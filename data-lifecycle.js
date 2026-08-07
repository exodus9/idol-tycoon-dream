(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DataLifecycle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SETTINGS=new Set(['idol_lang','idol_sfx','idol_bgm']);
  const SCHEMA='dream-group-local-export-v1';
  const MAX_IMPORT_BYTES=2*1024*1024;
  const IMPORT_JOURNAL='dg_import_recovery_v1';
  function isProgressKey(key){
    key=String(key||'');
    if(SETTINGS.has(key))return false;
    if(key.startsWith('idol_'))return true;
    return key.startsWith('dg_')&&!key.startsWith('dg_analytics_')&&!key.startsWith('dg_telemetry_')&&!key.startsWith('dg_import_');
  }
  function listProgressKeys(storage){
    const keys=[];
    for(let i=0;i<storage.length;i++){const key=storage.key(i);if(isProgressKey(key))keys.push(key);}
    return keys.sort();
  }
  function exportSnapshot(storage,now=new Date()){
    const data={schema:SCHEMA,exported_at:now.toISOString(),storage:{}};
    for(const key of listProgressKeys(storage))data.storage[key]=storage.getItem(key);
    return data;
  }
  function clearProgress(storage){
    const keys=listProgressKeys(storage);
    for(const key of keys)storage.removeItem(key);
    return keys;
  }
  function validateSnapshot(input){
    let value=input;
    if(typeof input==='string'){
      if(new TextEncoder().encode(input).length>MAX_IMPORT_BYTES)throw new Error('snapshot_too_large');
      try{value=JSON.parse(input);}catch(_){throw new Error('snapshot_invalid_json');}
    }
    if(!value||typeof value!=='object'||Array.isArray(value)||value.schema!==SCHEMA||!value.storage||typeof value.storage!=='object'||Array.isArray(value.storage))throw new Error('snapshot_invalid_schema');
    const clean={};
    for(const [key,raw] of Object.entries(value.storage)){
      if(!isProgressKey(key))throw new Error('snapshot_forbidden_key');
      if(typeof raw!=='string')throw new Error('snapshot_invalid_value');
      clean[key]=raw;
    }
    const normalized={schema:SCHEMA,exported_at:typeof value.exported_at==='string'?value.exported_at:'',storage:clean};
    if(new TextEncoder().encode(JSON.stringify(normalized)).length>MAX_IMPORT_BYTES)throw new Error('snapshot_too_large');
    return normalized;
  }
  function importSnapshot(storage,input){
    const snapshot=validateSnapshot(input), before={};
    for(const key of listProgressKeys(storage))before[key]=storage.getItem(key);
    try{
      storage.setItem(IMPORT_JOURNAL,JSON.stringify({schema:'dream-group-import-recovery-v1',storage:before}));
      for(const key of Object.keys(before))storage.removeItem(key);
      for(const [key,value] of Object.entries(snapshot.storage))storage.setItem(key,value);
      storage.removeItem(IMPORT_JOURNAL);
    }catch(error){
      const recovered=recoverImport(storage);
      const failure=new Error(recovered?'snapshot_import_failed':'snapshot_import_recovery_pending'); failure.cause=error; failure.recoveryPending=!recovered; throw failure;
    }
    return {imported:Object.keys(snapshot.storage).sort(),removed:Object.keys(before).filter(key=>!(key in snapshot.storage)).sort()};
  }
  function recoverImport(storage){
    let journal;try{journal=JSON.parse(storage.getItem(IMPORT_JOURNAL)||'');}catch(_){return true;}
    if(!journal||journal.schema!=='dream-group-import-recovery-v1'||!journal.storage||typeof journal.storage!=='object')return true;
    try{
      for(const key of listProgressKeys(storage))storage.removeItem(key);
      for(const [key,value] of Object.entries(journal.storage)){if(!isProgressKey(key)||typeof value!=='string')throw new Error('invalid_recovery');storage.setItem(key,value);}
      storage.removeItem(IMPORT_JOURNAL);return true;
    }catch(_){return false;}
  }
  return {SCHEMA,MAX_IMPORT_BYTES,IMPORT_JOURNAL,isProgressKey,listProgressKeys,exportSnapshot,validateSnapshot,importSnapshot,recoverImport,clearProgress};
});
