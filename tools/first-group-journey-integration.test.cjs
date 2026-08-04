const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('first and second completion expose a specific mentor-to-member continuation',()=>{
  assert.match(html,/FirstGroupJourney\.resultStep\(\{readyCount,groupCount:/);
  assert.match(html,/DG\.startMentorRun\(\$\{firstGroupOffer\.mentor\.rid\},\$\{firstGroupOffer\.target\.id\},'\$\{firstGroupOffer\.direction\}','result_first_group'\)/);
  assert.match(html,/Game\.pendingRunDirection=direction/);
});

test('the third completion leads to the first lineup before daily side actions',()=>{
  assert.match(html,/firstGroupStep==='firstLineup'/);
  assert.match(html,/\$\{firstGroupJourney\}\$\{returnHook\}/);
  assert.match(html,/DG\.go\(\);DG\.editLineup\('result_first_group'\)/);
});

test('first-group result transitions are measurable as a standalone funnel',()=>{
  assert.match(html,/first_group_continue/);
  assert.match(html,/source:eventSource/);
  assert.match(html,/step:'next_member'/);
  assert.match(html,/step:'lineup'/);
});

test('debut is protected by rehearsal readiness at UI and persistence boundaries',()=>{
  assert.match(html,/if\(!this\.groupReadiness\(\)\.pass\)return \{err:'notready'\}/);
  assert.match(html,/if\(!this\.groupReadiness\(\)\.pass\)\{ toast\(dgT\('debut\.notReady'\)\)/);
  assert.match(html,/debutReady\.pass\? `<button class="btn"/);
});
