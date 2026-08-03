const assert=require('node:assert/strict');
const Daily=require('../daily-retention.js');

assert.equal(Daily.kstDay(Date.UTC(2026,7,3,14,59)),'2026-08-03');
assert.equal(Daily.kstDay(Date.UTC(2026,7,3,15,0)),'2026-08-04','daily reset must follow KST midnight');
assert.equal(Daily.dayDiff('2026-08-04','2026-08-03'),1);

const first=Daily.complete({daily:{},boosts:[],history:[],today:'2026-08-03',rid:7,kind:'chant',boost:{climax:8},text:'플리와 응원법 리허설'});
assert.equal(first.accepted,true);
assert.equal(first.daily.streak,1);
assert.equal(first.boosts[0].climax,8);

const duplicate=Daily.complete({daily:first.daily,boosts:first.boosts,history:first.history,today:'2026-08-03',rid:7,kind:'letter'});
assert.equal(duplicate.accepted,false,'only one fandom project may be completed per KST day');
assert.equal(duplicate.boosts.length,1,'duplicate completion must not mint another boost');

const next=Daily.complete({daily:first.daily,boosts:first.boosts,history:first.history,today:'2026-08-04',rid:7,kind:'letter',boost:{bond:6},text:'플리와 팬레터'});
assert.equal(next.daily.streak,2);
const missed=Daily.state(next.daily,'2026-08-06');
assert.equal(missed.streak,0,'a missed day must reset the live streak');

const consumed=Daily.consume(next.boosts,7,Date.UTC(2026,7,4));
assert.equal(consumed.boost.kind,'chant','oldest pending boost must be consumed first');
assert.equal(Daily.consume(consumed.boosts,999).boost,null,'another idol must not consume the boost');

let bounded={daily:{},boosts:[],history:[]};
for(let i=1;i<=45;i++) bounded=Daily.complete({...bounded,today:`2026-09-${String(i).padStart(2,'0')}`,rid:7,kind:'idea',boost:{start:12},text:String(i)});
assert.ok(bounded.boosts.length<=7);
assert.ok(bounded.history.length<=40);

console.log('daily retention: OK');
