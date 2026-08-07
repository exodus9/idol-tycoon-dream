const test=require('node:test');
const assert=require('node:assert/strict');
const DataLifecycle=require('../data-lifecycle.js');

function storage(seed){
  const map=new Map(Object.entries(seed));
  return {get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),has:k=>map.has(k)};
}

test('export and reset share one progress-key policy',()=>{
  const store=storage({
    idol_save:'run',idol_save_backup_v1:'backup',idol_lb:'ranking',idol_prestige_count:'2',idol_pid:'local-1',
    dg_save_local_1:'agency',dg_save_local_1_backup_v1:'agency-backup',dg_league_seed:'seed',dg_fav_greet:'yes',dg_tut_v2:'done',
    idol_lang:'ja',idol_sfx:'off',idol_bgm:'on',dg_analytics_consent_v1:'granted',dg_analytics_participant_v1:'p-secret',dg_telemetry_outbox_v1:'[]',unrelated:'keep'
  });
  const snapshot=DataLifecycle.exportSnapshot(store,new Date('2026-08-08T00:00:00.000Z'));
  assert.deepEqual(Object.keys(snapshot.storage).sort(),DataLifecycle.listProgressKeys(store));
  assert.equal('dg_analytics_participant_v1' in snapshot.storage,false);
  const removed=DataLifecycle.clearProgress(store);
  assert.ok(removed.includes('idol_lb')&&removed.includes('idol_prestige_count')&&removed.includes('dg_league_seed'));
  assert.deepEqual(DataLifecycle.listProgressKeys(store),[],'no game progress may survive reset');
  for(const key of ['idol_lang','idol_sfx','idol_bgm','dg_analytics_consent_v1','dg_analytics_participant_v1','dg_telemetry_outbox_v1','unrelated'])assert.equal(store.has(key),true,`${key} must be preserved`);
});
