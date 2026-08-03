const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('first RUN copy distinguishes the opening hand from post-finish support cards',()=>{
  assert.ok(html.includes('첫 턴 추천 카드가 자동으로 준비돼'));
  assert.ok(html.includes('완주하면 첫 지원 카드도 남아'));
  assert.ok(!html.includes('맞는 약속과 카드가 자동으로 준비돼'));
});

test('result screen always exposes the appropriate next-day fandom bridge',()=>{
  assert.ok(html.includes('팬덤 답장이 도착했어'));
  assert.ok(html.includes('내일 00:00(KST), 팬덤 답장 도착'));
  assert.ok(html.includes('이 RUN을 내일로 이어가기'));
  assert.ok(html.includes('오늘의 팬덤 프로젝트 ›'));
  assert.ok(html.includes('onclick="DG.goDaily()"'));
});
