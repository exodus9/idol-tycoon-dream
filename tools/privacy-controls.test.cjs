const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const i18n=fs.readFileSync(path.resolve(__dirname,'../dg-i18n.js'),'utf8');
const gate=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../release-gate.json'),'utf8'));

test('privacy controls expose explicit analytics consent in every release locale',()=>{
  assert.match(html,/ProductTelemetry\.setConsent\(state\)/);
  assert.match(html,/Game\.setAnalyticsConsent\('granted'\)/);
  assert.match(html,/Game\.setAnalyticsConsent\('denied'\)/);
  assert.equal((i18n.match(/'privacy\.analyticsCopy'/g)||[]).length,4);
});

test('progress export excludes telemetry and analytics identifiers',()=>{
  assert.match(html,/DataLifecycle\.exportSnapshot\(localStorage\)/);
  assert.match(html,/DataLifecycle\.clearProgress\(localStorage\)/);
});

test('commercial release cannot pass with undocumented rights or operations',()=>{
  const required=gate.checks.filter(x=>x.required_for.includes('commercial_production'));
  const blockers=required.filter(x=>x.status!=='pass');
  assert.ok(blockers.some(x=>x.id==='idol_media_rights'));
  assert.ok(blockers.some(x=>x.id==='bundled_asset_rights'));
  assert.ok(blockers.some(x=>x.id==='production_observability'));
  assert.ok(blockers.every(x=>x.owner&&x.evidence_required));
});

test('public RC follows the product-owner scope while production keeps organizational gates',()=>{
  const publicRequired=gate.checks.filter(x=>x.required_for.includes('public_rc'));
  const productionRequired=gate.checks.filter(x=>x.required_for.includes('commercial_production'));
  for(const id of ['idol_media_rights','bundled_asset_rights','privacy_policy']){
    assert.equal(publicRequired.some(x=>x.id===id),false,`${id} is handled by the host-product scope for this RC`);
    assert.ok(productionRequired.some(x=>x.id===id),`${id} must remain visible for production certification`);
  }
});
