const test=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../run-balance-rules.js');

test('browser and simulator share first RUN protection',()=>{
  assert.equal(rules.protectsFirstGate(1,true,false),true);
  assert.equal(rules.protectsFirstGate(2,true,false),false);
  assert.equal(rules.protectsFirstGate(1,true,true),false);
});

test('season trend and its 25% growth multiplier are deterministic',()=>{
  assert.equal(rules.trendStatAt(Date.UTC(2026,0,5)),'vocal');
  assert.equal(rules.trendStatAt(Date.UTC(2026,0,19)),'acting');
  assert.equal(rules.trendMultiplier('dance','dance'),1.25);
  assert.equal(rules.trendMultiplier('visual','dance'),1);
});
