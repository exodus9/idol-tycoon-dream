(function(root){
  'use strict';

  function idolKey(idol){
    if(!idol||typeof idol!=='object')return '';
    if(idol.id==='custom')return `c:${String(idol.name||'').trim()}`;
    const id=idol.id!=null?idol.id:idol.rid;
    return id==null?'':`i:${String(id)}`;
  }

  function summary(run){
    if(!run||typeof run!=='object'||!run.idol)return null;
    const key=idolKey(run.idol);
    if(!key)return null;
    return Object.freeze({
      runId:String(run.runId||''),
      idolKey:key,
      idolId:run.idol.id==null?'':String(run.idol.id),
      idolName:String(run.idol.name||''),
      week:Math.max(1,Number(run.week)||1),
      total:run.mode==='quick'?12:24,
      retrainRid:run.retrainRid==null?'':String(run.retrainRid)
    });
  }

  function conflict(activeRun,selectedIdol){
    const active=summary(activeRun),selectedKey=idolKey(selectedIdol);
    if(!active||!selectedKey)return null;
    return Object.freeze({active,selectedKey,sameIdol:active.idolKey===selectedKey});
  }

  function approval(active,selectedIdol){
    const targetKey=idolKey(selectedIdol);
    if(!active||!active.runId||!targetKey)return null;
    return Object.freeze({activeRunId:String(active.runId),targetKey});
  }

  function approvalMatches(token,active,selectedIdol){
    const targetKey=idolKey(selectedIdol);
    return !!(token&&active&&String(token.activeRunId)===String(active.runId)&&token.targetKey===targetKey);
  }

  const api=Object.freeze({idolKey,summary,conflict,approval,approvalMatches});
  root.RunIdentity=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
