const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');

test('long localized Daily rewards wrap inside the mobile card',()=>{
  assert.match(html,/\.daily-option\{[^}]*grid-template-columns:45px minmax\(0,1fr\)/);
  assert.match(html,/\.daily-option em\{grid-column:2;[^}]*white-space:normal;[^}]*overflow-wrap:anywhere/);
});

test('core mobile screens preserve safe areas and reduced motion',()=>{
  assert.match(html,/env\(safe-area-inset-bottom\)/);
  assert.match(html,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(html,/#s-office,#s-play,#s-roster[^}]*overflow:hidden/);
});

test('the persistent home next-goal target stays at least 44px on short screens',()=>{
  assert.match(html,/\.hs3-daily\{[^}]*height:44px;min-height:44px/);
  assert.doesNotMatch(html,/\.hs3-daily\{[^}]*height:(?:3[0-9]|4[0-3])px/);
});

test('settings choice buttons preserve a 44px touch target',()=>{
  assert.match(html,/\.sheet-lang button\{[^}]*min-height:44px/);
});

test('the RUN Card archive routes navigation and filters through localization',()=>{
  for(const literal of ["['all','전체']","['grade','등급순']","['all','전 포지션']"]){
    assert.equal(html.includes(literal),false,`roster still contains ${literal}`);
  }
  for(const key of ['roster.lineupShort','roster.idols','roster.groupDex','roster.newIdol'])assert.match(html,new RegExp(`data-dg-i18n="${key}"`));
});

test('the Support Deck and its first coach never leak Korean into global locales',()=>{
  const cards=html.slice(html.indexOf('renderCardsOwned()'),html.indexOf('doMerge(type,star)'));
  for(const literal of ['레어도순','★별순','이 레어도 카드가 없어','장 보유'])assert.equal(cards.includes(literal),false,`support deck still contains ${literal}`);
  assert.equal(cards.includes("'>🂠 겹치기</button>"),false,'support stack control is still hard-coded');
  const coach=html.slice(html.indexOf('onTab(tab)'),html.indexOf('// 상세화: 조합소'));
  assert.match(coach,/dgT\('tutorial\.tabCards'\)/);
  assert.equal(coach.includes('<b>지원 카드</b>'),false);
});
