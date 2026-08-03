const test=require('node:test');
const assert=require('node:assert/strict');
const BeginnerFlow=require('../beginner-flow.js');

test('first RUN gets the current season direction only when no stronger choice exists',()=>{
  const valid=['vocal','dance','visual'];
  assert.equal(BeginnerFlow.recommendedDirection({valid,firstRun:true,trend:'dance'}),'dance');
  assert.equal(BeginnerFlow.recommendedDirection({valid,firstRun:true,trend:'dance',pending:'vocal'}),'vocal');
  assert.equal(BeginnerFlow.recommendedDirection({valid,firstRun:false,trend:'dance'}),null);
});

test('low stamina exposes a direct rest recovery action',()=>{
  const cards=[{cost:27},{cost:12},{cost:-44}];
  assert.deepEqual(BeginnerFlow.recoveryState(11,cards),{urgent:true,recommended:true,restIndex:2,stamina:11});
  assert.equal(BeginnerFlow.recoveryState(20,cards).urgent,false);
});

test('an event or promise cannot strand the player with an unaffordable hand',()=>{
  const cards=[{id:'vocal',cost:27},{id:'focus',cost:16},{id:'rest',cost:-44}];
  assert.deepEqual(BeginnerFlow.recoveryHand(['vocal','focus','vocal'],9,cards),['vocal','focus','rest']);
  assert.deepEqual(BeginnerFlow.recoveryHand(['vocal','focus','rest'],9,cards),['vocal','focus','rest']);
  assert.deepEqual(BeginnerFlow.recoveryHand(['vocal','focus'],40,cards),['vocal','focus']);
});

test('the first hand teaches the recommended direction with an affordable card',()=>{
  const cards=[
    {id:'l_vocal',stat:'vocal',cost:27,base:36},
    {id:'g_vocal',stat:'vocal',cost:13,base:20},
    {id:'l_visual',stat:'visual',cost:25,base:36}
  ];
  assert.deepEqual(BeginnerFlow.firstRunHand(['l_visual','burst','focus'],'vocal',cards),['g_vocal','burst','focus']);
  assert.deepEqual(BeginnerFlow.firstRunHand(['l_vocal','burst','focus'],'vocal',cards),['l_vocal','burst','focus']);
});

test('gate advice can only recommend stats actionable from the current hand',()=>{
  const cards=[{id:'g_vocal',stat:'vocal'},{id:'l_dance',stat:'dance'},{id:'rest',stat:null}];
  assert.deepEqual(BeginnerFlow.actionableStats(['g_vocal','rest','l_dance'],cards),['vocal','dance']);
});

test('gate advice never recommends a card the current stamina cannot play',()=>{
  const cards=[{id:'g_vocal',stat:'vocal',cost:13},{id:'l_dance',stat:'dance',cost:27},{id:'rest',stat:null,cost:-44}];
  assert.deepEqual(BeginnerFlow.actionableStats(['g_vocal','l_dance','rest'],cards,18),['vocal']);
  assert.deepEqual(BeginnerFlow.actionableStats(['g_vocal','l_dance','rest'],cards,5),[]);
});

test('gate advice never recommends an actionable stat that is already capped',()=>{
  const values={vocal:800,dance:120,visual:300};
  assert.equal(BeginnerFlow.recommendedTrainableStat({
    valid:['vocal','dance','visual'],actionable:['vocal','dance'],values,preferred:'vocal'
  }),'dance');
  assert.equal(BeginnerFlow.recommendedTrainableStat({
    valid:['vocal'],actionable:['vocal'],values,preferred:'vocal'
  }),null);
});

test('a mixed hand keeps its build while capped growth is handled by the UI',()=>{
  const cards=[
    {id:'l_vocal',kind:'lesson',stat:'vocal',cost:27},
    {id:'g_vocal',kind:'light',stat:'vocal',cost:13},
    {id:'l_dance',kind:'lesson',stat:'dance',cost:27},
    {id:'l_charm',kind:'lesson',stat:'charm',cost:25},
    {id:'special',kind:'rare',stat:null,cost:22},
    {id:'burst',kind:'burst',stat:null,cost:40},
    {id:'live',kind:'live',stat:null,cost:22},
    {id:'focus',kind:'buff',stat:null,cost:16},
    {id:'rest',kind:'rest',stat:null,cost:-44}
  ];
  const values={vocal:800,dance:280,charm:140};
  const hand=BeginnerFlow.productiveHand(['l_vocal','l_charm','focus'],cards,values,'vocal',800);
  assert.deepEqual(hand,['l_vocal','l_charm','focus']);
});

test('an all-capped hand falls back to useful non-growth actions',()=>{
  const cards=[
    {id:'l_vocal',kind:'lesson',stat:'vocal',cost:27},
    {id:'special',kind:'rare',stat:null,cost:22},
    {id:'live',kind:'live',stat:null,cost:22},
    {id:'focus',kind:'buff',stat:null,cost:16},
    {id:'rest',kind:'rest',stat:null,cost:-44}
  ];
  const hand=BeginnerFlow.productiveHand(['l_vocal','special'],cards,{vocal:800},'vocal',800);
  assert.deepEqual(hand,['live','special']);
});

test('capped growth is visibly disabled instead of pretending to add zero',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
  assert.ok(html.includes("capped?dgT('run.areaMax'"));
  assert.ok(html.includes("capped?' disabled aria-disabled=\"true\"'"));
  assert.ok(html.includes("capped?'MAX':'⚡ '+costTx"));
});

test('award-gate advice also filters recommendations through the current hand',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
  const advice=html.slice(html.indexOf('  gateAdvice(s,nxw)'),html.indexOf('  // 상황 반응형 코치'));
  assert.ok(advice.includes("const actionable=BeginnerFlow.actionableStats(s.hand,TRAIN_CARDS.concat([RARE_CARD]),s.stam)"));
  assert.ok(advice.includes('BeginnerFlow.recommendedTrainableStat'));
  assert.ok(advice.includes("preferred:direction.k"));
  assert.ok(advice.includes("if(!recommend)return"));
});

test('gate coach never compares incomparable stage-power and card-growth numbers',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
  const advice=html.slice(html.indexOf('  gateAdvice(s,nxw)'),html.indexOf('  // 상황 반응형 코치'));
  assert.equal(advice.includes("dgT('run.needPower'"),false);
  assert.equal(advice.includes("dgT('run.needPowerReady'"),false);
  assert.ok(advice.includes("dgT('run.firstGateProtected')"));
  assert.ok(advice.includes("dgT('run.finalImprove'"));
  assert.ok(advice.includes("dgT('run.rankImprove'"));
  assert.ok(advice.includes("dgT('run.gateImprove'"));
});

test('recovery copy tells players when the next turn is already a stage',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
  assert.ok(html.includes('const nextCompetition=this.sch().compets[nx.w], stageNext=dday===1&&!!nextCompetition'));
  assert.ok(html.includes("protectedNext?'run.restProtected':stageNext?'run.restBeforeStage'"));
  assert.ok(html.includes("protectedNext?'run.restProtectedCopy':stageNext?'run.restBeforeStageCopy':'run.restCopy'"));
});

test('result action names the exact next turn',()=>{
  assert.equal(BeginnerFlow.nextTurnLabel(1,12),'다음 턴 2/12');
  assert.equal(BeginnerFlow.nextTurnLabel(12,12),'결과 확인하기');
});

test('debut guidance uses the exact minimum-and-either-threshold rule',()=>{
  const cut={total:340,peak:150,min:100};
  assert.equal(BeginnerFlow.debutProgress({values:[50,50,50,50,50,50],cut,modifier:.85}).pass,false);
  assert.deepEqual(BeginnerFlow.debutProgress({values:[90,40,40,40,40,40],cut,modifier:.85}).need,{total:0,peak:38,min:0});
  assert.equal(BeginnerFlow.debutProgress({values:[90,40,40,40,40,40],cut,modifier:.85}).pass,true);
  assert.equal(BeginnerFlow.debutProgress({values:[128,20,20,20,20,20],cut,modifier:.85}).pass,true);
  assert.equal(BeginnerFlow.debutProgress({values:[84,60,60,60,60,60],cut,modifier:.85}).pass,false);
});

test('only the first RUN receives one gate safety pass',()=>{
  assert.equal(BeginnerFlow.protectsFirstGate(1,true,false),true);
  assert.equal(BeginnerFlow.protectsFirstGate(2,true,false),false);
  assert.equal(BeginnerFlow.protectsFirstGate(1,false,false),false);
  assert.equal(BeginnerFlow.protectsFirstGate(1,true,true),false);
});
