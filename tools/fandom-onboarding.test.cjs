const test=require('node:test');
const assert=require('node:assert/strict');
const FandomOnboarding=require('../fandom-onboarding.js');

test('new RUN gets one fandom contact at its first audition',()=>{
  assert.equal(FandomOnboarding.shouldPrompt({week:3,debutWeek:3,fanBondMoments:0}),true);
  assert.equal(FandomOnboarding.shouldPrompt({week:3,debutWeek:3}),true,'legacy saves without a counter must receive the contact');
});

test('existing contact or a normal training week never interrupts play',()=>{
  assert.equal(FandomOnboarding.shouldPrompt({week:3,debutWeek:3,fanBondMoments:1}),false);
  assert.equal(FandomOnboarding.shouldPrompt({week:2,debutWeek:3,fanBondMoments:0}),false);
  assert.equal(FandomOnboarding.shouldPrompt({week:4,debutWeek:3,fanBondMoments:0}),false);
});
