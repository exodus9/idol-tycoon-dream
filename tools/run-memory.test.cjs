const assert=require('node:assert/strict');
const RunMemory=require('../run-memory.js');

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
assert.deepEqual(RunMemory.replyLink(null),{});

const weak={mode:'full',runId:'r3',runDirection:'dance',mental:40,stam:10,cond:30,fanBond:5,fans:0,trainCount:{}};
RunMemory.applyStart(weak,RunMemory.options({...ctx,mode:'full'})[2]);
RunMemory.resolveCheckpoint(weak,'commit');
assert.equal(RunMemory.evaluate(weak).status,'failed');
console.log('run memory: OK');
