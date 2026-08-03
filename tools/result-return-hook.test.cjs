const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dgI18n=require('../dg-i18n.js');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('first RUN copy distinguishes the opening hand from post-finish support cards',()=>{
  assert.ok(html.includes("dgT('setup.firstOpeningCard')"));
  assert.ok(html.includes("dgT('setup.firstSupportCard')"));
  for(const locale of ['ko','en','ja','id']){
    assert.notEqual(dgI18n.t(locale,'setup.firstOpeningCard'),'setup.firstOpeningCard');
    assert.notEqual(dgI18n.t(locale,'setup.firstSupportCard'),'setup.firstSupportCard');
  }
  assert.ok(!html.includes('맞는 약속과 카드가 자동으로 준비돼'));
});

test('result screen always exposes the appropriate next-day fandom bridge',()=>{
  const keys=['result.returnReplyTitle','result.returnReplyCopy','result.returnReplyButton','result.returnTomorrowTitle','result.returnTomorrowCopy','result.returnTomorrowButton','result.returnStartTitle','result.returnStartCopy','result.returnStartButton'];
  for(const key of keys){
    assert.ok(html.includes(`dgT('${key}'`),`result bridge does not render ${key}`);
    for(const locale of ['ko','en','ja','id']) assert.notEqual(dgI18n.t(locale,key),key,`${locale} missing ${key}`);
  }
  assert.ok(html.includes('onclick="DG.goDaily()"'));
  assert.ok(html.includes("dgT('result.returnTomorrowTitle',{time:esc(unlockTime)})"));
  assert.ok(html.includes("dgT('daily.replyAt',{time:esc(this.replyUnlockLabel())})"));
  assert.ok(html.includes('DailyRetention.nextKstResetAt(now)'));
  const resultRenderer=html.slice(html.indexOf('renderResult(box, res)'),html.indexOf('runPromiseView(p,ctx)'));
  assert.ok(resultRenderer.indexOf('${returnHook}')<resultRenderer.indexOf('${idolReveal}'),'next-day bridge must appear before the tall idol card');
});

test('the next-day hook never claims a completed RUN is still continuing',()=>{
  const banned=[/이 RUN을 내일로 이어가기/,/Carry this RUN into tomorrow/i,/このRUNを明日へつなぐ/,/Lanjutkan RUN ini besok/i];
  for(const [i,locale] of ['ko','en','ja','id'].entries()){
    const copy=dgI18n.t(locale,'result.returnStartTitle');
    assert.equal(banned[i].test(copy),false,`${locale}: ${copy}`);
  }
});

test('result explains why final rank and card completion grade can differ',()=>{
  assert.ok(html.includes("dgT('result.rankGradeExplain'"));
  assert.ok(html.includes('score:Math.round(res.runGradeScore||0)'));
  assert.ok(html.includes('average:Math.round(res.runAverage||0)'));
  assert.ok(html.includes('goal:this.idolNextGoal(this.idolCardMeta(idolR))'));
  assert.ok(html.includes('runAverage:Math.round(STATS.reduce'));
  assert.ok(html.includes('runGradeScore:Math.round(top.score||0)'));
  for(const locale of ['ko','en','ja','id']){
    const copy=dgI18n.t(locale,'result.rankGradeExplain',{grade:'D',score:171,average:142,goal:'1 more RUN'});
    assert.notEqual(copy,'result.rankGradeExplain');
    assert.match(copy,/D/); assert.match(copy,/171/); assert.match(copy,/142/);
  }
});

test('favorite gift toast never leaks Korean into non-Korean locales',()=>{
  assert.ok(html.includes("dgT('home.giftToast'"));
  assert.equal(html.includes('연습하다 찾은 카드예요. 다음 무대에 같이 써봐요!'),false);
  for(const locale of ['ko','en','ja','id']){
    const copy=dgI18n.t(locale,'home.giftToast',{name:'Jimin',card:'Fandom Plan'});
    assert.notEqual(copy,'home.giftToast');
    assert.match(copy,/Jimin/); assert.match(copy,/Fandom Plan/);
  }
});

test('completed promise evidence never renders confusing over-target fractions',()=>{
  assert.ok(html.includes('const _rmDisplayValue=_rmSuccess&&_rmTarget>0?Math.min(_rmValue,_rmTarget):_rmValue'));
  assert.ok(html.includes('const _lmDisplayValue=_lmSuccess&&_lmTarget>0?Math.min(_lmValue,_lmTarget):_lmValue'));
  assert.ok(html.includes('const displayValue=success&&target>0?Math.min(value,target):value'));
});

test('arrived, opened and promise reply states remain localized through retraining',()=>{
  const keys=['daily.replyArrivedTitle','daily.replyReadyCopy','daily.receivedAt','daily.combinedReward','daily.openReply','daily.openedExtra','daily.openedPromiseReward','daily.openedChoiceReward','daily.promiseRetry','daily.promiseContinue','daily.archivedToast','daily.replyHistory','daily.revealToast'];
  for(const key of keys){
    assert.ok(html.includes(key),`daily reply flow does not render ${key}`);
    for(const locale of ['ko','en','ja','id']) assert.notEqual(dgI18n.t(locale,key),key,`${locale} missing ${key}`);
  }
  assert.ok(html.includes('DG.retrainFromPromiseReply'));
});
