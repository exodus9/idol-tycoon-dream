const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('first RUN progressively reveals the HUD without stacking two coaches',()=>{
  assert.match(html,/hud-stage-1/);
  assert.match(html,/hud-stage-2/);
  assert.match(html,/guidedFirst=.*!Tut\.did\('s2_train1'\)/);
  assert.match(html,/beginnerPrompt\.hidden=!beginnerStage\|\|guidedFirst/);
});

test('pre-completion achievements are banked and released after the first card',()=>{
  assert.match(html,/pendingAchvFx/);
  assert.match(html,/!completed&&newly\.length/);
  assert.match(html,/completed&&this\.data\.pendingAchvFx/);
});

test('the first-group result visibly reserves three member slots',()=>{
  assert.match(html,/class="fgj-slots"/);
  assert.match(html,/\[0,1,2\]\.map/);
});

test('the first result schedules the D1 promise before starting member two',()=>{
  assert.match(html,/firstGroupNeedsPromise=firstGroupStep==='nextMember'&&!this\.dailyState\(\)\.done/);
  assert.match(html,/firstGroupNeedsPromise\?'DG\.goDaily\(\)'/);
});
