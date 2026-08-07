(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DataLifecycle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SETTINGS=new Set(['idol_lang','idol_sfx','idol_bgm']);
  function isProgressKey(key){
    key=String(key||'');
    if(SETTINGS.has(key))return false;
    if(key.startsWith('idol_'))return true;
    return key.startsWith('dg_')&&!key.startsWith('dg_analytics_')&&!key.startsWith('dg_telemetry_');
  }
  function listProgressKeys(storage){
    const keys=[];
    for(let i=0;i<storage.length;i++){const key=storage.key(i);if(isProgressKey(key))keys.push(key);}
    return keys.sort();
  }
  function exportSnapshot(storage,now=new Date()){
    const data={schema:'dream-group-local-export-v1',exported_at:now.toISOString(),storage:{}};
    for(const key of listProgressKeys(storage))data.storage[key]=storage.getItem(key);
    return data;
  }
  function clearProgress(storage){
    const keys=listProgressKeys(storage);
    for(const key of keys)storage.removeItem(key);
    return keys;
  }
  return {isProgressKey,listProgressKeys,exportSnapshot,clearProgress};
});
