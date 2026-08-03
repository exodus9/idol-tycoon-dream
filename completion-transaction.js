(function(root){
  'use strict';

  function commit(options){
    const input=options||{};
    let saved=false;
    try{ saved=!!input.persist(); }catch(_){ saved=false; }
    if(saved)return true;
    try{ input.restore(input.snapshot); }catch(_){ return false; }
    return false;
  }

  const api=Object.freeze({commit});
  root.CompletionTransaction=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
