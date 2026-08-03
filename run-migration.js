(function(root){
  'use strict';

  function migrateV5(data,deps){
    const roster=Array.isArray(data.roster)?data.roster:[];
    const find=rid=>roster.find(r=>r.rid===rid);
    let changed=false;

    roster.forEach(r=>{
      if(r.spec!=null){ r.legacySpec=r.spec; r.legacyRun=true; delete r.spec; changed=true; }
    });

    data.lineup=(data.lineup&&typeof data.lineup==='object'&&!Array.isArray(data.lineup))?data.lineup:{};
    Object.keys(data.lineup).forEach(sid=>{
      const r=find(data.lineup[sid]);
      if(!r||r.incomplete||r.legacyRun){ delete data.lineup[sid]; changed=true; }
    });

    data.groups=Array.isArray(data.groups)?data.groups:[];
    data.groups.forEach(g=>{
      g.lineup=(g.lineup&&typeof g.lineup==='object'&&!Array.isArray(g.lineup))?g.lineup:{};
      Object.keys(g.lineup).forEach(sid=>{
        const r=find(g.lineup[sid]);
        if(!r||r.incomplete){ delete g.lineup[sid]; changed=true; }
      });
      const members=(g.slots||[]).map(s=>({s,r:find(g.lineup[s.sid])})).filter(m=>m.r&&!m.r.incomplete);
      const eligible=members.filter(m=>!m.r.legacyRun);
      const archived=members.some(m=>m.r.legacyRun);
      const nextN=members.length;
      const nextNeedsRebuild=eligible.length<3;
      if(g.n!==nextN||g.needsRebuild!==nextNeedsRebuild||g.legacyArchive!==archived) changed=true;
      g.n=nextN;
      g.needsRebuild=nextNeedsRebuild;
      g.legacyArchive=archived;
      if(!archived){
        const nextSum=members.reduce((sum,m)=>sum+deps.posScore(m.r.stats,m.s.type),0);
        const nextGrade=g.n?deps.grade(Math.round(nextSum/g.n)):'–';
        if(g.sum!==nextSum||g.grade!==nextGrade) changed=true;
        g.sum=nextSum;
        g.grade=nextGrade;
      }
    });

    if(data.repGid!=null&&!data.groups.some(g=>g.gid===data.repGid)){
      data.repGid=(data.groups[0]||{}).gid||null;
      changed=true;
    }
    return {changed};
  }

  function nextLegacyRid(data,group){
    const roster=Array.isArray(data&&data.roster)?data.roster:[];
    const byRid=new Map(roster.map(r=>[r.rid,r]));
    const slots=Array.isArray(group&&group.slots)?group.slots:[];
    const lineup=(group&&group.lineup)||{};
    const next=slots.map(s=>byRid.get(lineup[s.sid])).find(r=>r&&r.legacyRun);
    return next?next.rid:null;
  }

  const api={migrateV5,nextLegacyRid};
  root.RunMigration=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
