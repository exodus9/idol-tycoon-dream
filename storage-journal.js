(function(root){
  'use strict';

  function parseObject(raw){
    if(typeof raw!=='string'||!raw) return null;
    try{
      const value=JSON.parse(raw);
      return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
    }catch(_){ return null; }
  }

  function accepted(raw,validate){
    const value=parseObject(raw);
    if(!value) return null;
    try{ return !validate||validate(value)?value:null; }catch(_){ return null; }
  }

  function read(storage,key,backupKey,validate){
    const primary=accepted(storage.getItem(key),validate);
    if(primary) return {value:primary,recovered:false,source:'primary'};
    const backup=accepted(storage.getItem(backupKey),validate);
    if(!backup) return {value:null,recovered:false,source:'none'};
    try{ storage.setItem(key,JSON.stringify(backup)); }catch(_){}
    return {value:backup,recovered:true,source:'backup'};
  }

  function write(storage,key,backupKey,value,validate){
    const next=JSON.stringify(value);
    const previous=storage.getItem(key);
    if(accepted(previous,validate)) storage.setItem(backupKey,previous);
    storage.setItem(key,next);
    return true;
  }

  function clear(storage,key,backupKey){
    storage.removeItem(key);
    storage.removeItem(backupKey);
  }

  const api={parseObject,read,write,clear};
  root.StorageJournal=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
