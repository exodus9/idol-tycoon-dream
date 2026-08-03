const assert=require('node:assert/strict');
const Mentor=require('../mentor-inheritance.js');

const roster=[
  {rid:1,idkey:'i:1',name:'완주자',stats:{vocal:100},runDirection:'vocal'},
  {rid:2,idkey:'i:2',name:'미완성',stats:{vocal:20},incomplete:true},
  {rid:3,idkey:'i:3',name:'이전카드',stats:{vocal:20},legacyRun:true},
  {rid:4,idkey:'i:4',name:'대상본인',stats:{dance:90},runDirection:'dance'},
];
assert.deepEqual(Mentor.eligible(roster,{rid:4,idkey:'i:4'}).map(x=>x.rid),[1]);
const longRoster=Array.from({length:13},(_,i)=>({rid:i+10,idkey:`c:${i}`,stats:{vocal:80}}));
assert.equal(Mentor.eligible(longRoster,{}).length,13,'all completed mentors remain eligible');

const state={vocal:18,acting:18,dance:18,visual:18,charm:18,creative:18,mental:96,fanBond:20,runDirection:'dance'};
assert.deepEqual(Mentor.apply(state,{rid:1,name:'완주자',direction:'vocal',boost:12,mental:5}),{direction:'vocal',boost:12,mental:5});
assert.equal(state.vocal,30);
assert.equal(state.mental,100);
assert.equal(Mentor.resolve(state,'follow').direction,'vocal');
assert.equal(state.vocal,40);
assert.equal(state.mentorMomentDone,true);
assert.equal(Mentor.resolve(state,'remix'),null,'mentor moment may resolve once only');

const remix={vocal:10,acting:10,dance:10,visual:10,charm:10,creative:10,mental:50,fanBond:98,runDirection:'creative'};
Mentor.apply(remix,{rid:1,name:'완주자',direction:'vocal',boost:8,mental:4});
assert.deepEqual(Mentor.resolve(remix,'remix'),{direction:'creative',gain:8,mental:0,bond:5});
assert.equal(remix.creative,18);
assert.equal(remix.fanBond,100);

assert.equal(Mentor.apply({}, {direction:'invalid'}),null);
console.log('mentor inheritance: OK');
