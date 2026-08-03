const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const i18n = require('../dg-i18n.js');

test('season close produces a concrete next RUN proposal', () => {
  assert.ok(html.includes('seasonRunProposal(trend,g)'));
  assert.ok(html.includes("ProductTelemetry.track('season_brief_open'"));
  assert.ok(html.includes("'season.memberRun'"));
  assert.ok(html.includes("'season.makeVersion'"));
  for(const locale of ['ko','en','ja','id']){
    assert.notEqual(i18n.t(locale,'season.memberRun',{name:'A'}),'season.memberRun');
    assert.notEqual(i18n.t(locale,'season.makeVersion',{trend:'X'}),'season.makeVersion');
  }
});

test('season proposal carries the recommended direction into retraining', () => {
  assert.ok(html.includes('retrainForSeason(rid,direction)'));
  assert.ok(html.includes("this.retrain(rid,{source:'season_brief',direction})"));
  assert.ok(html.includes('Game.pendingRunDirection=STATS.some(s=>s.k===opts.direction)?opts.direction:null'));
  assert.ok(html.includes('else Game.runDirection=BeginnerFlow.recommendedDirection'));
  assert.ok(html.includes('pending:suggestedDirection'));
  assert.ok(html.includes("ProductTelemetry.track('season_retrain_click'"));
});

test('season proposal never assigns a mismatched role to a real member', () => {
  assert.ok(html.includes('const pool=members.filter(m=>m.type===trend.pos)'));
  assert.ok(!html.includes('if(!pool.length)pool=members.slice()'));
  assert.ok(html.includes("rid:member?member.r.rid:null"));
  assert.ok(html.includes("'season.groupCopy'"));
  for(const locale of ['ko','en','ja','id']) assert.notEqual(i18n.t(locale,'season.groupCopy'),'season.groupCopy');
});

test('season hook survives dismissal and protects an active RUN', () => {
  assert.ok(html.includes("const _seasonResult=this.data.lastSeasonResult"));
  assert.ok(html.includes('const _seasonHeroBtn=_homeSeasonPlan'));
  assert.ok(html.includes('_seasonHeroBtn||'));
  assert.ok(html.includes('if(Game.hasSave())'));
  assert.ok(html.includes("dgT('season.resumeFirst')"));
  for(const locale of ['ko','en','ja','id']) assert.notEqual(i18n.t(locale,'season.resumeFirst'),'season.resumeFirst');
});
