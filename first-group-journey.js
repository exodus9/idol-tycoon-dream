(function(root){
  'use strict';

  const ROLE_DIRECTION={leader:'charm',center:'visual',dancer:'dance'};
  const DIRECTION_ROLE={charm:'leader',visual:'center',dance:'dancer',vocal:'vocal',acting:'rapper',creative:'producer'};

  function nextDirection(completedDirections){
    const used=new Set((completedDirections||[]).filter(Boolean));
    return ['charm','visual','dance'].find(direction=>!used.has(direction))||'charm';
  }

  function resultStep(input){
    const state=input&&typeof input==='object'?input:{};
    if((state.groupCount||0)>0)return 'established';
    if((state.readyCount||0)<3)return 'nextMember';
    return 'firstLineup';
  }

  function debutReadiness(input){
    const state=input&&typeof input==='object'?input:{};
    const roles=new Set((state.roles||[]).filter(Boolean));
    const memberCount=Math.max(0,Number(state.memberCount)||0);
    const average=Math.max(0,Number(state.averageRolePower)||0);
    const synergy=Math.max(0,Number(state.synergyPct)||0);
    const checks={
      members:memberCount>=3,
      front:roles.has('leader')&&roles.has('center'),
      stage:[...roles].some(role=>!['leader','center'].includes(role)),
      power:average>=100,
      synergy:synergy>=3
    };
    const missing=Object.keys(checks).filter(key=>!checks[key]);
    return {pass:missing.length===0,checks,missing,memberCount,average,synergy};
  }

  const api=Object.freeze({ROLE_DIRECTION,DIRECTION_ROLE,nextDirection,resultStep,debutReadiness});
  root.FirstGroupJourney=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
