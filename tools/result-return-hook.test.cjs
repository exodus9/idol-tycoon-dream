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
    assert.ok(html.includes(`dgT('${key}')`),`result bridge does not render ${key}`);
    for(const locale of ['ko','en','ja','id']) assert.notEqual(dgI18n.t(locale,key),key,`${locale} missing ${key}`);
  }
  assert.ok(html.includes('onclick="DG.goDaily()"'));
});

test('arrived, opened and promise reply states remain localized through retraining',()=>{
  const keys=['daily.replyArrivedTitle','daily.replyReadyCopy','daily.receivedAt','daily.combinedReward','daily.openReply','daily.openedExtra','daily.openedPromiseReward','daily.openedChoiceReward','daily.promiseRetry','daily.promiseContinue','daily.archivedToast','daily.replyHistory','daily.revealToast'];
  for(const key of keys){
    assert.ok(html.includes(key),`daily reply flow does not render ${key}`);
    for(const locale of ['ko','en','ja','id']) assert.notEqual(dgI18n.t(locale,key),key,`${locale} missing ${key}`);
  }
  assert.ok(html.includes('DG.retrainFromPromiseReply'));
});
