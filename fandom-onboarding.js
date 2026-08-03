(function(root){
  'use strict';
  function shouldPrompt(state){
    const s=state&&typeof state==='object'?state:{};
    return Number.isFinite(+s.week)&&Number.isFinite(+s.debutWeek)&&+s.week===+s.debutWeek&&!(+s.fanBondMoments>0);
  }
  const api={shouldPrompt};
  root.FandomOnboarding=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
