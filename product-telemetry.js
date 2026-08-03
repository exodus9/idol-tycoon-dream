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
    Object.keys(props||{}).slice(0,24).forEach(k=>{ const v=props[k]; if(['string','number','boolean'].includes(typeof v)) out[k]=typeof v==='string'?v.slice(0,120):v; });
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
    let msg=raw&&raw.data!==undefined?raw.data:raw;
    if(typeof msg==='string'){ try{msg=JSON.parse(msg);}catch(_){return;} }
    if(!msg||msg.type!=='DREAM_GROUP_CONTEXT'||!msg.data||typeof msg.data!=='object')return;
    context=clean(msg.data); track('context_received',{has_user:!!context.user_id,has_favorite:!!context.favorite_id});
  }
  function ready(){ nativePost({type:'DREAM_GROUP_READY',data:{version:'2026-08-03'}}); track('app_open',{standalone:!(root.webkit||root.Android)}); }
  root.addEventListener&&root.addEventListener('message',receive);
  const api={track,screen,receive,ready,getContext:()=>({...context})};
  root.ProductTelemetry=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
