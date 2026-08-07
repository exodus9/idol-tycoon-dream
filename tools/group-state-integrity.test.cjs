const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('standalone group updates cannot submit any leaderboard state', () => {
  const submit = html.slice(html.indexOf('    submitGroup()'), html.indexOf('    showLeague(){'));
  assert.match(submit,/submitGroup\(\)\{ this\._leagueServer=false; return false; \}/);
  assert.equal(submit.includes('fetch('), false);
});

test('rerun adoption protects displayed BEST score and every assigned group slot', () => {
  const finish = html.slice(html.indexOf('    onFinish(st, statVals, end)'), html.indexOf('    // ⑳⑲ 드랍 재설계'));
  assert.ok(finish.includes('RunAdoption.decide'));
  assert.ok(finish.includes('this.idolTop(_oldStats).score'));
  assert.ok(finish.includes('_assignedTypes.map(type=>this.posScore(_oldStats,type))'));
  assert.ok(finish.includes('_assignedTypes.map(type=>this.posScore(stats,type))'));
});
