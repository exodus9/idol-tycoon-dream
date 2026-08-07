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

test('export, reset and import restore progress exactly without touching settings',()=>{
  const store=storage({idol_save:'run',dg_save_local_1:'agency',idol_lang:'ja',dg_analytics_consent_v1:'granted',unrelated:'keep'});
  const snapshot=DataLifecycle.exportSnapshot(store,new Date('2026-08-08T00:00:00.000Z'));
  DataLifecycle.clearProgress(store);
  store.setItem('idol_save','new-run');
  const result=DataLifecycle.importSnapshot(store,JSON.stringify(snapshot));
  assert.deepEqual(result.imported,['dg_save_local_1','idol_save']);
  assert.equal(store.getItem('idol_save'),'run');
  assert.equal(store.getItem('dg_save_local_1'),'agency');
  assert.equal(store.getItem('idol_lang'),'ja');
  assert.equal(store.getItem('dg_analytics_consent_v1'),'granted');
  assert.equal(store.getItem('unrelated'),'keep');
});

test('import rejects malformed, oversized and non-progress data',()=>{
  const store=storage({idol_save:'safe'});
  for(const value of ['{',JSON.stringify({schema:'wrong',storage:{idol_save:'x'}}),JSON.stringify({schema:DataLifecycle.SCHEMA,storage:{dg_analytics_participant_v1:'secret'}}),JSON.stringify({schema:DataLifecycle.SCHEMA,storage:{idol_save:7}})]){
    assert.throws(()=>DataLifecycle.importSnapshot(store,value));
    assert.equal(store.getItem('idol_save'),'safe');
  }
  assert.throws(()=>DataLifecycle.importSnapshot(store,' '.repeat(DataLifecycle.MAX_IMPORT_BYTES+1)),/snapshot_too_large/);
});

test('failed storage write rolls back the original progress',()=>{
  const map=new Map([['idol_save','safe'],['dg_save_local_1','agency'],['idol_lang','ko']]); let fail=true;
  const store={get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.has(k)?map.get(k):null,removeItem:k=>map.delete(k),setItem(k,v){if(fail&&k==='dg_new'){fail=false;throw new Error('quota');}map.set(k,String(v));}};
  const incoming={schema:DataLifecycle.SCHEMA,storage:{idol_save:'replacement',dg_new:'new'}};
  assert.throws(()=>DataLifecycle.importSnapshot(store,incoming),/snapshot_import_failed/);
  assert.equal(store.getItem('idol_save'),'safe');
  assert.equal(store.getItem('dg_save_local_1'),'agency');
  assert.equal(store.getItem('dg_new'),null);
  assert.equal(store.getItem('idol_lang'),'ko');
});

test('persistent write failure leaves a durable journal and recovers on the next healthy load',()=>{
  const map=new Map([['idol_save','safe'],['dg_save_local_1','agency']]); let writes=0,broken=true;
  const store={get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.has(k)?map.get(k):null,removeItem:k=>map.delete(k),setItem(k,v){writes++;if(broken&&writes>1)throw new Error('storage unavailable');map.set(k,String(v));}};
  assert.throws(()=>DataLifecycle.importSnapshot(store,{schema:DataLifecycle.SCHEMA,storage:{idol_save:'replacement'}}),error=>error.recoveryPending===true);
  assert.ok(store.getItem(DataLifecycle.IMPORT_JOURNAL),'the original state must survive in a durable recovery journal');
  broken=false;
  assert.equal(DataLifecycle.recoverImport(store),true);
  assert.equal(store.getItem('idol_save'),'safe');
  assert.equal(store.getItem('dg_save_local_1'),'agency');
  assert.equal(store.getItem(DataLifecycle.IMPORT_JOURNAL),null);
});
