(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RunBalanceRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SEASON_MS=14*24*3600*1000;
  const SEASON_EPOCH=Date.UTC(2026,0,5);
  const TREND_STATS=['vocal','acting','dance','visual','creative'];
  function protectsFirstGate(runNo,isGate,won){
    return !!isGate&&!won&&Math.max(1,Math.round(Number(runNo)||1))===1;
  }
  function trendMultiplier(stat,trendStat){ return stat&&stat===trendStat?1.25:1; }
  function seasonNo(now){ return Math.max(0,Math.floor(((Number(now)||Date.now())-SEASON_EPOCH)/SEASON_MS)); }
  function trendStatAt(now){ return TREND_STATS[seasonNo(now)%TREND_STATS.length]; }
  return Object.freeze({SEASON_MS,SEASON_EPOCH,TREND_STATS,protectsFirstGate,trendMultiplier,seasonNo,trendStatAt});
});
