const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('season close produces a concrete next RUN proposal', () => {
  assert.ok(html.includes('seasonRunProposal(trend,g)'));
  assert.ok(html.includes("ProductTelemetry.track('season_brief_open'"));
  assert.ok(html.includes('새 시즌 RUN'));
  assert.ok(html.includes('버전 제작하기 ›'));
});

test('season proposal carries the recommended direction into retraining', () => {
  assert.ok(html.includes('retrainForSeason(rid,direction)'));
  assert.ok(html.includes("this.retrain(rid,{source:'season_brief',direction})"));
  assert.ok(html.includes('Game.pendingRunDirection=STATS.some(s=>s.k===opts.direction)?opts.direction:null'));
  assert.ok(html.includes('else Game.runDirection=suggestedDirection'));
  assert.ok(html.includes("ProductTelemetry.track('season_retrain_click'"));
});

test('season proposal never assigns a mismatched role to a real member', () => {
  assert.ok(html.includes('const pool=members.filter(m=>m.type===trend.pos)'));
  assert.ok(!html.includes('if(!pool.length)pool=members.slice()'));
  assert.ok(html.includes("rid:member?member.r.rid:null"));
  assert.ok(html.includes("멤버 평가는 그대로 두고 새 콘셉트만"));
});

test('season hook survives dismissal and protects an active RUN', () => {
  assert.ok(html.includes("const _seasonResult=this.data.lastSeasonResult"));
  assert.ok(html.includes('const _seasonHeroBtn=_homeSeasonPlan'));
  assert.ok(html.includes('_seasonHeroBtn||'));
  assert.ok(html.includes('if(Game.hasSave())'));
  assert.ok(html.includes("시즌 제안은 홈에 남아 있어"));
});
