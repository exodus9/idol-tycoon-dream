const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sim = fs.readFileSync(path.join(root, 'tools', 'balance-sim.mjs'), 'utf8');

assert.match(html, /const jk = \(c\.kind==="rare"\) \? "great" : rollJudge/,
  'live RUN must guarantee great, not perfect, for rare lessons');
assert.match(sim, /card\.kind === 'rare' \? 'great' : rollJudge/,
  'balance simulator must mirror the live rare-lesson judgment');
assert.doesNotMatch(html, /const jk = \(c\.kind==="rare"\) \? "perfect"/,
  'rare lessons must not force the 4.6x perfect judgment');
assert.match(html, /const preview=impactStat\?RunBalanceRules\.growthOutcome\(/,
  'card preview must use the shared cap-aware growth rule');
assert.match(html, /const growth=RunBalanceRules\.growthOutcome\(/,
  'live execution must use the same shared cap-aware growth rule');
assert.match(html, /let g=growth\.applied;/,
  'result gain must equal the amount actually applied');
assert.match(sim, /const growth = RunBalanceRules\.growthOutcome\(/,
  'balance simulator must use the same shared growth rule');

console.log('growth truthfulness: OK');
