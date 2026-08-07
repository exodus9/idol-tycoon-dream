const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'..','product-telemetry.js'),'utf8');
const locale=fs.readFileSync(path.join(__dirname,'..','dg-i18n.js'),'utf8');

test('selecting a favorite immediately resolves an active RUN identity conflict',()=>{
  const pick=html.slice(html.indexOf('  pick(id,source){'),html.indexOf('  renderSpecPick(){'));
  const prompt=html.slice(html.indexOf('  promptActiveRunDecision('),html.indexOf('  goSelect(){'));
  assert.ok(pick.includes('this.promptActiveRunDecision(this.selIdol,false)'));
  assert.ok(prompt.includes("decision:'continue'"));
  assert.ok(prompt.includes("decision:'replace'"));
  assert.ok(prompt.includes('active.idolName'));
  assert.ok(prompt.includes('active.week'));
  assert.ok(bridge.includes("active_run_decision:['active_run_id','active_id','target_id','decision','turn']"));
});

test('RUN replacement commits save and rewards together before run_start telemetry',()=>{
  const start=html.slice(html.indexOf('  start(){'),html.indexOf('  // 캐릭터 확정'));
  const snapshot=start.indexOf('agencySnapshot=DG.snapshotRunStart()');
  const reward=start.indexOf('DG.takeDailyBoost');
  const commit=start.indexOf('CompletionTransaction.commitPair');
  const event=start.indexOf("ProductTelemetry.track('run_start'");
  assert.ok(snapshot>=0&&snapshot<reward,'agency and active RUN must be snapshotted before rewards are consumed');
  assert.ok(reward<commit&&commit<event,'rewards and both stores must commit before run_start is emitted');
  assert.ok(start.includes('this.restoreRunSave(runSnapshot)'));
  assert.ok(start.includes('DG.restoreRunStart(agencySnapshot)'));
  assert.ok(start.includes('if(replacingActive)this.clearSave()'));
});

test('replacement approval is bound to the active run and selected idol',()=>{
  const prompt=html.slice(html.indexOf('  promptActiveRunDecision('),html.indexOf('  goSelect(){'));
  const start=html.slice(html.indexOf('  start(){'),html.indexOf('  // 캐릭터 확정'));
  assert.ok(prompt.includes('RunIdentity.approvalMatches(this._replaceApproval,active,selected)'));
  assert.ok(prompt.includes('this._replaceApproval=RunIdentity.approval(active,selected)'));
  assert.ok(start.includes('RunIdentity.approvalMatches(this._replaceApproval,activeAtCommit,idol)'));
  assert.equal(html.includes('_replaceConfirmed'),false,'unscoped boolean replacement approval must not return');
});

test('active and target identities are named in all four launch locales',()=>{
  assert.equal((locale.match(/'run\.replaceTitle':'[^']*\{active\}/g)||[]).length,4);
  assert.equal((locale.match(/'run\.replaceCopy':'[^']*\{active\}[^']*\{target\}/g)||[]).length,4);
  assert.equal((locale.match(/'save\.startRollback':/g)||[]).length,4);
  assert.equal((locale.match(/'save\.startRecoveryUnknown':/g)||[]).length,4);
});
