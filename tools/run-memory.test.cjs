const assert=require('node:assert/strict');
const RunMemory=require('../run-memory.js');
assert.equal(RunMemory.options({idolName:'G-DRAGON',fandom:'팬덤',directionLabel:'랩 무대',mode:'quick'})[1].copy,'팬들이 다시 부르고 싶은 장면을 팬 소통 훈련으로 완성해요.');

const ctx={idolName:'예준',fandom:'플리',directionLabel:'보컬 무대',mode:'quick'};
const opts=RunMemory.options(ctx);
assert.equal(opts.length,3);
assert.match(opts[0].title,/보컬 무대/);
assert.match(opts[1].title,/플리/);

const state={mode:'quick',runId:'r1',runNo:3,runDirection:'vocal',vocal:20,charm:10,mental:72,stam:80,cond:80,fanBond:18,fans:100,trainCount:{vocal:2}};
RunMemory.applyStart(state,opts[0]);
assert.equal(RunMemory.progress(state).met,false);
assert.equal(RunMemory.resolveCheckpoint(state,'commit').choice,'commit');
assert.equal(state.vocal,28);
state.trainCount.vocal=3;
const success=RunMemory.evaluate(state);
assert.equal(success.status,'success');
assert.equal(success.run,3,'immutable memory must retain the exact RUN number');
RunMemory.applyReward(state,success);
assert.equal(state.fans,900);
assert.equal(RunMemory.resolveCheckpoint(state,'adapt'),null,'checkpoint resolves once');

const failedPrev={runId:'r0',run:1,baseType:'fandom',title:'플리와 앙코르 약속',status:'failed'};
const retry=RunMemory.options({...ctx,previous:failedPrev})[0];
assert.equal(retry.retryOf,'r0');
const retryState={mode:'quick',runId:'r2',runDirection:'vocal',mental:70,stam:80,cond:80,fanBond:20,fans:0,trainCount:{charm:2}};
RunMemory.applyStart(retryState,retry);
RunMemory.resolveCheckpoint(retryState,'adapt');
const retryResult=RunMemory.evaluate(retryState);
assert.equal(retryResult.status,'success');
assert.equal(retryResult.bonusCard,true);

const unresolvedA={runId:'failed-a',status:'failed',baseType:'signature'};
const unrelatedSuccess={runId:'success-b',status:'success',retryOf:'',baseType:'fandom'};
assert.equal(RunMemory.nextUnresolved(unresolvedA,unrelatedSuccess),unresolvedA,'an unrelated success must not erase an older unfinished promise');
assert.equal(RunMemory.nextUnresolved(unresolvedA,{...unrelatedSuccess,retryOf:'failed-a'}),null,'only the matching successful retry resolves the unfinished promise');
const failedB={runId:'failed-b',status:'failed',baseType:'resilience'};
assert.equal(RunMemory.nextUnresolved(unresolvedA,failedB),failedB,'a newly failed promise becomes the next retry target');
assert.equal(RunMemory.replySelection(unresolvedA),'retry:signature');
assert.equal(RunMemory.replySelection({status:'success',baseType:'fandom'}),'fandom');
assert.deepEqual(RunMemory.replyLink({runId:'failed-a',promiseId:'signature'}),{source:'promise_reply',reply_run_id:'failed-a',reply_promise_id:'signature'});
assert.deepEqual(RunMemory.replyLink({source:'run_record',runId:'failed-a',promiseId:'signature'}),{source:'run_record',reply_run_id:'failed-a',reply_promise_id:'signature'});
assert.deepEqual(RunMemory.replyLink(null),{});

const records=[
  {rid:7,runId:'failed-a',runMemory:{runId:'failed-a',promiseId:'signature',status:'failed',baseType:'signature'}},
  {rid:7,runId:'failed-b',runMemory:{runId:'failed-b',promiseId:'resilience',status:'failed',baseType:'resilience'}},
];
const sourceA=RunMemory.recordSource(records,{source:'run_record',rid:7,runId:'failed-a',promiseId:'signature'});
const sourceB=RunMemory.recordSource(records,{source:'run_record',rid:7,runId:'failed-b',promiseId:'resilience'});
assert.equal(sourceA.memory.runId,'failed-a','album CTA for A must bind to A even when B is the latest unresolved promise');
assert.equal(RunMemory.options({...ctx,previous:sourceA.memory})[0].retryOf,'failed-a');
assert.equal(sourceB.memory.runId,'failed-b','album CTA for B must bind to B');
assert.equal(RunMemory.options({...ctx,previous:sourceB.memory})[0].retryOf,'failed-b');
assert.equal(RunMemory.recordSource(records,{source:'run_record',rid:7,runId:'failed-a',promiseId:'resilience'}),null,'mismatched promise IDs must be rejected');
assert.equal(RunMemory.recordSource(records,{source:'card_detail',rid:7,runId:'failed-a',promiseId:'signature'}),null,'only exact immutable-record sources may link a promise');

const weak={mode:'full',runId:'r3',runDirection:'dance',mental:40,stam:10,cond:30,fanBond:5,fans:0,trainCount:{}};
RunMemory.applyStart(weak,RunMemory.options({...ctx,mode:'full'})[2]);
RunMemory.resolveCheckpoint(weak,'commit');
assert.equal(RunMemory.evaluate(weak).status,'failed');
console.log('run memory: OK');
