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

  function addDays(day,amount){
    const p=String(day||'').split('-').map(Number);
    if(p.length<3||p.some(Number.isNaN)) return '';
    const d=new Date(Date.UTC(p[0],p[1]-1,p[2]+Number(amount||0)));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }

  function nextKstResetAt(now){
    const day=kstDay(now), p=day.split('-').map(Number);
    if(p.length<3||p.some(Number.isNaN)) return NaN;
    return Date.UTC(p[0],p[1]-1,p[2]+1)-9*3600000;
  }

  function keepEchoes(list){
    const rows=(Array.isArray(list)?list:[]).filter(x=>x&&typeof x==='object');
    const recentClaimed=new Set(rows.filter(x=>x.claimedAt).slice(-20));
    return rows.filter(x=>!x.claimedAt||recentClaimed.has(x));
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
    boosts.push({id:`${current.today}:${input.rid}:${input.kind}`,rid:input.rid,kind:input.kind,day:current.today,awaitingReply:true,...(input.boost||{})});
    const history=(Array.isArray(input.history)?input.history:[]).slice();
    history.push({rid:input.rid,day:current.today,kind:input.kind,text:input.text});
    return {
      accepted:true,
      daily:{lastDay:current.today,streak,total:current.total+1,choice:input.kind},
      boosts,history:history.slice(-40),streak
    };
  }

  function queueEcho(echoes,input){
    const list=(Array.isArray(echoes)?echoes:[]).filter(x=>x&&typeof x==='object').slice();
    const id=`${input.today}:${input.rid}:${input.kind}`;
    if(!list.some(x=>x.id===id)) list.push({id,rid:input.rid,kind:input.kind,fromDay:input.today,revealDay:addDays(input.today,1),idolName:input.idolName||'',fandomName:input.fandomName||'',
      runId:input.runId||'',promiseId:input.promiseId||'',promiseType:input.promiseType||'',promiseDirection:input.promiseDirection||'',promiseTitle:input.promiseTitle||'',promiseStatus:input.promiseStatus||''});
    return keepEchoes(list);
  }

  function echoState(echoes,today,rid){
    const list=(Array.isArray(echoes)?echoes:[]).filter(x=>x&&typeof x==='object'), day=today||kstDay();
    const same=x=>rid==null||String(x.rid)===String(rid);
    const ready=list.find(x=>same(x)&&!x.claimedAt&&x.revealDay&&dayDiff(day,x.revealDay)>=0)||null;
    const revealed=list.slice().reverse().find(x=>same(x)&&x.claimedDay===day)||null;
    return {ready,revealed};
  }

  function focusedEchoState(echoes,today,focusId,rid){
    const list=(Array.isArray(echoes)?echoes:[]).filter(x=>x&&typeof x==='object'), day=today||kstDay();
    const focus=focusId?list.find(x=>String(x.id)===String(focusId)):null;
    if(!focus)return {...echoState(list,day,rid),pending:null,focused:false};
    const ready=!focus.claimedAt&&focus.revealDay&&dayDiff(day,focus.revealDay)>=0?focus:null;
    const revealed=focus.claimedDay===day?focus:null;
    const pending=!focus.claimedAt&&focus.revealDay&&dayDiff(day,focus.revealDay)<0?focus:null;
    return {ready,revealed,pending,focused:true};
  }

  function claimEcho(echoes,id,today,now){
    const list=(Array.isArray(echoes)?echoes:[]).filter(x=>x&&typeof x==='object'), day=today||kstDay(), echo=list.find(x=>x.id===id);
    if(!echo||echo.claimedAt||!echo.revealDay||dayDiff(day,echo.revealDay)<0) return {accepted:false,echo:null,echoes:list};
    echo.claimedAt=now==null?Date.now():now; echo.claimedDay=day;
    return {accepted:true,echo,echoes:keepEchoes(list)};
  }

  function pendingEcho(echoes,rid){
    return (Array.isArray(echoes)?echoes:[]).find(x=>x&&typeof x==='object'&&!x.claimedAt&&String(x.rid)===String(rid))||null;
  }

  // A concrete next-day contract is stronger than a generic "come back tomorrow".
  // Match the exact RUN first so another queued fandom reply cannot replace it.
  function pendingReturn(echoes,today,input){
    const p=input&&typeof input==='object'?input:{}, day=today||kstDay();
    return (Array.isArray(echoes)?echoes:[])
      .filter(x=>x&&typeof x==='object'&&!x.claimedAt&&x.revealDay&&dayDiff(day,x.revealDay)<0)
      .filter(x=>p.rid==null||String(x.rid)===String(p.rid))
      .filter(x=>!p.runId||String(x.runId)===String(p.runId))
      .sort((a,b)=>String(a.revealDay).localeCompare(String(b.revealDay))||String(a.fromDay).localeCompare(String(b.fromDay)))[0]||null;
  }

  function mergeReplyBoost(boosts,echo,boost,today){
    const list=(Array.isArray(boosts)?boosts:[]).filter(x=>x&&typeof x==='object'&&!x.usedAt);
    const target=list.find(x=>String(x.rid)===String(echo.rid)&&x.day===echo.fromDay&&x.kind===echo.kind);
    if(target){
      for(const key of ['bond','climax','start']) if(boost&&boost[key]) target[key]=(target[key]||0)+boost[key];
      target.reply=true; delete target.awaitingReply;
      return [target,...list.filter(x=>x!==target)];
    }
    const reply={id:`reply:${echo.id}`,rid:echo.rid,kind:`reply-${echo.kind}`,day:today,...boost};
    return [reply,...list];
  }

  function consume(boosts,rid,now){
    const list=Array.isArray(boosts)?boosts:[], at=now==null?Date.now():now;
    const found=list.find(x=>!x.usedAt&&!x.awaitingReply&&String(x.rid)===String(rid));
    if(!found) return {boost:null,boosts:list};
    found.usedAt=at;
    return {boost:found,boosts:list.filter(x=>!x.usedAt||at-x.usedAt<7*86400000)};
  }

  function firstGroupBridge(input){
    const p=input&&typeof input==='object'?input:{}, ready=Math.max(0,Number(p.readyCount)||0), groups=Math.max(0,Number(p.groupCount)||0), echo=p.echo;
    if(!echo||groups>0||ready<1||ready>=3)return null;
    return {id:`first-group:${echo.id}`,sourceRid:echo.rid,sourceEchoId:echo.id,start:8,createdAt:Number(p.now)||Date.now()};
  }

  function consumeFirstGroupBridge(bridge,isRetrain,now){
    if(!bridge||typeof bridge!=='object'||bridge.usedAt||isRetrain)return {boost:null,bridge:bridge||null};
    return {boost:{start:Math.max(0,Number(bridge.start)||0),sourceRid:bridge.sourceRid,sourceEchoId:bridge.sourceEchoId},bridge:{...bridge,usedAt:Number(now)||Date.now()}};
  }

  const api={kstDay,dayDiff,addDays,nextKstResetAt,state,complete,queueEcho,echoState,focusedEchoState,claimEcho,pendingEcho,pendingReturn,mergeReplyBoost,consume,firstGroupBridge,consumeFirstGroupBridge};
  root.DailyRetention=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
