const assert = require('node:assert/strict');
const ProgressAction = require('../progress-action.js');

assert.equal(ProgressAction.decide({readyCount:1,lineupCount:1}), 'scout');
assert.equal(ProgressAction.decide({readyCount:3,lineupCount:0}), 'lineup');
assert.equal(ProgressAction.decide({readyCount:3,lineupCount:3}), 'debut');
assert.equal(ProgressAction.decide({hasRepresentative:true}), 'battle');
assert.equal(ProgressAction.decide({hasRepresentative:true,battleLoss:true}), 'retrain');
assert.equal(ProgressAction.decide({hasRepresentative:true,promisePending:true}), 'promiseRetry');
assert.equal(ProgressAction.decide({readyCount:1,focusIncomplete:true}), 'retry');

console.log('progress action: OK');
