(function(root){
  'use strict';
  const START=Date.now();
  let context={};
  let lastScreen='';

  function sessionId(){
    try{
      let id=sessionStorage.getItem('dg_session_id');
      if(!id){ id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; sessionStorage.setItem('dg_session_id',id); }
      return id;
    }catch(_){ return 'no-session'; }
  }
  function clean(props){
    const out={};
    Object.keys(props||{}).filter(k=>!/token|authorization|password|email|phone/i.test(k)).slice(0,24).forEach(k=>{ const v=props[k]; if(['string','number','boolean'].includes(typeof v)) out[k]=typeof v==='string'?v.slice(0,120):v; });
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
    if(!/^[a-z][a-z0-9_]{1,39}$/.test(String(name||''))) return null;
    const qs=new URLSearchParams(root.location&&root.location.search||'');
    const event={event:name,session_id:sessionId(),elapsed_ms:Date.now()-START,slot:(qs.get('slot')||'direct').slice(0,40),...clean(props)};
    try{ root.dataLayer=root.dataLayer||[]; root.dataLayer.push({...event,event:`dream_group_${name}`}); }catch(_){}
    try{ root.dispatchEvent(new CustomEvent('dream-group-event',{detail:event})); }catch(_){}
    nativePost({type:'DREAM_GROUP_EVENT',data:event});
    return event;
  }
  function screen(id){ if(!id||id===lastScreen)return; lastScreen=id; track('screen_view',{screen:id}); }
  function receive(raw){
    if(!raw||raw.source!==root)return false;
    try{ if(root.location&&root.location.origin&&raw.origin&&raw.origin!==root.location.origin)return false; }catch(_){ return false; }
    let msg=raw.data;
    if(typeof msg==='string'){ try{msg=JSON.parse(msg);}catch(_){return;} }
    if(!msg||msg.type!=='DREAM_GROUP_CONTEXT'||!msg.data||typeof msg.data!=='object')return;
    context=cleanContext(msg.data);
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
