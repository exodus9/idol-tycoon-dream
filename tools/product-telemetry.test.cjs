const assert=require('node:assert/strict');
const memory=new Map();
global.localStorage={getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
Object.defineProperty(global,'navigator',{value:{onLine:true},configurable:true});
global.document={currentScript:{src:'https://game.local/product-telemetry.js?v=candidate123'}};
const Telemetry=require('../product-telemetry.js');

assert.equal(Telemetry.getConsent(),'pending');
Telemetry.ready();
Telemetry.track('experiment_exposure',{experiment:'first_run_guidance_v1',variant:'guided'});
Telemetry.track('idol_select',{idol_id:'5968169',source:'search',first_roster:true});
Telemetry.track('first_run_setup_skipped',{run_id:'pending-run',mode:'quick',direction:'vocal'});
Telemetry.track('first_action',{run_id:'pending-run',run_no:1,turn:1,card_id:'g_vocal',direction:'vocal',recommended:true});
assert.equal((global.dataLayer||[]).length,0,'pending consent must not deliver the first-session funnel');
assert.equal(Telemetry.getStatus().pending_consent_size,0,'pending consent must not retain the first-session funnel');
assert.equal(Telemetry.setConsent('granted'),true);
assert.equal(Telemetry.getConsent(),'granted');
assert.equal(Telemetry.getStatus().schema_version,2);
assert.equal(Telemetry.getStatus().build,'candidate123','build must be captured while the script is evaluating');
assert.match(Telemetry.getStatus().participant_id,/^p-/);
assert.equal(global.dataLayer.some(x=>x.event==='dream_group_app_open'),false,'granting consent must not retroactively collect app_open');
for(const name of ['experiment_exposure','idol_select','first_run_setup_skipped','first_action']){
  assert.equal(global.dataLayer.some(x=>x.event===`dream_group_${name}`),false,`${name} must not survive pending consent`);
}
assert.equal(Telemetry.getStatus().pending_consent_size,0);

const event=Telemetry.track('run_start',{mode:'quick',run_no:2,secret:{token:'must-not-pass'},long:'x'.repeat(200)});
assert.equal(event.event,'run_start');
assert.equal(event.mode,'quick');
assert.equal(event.run_no,2);
assert.equal('secret' in event,false,'nested objects and token-shaped payloads must not cross the bridge');
assert.equal('long' in event,false,'unlisted props must not cross the event schema');
const guarded=Telemetry.track('run_finish',{event:'forged',session_id:'forged',elapsed_ms:-1,slot:'forged',jwt:'x',credential:'x',secret:'x',user_id:'x',device_id:'x',idfa:'x',member_no:'x',login_id:'x',birth_date:'x',favorite_id:7,run_id:'safe-run',completed:true});
assert.equal(guarded.event,'run_finish');
assert.notEqual(guarded.session_id,'forged');
assert.notEqual(guarded.elapsed_ms,-1);
assert.notEqual(guarded.slot,'forged');
for(const key of ['jwt','credential','secret','user_id','device_id','idfa','member_no','login_id','birth_date','favorite_id'])assert.equal(key in guarded,false,`${key} must not cross an unrelated native event schema`);
assert.equal(guarded.run_id,'safe-run');
assert.equal(guarded.completed,true);
const embedded=Telemetry.track('run_finish',{run_id:'person@example.com',promise_id:'https://evil.example/?token=x',completed:true});
assert.equal('run_id' in embedded,false,'email-shaped strings must not cross through an allowed event field');
assert.equal('promise_id' in embedded,false,'URL-shaped strings must not cross through an allowed event field');
assert.equal(Telemetry.track('INVALID EVENT',{}),null);
assert.equal(Telemetry.track('unknown_but_valid_name',{mode:'quick'}),null,'unknown events must not cross the bridge');
assert.ok(global.dataLayer.some(x=>x.event==='dream_group_run_start'));
const noDuplicateId=event.event_id, noDuplicateBefore=global.dataLayer.filter(x=>x.event_id===noDuplicateId).length;
Telemetry.flush(); Telemetry.flush();
assert.equal(global.dataLayer.filter(x=>x.event_id===noDuplicateId).length,noDuplicateBefore,'an unacked event must not be delivered twice in one page session');

const protectedGate=Telemetry.track('first_run_gate_protected',{run_id:'run-1',rank:4,mode:'quick',user_id:'must-not-pass'});
assert.equal(protectedGate.event,'first_run_gate_protected');
assert.equal(protectedGate.rank,4);
assert.equal('user_id' in protectedGate,false);
const startup=Telemetry.track('startup_health',{load_ms:820,image_failures:1,native_context:true,token:'must-not-pass'});
assert.deepEqual({load_ms:startup.load_ms,image_failures:startup.image_failures,native_context:startup.native_context},{load_ms:820,image_failures:1,native_context:true});
assert.equal('token' in startup,false);

assert.equal(Telemetry._receiveForTest({source:{},data:{type:'DREAM_GROUP_CONTEXT',data:{user_id:'forged',favorite_id:999}}}),false,'another frame/source must not replace app context');
assert.equal(Telemetry._receiveForTest({source:globalThis,data:{type:'DREAM_GROUP_CONTEXT',data:{favorite_id:999}}}),false,'origin-less context must be rejected');
Telemetry._receiveForTest({source:globalThis,origin:'https://game.local',data:{type:'DREAM_GROUP_CONTEXT',data:{user_id:'must-not-pass',favorite_id:7,favorite_name:'예준',profile:{private:true},token:'must-not-pass',jwt:'must-not-pass',credential:'must-not-pass',secret:'must-not-pass'}}});
assert.deepEqual(Telemetry.getContext(),{favorite_id:7,favorite_name:'예준'});
assert.equal(Telemetry._receiveForTest({source:globalThis,origin:'https://game.local',data:{type:'DREAM_GROUP_CONTEXT',data:{favorite_id:7,favorite_name:'예준'}}}),false,'duplicate normalized context must be ignored');
assert.equal(global.dataLayer.filter(x=>x.event==='dream_group_context_received').length,1,'duplicate context must not duplicate telemetry');

const selection=Telemetry.track('idol_select',{idol_id:'5968169',source:'search',first_roster:true,display_name:'must-not-pass'});
assert.deepEqual({idol_id:selection.idol_id,source:selection.source,first_roster:selection.first_roster},{idol_id:'5968169',source:'search',first_roster:true});
assert.equal('display_name' in selection,false);
const action=Telemetry.track('first_action',{run_id:'run-2',run_no:1,turn:1,card_id:'vocal',direction:'vocal',recommended:true});
assert.equal(action.card_id,'vocal');
assert.equal(action.recommended,true);

const ackDelivered=()=>{const ids=[...new Set((global.dataLayer||[]).map(x=>x.event_id).filter(Boolean))];ids.forEach(id=>Telemetry.ack(id));};
ackDelivered();
assert.equal(Telemetry.getStatus().outbox_size,0);
const deliveredBefore=global.dataLayer.length;
global.navigator.onLine=false;
const queuedFailure=Telemetry.track('save_failure',{store:'run',operation:'write',recoverable:true,error_message:'private path'});
assert.equal(global.dataLayer.length,deliveredBefore,'offline consented events must wait in the outbox');
assert.equal(Telemetry.getStatus().outbox_size,1);
global.navigator.onLine=true;
assert.equal(Telemetry.flush(),1);
assert.equal(Telemetry.getStatus().outbox_size,1,'delivery attempt without ACK must remain queued');
assert.equal(global.dataLayer.length,deliveredBefore+1);
assert.equal(Telemetry.flush(),0,'an in-flight event must wait for ACK instead of duplicating');
assert.equal(global.dataLayer.length,deliveredBefore+1);
assert.equal(Telemetry._receiveForTest({source:globalThis,origin:'https://game.local',data:{type:'DREAM_GROUP_EVENT_ACK',data:{event_id:queuedFailure.event_id}}}),true);
assert.equal(Telemetry.getStatus().outbox_size,0,'only an ACK may remove a queued event');

assert.equal(Telemetry.setConsent('denied'),true);
const deniedBefore=global.dataLayer.length;
assert.equal(Telemetry.track('experiment_exposure',{experiment:'first_run_v1',variant:'guided'}),null,'denied analytics must not create an event');
assert.equal(global.dataLayer.length,deniedBefore,'denied analytics must remain local-only');
assert.equal(Telemetry.getStatus().participant_id,'');
assert.equal(Telemetry.setConsent('granted'),true);

const localeEvent=Telemetry.track('app_locale_applied',{locale:'ja',secret:'must-not-pass'});
assert.equal(localeEvent.locale,'ja');
assert.equal('secret' in localeEvent,false,'locale telemetry must keep the event allowlist');

const firstGroup=Telemetry.track('first_group_continue',{step:'next_member',source:'result_first_group',ready_count:1,mentor_rid:'1',target_id:'5968169',direction:'visual',idol_name:'must-not-pass'});
assert.deepEqual({step:firstGroup.step,source:firstGroup.source,ready_count:firstGroup.ready_count,direction:firstGroup.direction},{step:'next_member',source:'result_first_group',ready_count:1,direction:'visual'});
assert.equal('idol_name' in firstGroup,false,'first-group funnel events must not expose real-person display names');

const rewardReuse=Telemetry.track('support_reward_reuse',{rid:'7',direction:'vocal',reward_count:2,equipped_count:2,card_names:'must-not-pass'});
assert.deepEqual({event:rewardReuse.event,rid:rewardReuse.rid,direction:rewardReuse.direction,reward_count:rewardReuse.reward_count,equipped_count:rewardReuse.equipped_count},{event:'support_reward_reuse',rid:'7',direction:'vocal',reward_count:2,equipped_count:2});
assert.equal('card_names' in rewardReuse,false,'support-card names must not cross the analytics schema');

console.log('product telemetry: OK');
