(function(root){
  'use strict';

  function objectMap(value){
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }

  function migrateV5(data,deps,backup){
    const roster=Array.isArray(data.roster)?data.roster:[];
    const byRid=new Map(roster.map(r=>[String(r.rid),r]));
    const find=rid=>byRid.get(String(rid));
    let changed=false, recoveredLineup=false;
    const affected=roster.some(r=>r.spec!=null||r.legacyRun||r.legacySpec!=null);

    // 기존 자산은 즉시 계속 사용 가능해야 한다. 과거의 고정 특기 의미만 폐기하고,
    // 카드/편성/그룹/승점은 그대로 유지한다. 다음 재육성부터 사용자가 새 RUN 방향을 고른다.
    roster.forEach(r=>{
      if(r.spec!=null||r.legacyRun||r.legacySpec!=null){
        if(!r.runDirection) r.runDirection='archive';
        delete r.spec; delete r.legacySpec; delete r.legacyRun;
        changed=true;
      }
    });

    data.lineup=objectMap(data.lineup);
    data.groups=Array.isArray(data.groups)?data.groups:[];
    Object.keys(data.lineup).forEach(sid=>{
      const r=find(data.lineup[sid]);
      if(!r||r.incomplete){ delete data.lineup[sid]; changed=true; }
    });

    // 실패 배포가 v4 편성을 비운 뒤 저장한 경우, 직전 저널 backup의 편성을 우선 복구한다.
    const backupLineup=objectMap(backup&&backup.lineup);
    if(affected&&!Object.keys(data.lineup).length&&!data.groups.length&&Object.keys(backupLineup).length){
      Object.keys(backupLineup).forEach(sid=>{
        const r=find(backupLineup[sid]);
        if(r&&!r.incomplete) data.lineup[sid]=r.rid;
      });
      if(Object.keys(data.lineup).length){ changed=true; recoveredLineup=true; }
    }

    data.groups.forEach(g=>{
      g.lineup=objectMap(g.lineup);
      Object.keys(g.lineup).forEach(sid=>{
        const r=find(g.lineup[sid]);
        if(!r||r.incomplete){ delete g.lineup[sid]; changed=true; }
      });
      const members=(g.slots||[]).map(s=>({s,r:find(g.lineup[s.sid])})).filter(m=>m.r&&!m.r.incomplete);
      const nextN=members.length;
      const nextNeedsRebuild=nextN<3;
      const nextSum=members.reduce((sum,m)=>sum+deps.posScore(m.r.stats,m.s.type),0);
      const nextGrade=nextN?deps.grade(Math.round(nextSum/nextN)):'–';
      if(g.n!==nextN||g.needsRebuild!==nextNeedsRebuild||g.legacyArchive||g.sum!==nextSum||g.grade!==nextGrade) changed=true;
      g.n=nextN; g.needsRebuild=nextNeedsRebuild; g.legacyArchive=false; g.sum=nextSum; g.grade=nextGrade;
    });

    // old backup까지 덮인 극단 경로: 그룹이 없고 사용 가능 카드가 3장 이상이면 첫 3자리를 복원한다.
    if(affected&&!Object.keys(data.lineup).length&&!data.groups.length){
      const slots=Array.isArray(data.slots)&&data.slots.length?data.slots:[
        {sid:1,type:'leader'},{sid:2,type:'center'},{sid:3,type:'dancer'}
      ];
      const pool=roster.filter(r=>!r.incomplete).slice(0,Math.min(9,slots.length));
      const free=slots.slice(), used=new Set();
      while(free.length&&used.size<pool.length){
        let best=null;
        free.forEach(s=>pool.forEach(r=>{
          if(used.has(r.rid)) return;
          const score=deps.posScore(r.stats,s.type);
          if(!best||score>best.score) best={s,r,score};
        }));
        if(!best) break;
        data.lineup[best.s.sid]=best.r.rid; used.add(best.r.rid);
        free.splice(free.indexOf(best.s),1);
      }
      if(Object.keys(data.lineup).length){ changed=true; recoveredLineup=true; }
    }

    if(data.repGid!=null&&!data.groups.some(g=>g.gid===data.repGid)){
      data.repGid=(data.groups[0]||{}).gid||null;
      changed=true;
    }
    return {changed,recoveredLineup};
  }

  const api={migrateV5};
  root.RunMigration=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
