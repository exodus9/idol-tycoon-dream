const assert=require('node:assert/strict');
const Telemetry=require('../product-telemetry.js');

const event=Telemetry.track('run_start',{mode:'quick',run_no:2,secret:{token:'must-not-pass'},long:'x'.repeat(200)});
assert.equal(event.event,'run_start');
assert.equal(event.mode,'quick');
assert.equal(event.run_no,2);
assert.equal('secret' in event,false,'nested objects and token-shaped payloads must not cross the bridge');
assert.equal(event.long.length,120);
assert.equal(Telemetry.track('INVALID EVENT',{}),null);
assert.ok(global.dataLayer.some(x=>x.event==='dream_group_run_start'));

Telemetry.receive({data:{type:'DREAM_GROUP_CONTEXT',data:{user_id:'u1',favorite_id:7,profile:{private:true}}}});
assert.deepEqual(Telemetry.getContext(),{user_id:'u1',favorite_id:7});

console.log('product telemetry: OK');
