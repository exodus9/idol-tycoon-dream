(function(root){
  'use strict';

  // 모든 표면이 같은 다음 목표를 말하도록 만드는 순수 진행 결정기.
  function decide(input){
    const s=input&&typeof input==='object'?input:{};
    if(s.promisePending) return 'promiseRetry';
    if(s.focusIncomplete) return 'retry';
    if(s.hasRepresentative){
      if(s.battleLoss) return 'retrain';
      return 'battle';
    }
    if((s.readyCount||0)<3) return 'scout';
    if((s.lineupCount||0)<3) return 'lineup';
    return 'debut';
  }

  const api={decide};
  root.ProgressAction=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
