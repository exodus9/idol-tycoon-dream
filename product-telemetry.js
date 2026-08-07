(function(root){
  'use strict';
  const START=Date.now();
  let context={};
  let lastScreen='';
  let lastContextKey='';
  let imageFailures=0;
  let sequence=0;
  const SCHEMA_VERSION=2;
  const CONSENT_KEY='dg_analytics_consent_v1';
  const PARTICIPANT_KEY='dg_analytics_participant_v1';
  const OUTBOX_KEY='dg_telemetry_outbox_v1';
  const MAX_OUTBOX=120;
  const BUILD_VERSION=(()=>{try{const src=root.document&&root.document.currentScript&&root.document.currentScript.src||'';return new URL(src,root.location&&root.location.href||'https://local.invalid').searchParams.get('v')||'dev';}catch(_){return 'dev';}})();
  const EVENT_FIELDS={
    app_open:['standalone'],screen_view:['screen'],context_received:['has_favorite'],app_locale_applied:['locale'],
    startup_health:['load_ms','image_failures','native_context'],context_timeout:['wait_ms'],reply_impression:['kind','wait_days'],
    favorite_context_applied:['favorite_id'],favorite_context_change:['source'],favorite_context_unmatched:[],
    fandom_first_contact:['run_id','choice','bond_after'],
    first_run_gate_protected:['run_id','rank','mode'],
    run_start:['run_id','prev_run_id','reply_run_id','reply_promise_id','source','mode','run_no','retrain','direction','season_edition_target','started_season','promise_id','promise_retry','daily_boost','mentor','mentor_rid'],
    promise_checkpoint:['run_id','promise_id','choice','progress','target','on_track'],mentor_moment:['run_id','run_no','mentor_rid','choice','direction'],stage_strategy:['run_no','strategy','outcome'],promise_result:['run_id','promise_id','status','retry'],
    run_finish:['run_id','prev_run_id','run_no','completed','final_rank','direction','season_edition_completed','season_edition_new','season_edition_best_updated','season_edition_version_added','season_no','card_registered','mentor','mentor_rid','mentor_choice','promise_id','promise_status','promise_retry'],
    result_share:['run_no','method'],season_retrain_click:['season_no','trend_pos','rid','direction','deferred','generic'],group_debut:['member_count','group_grade','total_groups'],season_brief_open:['season_no','previous_season','previous_tier','has_run_proposal','proposal_rid'],
    daily_complete:['choice','streak','total','milestone'],daily_reply_open:['kind','wait_days','archived','first_group_bridge'],daily_reply_to_scout:['source_rid','start'],promise_reply_open:['run_id','promise_id','status','wait_days'],promise_reply_to_retrain:['rid','run_id','promise_id'],
    run_album_open:['rid','run_count'],run_record_open:['rid','run_id','run_no','promise_status','adopted'],promise_offer:['run_id','option_count','retry','source'],promise_selected:['run_id','promise_id','source','retry','reply_run_id','reply_promise_id'],
    mentor_home_start:['run_id','mentor_rid','target_id','source','direction'],first_group_continue:['step','source','ready_count','mentor_rid','target_id','direction'],mentor_select:['run_id','selected','source','mentor_rid'],mentor_offer:['run_id','candidate_count','default_selected'],retrain_started:['rid','run_id','source','direction','promise_id','reply_run_id','reply_promise_id'],
    idol_select:['idol_id','source','first_roster'],first_action:['run_id','run_no','turn','card_id','direction','recommended'],
    active_run_decision:['active_run_id','active_id','target_id','decision','turn'],
    first_run_setup_skipped:['run_id','mode','direction'],
    favorite_first_moment:['run_id','direction','bond_after'],
    second_run_start:['run_id','mode','direction','source'],second_run_finish:['run_id','completed','final_rank','direction'],
    support_reward_reuse:['rid','direction','reward_count','equipped_count'],
    save_failure:['store','operation','recoverable'],runtime_error:['type','source','fatal'],
    experiment_exposure:['experiment','variant'],consent_changed:['state']
  };
  const SAFE_EVENT_TEXT=/^[\p{L}\p{N}\s:_-]{1,120}$/u;
  const SAFE_SLOT=/^[a-z0-9_-]{1,24}$/;

  function safeGet(key){ try{return root.localStorage&&root.localStorage.getItem(key)||'';}catch(_){return '';} }
  function safeSet(key,value){ try{root.localStorage&&root.localStorage.setItem(key,value);return true;}catch(_){return false;} }
  function makeId(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
  function consentState(){ const value=safeGet(CONSENT_KEY); return value==='granted'||value==='denied'?value:'pending'; }
  function participantId(){
    if(consentState()!=='granted')return '';
    let id=safeGet(PARTICIPANT_KEY);
    if(!/^p-[a-z0-9-]{8,40}$/.test(id)){id=makeId('p');safeSet(PARTICIPANT_KEY,id);}
    return id;
  }
  function buildVersion(){ return BUILD_VERSION; }
  function readOutbox(){ try{const value=JSON.parse(safeGet(OUTBOX_KEY)||'[]');return Array.isArray(value)?value:[];}catch(_){return [];} }
  function writeOutbox(items){ return safeSet(OUTBOX_KEY,JSON.stringify(items.slice(-MAX_OUTBOX))); }
  function queue(event){ const list=readOutbox(); if(!list.some(item=>item&&item.event_id===event.event_id))list.push(event); writeOutbox(list); }
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
  function deliver(event){
    try{ root.dataLayer=root.dataLayer||[]; root.dataLayer.push({...event,event:`dream_group_${event.event}`}); }catch(_){}
    nativePost({type:'DREAM_GROUP_EVENT',data:event});
  }
  function ack(eventId){
    if(typeof eventId!=='string'||!/^e-[a-z0-9-]{8,40}$/.test(eventId))return false;
    const before=readOutbox(),after=before.filter(item=>!item||item.event_id!==eventId);
    if(after.length===before.length)return false;
    writeOutbox(after); return true;
  }
  function flush(){
    if(consentState()!=='granted')return 0;
    try{if(root.navigator&&root.navigator.onLine===false)return 0;}catch(_){}
    const list=readOutbox(); list.forEach(deliver); return list.length;
  }
  function track(name,props){
    name=String(name||''); if(!/^[a-z][a-z0-9_]{1,39}$/.test(name)||!EVENT_FIELDS[name]) return null;
    if(consentState()!=='granted')return null;
    const qs=new URLSearchParams(root.location&&root.location.search||'');
    const rawSlot=(qs.get('slot')||'direct').toLowerCase();
    const event={...clean(name,props),event:name,event_id:makeId('e'),schema_version:SCHEMA_VERSION,build:buildVersion(),session_id:sessionId(),occurred_at:new Date().toISOString(),elapsed_ms:Date.now()-START,sequence:++sequence,slot:SAFE_SLOT.test(rawSlot)?rawSlot:'other'};
    const pid=participantId(); if(pid)event.participant_id=pid;
    try{ root.dispatchEvent(new CustomEvent('dream-group-event',{detail:event})); }catch(_){}
    queue(event);flush();
    return event;
  }
  function screen(id){ if(!id||id===lastScreen)return; lastScreen=id; track('screen_view',{screen:id}); }
  function receive(raw){
    if(!raw||raw.source!==root)return false;
    if(!raw.origin)return false;
    try{ if(root.location&&root.location.origin&&raw.origin!==root.location.origin)return false; }catch(_){ return false; }
    let msg=raw.data;
    if(typeof msg==='string'){ try{msg=JSON.parse(msg);}catch(_){return;} }
    if(msg&&msg.type==='DREAM_GROUP_EVENT_ACK'){return !!(msg.data&&ack(msg.data.event_id));}
    if(!msg||msg.type!=='DREAM_GROUP_CONTEXT'||!msg.data||typeof msg.data!=='object')return;
    const next=cleanContext(msg.data),key=JSON.stringify(next); if(key===lastContextKey)return false;
    context=next; lastContextKey=key;
    try{ root.dispatchEvent&&root.dispatchEvent(new CustomEvent('dream-group-context',{detail:{...context}})); }catch(_){ }
    track('context_received',{has_favorite:!!context.favorite_id});
    return true;
  }
  function setConsent(state){
    if(state!=='granted'&&state!=='denied')return false;
    const before=consentState(); if(!safeSet(CONSENT_KEY,state))return false;
    if(state==='denied'){try{root.localStorage&&root.localStorage.removeItem(PARTICIPANT_KEY);root.localStorage&&root.localStorage.removeItem(OUTBOX_KEY);}catch(_){}}
    if(before!==state)track('consent_changed',{state});
    if(state==='granted')flush(); return true;
  }
  function ready(){ const native=!!(root.webkit||root.Android); nativePost({type:'DREAM_GROUP_READY',data:{version:'2026-08-08',telemetry_schema:SCHEMA_VERSION}}); track('app_open',{standalone:!native});
    if(native) root.setTimeout&&root.setTimeout(()=>{ if(!lastContextKey)track('context_timeout',{wait_ms:2500}); },2500); }
  root.addEventListener&&root.addEventListener('error',event=>{ try{ if(event&&event.target&&String(event.target.tagName).toUpperCase()==='IMG'){imageFailures++;return;} track('runtime_error',{type:'error',source:'window',fatal:false}); }catch(_){} },true);
  root.addEventListener&&root.addEventListener('unhandledrejection',()=>{ try{track('runtime_error',{type:'promise',source:'window',fatal:false});}catch(_){} });
  root.addEventListener&&root.addEventListener('online',flush);
  root.addEventListener&&root.addEventListener('load',()=>track('startup_health',{load_ms:Date.now()-START,image_failures:imageFailures,native_context:!!lastContextKey}));
  root.addEventListener&&root.addEventListener('message',receive);
  const api={track,screen,ready,flush,ack,setConsent,getConsent:consentState,getContext:()=>({...context}),getStatus:()=>({schema_version:SCHEMA_VERSION,build:buildVersion(),consent:consentState(),participant_id:participantId(),outbox_size:readOutbox().length,pending_consent_size:0})};
  root.ProductTelemetry=api;
  if(typeof module!=='undefined'&&module.exports){ api._receiveForTest=receive; module.exports=api; }
})(typeof window!=='undefined'?window:globalThis);
