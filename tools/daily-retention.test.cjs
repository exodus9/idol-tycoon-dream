const assert=require('node:assert/strict');
const Daily=require('../daily-retention.js');

assert.equal(Daily.kstDay(Date.UTC(2026,7,3,14,59)),'2026-08-03');
assert.equal(Daily.kstDay(Date.UTC(2026,7,3,15,0)),'2026-08-04','daily reset must follow KST midnight');
assert.equal(Daily.nextKstResetAt(Date.UTC(2026,7,3,14,59)),Date.UTC(2026,7,3,15,0),'the next reply opens at the immediately following KST midnight');
assert.equal(Daily.nextKstResetAt(Date.UTC(2026,7,3,15,0)),Date.UTC(2026,7,4,15,0),'a new KST day must schedule the next midnight, not the one that just passed');
assert.equal(Daily.dayDiff('2026-08-04','2026-08-03'),1);
assert.equal(Daily.addDays('2026-08-31',1),'2026-09-01');

const first=Daily.complete({daily:{},boosts:[],history:[],today:'2026-08-03',rid:7,kind:'chant',boost:{climax:8},text:'플리와 응원법 리허설'});
assert.equal(first.accepted,true);
assert.equal(first.daily.streak,1);
assert.equal(first.boosts[0].climax,8);
assert.equal(first.boosts[0].awaitingReply,true,'today\'s project reward must stay locked until the next-day reply opens');
assert.equal(Daily.consume(first.boosts,7,Date.UTC(2026,7,3)).boost,null,'same-day retraining must not consume tomorrow\'s promised reward');

const duplicate=Daily.complete({daily:first.daily,boosts:first.boosts,history:first.history,today:'2026-08-03',rid:7,kind:'letter'});
assert.equal(duplicate.accepted,false,'only one fandom project may be completed per KST day');
assert.equal(duplicate.boosts.length,1,'duplicate completion must not mint another boost');

const next=Daily.complete({daily:first.daily,boosts:first.boosts,history:first.history,today:'2026-08-04',rid:7,kind:'letter',boost:{bond:6},text:'플리와 팬레터'});
assert.equal(next.daily.streak,2);
const missed=Daily.state(next.daily,'2026-08-06');
assert.equal(missed.streak,0,'a missed day must reset the live streak');

const legacyBoosts=next.boosts.map(x=>{const copy={...x};delete copy.awaitingReply;return copy;});
const consumed=Daily.consume(legacyBoosts,7,Date.UTC(2026,7,4));
assert.equal(consumed.boost.kind,'chant','legacy unlocked boosts must remain consumable and preserve oldest-first order');
assert.equal(Daily.consume(consumed.boosts,999).boost,null,'another idol must not consume the boost');

const echoes=Daily.queueEcho([],{today:'2026-08-03',rid:7,kind:'chant'});
assert.equal(Daily.echoState([null,...echoes],'2026-08-04').ready.id,echoes[0].id,'damaged optional entries must not break the daily screen');
assert.equal(Daily.pendingEcho(echoes,7).id,echoes[0].id);
assert.equal(echoes[0].revealDay,'2026-08-04');
assert.equal(Daily.echoState(echoes,'2026-08-03').ready,null,'the fandom reply must stay closed until the next KST day');
assert.equal(Daily.echoState(echoes,'2026-08-04').ready.id,'2026-08-03:7:chant');
const promiseEcho=Daily.queueEcho(echoes,{today:'2026-08-03',rid:7,kind:'promise:run-7',runId:'run-7',promiseId:'fandom',promiseType:'fandom',promiseDirection:'charm',promiseTitle:'플리와 앙코르 약속',promiseStatus:'failed'});
assert.equal(promiseEcho[1].promiseTitle,'플리와 앙코르 약속');
assert.equal(promiseEcho[1].promiseType,'fandom','echoes must preserve locale-neutral promise identity');
assert.equal(promiseEcho[1].promiseDirection,'charm','echoes must preserve the RUN direction for later localization');
assert.equal(promiseEcho[1].promiseStatus,'failed','RUN promise result must survive until the next-day reply');
const earlyClaim=Daily.claimEcho(echoes,'2026-08-03:7:chant','2026-08-03',1);
assert.equal(earlyClaim.accepted,false);
const claimed=Daily.claimEcho(echoes,'2026-08-03:7:chant','2026-08-04',2);
assert.equal(claimed.accepted,true);
assert.equal(Daily.echoState(claimed.echoes,'2026-08-04').revealed.id,claimed.echo.id);
assert.equal(Daily.claimEcho(claimed.echoes,claimed.echo.id,'2026-08-04',3).accepted,false,'a reply reward must be claimed only once');
const matchingBoost=[{id:'2026-08-03:7:chant',rid:7,kind:'chant',day:'2026-08-03',climax:8}];
const merged=Daily.mergeReplyBoost(matchingBoost,claimed.echo,{climax:4},'2026-08-04');
assert.equal(merged.length,1,'the next-day reply must enhance the matching pending RUN boost, not delay into a second RUN');
assert.equal(merged[0].climax,12);
assert.equal(merged[0].awaitingReply,undefined);
assert.equal(Daily.consume(merged.map(x=>({...x})),7,4).boost.climax,12,'opening the reply must unlock the combined reward for exactly one RUN');
const lockedMatching=[{id:'2026-08-03:7:chant',rid:7,kind:'chant',day:'2026-08-03',climax:8,awaitingReply:true}];
const unlocked=Daily.mergeReplyBoost(lockedMatching,claimed.echo,{climax:4},'2026-08-04');
assert.equal(unlocked[0].awaitingReply,undefined,'reply opening must unlock newly-created locked boosts');
assert.equal(Daily.consume(unlocked.map(x=>({...x})),7,5).boost.climax,12);
const replyOnly=Daily.mergeReplyBoost([],claimed.echo,{climax:4},'2026-08-04');
assert.equal(replyOnly[0].kind,'reply-chant','a reply still creates a next-RUN boost if yesterday\'s boost was already used');
const older=[{id:'old',rid:7,kind:'letter',day:'2026-08-02',bond:6},...matchingBoost];
const prioritized=Daily.mergeReplyBoost(older,claimed.echo,{climax:4},'2026-08-04');
assert.equal(Daily.consume(prioritized,7,4).boost.id,matchingBoost[0].id,'the opened reply must apply to the literal next RUN even with an older pending boost');

let bounded={daily:{},boosts:[],history:[]};
for(let i=1;i<=45;i++) bounded=Daily.complete({...bounded,today:`2026-09-${String(i).padStart(2,'0')}`,rid:7,kind:'idea',boost:{start:12},text:String(i)});
assert.equal(bounded.boosts.length,45,'unused promised rewards must never disappear behind an undisclosed storage cap');
assert.ok(bounded.history.length<=40);

let eight={daily:{},boosts:[],history:[]}, eightEchoes=[];
for(let day=1;day<=8;day++){
  const today=`2026-10-${String(day).padStart(2,'0')}`;
  eight=Daily.complete({...eight,today,rid:7,kind:'chant',boost:{climax:8},text:`day ${day}`});
  eightEchoes=Daily.queueEcho(eightEchoes,{today,rid:7,kind:'chant'});
  const reveal=`2026-10-${String(day+1).padStart(2,'0')}`;
  const opened=Daily.claimEcho(eightEchoes,`${today}:7:chant`,reveal,day);
  assert.equal(opened.accepted,true);
  eightEchoes=opened.echoes;
  eight.boosts=Daily.mergeReplyBoost(eight.boosts,opened.echo,{climax:4},reveal);
}
assert.equal(eight.boosts.length,8,'the eighth project must preserve all seven earlier unused rewards');
assert.equal(new Set(eight.boosts.map(x=>x.id)).size,8);
assert.ok(eight.boosts.every(x=>!x.awaitingReply&&x.climax===12));
const oneRun=Daily.consume(eight.boosts.map(x=>({...x})),7,100);
assert.equal(oneRun.boost.climax,12);
assert.equal(oneRun.boosts.filter(x=>!x.usedAt).length,7,'one RUN must consume exactly one of eight preserved rewards');
assert.equal(Daily.consume(oneRun.boosts,999,101).boost,null,'another idol must not consume preserved rewards');

const groupBridge=Daily.firstGroupBridge({echo:{id:'2026-08-04:7:letter',rid:7},readyCount:1,groupCount:0,now:10});
assert.equal(groupBridge.start,8,'the first D1 reply must advance the first-group path');
assert.equal(Daily.firstGroupBridge({echo:{id:'x',rid:7},readyCount:3,groupCount:0}),null,'the bridge closes once the first lineup is ready');
assert.equal(Daily.firstGroupBridge({echo:{id:'x',rid:7},readyCount:1,groupCount:1}),null,'the bridge is onboarding-only');
assert.equal(Daily.consumeFirstGroupBridge(groupBridge,true,11).boost,null,'retraining keeps the agency-wide bridge for a new member');
const usedBridge=Daily.consumeFirstGroupBridge(groupBridge,false,12);
assert.equal(usedBridge.boost.start,8);
assert.equal(Daily.consumeFirstGroupBridge(usedBridge.bridge,false,13).boost,null,'the first-group bridge is one-use');

let promiseQueue=[];
for(let i=1;i<=25;i++) promiseQueue=Daily.queueEcho(promiseQueue,{today:'2026-11-01',rid:7,kind:`promise:run-${i}`,runId:`run-${i}`,promiseId:'signature'});
assert.equal(promiseQueue.length,25,'unopened RUN replies must never disappear behind the claimed-history cap');
assert.equal(promiseQueue[0].runId,'run-1');

console.log('daily retention: OK');
