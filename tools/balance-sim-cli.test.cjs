const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'tools', 'balance-sim.mjs');

{
  const run = spawnSync(process.execPath, [script, '--runs', '100', '--seed', '7', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  const parsed = JSON.parse(run.stdout);
  assert.equal(parsed.runsPerScenario, 100);
  assert.equal(parsed.seed, 7);
  assert.ok(parsed.rows.every((row) => Number.isFinite(row.finalReach)));
}

{
  const run = spawnSync(process.execPath, [script, '--runs', 'not-a-number', '--acceptance'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /--runs.*100 이상의 정수/);
}

console.log('balance sim CLI: OK');
