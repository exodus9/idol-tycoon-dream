(function(root){
  'use strict';

  function kstDay(now){
    const date=now==null?new Date():new Date(now);
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
      const value={}; parts.forEach(p=>{ if(p.type!=='literal')value[p.type]=p.value; });
      return `${value.year}-${value.month}-${value.day}`;
    }catch(_){
      const d=new Date(date.getTime()+9*3600000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
  }

  function dayDiff(a,b){
    const pa=String(a||'').split('-').map(Number), pb=String(b||'').split('-').map(Number);
    if(pa.length<3||pb.length<3||pa.some(Number.isNaN)||pb.some(Number.isNaN)) return 999;
    return Math.round((Date.UTC(pa[0],pa[1]-1,pa[2])-Date.UTC(pb[0],pb[1]-1,pb[2]))/86400000);
  }

  function state(daily,today){
    const d=daily&&typeof daily==='object'?daily:{}, day=today||kstDay(), done=d.lastDay===day;
    const streak=done?(d.streak||1):(dayDiff(day,d.lastDay)===1?(d.streak||0):0);
    return {today:day,done,streak,total:d.total||0,choice:d.choice||'',lastDay:d.lastDay||''};
  }

  function complete(input){
    const current=state(input.daily,input.today);
    if(current.done) return {accepted:false,daily:input.daily||{},boosts:input.boosts||[],history:input.history||[],streak:current.streak};
    const streak=dayDiff(current.today,current.lastDay)===1?current.streak+1:1;
    const boosts=(Array.isArray(input.boosts)?input.boosts:[]).filter(x=>!x.usedAt);
    boosts.push({id:`${current.today}:${input.rid}:${input.kind}`,rid:input.rid,kind:input.kind,day:current.today,...(input.boost||{})});
    const history=(Array.isArray(input.history)?input.history:[]).slice();
    history.push({rid:input.rid,day:current.today,kind:input.kind,text:input.text});
    return {
      accepted:true,
      daily:{lastDay:current.today,streak,total:current.total+1,choice:input.kind},
      boosts:boosts.slice(-7),history:history.slice(-40),streak
    };
  }

  function consume(boosts,rid,now){
    const list=Array.isArray(boosts)?boosts:[], at=now==null?Date.now():now;
    const found=list.find(x=>!x.usedAt&&String(x.rid)===String(rid));
    if(!found) return {boost:null,boosts:list};
    found.usedAt=at;
    return {boost:found,boosts:list.filter(x=>!x.usedAt||at-x.usedAt<7*86400000).slice(-7)};
  }

  const api={kstDay,dayDiff,state,complete,consume};
  root.DailyRetention=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
