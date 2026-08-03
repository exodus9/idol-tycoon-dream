const test = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../dg-i18n.js');

test('all four meta UI packs expose identical keys', () => {
  assert.equal(i18n.assertKeyParity(), true);
  assert.deepEqual(i18n.getKeyParity(), {
    ko: { missing: [], extra: [] }, en: { missing: [], extra: [] },
    ja: { missing: [], extra: [] }, id: { missing: [], extra: [] }
  });
});

test('normalizes supported locale variants and falls back to English', () => {
  assert.equal(i18n.normalizeLocale('en-US'), 'en');
  assert.equal(i18n.normalizeLocale('ja_JP'), 'ja');
  assert.equal(i18n.normalizeLocale('id-ID'), 'id');
  assert.equal(i18n.normalizeLocale('in'), 'id');
  assert.equal(i18n.normalizeLocale('fr-FR'), 'en');
  assert.equal(i18n.normalizeLocale(), 'en');
});

test('formats variables and preserves missing placeholders', () => {
  assert.equal(i18n.t('en-US', 'entry.resume', { name: 'Mina' }), 'Continue Mina\'s RUN');
  assert.equal(i18n.t('ja', 'run.turn', { current: 3, total: 12 }), 'ターン 3 / 12');
  assert.equal(i18n.format('Hello {name} / {missing}', { name: 'Ari' }), 'Hello Ari / {missing}');
});

test('uses Korean, then the key itself, for missing entries', () => {
  assert.equal(i18n.t('en', 'daily.title'), 'Today\'s Fandom Project');
  const saved = i18n.packs.en['daily.title'];
  delete i18n.packs.en['daily.title'];
  assert.equal(i18n.t('en', 'daily.title'), '오늘의 팬덤 프로젝트');
  i18n.packs.en['daily.title'] = saved;
  assert.equal(i18n.t('en', 'not.a.real.key'), 'not.a.real.key');
});

test('is available through a browser-style global UMD export', () => {
  assert.equal(globalThis.DGI18n, i18n);
  assert.equal(i18n.createTranslator('id-ID')('common.confirm'), 'Konfirmasi');
});

test('critical achievement and support-card surfaces are translated in every release locale', () => {
  const keys = [
    'achievement.unlocked', 'achievement.rewardReady', 'achievement.claim',
    'support.detail.effect', 'support.detail.special', 'support.detail.origin',
    'support.detail.owned', 'support.detail.new', 'support.origin.n', 'support.origin.ssr',
    'result.finalFanGain', 'result.runDirection', 'result.joinCardMeta',
    'result.firstGateNext', 'result.groupCandidate'
  ];
  for (const locale of ['en', 'ja', 'id']) {
    for (const key of keys) {
      assert.notEqual(i18n.t(locale, key), i18n.t('ko', key), `${locale}.${key} fell back to Korean`);
      assert.notEqual(i18n.t(locale, key), key, `${locale}.${key} is missing`);
    }
  }
});

test('generic season-edition copy does not duplicate the word edition', () => {
  for (const locale of ['en', 'ja', 'id']) {
    const rendered = i18n.t(locale, 'result.editionCollectedCopy', {
      name: i18n.t(locale, 'card.seasonEdition')
    });
    assert.equal(/Edition Edition|エディションエディション|Edisi Edisi/i.test(rendered), false, `${locale}: ${rendered}`);
  }
});

test('growth preview is labeled as a variable baseline in every release locale', () => {
  const copies=['ko','en','ja','id'].map(locale=>i18n.t(locale,'run.expectedGain',{stat:'X',amount:52}));
  for(const copy of copies) assert.match(copy,/52/);
  assert.match(copies[0],/기본 성장.*결과에 따라 변동/);
  assert.match(copies[1],/base growth.*outcome varies/i);
  assert.match(copies[2],/基準成長.*結果で変動/);
  assert.match(copies[3],/dasar.*berubah/i);
});

test('growth preview teaches normal and failed outcome ranges in every release locale', () => {
  for(const locale of ['ko','en','ja','id']){
    const copy=i18n.t(locale,'run.growthRange',{stat:'X',min:40,max:50,failMin:11,failMax:14});
    assert.notEqual(copy,'run.growthRange');
    for(const amount of ['40','50','11','14']) assert.match(copy,new RegExp(amount));
  }
});

test('stage coach and immediate recovery guidance are localized in every release locale', () => {
  const keys=['run.firstGateProtected','run.finalImprove','run.finalRecover','run.rankImprove','run.rankRecover','run.gateImprove','run.gateRecover','run.restProtected','run.restProtectedCopy','run.restBeforeStage','run.restBeforeStageCopy'];
  for(const locale of ['ko','en','ja','id']) for(const key of keys) assert.notEqual(i18n.t(locale,key),key,`${locale}.${key} missing`);
});

test('reply time and rank-versus-grade explanations are localized',()=>{
  for(const locale of ['ko','en','ja','id']){
    const reply=i18n.t(locale,'daily.replyAt',{time:'Aug 4, 22:00 WIB'});
    assert.match(reply,/22:00/);
    assert.equal(/00:00\s*KST/i.test(reply),false);
    const grade=i18n.t(locale,'result.rankGradeExplain',{grade:'D',score:171,average:142,goal:'X'});
    assert.notEqual(grade,'result.rankGradeExplain');
    assert.match(grade,/171/); assert.match(grade,/142/);
    const gift=i18n.t(locale,'home.giftToast',{name:'Jimin',card:'Fandom Plan'});
    assert.notEqual(gift,'home.giftToast');
    assert.match(gift,/Jimin/); assert.match(gift,/Fandom Plan/);
  }
});
