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
