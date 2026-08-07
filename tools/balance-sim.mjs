#!/usr/bin/env node

/**
 * 드림그룹 관문 몬테카를로.
 *
 * 목적: 화면 자동 클릭이 아니라 현재 index.html의 카드/판정/관문 수치로
 * 모드·지원 카드·플레이 전략별 통과율과 1위 마진을 반복 측정한다.
 * 이벤트는 선택지 편차가 커서 제외하고, 유대 커뮤 확률과 무대 선택은 포함한다.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {createRequire} from 'node:module';
import StageCriteria from '../stage-criteria.js';

const require=createRequire(import.meta.url);
const RunBalanceRules=require('../run-balance-rules.js');
const BeginnerFlow=require('../beginner-flow.js');
const RunMemory=require('../run-memory.js');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const REQUIRED_SOURCE = [
  'const PERF = { condMin:78, pMax:0.10, mult:4.6 }',
  'const MENTAL_THRESH = 56',
  'const GROWTH_BY_LEVEL=[2.6, 2.4, 2.8, 2.7, 2.4, 2.0, 1.3, 0.75]',
  'debutCut:{total:340, peak:150, min:100}',
  'debutCut:{total:170, peak:80, min:55}',
  'const RUN_DIFFICULTY = [1, 1, 1.18, 1.27, 1.35]',
  "n>1 ? (mode==='quick'?1.15:(n>=4?1.24:1.18)) : 1",
  'RunBalanceRules.trendMultiplier(stat,trendStat)',
  'RunBalanceRules.protectsFirstGate(s.runNo,c.gate,win)',
  'const FIRST_RUN_RIVAL_MULT = 0.88',
  'BeginnerFlow.productiveHand(s.hand,TRAIN_CARDS.concat([RARE_CARD])',
  'RunMemory.routeEffect(s,{stat,kind:c.kind,outcome:jk})',
];
for (const needle of REQUIRED_SOURCE) {
  if (!source.includes(needle)) throw new Error(`index.html 수치가 바뀌었습니다. 시뮬레이터 동기화 필요: ${needle}`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) throw new Error(`알 수 없는 인자입니다: ${arg}`);
    const body = arg.slice(2);
    const eq = body.indexOf('=');
    if (eq >= 0) {
      out[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next != null && !next.startsWith('--')) {
      out[body] = next;
      i += 1;
    } else out[body] = 'true';
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const runsInput = Number(args.runs ?? 10_000);
const seedInput = Number(args.seed ?? 20260803);
if (!Number.isFinite(runsInput) || !Number.isInteger(runsInput) || runsInput < 100) {
  throw new Error(`--runs는 100 이상의 정수여야 합니다: ${String(args.runs)}`);
}
if (!Number.isFinite(seedInput) || !Number.isInteger(seedInput)) {
  throw new Error(`--seed는 정수여야 합니다: ${String(args.seed)}`);
}
const RUNS = runsInput;
const SEED = seedInput >>> 0;

const STATS = ['vocal', 'acting', 'dance', 'visual', 'charm', 'creative'];
const GROWTH = [2.6, 2.4, 2.8, 2.7, 2.4, 2.0, 1.3, 0.75];
const PERF = {condMin: 78, pMax: 0.10, mult: 4.6};
const JUDGE = {
  dbad: {mult: -0.5, cond: -24, fanMult: 0.2, mental: -9},
  fail: {mult: 0.28, cond: -14, fanMult: 0.4, mental: -3},
  ok: {mult: 1, cond: -9, fanMult: 1, mental: 0},
  great: {mult: 2.1, cond: -4, fanMult: 2.3, mental: 2},
  perfect: {mult: PERF.mult, cond: -2, fanMult: 3.2, mental: 4},
};
const CARDS = [
  {id: 'l_vocal', kind: 'lesson', stat: 'vocal', base: 36, cost: 27},
  {id: 'l_acting', kind: 'lesson', stat: 'acting', base: 36, cost: 27},
  {id: 'l_dance', kind: 'lesson', stat: 'dance', base: 36, cost: 27},
  {id: 'l_visual', kind: 'lesson', stat: 'visual', base: 36, cost: 25},
  {id: 'l_charm', kind: 'lesson', stat: 'charm', base: 34, cost: 25},
  {id: 'l_creative', kind: 'lesson', stat: 'creative', base: 34, cost: 27},
  {id: 'g_vocal', kind: 'light', stat: 'vocal', base: 20, cost: 13},
  {id: 'g_dance', kind: 'light', stat: 'dance', base: 20, cost: 13},
  {id: 'g_charm', kind: 'light', stat: 'charm', base: 19, cost: 12},
  {id: 'rest', kind: 'rest', stat: null, base: 0, cost: -44},
  {id: 'live', kind: 'live', stat: null, base: 0, cost: 22},
  {id: 'burst', kind: 'burst', stat: null, base: 58, cost: 40},
  {id: 'focus', kind: 'buff', stat: null, base: 0, cost: 16},
];
const RARE = {id: 'special', kind: 'rare', stat: null, base: 66, cost: 22};
const BY_ID = new Map([...CARDS, RARE].map((card) => [card.id, card]));
const LESSONS = CARDS.filter((card) => card.kind === 'lesson' || card.kind === 'light');
const SITUATIONAL = ['live', 'burst', 'focus'];

const SCHEDULES = {
  full: {
    total: 24,
    debut: 6,
    debutCut: {total: 340, peak: 150, min: 100},
    compets: {
      12: {type: 'stage', field: ['vocal', 'dance', 'visual', 'charm'], base: 125},
      18: {type: 'award', gate: true, base: 190},
      24: {type: 'award', final: true, base: 300},
    },
  },
  quick: {
    total: 12,
    debut: 3,
    debutCut: {total: 170, peak: 80, min: 55},
    compets: {
      6: {type: 'stage', field: ['vocal', 'dance', 'visual', 'charm'], base: 80},
      9: {type: 'award', gate: true, base: 137},
      12: {type: 'award', final: true, base: 217},
    },
  },
};

const SUPPORTS = {
  none: {label: '무장착', all: 0, spec: 0, growth: 1, gate: 1},
  effort: {label: '노력파 N★1', all: 15, spec: 0, growth: 1, gate: 1},
  statR: {label: '집중 R★1', all: 0, spec: 55, growth: 1, gate: 1},
  genius: {label: '천재 SR★1', all: 35, spec: 0, growth: 1, gate: 1},
  prodigy: {label: '천재소년 SSR★1', all: 30, spec: 0, growth: 1.25, gate: 1},
};

const STRATEGIES = {
  reckless: '고위험: 레어→특훈→고비용 레슨, 휴식은 강제될 때만',
  balanced: '균형: 기력·컨디션을 관리하며 다음 관문 요구치 보완',
  specialist: '특기 집중: 특기·콤보 우선, 위험할 때만 회복',
};

// 첫 판은 온보딩 보호, 이후는 카드/계승 성장에 맞춰 라이벌도 강해진다.
// 이 값은 index.html의 RUN_DIFFICULTY와 반드시 함께 바꾼다.
const RUN_DIFFICULTY = [1, 1, 1.18, 1.27, 1.35];
function runDifficulty(runNo) { return RUN_DIFFICULTY[Math.min(RUN_DIFFICULTY.length - 1, Math.max(1, runNo))]; }
function modeDifficulty(mode, runNo) { return runDifficulty(runNo) * (runNo > 1 ? (mode === 'quick' ? 1.15 : (runNo >= 4 ? 1.24 : 1.18)) : 1); }

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function levelOf(value) { return Math.min(7, Math.floor(Math.max(0, value) / 100)); }
function growthMult(value) { return GROWTH[levelOf(value)]; }

function rollJudge(state, random) {
  const lowMental = Math.max(0, 56 - state.mental);
  const great = Math.max(0, 0.03 + state.cond * 0.0018);
  const dbad = Math.max(0.02, 0.44 - state.cond * 0.0052 + lowMental * 0.008);
  const fail = Math.max(0.05, 0.37 - state.cond * 0.0022 + lowMental * 0.004);
  const r = random();
  if (r < dbad) return 'dbad';
  if (r < dbad + fail) return 'fail';
  if (r > 1 - great) {
    const perfect = state.cond >= PERF.condMin
      ? PERF.pMax * ((state.cond - PERF.condMin) / (100 - PERF.condMin))
      : 0;
    return random() < perfect ? 'perfect' : 'great';
  }
  return 'ok';
}

function drawHand(state, random) {
  const bag = LESSONS.slice();
  const hand = [];
  while (hand.length < 2 && bag.length) hand.push(bag.splice(Math.floor(random() * bag.length), 1)[0]);
  hand.push(BY_ID.get(SITUATIONAL[Math.floor(random() * SITUATIONAL.length)]));
  if (random() < 0.22) hand[Math.floor(random() * hand.length)] = RARE;
  if (state.stam < 27 && !hand.some((card) => card.kind === 'rest')) hand[hand.length - 1] = BY_ID.get('rest');
  return BeginnerFlow.productiveHand(hand.map(card=>card.id),[...CARDS,RARE],state,state.spec,800).map(id=>BY_ID.get(id));
}

function nextGate(schedule, week) {
  if (week < schedule.debut) return {type: 'debut', week: schedule.debut};
  for (const [w, gate] of Object.entries(schedule.compets)) if (Number(w) > week) return {...gate, week: Number(w)};
  return null;
}

function desiredStats(gate, state) {
  if (!gate || gate.type === 'debut' || gate.type === 'award') return STATS.slice().sort((a, b) => state[a] - state[b]);
  return StageCriteria.effectiveFields(gate.field, state.spec).sort((a, b) => state[a] - state[b]);
}

function chooseCard(hand, state, strategy, schedule) {
  const impactStat=card=>card&&(card.stat||(['rare','burst'].includes(card.kind)?state.spec:null));
  const affordable = hand.filter((card) => {
    const stat=impactStat(card);
    return (!stat||state[stat]<800)&&(card.cost <= 0 || state.stam >= card.cost);
  });
  if (!affordable.length) return hand.find((card) => card.kind === 'rest') || hand[0];
  const rare = affordable.find((card) => card.kind === 'rare');
  if (rare) return rare;
  const rest = affordable.find((card) => card.kind === 'rest');
  if (strategy === 'balanced' && rest && (state.stam < 42 || state.cond < 42 || state.mental < 44)) return rest;
  if (strategy === 'specialist' && rest && (state.stam < 30 || state.cond < 30 || state.mental < 35)) return rest;
  if (strategy === 'reckless') {
    return affordable.slice().sort((a, b) => ((b.kind === 'burst') - (a.kind === 'burst')) || b.base - a.base)[0];
  }
  const gate = nextGate(schedule, state.week);
  const desired = desiredStats(gate, state);
  const score = (card) => {
    if (card.kind === 'rest') return -50;
    if (card.kind === 'focus') return state.buff ? -20 : (gate && gate.week - state.week >= 2 ? 36 : 4);
    if (card.kind === 'live') return 8;
    const stat = card.kind === 'burst' ? state.spec : card.stat;
    let value = card.base + (stat === state.spec ? (strategy === 'specialist' ? 44 : 15) : 0);
    const rank = desired.indexOf(stat);
    if (rank >= 0) value += Math.max(0, 24 - rank * 5);
    if (card.kind === 'burst') value -= state.cond < 64 || state.mental < 56 ? 45 : 0;
    if (state.comboStat === stat) value += Math.min(28, state.combo * 8);
    return value;
  };
  return affordable.slice().sort((a, b) => score(b) - score(a))[0];
}

function playCard(card, state, random) {
  const condMult = state.cond >= 66 ? 1.4 : state.cond >= 34 ? 1 : 0.6;
  state.stam = Math.max(0, Math.min(100, state.stam - card.cost));
  if (card.kind === 'rest') {
    const route=RunMemory.routeEffect(state,{kind:'rest',outcome:'ok'});
    state.cond = Math.min(100, state.cond + 30);
    state.mental = Math.min(100, state.mental + 14 + route.mentalGain);
    state.combo = 0; state.comboStat = null;
    return;
  }
  if (card.kind === 'buff') { const route=RunMemory.routeEffect(state,{kind:'buff',outcome:'ok'}); state.buff = {turns: 3, mult: 1.3}; state.mental=Math.min(100,state.mental+route.mentalGain); return; }
  if (card.kind === 'live') {
    state.fans += 140 + Math.round(random() * 140);
    const stat = STATS[Math.floor(random() * STATS.length)];
    state[stat] = Math.min(800, state[stat] + Math.round(12 * condMult * growthMult(state[stat])));
    state.cond = Math.max(0, state.cond - 6);
    state.combo = 0; state.comboStat = null;
    return;
  }
  const stat = card.kind === 'rare' || card.kind === 'burst' ? state.spec : card.stat;
  if (state.comboStat === stat) state.combo += 1;
  else { state.combo = 1; state.comboStat = stat; }
  const comboMult = 1 + Math.min(0.6, (state.combo - 1) * 0.15);
  const trendMult = RunBalanceRules.trendMultiplier(stat, state.trendStat);
  const buffOn = Boolean(state.buff?.turns > 0);
  const judgeKey = card.kind === 'rare' ? 'great' : rollJudge(state, random);
  const judge = JUDGE[judgeKey];
  const route=RunMemory.routeEffect(state,{stat,kind:card.kind,outcome:judgeKey});
  const growth = RunBalanceRules.growthOutcome({
    base: card.base,
    judgeMult: judge.mult,
    current: state[stat],
    growthMult: judge.mult > 0 ? growthMult(state[stat]) : 1,
    talentMult: judge.mult > 0 && stat === state.spec ? 1.25 : 1,
    trendMult: judge.mult > 0 ? trendMult : 1,
    cardGrowth: judge.mult > 0 ? state.cardGrowth * route.growthMult : 1,
    comboMult: judge.mult > 0 ? comboMult : 1,
    buffMult: judge.mult > 0 && buffOn ? state.buff.mult : 1,
    randomMult: judge.mult > 0 ? 0.9 + random() * 0.2 : 1,
  });
  state[stat] = growth.next;
  state.fans += Math.max(0, Math.round((28 + state[stat] * 0.5) * (card.kind === 'light' ? 0.6 : 1) * judge.fanMult * route.fanMult));
  state.bond=Math.min(100,state.bond+route.bondGain);
  if (card.kind === 'rare') {
    state.cond = Math.min(100, state.cond + 28);
    state.mental = Math.min(100, state.mental + 3);
  } else {
    state.cond = Math.max(0, state.cond + judge.cond + (card.kind === 'burst' ? -12 : 0));
    state.mental = Math.max(0, Math.min(100, state.mental + (judge.mental<0?Math.round(judge.mental*route.mentalLossMult):judge.mental)));
  }
  if (buffOn && --state.buff.turns <= 0) state.buff = null;
  if (judgeKey === 'fail' || judgeKey === 'dbad') { state.combo = 0; state.comboStat = null; }
}

function stageMultiplier(state, random, strategy, expectedRatio) {
  if (strategy === 'reckless' || expectedRatio < 0.92) {
    const chance = Math.min(0.72, 0.55 + Math.floor(state.bond * 0.2) / 100);
    return random() < chance ? 1.38 : 0.78;
  }
  return 1.08;
}

function powerAtGate(state, gate, random, mult) {
  let mine;
  if (gate.type === 'stage') {
    const fields = StageCriteria.effectiveFields(gate.field, state.spec);
    const avg = fields.reduce((sum, stat) => sum + state[stat], 0) / fields.length;
    mine = avg * (0.55 + 0.45 * state.cond / 100) * (0.9 + random() * 0.2);
  } else {
    const avg = STATS.reduce((sum, stat) => sum + state[stat], 0) / STATS.length;
    const peak = Math.max(...STATS.map((stat) => state[stat]));
    mine = Math.max(avg, peak * 0.34) * (1 + Math.min(0.45, state.fans / 60000)) * (0.9 + random() * 0.2);
  }
  return mine * state.cardGate * mult;
}

function resolveRankGate(state, gate, random, strategy, difficulty, runNo) {
  const base = gate.base * difficulty * (runNo === 1 ? 0.88 : 1);
  const expected = powerAtGate(state, gate, () => 0.5, 1) / base;
  const mult = stageMultiplier(state, random, strategy, expected);
  const mine = powerAtGate(state, gate, random, mult);
  const rivals = Array.from({length: 3}, () => base * (0.75 + random() * 0.5));
  const top = Math.max(...rivals);
  const rank = 1 + rivals.filter((score) => score > mine).length;
  return {rank, margin: mine - top, mine, top};
}

function simulateOne(mode, supportKey, strategy, runNo, random, routeType='signature') {
  const schedule = SCHEDULES[mode];
  const support = SUPPORTS[supportKey];
  const difficulty = modeDifficulty(mode, runNo);
  const spec = STATS[Math.floor(random() * STATS.length)];
  const mentorStat = runNo > 1 ? STATS[Math.floor(random() * STATS.length)] : null;
  const state = {spec,runNo,runDirection:spec,runPromise:{baseType:routeType}, trendStat:RunBalanceRules.trendStatAt(), cond: 100, mental: 60, stam: 100, fans: 0, bond: 8, combo: 0, comboStat: null,
    buff: null, cardGrowth: support.growth, cardGate: support.gate, week: 1};
  for (const stat of STATS) state[stat] = 12 + support.all;
  state[spec] += 18 + support.spec;
  state[STATS[(STATS.indexOf(spec) + 3) % STATS.length]] += 2;
  if (mentorStat) state[mentorStat] += 10; // 완주자 평균 ★2 시작 계승(+10)
  const out = {debut: false, stage: null, gate: null, final: null};

  while (state.week <= schedule.total) {
    if (state.week === (mode === 'quick' ? 5 : 9)) {
      state.stam = Math.max(0, state.stam - 8);
      if(routeType==='signature')state[spec] += 8;
      else if(routeType==='fandom')state.bond=Math.min(100,state.bond+5);
      else state.mental=Math.min(100,state.mental+5);
    }
    if (mentorStat && state.week === (mode === 'quick' ? 4 : 7)) {
      state[mentorStat] += 10; // 보장 멘토콜에서 노하우 계승 선택
      state.mental = Math.min(100, state.mental + 3);
    }
    if (state.week === schedule.debut) {
      const cut = schedule.debutCut;
      const expected = Math.max(STATS.reduce((sum, stat) => sum + state[stat], 0) / cut.total,
        Math.max(...STATS.map((stat) => state[stat])) / cut.peak);
      const mult = stageMultiplier(state, random, strategy, expected);
      const cm = (runNo === 1 ? 0.85 : 1) * (runNo === 1 ? 1 : Math.min(1.14, 1 + (difficulty - 1) * 0.45));
      const total = STATS.reduce((sum, stat) => sum + state[stat], 0) * mult;
      const peak = Math.max(...STATS.map((stat) => state[stat])) * mult;
      out.debut = peak >= cut.min * cm && (total >= cut.total * cm || peak >= cut.peak * cm);
      state.fans += out.debut ? Math.round(1500 + total * 4) : Math.round(total * 2);
    } else if (schedule.compets[state.week]) {
      const gate = schedule.compets[state.week];
      const result = resolveRankGate(state, gate, random, strategy, difficulty, runNo);
      if (gate.gate) out.gate = result;
      else if (gate.final) out.final = result;
      else out.stage = result;
      if (gate.type === 'stage') {
        if (result.rank === 1) { state.fans += Math.round(2200 + gate.base * 45); state.mental += 8; state.cond = Math.max(0, state.cond - 6); }
        else if (result.rank <= 3) { state.fans += 700; state.mental += 3; }
        else { state.fans += 150; state.mental = Math.max(0, state.mental - 6); state.cond = Math.max(0, state.cond - 4); }
      } else if (gate.gate) {
        if (result.rank === 1) { state.fans += Math.round(3800 + state.fans * 0.04); state.mental += 6; }
        else state.fans += 400;
      }
      if (gate.gate && result.rank !== 1 && !RunBalanceRules.protectsFirstGate(runNo,true,false)) return out;
    } else {
      const hand = drawHand(state, random);
      playCard(chooseCard(hand, state, strategy, schedule), state, random);
      // 실제 startWeek와 같은 배타 확률: 이벤트 25% 뒤, 남은 주의 22%에 유대 커뮤.
      // 이벤트 수치 효과는 선택지 편차가 커 통제변수에서 제외한다.
      if (state.week >= 3 && random() >= 0.25 && random() < 0.22) state.bond = Math.min(100, state.bond + 10);
    }
    state.week += 1;
  }
  return out;
}

function pct(value) { return `${(value * 100).toFixed(1)}%`; }
function avg(list) { return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0; }
function q(list, p) {
  if (!list.length) return 0;
  const sorted = list.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

const scenarios = [];
for (const mode of ['quick', 'full']) {
  for (const support of ['none', 'effort', 'statR', 'genius', 'prodigy']) {
    for (const strategy of Object.keys(STRATEGIES)) scenarios.push({mode, support, strategy});
  }
}

const rows = scenarios.map((scenario, index) => {
  const random = rng(SEED + index * 9973);
  const runNo = {none: 1, effort: 2, statR: 2, genius: 3, prodigy: 4}[scenario.support];
  const results = Array.from({length: RUNS}, () => simulateOne(scenario.mode, scenario.support, scenario.strategy, runNo, random));
  const stages = results.map((r) => r.stage).filter(Boolean);
  const gates = results.map((r) => r.gate).filter(Boolean);
  const finals = results.map((r) => r.final).filter(Boolean);
  return {
    ...scenario,
    runNo,
    supportLabel: SUPPORTS[scenario.support].label+(runNo>1?' + 멘토 ★2':''),
    debut: results.filter((r) => r.debut).length / RUNS,
    stageWin: stages.filter((r) => r.rank === 1).length / RUNS,
    gateWin: gates.filter((r) => r.rank === 1).length / RUNS,
    finalReach: finals.length / RUNS,
    finalWin: finals.filter((r) => r.rank === 1).length / RUNS,
    finalWinGivenReach: finals.length ? finals.filter((r) => r.rank === 1).length / finals.length : 0,
    marginAvg: avg(finals.map((r) => r.margin)),
    marginP10: q(finals.map((r) => r.margin), 0.1),
    marginP90: q(finals.map((r) => r.margin), 0.9),
  };
});

const routeRows=['signature','fandom','resilience'].flatMap((route,routeIndex)=>['quick','full'].map((mode,modeIndex)=>{
  const random=rng(SEED+800000+routeIndex*20000+modeIndex*5000);
  const results=Array.from({length:RUNS},()=>simulateOne(mode,'effort','balanced',2,random,route));
  const finals=results.map(result=>result.final).filter(Boolean);
  return {mode,route,runNo:2,finalReach:finals.length/RUNS,finalWin:finals.filter(result=>result.rank===1).length/RUNS,finalWinGivenReach:finals.length?finals.filter(result=>result.rank===1).length/finals.length:0};
}));

if (args.acceptance === 'true') {
  const row=(mode,support,strategy='balanced')=>rows.find(r=>r.mode===mode&&r.support===support&&r.strategy===strategy);
  const checks=[
    ['첫 간이육성 파이널 도달률(첫 RUN 관문 보호 포함)',row('quick','none').finalReach,0.99,1.00],
    ['2회차 간이육성 파이널 1위율',row('quick','effort').finalWin,0.55,0.70],
    ['2회차 정규육성 파이널 1위율',row('full','effort').finalWin,0.50,0.72],
    ['3회차 간이육성 파이널 1위율',row('quick','genius').finalWin,0.42,0.60],
    ['3회차 정규육성 파이널 1위율',row('full','genius').finalWin,0.38,0.58],
    ['4회차 간이육성 파이널 1위율',row('quick','prodigy').finalWin,0.30,0.50],
    ['4회차 정규육성 파이널 1위율',row('full','prodigy').finalWin,0.35,0.55],
  ];
  const invalid=checks.filter(([,value])=>!Number.isFinite(value));
  if(invalid.length){
    invalid.forEach(([label,value])=>console.error(`ACCEPTANCE INVALID: ${label} ${String(value)}`));
    process.exit(1);
  }
  const failed=checks.filter(([,value,min,max])=>value<min||value>max);
  if(failed.length){
    failed.forEach(([label,value,min,max])=>console.error(`ACCEPTANCE FAIL: ${label} ${(value*100).toFixed(1)}% (목표 ${(min*100).toFixed(0)}~${(max*100).toFixed(0)}%)`));
    process.exit(1);
  }
}

if (args.json === 'true') {
  console.log(JSON.stringify({runsPerScenario: RUNS, seed: SEED, rows,routeRows}, null, 2));
  process.exit(0);
}

console.log(`# 드림그룹 관문 시뮬레이션 (${RUNS.toLocaleString()}판/조건)`);
console.log('');
console.log('| 모드 | 회차 | 지원 카드 | 전략 | 첫 심사 | 중간 1위 | 생존 관문 | 파이널 도달 | 파이널 1위(전체) | 도달 시 1위 | 파이널 평균 마진 |');
console.log('|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|');
for (const row of rows) {
  console.log(`| ${row.mode} | ${row.runNo} | ${row.supportLabel} | ${row.strategy} | ${pct(row.debut)} | ${pct(row.stageWin)} | ${pct(row.gateWin)} | ${pct(row.finalReach)} | ${pct(row.finalWin)} | ${pct(row.finalWinGivenReach)} | ${row.marginAvg.toFixed(1)} |`);
}
console.log('');
console.log('- 마진 = 내 파이널 점수 − 가장 강한 라이벌 점수. 양수면 1위.');
console.log('- 이벤트 효과는 제외했다. 무작위 이벤트 운이 아닌 카드 선택·컨디션·멘탈·지원 카드·무대 선택의 힘을 분리하기 위해서다.');
console.log('- 2회차부터 자동 선택되는 평균 ★2 멘토의 시작 +10과 보장 멘토콜 +10·멘탈 +3은 포함했다.');
console.log('- RUN 약속은 대표 경로인 시그니처 장면 고수(점검 시 기력 -8·핵심 방향 +8)를 포함했다.');
console.log('');
console.log('| 2회차 모드 | 약속 ROUTE | 파이널 도달 | 파이널 1위 | 도달 시 1위 |');
console.log('|---|---|---:|---:|---:|');
for(const row of routeRows)console.log(`| ${row.mode} | ${row.route} | ${pct(row.finalReach)} | ${pct(row.finalWin)} | ${pct(row.finalWinGivenReach)} |`);
console.log('- ROUTE 표는 동일한 노력파 N★1·멘토 ★2·균형 전략에서 약속 효과만 바꾼 1만 판 비교다.');
console.log(`- 실게임과 같은 첫 RUN 관문 보호와 현재 시즌 트렌드(${RunBalanceRules.trendStatAt()} 훈련 ×1.25)를 포함했다.`);
console.log('- 현재 index.html 핵심 상수와 공용 RUN 규칙이 불일치하면 실행을 중단한다.');
if(args.acceptance==='true') console.log('- 밸런스 acceptance: 대표 회차별 목표 구간 통과.');
