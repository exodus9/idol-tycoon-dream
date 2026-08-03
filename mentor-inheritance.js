(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.MentorInheritance=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const DIRECTIONS=['vocal','acting','dance','visual','charm','creative'];
  const validDirection=k=>DIRECTIONS.includes(k);
  const eligible=(roster,target={})=>(Array.isArray(roster)?roster:[]).filter(r=>r&&r.rid!=null&&!r.incomplete&&!r.legacyRun&&r.stats&&r.rid!==target.rid&&(!target.idkey||r.idkey!==target.idkey));
  const apply=(state,mentor)=>{
    if(!state||!mentor||!validDirection(mentor.direction)) return null;
    const boost=Math.max(4,Math.min(14,Math.round(+mentor.boost||8)));
    const mental=Math.max(0,Math.min(8,Math.round(+mentor.mental||4)));
    state[mentor.direction]=(+state[mentor.direction]||0)+boost;
    state.mental=Math.min(100,(+state.mental||0)+mental);
    state.mentor={rid:mentor.rid,name:String(mentor.name||'선배'),img:String(mentor.img||''),direction:mentor.direction,boost,mental};
    return {direction:mentor.direction,boost,mental};
  };
  const resolve=(state,choice)=>{
    if(!state||!state.mentor||state.mentorMomentDone) return null;
    const mentor=state.mentor, follow=choice==='follow';
    const direction=follow&&validDirection(mentor.direction)?mentor.direction:state.runDirection;
    if(!validDirection(direction)) return null;
    const gain=follow?10:8;
    state[direction]=(+state[direction]||0)+gain;
    if(follow) state.mental=Math.min(100,(+state.mental||0)+3);
    else state.fanBond=Math.min(100,(+state.fanBond||0)+5);
    state.mentorMomentDone=true;
    state.mentorChoice=follow?'follow':'remix';
    return {direction,gain,mental:follow?3:0,bond:follow?0:5};
  };
  return {DIRECTIONS,eligible,apply,resolve};
});
