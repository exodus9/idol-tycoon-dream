const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function boot(language,search=''){
  const store = new Map();
  const context = vm.createContext({
    navigator:{language},location:{search},URLSearchParams,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value))},
    console
  });
  context.window=context;
  vm.runInContext(source, context, {filename:'i18n.js'});
  return context;
}

test('launch locale detection covers Korean, English, Japanese and Indonesian',()=>{
  assert.equal(boot('ko-KR').LANG,'ko');
  assert.equal(boot('en-US').LANG,'en');
  assert.equal(boot('ja-JP').LANG,'ja');
  assert.equal(boot('id-ID').LANG,'id');
  assert.equal(boot('in-ID').LANG,'id');
  assert.equal(boot('ko-KR','?lang=id').LANG,'id','an explicit QA/deep-link locale must override the device language');
  assert.deepEqual(Array.from(boot('en-US').langList(),x=>x.code),['ko','en','ja','id']);
  assert.ok(html.includes('src="dg-i18n.js'));
});

test('an explicit URL locale stays authoritative after restored page state writes',()=>{
  const w=boot('ko-KR','?lang=ja');
  assert.equal(w.LANG,'ja');
  w.LANG='ko';
  assert.equal(w.LANG,'ja');
  w.setLang('en');
  assert.equal(w.LANG,'ja');
  w.setLang('en',{user:true});
  assert.equal(w.LANG,'en','an explicit in-game language choice may replace the deep-link default');
});

test('active global result copy evaluates the RUN production, not a real idol',()=>{
  const banned=[/raw talent/i,/six talents/i,/no weakness/i,/unbeatable/i,/innate/i,/才能すべて/,/弱点がない/,/無敵/,/完成型素材/,/実力ステータス/];
  for(const locale of ['en','ja','id']){
    const w=boot(locale==='id'?'id-ID':`${locale}-${locale.toUpperCase()}`);
    const active=Object.entries(w.I18N[locale]).filter(([key])=>/^(t_tagline|manual_|say_perfect|debut_pass_text|cp_.*_sub|end_|start_log|e_|d_|hall_)/.test(key)).map(([,value])=>String(value)).join('\n');
    for(const pattern of banned) assert.equal(pattern.test(active),false,`${locale} contains ${pattern}`);
    assert.match(active,/RUN|制作|stage|production|ステージ/i);
  }
});

test('core RUN recovery and fandom talk never render untranslated meta keys',()=>{
  assert.ok(html.includes("toast(dgT('run.noStamina'))"));
  assert.ok(html.includes("toast(dgT('save.noSpace'))"));
  assert.ok(html.includes('prompt:dgTOr(`bondTalk.${raw.id}.prompt`,raw.prompt)'));
  assert.ok(html.includes('t:dgTOr(`bondTalk.${raw.id}.r${i+1}`,ch.t)'));
  assert.ok(html.includes('react:dgTOr(`bondTalk.${raw.id}.a${i+1}`,ch.react)'));
  assert.equal(/toast\(["']기력이 부족해/.test(html),false);
});

test('fandom and chance choices disclose their real tradeoffs before commitment',()=>{
  assert.ok(html.includes("dgT('run.mental')} +4"),'the care reply must disclose its mental reward');
  assert.ok(html.includes("dgT('run.fans')} +${fmt(fanGain)}"),'the rally reply must disclose its fan reward');
  assert.ok(html.includes('class="risk-preview"'),'chance choices must preview both outcomes');
  assert.ok(html.includes('t("ev_"+eid+"_w_d")'));
  assert.ok(html.includes('t("ev_"+eid+"_lo_d")'));
});

test('saved RUN promises are re-localized from identity instead of stale display copy',()=>{
  assert.ok(html.includes('DG.runPromiseView(p,{idol:s.idol,direction:s.runDirection})'));
  assert.ok(html.includes("promiseType:record.runMemory.baseType"));
  assert.ok(html.includes("promiseDirection:st.runDirection"));
  assert.ok(html.includes("dgT(`promise.${promiseType}Title`"));
});

test('Choeaedol event decisions and outcomes are reviewed in every release locale',()=>{
  const keys=[
    'ev_themepick_title','ev_themepick_text','ev_themepick_c1','ev_themepick_w_l',
    'ev_themepick_w_d','ev_themepick_lo_l','ev_themepick_lo_d','ev_themepick_c2',
    'ev_freetalk_title','ev_freetalk_text','ev_freetalk_c1',
    'ev_miracle_title','ev_miracle_text','ev_miracle_c1'
  ];
  const ko=boot('ko-KR').I18N.ko;
  for(const locale of ['en','ja','id']){
    const pack=boot(locale==='id'?'id-ID':`${locale}-${locale.toUpperCase()}`).I18N[locale];
    for(const key of keys){
      assert.ok(pack[key],`${locale}.${key} is missing`);
      assert.notEqual(pack[key],ko[key],`${locale}.${key} fell back to Korean`);
      if(locale!=='ja') assert.equal(/[가-힣]/.test(pack[key]),false,`${locale}.${key} contains Korean`);
    }
  }
});

test('critical achievement and support-card renderers use locale keys instead of Korean literals',()=>{
  const achievement=html.slice(html.indexOf('claimAchvReward(id)'),html.indexOf('showFlipCard('));
  const detail=html.slice(html.indexOf('showCardDetail(type)'),html.indexOf('renderResult(box, res)'));
  const origin=html.slice(html.indexOf('cardOrigin(id){'),html.indexOf('revealDrop(el,'));
  assert.ok(achievement.includes("dgT('achievement.unlocked')"));
  assert.ok(achievement.includes("dgT('achievement.claim')"));
  assert.equal(/<div class="afx-h">🏅 업적 달성|>🎁 보상받기<|>🎁 수령완료</.test(achievement),false);
  assert.ok(detail.includes("dgT('support.detail.effect')"));
  assert.ok(detail.includes("dgT('support.detail.origin')"));
  assert.equal(/획득 방법|🎴 보유|✨ 특수/.test(detail),false);
  assert.ok(origin.includes("dgT('support.origin.n')"));
  assert.ok(origin.includes("dgT('support.origin.ssr')"));
  assert.equal(/육성 완주 시 획득|서로 다른 SR 2장 합성/.test(origin),false);
});

test('result next-star copy uses the concrete localized requirement',()=>{
  assert.ok(html.includes("{goal:this.idolNextGoal(this.idolCardMeta(idolR))}"));
  assert.equal(html.includes("{goal:window.LANG==='ko'?this.idolNextGoal"),false);
});
