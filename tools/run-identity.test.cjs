const test=require('node:test');
const assert=require('node:assert/strict');
const RunIdentity=require('../run-identity.js');

test('real and custom idols have stable, non-overlapping identities',()=>{
  assert.equal(RunIdentity.idolKey({id:7,name:'A'}),'i:7');
  assert.equal(RunIdentity.idolKey({id:'custom',name:'A'}),'c:A');
  assert.equal(RunIdentity.idolKey({id:'custom',name:' A '}),'c:A');
});

test('active RUN summary preserves the identity needed for exact resume',()=>{
  const got=RunIdentity.summary({runId:'run-a',idol:{id:7,name:'지민'},week:4,mode:'quick',retrainRid:12});
  assert.deepEqual({...got},{runId:'run-a',idolKey:'i:7',idolId:'7',idolName:'지민',week:4,total:12,retrainRid:'12'});
});

test('a different favorite creates an explicit conflict while the same favorite remains identifiable',()=>{
  const active={runId:'run-a',idol:{id:7,name:'지민'},week:4,mode:'quick'};
  assert.equal(RunIdentity.conflict(active,{id:8,name:'예준'}).sameIdol,false);
  assert.equal(RunIdentity.conflict(active,{id:7,name:'지민'}).sameIdol,true);
  assert.equal(RunIdentity.conflict(null,{id:8,name:'예준'}),null);
});

test('replacement approval belongs to one active RUN and one selected idol only',()=>{
  const active={runId:'run-a',idolKey:'i:7'};
  const token=RunIdentity.approval(active,{id:8,name:'B'});
  assert.equal(RunIdentity.approvalMatches(token,active,{id:8,name:'B'}),true);
  assert.equal(RunIdentity.approvalMatches(token,active,{id:9,name:'C'}),false,'A→B approval must not authorize A→C');
  assert.equal(RunIdentity.approvalMatches(token,{runId:'run-new'},{id:8,name:'B'}),false,'approval must not survive a changed active RUN');
});
