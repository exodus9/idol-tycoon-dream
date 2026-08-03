const assert=require('node:assert/strict');
const Telemetry=require('../product-telemetry.js');

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

assert.equal(Telemetry._receiveForTest({source:{},data:{type:'DREAM_GROUP_CONTEXT',data:{user_id:'forged',favorite_id:999}}}),false,'another frame/source must not replace app context');
assert.equal(Telemetry._receiveForTest({source:globalThis,data:{type:'DREAM_GROUP_CONTEXT',data:{favorite_id:999}}}),false,'origin-less context must be rejected');
Telemetry._receiveForTest({source:globalThis,origin:'https://game.local',data:{type:'DREAM_GROUP_CONTEXT',data:{user_id:'must-not-pass',favorite_id:7,favorite_name:'예준',profile:{private:true},token:'must-not-pass',jwt:'must-not-pass',credential:'must-not-pass',secret:'must-not-pass'}}});
assert.deepEqual(Telemetry.getContext(),{favorite_id:7,favorite_name:'예준'});
assert.equal(Telemetry._receiveForTest({source:globalThis,origin:'https://game.local',data:{type:'DREAM_GROUP_CONTEXT',data:{favorite_id:7,favorite_name:'예준'}}}),false,'duplicate normalized context must be ignored');
assert.equal(global.dataLayer.filter(x=>x.event==='dream_group_context_received').length,1,'duplicate context must not duplicate telemetry');

console.log('product telemetry: OK');
