(function(root){
  'use strict';
  const START=Date.now();
  let context={};
  let lastScreen='';
  let lastContextKey='';
  const EVENT_FIELDS={
    app_open:['standalone'],screen_view:['screen'],context_received:['has_favorite'],
    favorite_context_applied:['favorite_id'],favorite_context_change:['source'],favorite_context_unmatched:[],
    fandom_first_contact:['run_id','choice','bond_after'],
    run_start:['run_id','prev_run_id','reply_run_id','reply_promise_id','source','mode','run_no','retrain','direction','season_edition_target','started_season','promise_id','promise_retry','daily_boost','mentor','mentor_rid'],
    promise_checkpoint:['run_id','promise_id','choice','progress','target','on_track'],mentor_moment:['run_id','run_no','mentor_rid','choice','direction'],stage_strategy:['run_no','strategy','outcome'],promise_result:['run_id','promise_id','status','retry'],
    run_finish:['run_id','prev_run_id','run_no','completed','final_rank','direction','season_edition_completed','season_edition_new','season_edition_best_updated','season_edition_version_added','season_no','card_registered','mentor','mentor_rid','mentor_choice','promise_id','promise_status','promise_retry'],
    result_share:['run_no','method'],season_retrain_click:['season_no','trend_pos','rid','direction','deferred','generic'],group_debut:['member_count','group_grade','total_groups'],season_brief_open:['season_no','previous_season','previous_tier','has_run_proposal','proposal_rid'],
    daily_complete:['choice','streak','total','milestone'],daily_reply_open:['kind','wait_days','archived'],promise_reply_open:['run_id','promise_id','status','wait_days'],promise_reply_to_retrain:['rid','run_id','promise_id'],
    run_album_open:['rid','run_count'],run_record_open:['rid','run_id','run_no','promise_status','adopted'],promise_offer:['run_id','option_count','retry','source'],promise_selected:['run_id','promise_id','source','retry','reply_run_id','reply_promise_id'],
    mentor_home_start:['run_id','mentor_rid','target_id'],mentor_select:['run_id','selected','source','mentor_rid'],mentor_offer:['run_id','candidate_count','default_selected'],retrain_started:['rid','run_id','source','direction','promise_id','reply_run_id','reply_promise_id']
  };
  const SAFE_EVENT_TEXT=/^[\p{L}\p{N}\s:_-]{1,120}$/u;
  const SAFE_SLOT=/^[a-z0-9_-]{1,24}$/;

  function sessionId(){
    try{
      let id=sessionStorage.getItem('dg_session_id');
      if(!id){ id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; sessionStorage.setItem('dg_session_id',id); }
      return id;
    }catch(_){ return 'no-session'; }
  }
  function clean(name,props){
    const out={};
    const allowed=EVENT_FIELDS[name]; if(!allowed)return out;
    allowed.forEach(k=>{ const v=(props||{})[k]; if(typeof v==='number'&&Number.isFinite(v))out[k]=v; else if(typeof v==='boolean')out[k]=v; else if(typeof v==='string'&&SAFE_EVENT_TEXT.test(v))out[k]=v; });
    return out;
  }
  function cleanContext(props){
    const out={}, src=props&&typeof props==='object'?props:{};
    const scalar=(key,max=120)=>{ const v=src[key]; if(typeof v==='number'&&Number.isFinite(v))out[key]=v; else if(typeof v==='string'&&v)out[key]=v.slice(0,max); };
    scalar('favorite_id',80); scalar('favorite_name',80); scalar('favorite_group',80); scalar('locale',16); scalar('app_version',32);
    return out;
  }
  function nativePost(payload){
    try{ if(root.webkit&&root.webkit.messageHandlers&&root.webkit.messageHandlers.nativeApp) root.webkit.messageHandlers.nativeApp.postMessage(payload); }catch(_){}
    try{ if(root.Android&&typeof root.Android.receiveMessage==='function') root.Android.receiveMessage(JSON.stringify(payload)); }catch(_){}
  }
  function track(name,props){
    name=String(name||''); if(!/^[a-z][a-z0-9_]{1,39}$/.test(name)||!EVENT_FIELDS[name]) return null;
    const qs=new URLSearchParams(root.location&&root.location.search||'');
    const rawSlot=(qs.get('slot')||'direct').toLowerCase();
    const event={...clean(name,props),event:name,session_id:sessionId(),elapsed_ms:Date.now()-START,slot:SAFE_SLOT.test(rawSlot)?rawSlot:'other'};
    try{ root.dataLayer=root.dataLayer||[]; root.dataLayer.push({...event,event:`dream_group_${name}`}); }catch(_){}
    try{ root.dispatchEvent(new CustomEvent('dream-group-event',{detail:event})); }catch(_){}
    nativePost({type:'DREAM_GROUP_EVENT',data:event});
    return event;
  }
  function screen(id){ if(!id||id===lastScreen)return; lastScreen=id; track('screen_view',{screen:id}); }
  function receive(raw){
    if(!raw||raw.source!==root)return false;
    if(!raw.origin)return false;
    try{ if(root.location&&root.location.origin&&raw.origin!==root.location.origin)return false; }catch(_){ return false; }
    let msg=raw.data;
    if(typeof msg==='string'){ try{msg=JSON.parse(msg);}catch(_){return;} }
    if(!msg||msg.type!=='DREAM_GROUP_CONTEXT'||!msg.data||typeof msg.data!=='object')return;
    const next=cleanContext(msg.data),key=JSON.stringify(next); if(key===lastContextKey)return false;
    context=next; lastContextKey=key;
    try{ root.dispatchEvent&&root.dispatchEvent(new CustomEvent('dream-group-context',{detail:{...context}})); }catch(_){ }
    track('context_received',{has_favorite:!!context.favorite_id});
    return true;
  }
  function ready(){ nativePost({type:'DREAM_GROUP_READY',data:{version:'2026-08-03'}}); track('app_open',{standalone:!(root.webkit||root.Android)}); }
  root.addEventListener&&root.addEventListener('message',receive);
  const api={track,screen,ready,getContext:()=>({...context})};
  root.ProductTelemetry=api;
  if(typeof module!=='undefined'&&module.exports){ api._receiveForTest=receive; module.exports=api; }
})(typeof window!=='undefined'?window:globalThis);
