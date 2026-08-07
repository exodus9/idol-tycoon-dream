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

  function commitPair(options){
    const input=options||{};
    let runSaved=false,agencySaved=false;
    try{runSaved=!!input.persistRun();}catch(_){runSaved=false;}
    if(runSaved){try{agencySaved=!!input.persistAgency();}catch(_){agencySaved=false;}}
    if(runSaved&&agencySaved)return {ok:true,recovered:true};
    let runRestored=false,agencyRestored=false;
    try{runRestored=!!input.restoreRun();}catch(_){runRestored=false;}
    try{agencyRestored=!!input.restoreAgency();}catch(_){agencyRestored=false;}
    return {ok:false,recovered:runRestored&&agencyRestored};
  }

  const api=Object.freeze({commit,commitPair});
  root.CompletionTransaction=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
