const test=require('node:test');
const assert=require('node:assert/strict');
const CompletionTransaction=require('../completion-transaction.js');

test('successful permanent write keeps the finished ledger',()=>{
  let restored=false;
  const ok=CompletionTransaction.commit({snapshot:'before',persist:()=>true,restore:()=>{restored=true;}});
  assert.equal(ok,true);
  assert.equal(restored,false);
});

test('failed permanent write restores the exact pre-finish snapshot',()=>{
  let ledger={runs:2,roster:['mutated']};
  const snapshot=JSON.stringify({runs:1,roster:[]});
  const ok=CompletionTransaction.commit({snapshot,persist:()=>false,restore:raw=>{ledger=JSON.parse(raw);}});
  assert.equal(ok,false);
  assert.deepEqual(ledger,{runs:1,roster:[]});
});

test('thrown storage error follows the same rollback path',()=>{
  let restored='';
  const ok=CompletionTransaction.commit({snapshot:'stable',persist:()=>{throw new Error('quota');},restore:raw=>{restored=raw;}});
  assert.equal(ok,false);
  assert.equal(restored,'stable');
});

for(const failAt of ['run','agency'])test(`${failAt} failure restores active RUN and reward ledger together`,()=>{
  let run='ACTIVE-A',agency='REWARDS-A',emitted=0;
  const beforeRun=run,beforeAgency=agency;
  agency='REWARDS-CONSUMED';
  const result=CompletionTransaction.commitPair({
    persistRun:()=>{run='ACTIVE-B';return failAt!=='run';},
    persistAgency:()=>failAt!=='agency',
    restoreRun:()=>{run=beforeRun;return true;},
    restoreAgency:()=>{agency=beforeAgency;return true;}
  });
  if(result.ok)emitted++;
  assert.equal(result.ok,false);
  assert.equal(result.recovered,true);
  assert.equal(run,'ACTIVE-A');
  assert.equal(agency,'REWARDS-A');
  assert.equal(emitted,0,'failed replacement must not emit run_start');
});

test('recovery uncertainty remains visible',()=>{
  const result=CompletionTransaction.commitPair({persistRun:()=>false,persistAgency:()=>true,restoreRun:()=>false,restoreAgency:()=>true});
  assert.deepEqual(result,{ok:false,recovered:false});
});
