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

test('rare lesson growth stays strong without skipping straight from F to the cap',()=>{
  const outcome=rules.growthOutcome({base:66,judgeMult:2.1,current:90,growthMult:2.6,talentMult:1.25,trendMult:1.25,cardGrowth:1.18,comboMult:1,buffMult:1,randomMult:1});
  assert.deepEqual(outcome,{raw:664,applied:664,next:754});
});

test('preview and result can report only the amount actually applied at the cap',()=>{
  const outcome=rules.growthOutcome({base:66,judgeMult:2.1,current:760,growthMult:2.6,talentMult:1.25,trendMult:1.25,cardGrowth:1.18,comboMult:1,buffMult:1,randomMult:1});
  assert.equal(outcome.raw,664);
  assert.equal(outcome.applied,40);
  assert.equal(outcome.next,800);
});
