const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const StageCriteria = require('../stage-criteria.js');

const BASE = ['vocal', 'dance', 'visual', 'charm'];

test('a selected production direction is always judged on the stage', () => {
  for (const direction of ['vocal', 'acting', 'dance', 'visual', 'charm', 'creative']) {
    const fields = StageCriteria.effectiveFields(BASE, direction);
    assert.equal(fields.length, 4);
    assert.equal(fields.includes(direction), true, direction);
  }
});

test('existing criteria stay stable and source config is never mutated', () => {
  assert.deepEqual(StageCriteria.effectiveFields(BASE, 'dance'), BASE);
  assert.deepEqual(StageCriteria.effectiveFields(BASE, 'acting'), ['vocal', 'dance', 'visual', 'acting']);
  assert.deepEqual(BASE, ['vocal', 'dance', 'visual', 'charm']);
});

test('empty and duplicate input remains deterministic', () => {
  assert.deepEqual(StageCriteria.effectiveFields([], 'creative'), ['creative']);
  assert.deepEqual(StageCriteria.effectiveFields(['vocal', 'vocal', 'dance'], 'acting'), ['vocal', 'acting']);
});

test('the home in-progress card receives the active RUN direction', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(source, /directionKey=\(r&&r\.runDirection\)\|\|opt\.runDirection/);
  assert.match(source, /cardState:'training', runDirection:_resume\.stats\.runDirection/);
});
