(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SeasonEditionLedger=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const copyEdition=e=>e&&Number.isFinite(+e.no)?{no:+e.no,name:String(e.name||''),icon:String(e.icon||'🎬'),pos:String(e.pos||''),direction:String(e.direction||'')}:null;
  const scoreOf=(record,keys)=>(keys||[]).reduce((n,k)=>n+((record&&record.stats&&+record.stats[k])||0),0);
  function qualify(input){
    input=input||{};
    if(!input.registered||!input.reachedFinal||!input.trend||input.direction!==input.expectedDirection)return null;
    return copyEdition({no:+input.seasonNo,name:input.trend.name||input.trend.nm,icon:input.trend.icon||input.trend.ic,pos:input.trend.pos,direction:input.direction});
  }
  function editionsOf(rows,rid){ return (rows||[]).filter(e=>String(e.rid)===String(rid)).sort((a,b)=>(+b.no)-(+a.no)); }
  function upsert(rows,input,keys){
    rows=Array.isArray(rows)?rows:[]; input=input||{};
    const edition=copyEdition(input.edition),record=input.record,rid=input.rid;
    if(rid==null||!edition||!record||!record.completed)return {rows,row:null,created:false};
    const key=`${rid}:${edition.no}`,score=scoreOf(record,keys),runId=String(record.runId||'');
    let row=rows.find(e=>`${e.rid}:${+e.no}`===key),created=false;
    if(!row){row={rid,no:edition.no,name:edition.name,icon:edition.icon,pos:edition.pos,direction:edition.direction,runIds:[],bestRunId:runId,bestScore:score,completedAt:record.savedAt||Date.now()};rows.push(row);created=true;}
    if(!Array.isArray(row.runIds))row.runIds=[];
    const versionAdded=!!(runId&&!row.runIds.some(id=>String(id)===runId)); if(versionAdded)row.runIds.push(runId);
    const bestChanged=!created&&score>(row.bestScore||0); if(bestChanged){row.bestScore=score;row.bestRunId=runId||row.bestRunId;}
    return {rows,row,created,versionAdded,bestChanged};
  }
  function migrate(records,rows,keys){
    const previous=JSON.stringify(Array.isArray(rows)?rows:[]);
    // 파이널 도달이 증명된 RUN 원장을 유일한 진실로 삼아 매번 재구축한다.
    // 옛 실험판이 만들어 둔 고아 에디션 행이 영구 컬렉션으로 남는 것을 막는다.
    rows=[];
    let changed=false;
    (records||[]).forEach(record=>{
      if(!record||!record.seasonEdition)return;
      // 파이널 도달 증거가 없는 옛 실험 데이터는 에디션으로 공인하지 않는다.
      if(record.seasonQualified!==true){delete record.seasonEdition;changed=true;return;}
      if(record.completed==null){record.completed=!record.failed;changed=true;}
      if(!record.completed)return;
      const before=rows.length,prev=rows.find(e=>String(e.rid)===String(record.rid)&&+e.no===+record.seasonEdition.no),prevRuns=prev&&Array.isArray(prev.runIds)?prev.runIds.length:0,prevBest=prev&&prev.bestRunId;
      const out=upsert(rows,{rid:record.rid,edition:record.seasonEdition,record},keys); rows=out.rows;
      if(rows.length!==before||!prev||out.row.runIds.length!==prevRuns||String(out.row.bestRunId||'')!==String(prevBest||''))changed=true;
    });
    if(JSON.stringify(rows)!==previous)changed=true;
    return {rows,changed};
  }
  return {copyEdition,scoreOf,qualify,editionsOf,upsert,migrate};
});
