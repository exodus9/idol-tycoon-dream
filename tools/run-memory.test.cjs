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
const committed=RunMemory.resolveCheckpoint(state,'commit');
assert.equal(committed.choice,'commit');
assert.equal(committed.met,true,'a direct promise boost at 2/3 must visibly complete the 3/3 goal');
assert.equal(state.vocal,28);
const success=RunMemory.evaluate(state);
assert.equal(success.status,'success');
assert.equal(success.run,3,'immutable memory must retain the exact RUN number');
RunMemory.applyReward(state,success);
assert.equal(state.fans,900);
assert.equal(RunMemory.resolveCheckpoint(state,'adapt'),null,'checkpoint resolves once');

const fandomCommit={mode:'quick',runId:'f1',runDirection:'vocal',mental:70,stam:50,cond:70,fanBond:20,fans:0,trainCount:{charm:1}};
RunMemory.applyStart(fandomCommit,opts[1]);
const fandomCommitted=RunMemory.resolveCheckpoint(fandomCommit,'commit');
assert.equal(fandomCommitted.value,2);
assert.equal(fandomCommitted.met,true,'the fandom promise boost must advance its displayed training count');

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

const signatureRoute={runNo:2,runDirection:'vocal',runPromise:{baseType:'signature'}};
assert.deepEqual(RunMemory.routeEffect(signatureRoute,{stat:'vocal',kind:'lesson',outcome:'ok'}),{type:'signature',growthMult:1.05,fanMult:1,bondGain:0,mentalLossMult:1,mentalGain:0,active:true});
assert.equal(RunMemory.routeEffect(signatureRoute,{stat:'dance',kind:'lesson',outcome:'ok'}).active,false);
const fandomRoute={runNo:2,runDirection:'vocal',runPromise:{baseType:'fandom'}};
assert.deepEqual(RunMemory.routeEffect(fandomRoute,{stat:'charm',kind:'lesson',outcome:'ok'}),{type:'fandom',growthMult:1,fanMult:1.1,bondGain:2,mentalLossMult:1,mentalGain:0,active:true});
const resilienceRoute={runNo:2,runDirection:'vocal',runPromise:{baseType:'resilience'}};
assert.equal(RunMemory.routeEffect(resilienceRoute,{stat:'dance',kind:'lesson',outcome:'fail'}).mentalLossMult,.5);
assert.equal(RunMemory.routeEffect(resilienceRoute,{kind:'rest',outcome:'ok'}).mentalGain,4);
assert.equal(RunMemory.routeEffect({}, {stat:'vocal'}).active,false);
assert.equal(RunMemory.routeEffect({runNo:1,runDirection:'vocal',runPromise:{baseType:'signature'}},{stat:'vocal'}).active,false,'first RUN onboarding balance stays unchanged');
const setupHtml=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
assert.ok(setupHtml.includes("route=firstRun?'':dgT('run.routeEffect.'"),'first RUN must not advertise inactive route effects');
const DGI18n=require('../dg-i18n.js');
for(const locale of ['ko','en','ja','id']){
  assert.match(DGI18n.t(locale,'run.routeEffect.signature'),/5%/);
  assert.match(DGI18n.t(locale,'run.routeEffect.fandom',{amount:2}),/10%/);
  assert.match(DGI18n.t(locale,'run.routeEffect.fandom',{amount:2}),/2/);
  assert.match(DGI18n.t(locale,'run.routeEffect.resilience'),/50%/);
  assert.match(DGI18n.t(locale,'run.routeEffect.resilience'),/4/);
}
console.log('run memory: OK');
