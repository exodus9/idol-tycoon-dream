const test = require('node:test');
const assert = require('node:assert/strict');
const RunAdoption = require('../run-adoption.js');

test('a higher total cannot replace a stronger displayed specialist card', () => {
  assert.equal(RunAdoption.decide({
    oldBest:700,newBest:160,oldAverage:150,newAverage:160,
    oldAssignedRoleScores:[],newAssignedRoleScores:[]
  }), false);
});

test('a displayed BEST improvement cannot weaken an assigned group slot', () => {
  assert.equal(RunAdoption.decide({
    oldBest:500,newBest:520,oldAverage:250,newAverage:270,
    oldAssignedRoleScores:[550],newAssignedRoleScores:[420]
  }), false);
});

test('a stronger card that preserves every assigned slot is adopted', () => {
  assert.equal(RunAdoption.decide({
    oldBest:500,newBest:520,oldAverage:250,newAverage:270,
    oldAssignedRoleScores:[550,430],newAssignedRoleScores:[551,480]
  }), true);
});

test('equal best score needs a non-decreasing six-area average', () => {
  assert.equal(RunAdoption.decide({oldBest:500,newBest:500,oldAverage:250,newAverage:249}), false);
  assert.equal(RunAdoption.decide({oldBest:500,newBest:500,oldAverage:250,newAverage:250}), true);
});

test('unfinished and legacy cards always accept a completed RUN', () => {
  assert.equal(RunAdoption.decide({incomplete:true,oldBest:900,newBest:100,oldAssignedRoleScores:[900],newAssignedRoleScores:[100]}), true);
  assert.equal(RunAdoption.decide({legacy:true,oldBest:900,newBest:100,oldAssignedRoleScores:[900],newAssignedRoleScores:[100]}), true);
});
