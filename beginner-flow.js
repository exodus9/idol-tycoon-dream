(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BeginnerFlow=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function isFirstRun(data,retrainRid){
    return !retrainRid && Math.max(0,Number(data&&data.runs)||0)===0;
  }

  function recommendedDirection(input){
    input=input||{};
    const valid=new Set(input.valid||[]);
    for(const value of [input.current,input.pending,input.custom]){
      if(valid.has(value))return value;
    }
    if(input.firstRun&&valid.has(input.trend))return input.trend;
    return null;
  }

  function recoveryState(stamina,cards){
    const current=Math.max(0,Number(stamina)||0);
    const list=(cards||[]).filter(Boolean);
    const restIndex=list.findIndex(card=>Number(card.cost)<0);
    const hasPlayableTraining=list.some(card=>Number(card.cost)>0&&current>=Number(card.cost));
    return {
      urgent:restIndex>=0&&!hasPlayableTraining,
      recommended:restIndex>=0&&current<27,
      restIndex,
      stamina:current
    };
  }

  function recoveryHand(hand,stamina,cards){
    const ids=Array.isArray(hand)?hand.slice():[];
    const byId=new Map((cards||[]).filter(Boolean).map(card=>[card.id,card]));
    const current=Math.max(0,Number(stamina)||0);
    const hasRest=ids.some(id=>Number((byId.get(id)||{}).cost)<0);
    const hasPlayable=ids.some(id=>{const card=byId.get(id);return card&&Number(card.cost)>0&&current>=Number(card.cost);});
    if(hasRest||(current>=27&&hasPlayable))return ids;
    const rest=(cards||[]).find(card=>card&&Number(card.cost)<0);
    if(!rest)return ids;
    if(ids.length)ids[ids.length-1]=rest.id;
    else ids.push(rest.id);
    return ids;
  }

  function firstRunHand(hand,direction,cards){
    const ids=Array.isArray(hand)?hand.slice():[];
    const pool=(cards||[]).filter(Boolean);
    const byId=new Map(pool.map(card=>[card.id,card]));
    if(ids.some(id=>{const card=byId.get(id);return card&&card.stat===direction;}))return ids;
    const recommended=pool
      .filter(card=>card.stat===direction&&Number(card.cost)>0)
      .sort((a,b)=>(Number(a.cost)||0)-(Number(b.cost)||0)||(Number(b.base)||0)-(Number(a.base)||0))[0];
    if(!recommended)return ids;
    if(ids.length)ids[0]=recommended.id;
    else ids.push(recommended.id);
    return ids;
  }

  function actionableStats(hand,cards,stamina){
    const byId=new Map((cards||[]).filter(Boolean).map(card=>[card.id,card]));
    const hasStamina=stamina!=null&&Number.isFinite(Number(stamina));
    const current=Math.max(0,Number(stamina)||0);
    return [...new Set((hand||[]).map(id=>byId.get(id)).filter(card=>card&&card.stat&&(!hasStamina||Number(card.cost)<=current)).map(card=>card.stat))];
  }

  function recommendedTrainableStat(input){
    input=input||{};
    const valid=[...new Set((input.valid||[]).filter(Boolean))];
    const actionable=new Set((input.actionable||[]).filter(Boolean));
    const values=input.values||{};
    const cap=Math.max(1,Number(input.cap)||800);
    const trainable=valid.filter(key=>actionable.has(key)&&(Number(values[key])||0)<cap);
    if(!trainable.length)return null;
    if(input.preferred&&trainable.includes(input.preferred))return input.preferred;
    return trainable.sort((a,b)=>(Number(values[a])||0)-(Number(values[b])||0))[0]||null;
  }

  function nextTurnLabel(week,total){
    const now=Math.max(1,Math.round(Number(week)||1));
    const end=Math.max(now,Math.round(Number(total)||now));
    return now>=end?'결과 확인하기':`다음 턴 ${now+1}/${end}`;
  }

  function debutProgress(input){
    input=input||{};
    const values=(input.values||[]).map(value=>Math.max(0,Number(value)||0));
    const cut=input.cut||{};
    const modifier=Math.max(0,Number(input.modifier)||1);
    const total=values.reduce((sum,value)=>sum+value,0);
    const peak=values.length?Math.max(...values):0;
    const target={
      total:Math.max(0,(Number(cut.total)||0)*modifier),
      peak:Math.max(0,(Number(cut.peak)||0)*modifier),
      min:Math.max(0,(Number(cut.min)||0)*modifier)
    };
    const need={
      total:Math.max(0,Math.ceil(target.total-total)),
      peak:Math.max(0,Math.ceil(target.peak-peak)),
      min:Math.max(0,Math.ceil(target.min-peak))
    };
    return {
      pass:need.min===0&&(need.total===0||need.peak===0),
      total,
      peak,
      target,
      need
    };
  }

  function protectsFirstGate(runNo,isGate,won){
    return !!isGate&&!won&&Math.max(1,Math.round(Number(runNo)||1))===1;
  }

  return Object.freeze({isFirstRun,recommendedDirection,recoveryState,recoveryHand,firstRunHand,actionableStats,recommendedTrainableStat,nextTurnLabel,debutProgress,protectsFirstGate});
});
