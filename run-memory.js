(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.RunMemory=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const TYPES=['signature','fandom','resilience'];
  const countTarget=mode=>mode==='quick'?3:5;
  const fandomTarget=mode=>mode==='quick'?2:4;
  const mentalTarget=mode=>mode==='quick'?65:70;
  const baseType=p=>p&&TYPES.includes(p.baseType)?p.baseType:(p&&TYPES.includes(p.id)?p.id:'signature');
  const targetFor=(type,mode)=>type==='signature'?countTarget(mode):type==='fandom'?fandomTarget(mode):mentalTarget(mode);

  function option(type,ctx,extra={}){
    const mode=ctx.mode==='quick'?'quick':'full', idol=String(ctx.idolName||'아이돌'), fandom=String(ctx.fandom||'팬덤'), direction=String(ctx.directionLabel||'핵심 무대');
    const target=targetFor(type,mode);
    const map={
      signature:{icon:'🎬',title:`${direction} 대표 장면 남기기`,copy:`${idol}의 이번 버전을 ${direction} 한 장면으로 증명해요.`,goal:`${direction} 훈련 ${target}회`,tradeoff:'핵심 성장 집중 · 다른 관문 준비 여유 감소'},
      fandom:{icon:'💌',title:`${fandom} 앙코르 약속`,copy:'팬들이 다시 부르고 싶은 장면을 팬 소통 훈련으로 완성해요.',goal:`팬 소통 훈련 ${target}회`,tradeoff:'팬덤 유대 강화 · 핵심 무대 성장 분산'},
      resilience:{icon:'🔥',title:`${idol}의 흔들리지 않는 파이널`,copy:'고위험 한 방보다 컨디션과 멘탈을 지켜 마지막 무대까지 가요.',goal:`완주 시 멘탈 ${target} 이상`,tradeoff:'안정 운영 · 고위험 훈련 기회 감소'},
    };
    return {id:type,baseType:type,target,mode,...map[type],...extra};
  }

  function options(ctx={}){
    const out=TYPES.map(type=>option(type,ctx));
    const prev=ctx.previous&&ctx.previous.status==='failed'?ctx.previous:null;
    if(prev){
      const type=baseType(prev), retry=option(type,ctx,{id:`retry:${type}`,retryOf:String(prev.runId||''),retryRun:Number(prev.run||0),
        title:`미완결 · ${String(prev.title||'지난 약속')} 다시 도전`,copy:`${prev.run?`RUN ${String(prev.run).padStart(2,'0')}`:'지난 RUN'}에서 못 지킨 목표를 다른 선택으로 끝내요.`,icon:'↻'});
      return [retry,...out.filter(x=>x.baseType!==type)];
    }
    return out;
  }

  function applyStart(state,promise){
    if(!state||!promise||!baseType(promise))return null;
    state.runPromise={id:String(promise.id),baseType:baseType(promise),title:String(promise.title||''),copy:String(promise.copy||''),goal:String(promise.goal||''),tradeoff:String(promise.tradeoff||''),target:Number(promise.target||0),retryOf:String(promise.retryOf||''),retryRun:Number(promise.retryRun||0)};
    state.promiseStartBond=Number(state.fanBond||0); state.promiseStartMental=Number(state.mental||0);
    return state.runPromise;
  }

  function progress(state){
    const p=state&&state.runPromise; if(!p)return null;
    const type=baseType(p), relaxed=state.promiseCheckpoint==='adapt';
    const target=Math.max(1,Number(p.target||targetFor(type,state.mode))-(relaxed?(type==='resilience'?8:1):0));
    let value=0,label='';
    if(type==='signature'){ value=Number((state.trainCount||{})[state.runDirection]||0); label=`핵심 무대 훈련 ${value}/${target}`; }
    else if(type==='fandom'){ value=Number((state.trainCount||{}).charm||0); label=`팬 소통 훈련 ${value}/${target}`; }
    else { value=Math.round(Number(state.mental||0)); label=`현재 멘탈 ${value}/${target}`; }
    return {type,value,target,label,met:value>=target,relaxed};
  }

  function resolveCheckpoint(state,choice){
    if(!state||!state.runPromise||state.promiseCheckpoint)return null;
    const type=baseType(state.runPromise), commit=choice==='commit';
    state.promiseCheckpoint=commit?'commit':'adapt';
    if(commit){
      state.stam=Math.max(0,Number(state.stam||0)-8);
      if(type==='signature') state[state.runDirection]=Number(state[state.runDirection]||0)+8;
      else if(type==='fandom') state.fanBond=Math.min(100,Number(state.fanBond||0)+5);
      else state.mental=Math.min(100,Number(state.mental||0)+5);
    }else{
      state.cond=Math.min(100,Number(state.cond||0)+5);
      state.fanBond=Math.min(100,Number(state.fanBond||0)+2);
    }
    return {choice:state.promiseCheckpoint,...progress(state)};
  }

  function evaluate(state){
    const p=state&&state.runPromise, pg=progress(state); if(!p||!pg)return null;
    const success=pg.met, type=pg.type, retry=!!p.retryOf;
    const evidence=type==='signature'?`${pg.label} · ${success?'대표 장면 완성':'집중 훈련 부족'}`
      :type==='fandom'?`${pg.label} · ${success?'앙코르 약속 완성':'팬 소통 준비 부족'}`
      :`${pg.label} · ${success?'끝까지 중심을 지킴':'마지막까지 흔들림'}`;
    const reward=success?(type==='fandom'?'다음 회차 유대 계승 +6':type==='signature'?'팬 800명 추가':'팬 500명 추가'):'다음 RUN에서 미완결 약속 재도전';
    return {runId:String(state.runId||''),run:Number(state.runNo||0),promiseId:String(p.id),baseType:type,title:String(p.title||''),goal:String(p.goal||''),status:success?'success':'failed',
      checkpoint:String(state.promiseCheckpoint||'none'),value:pg.value,target:pg.target,relaxed:!!pg.relaxed,evidence,reward,retryOf:String(p.retryOf||''),retry,bonusCard:success&&retry};
  }

  function applyReward(state,result){
    if(!state||!result||result.status!=='success')return result;
    if(result.baseType==='fandom') state.fanBond=Math.min(100,Number(state.fanBond||0)+6);
    else state.fans=Number(state.fans||0)+(result.baseType==='signature'?800:500);
    return result;
  }

  function nextUnresolved(previous,result){
    const prev=previous&&previous.status==='failed'?previous:null;
    if(result&&result.status==='failed')return result;
    if(prev&&result&&result.status==='success'&&result.retryOf&&String(result.retryOf)===String(prev.runId||''))return null;
    return prev;
  }

  function recordSource(records,input){
    const source=input&&input.source;
    if(!['promise_reply','run_record'].includes(source))return null;
    const rid=String(input.rid), runId=String(input.runId||''), promiseId=String(input.promiseId||'');
    if(!runId||!promiseId)return null;
    const record=Array.isArray(records)?records.find(x=>String(x.rid)===rid&&String(x.runId)===runId):null;
    const memory=record&&record.runMemory;
    if(!memory||String(memory.promiseId||'')!==promiseId)return null;
    return {source,rid:input.rid,runId,promiseId,memory:{...memory}};
  }

  function replyLink(source){
    if(!source||!source.runId||!source.promiseId)return {};
    return {source:source.source==='run_record'?'run_record':'promise_reply',reply_run_id:String(source.runId),reply_promise_id:String(source.promiseId)};
  }

  function replySelection(memory){
    if(!memory)return '';
    const type=baseType(memory);
    return memory.status==='failed'?`retry:${type}`:type;
  }

  return {TYPES,options,applyStart,progress,resolveCheckpoint,evaluate,applyReward,nextUnresolved,recordSource,replyLink,replySelection};
});
