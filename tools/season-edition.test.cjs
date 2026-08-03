const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SeasonEditionLedger = require('../season-edition.js');
const dgI18n = require('../dg-i18n.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const trend = {nm:'보컬 대세',ic:'🎵',pos:'vocal'};

test('first-card guarantee never grants an edition without reaching the final', () => {
  assert.equal(SeasonEditionLedger.qualify({registered:true,reachedFinal:false,direction:'vocal',expectedDirection:'vocal',seasonNo:15,trend}), null);
  assert.equal(SeasonEditionLedger.qualify({registered:true,reachedFinal:true,direction:'dance',expectedDirection:'vocal',seasonNo:15,trend}), null);
});

test('edition belongs to the finish season, not the start season', () => {
  const edition = SeasonEditionLedger.qualify({registered:true,reachedFinal:true,direction:'vocal',expectedDirection:'vocal',seasonNo:16,trend});
  assert.equal(edition.no, 16);
  assert.equal(edition.name, '보컬 대세');
  assert.ok(html.includes('startedSeason:DG.seasonNo()'));
  assert.ok(html.includes('seasonNo:this.seasonNo(),trend:_finishTrend'));
});

test('same idol and season creates one collection entry with multiple versions', () => {
  let rows=[];
  const edition={no:15,name:'보컬 대세',icon:'🎵',pos:'vocal',direction:'vocal'};
  const first=SeasonEditionLedger.upsert(rows,{rid:7,edition,record:{runId:'a',completed:true,stats:{vocal:100}}},['vocal']); rows=first.rows;
  const second=SeasonEditionLedger.upsert(rows,{rid:7,edition,record:{runId:'b',completed:true,stats:{vocal:140}}},['vocal']); rows=second.rows;
  assert.equal(rows.length,1);
  assert.deepEqual(rows[0].runIds,['a','b']);
  assert.equal(rows[0].bestRunId,'b');
  assert.equal(first.created,true);
  assert.equal(second.created,false);
  assert.equal(second.versionAdded,true);
  assert.equal(second.bestChanged,true);
});

test('legacy edition records backfill completion and deduplicate the ledger', () => {
  const records=[
    {rid:2,runId:'old-a',failed:false,seasonQualified:true,seasonEdition:{no:14,name:'랩 대세'},stats:{acting:80}},
    {rid:2,runId:'old-b',failed:false,seasonQualified:true,seasonEdition:{no:14,name:'랩 대세'},stats:{acting:90}},
  ];
  const out=SeasonEditionLedger.migrate(records,[],['acting']);
  assert.equal(out.rows.length,1);
  assert.equal(out.rows[0].runIds.length,2);
  assert.equal(records[0].completed,true);
});

test('legacy editions without final qualification are removed from records and ledger', () => {
  const records=[{rid:3,runId:'bad-old',failed:false,seasonEdition:{no:13,name:'보컬 대세'},stats:{vocal:999}}];
  const stale=[{rid:3,no:13,name:'보컬 대세',runIds:['bad-old'],bestRunId:'bad-old',bestScore:999}];
  const out=SeasonEditionLedger.migrate(records,stale,['vocal']);
  assert.equal(out.rows.length,0);
  assert.equal(records[0].seasonEdition,undefined);
  assert.equal(out.changed,true);
});

test('pre-run target, card, classified result, album and current-season collection all read the canonical ledger', () => {
  for (const marker of ['SeasonEditionLedger.upsert', 'ownedEdition=rr?this.seasonEditionOf', 'class="season-edition-preview"', "dgT(ownedEdition?'setup.editionOwned':'setup.editionUnowned')", 'seasonEditionCount=this.seasonEditionsOf(rid).length', 'class="ic-season"', "'result.editionCollected'", "'result.editionBest'", "'result.editionVersion'", 'season_edition_new:']) {
    assert.ok(html.includes(marker), `missing season edition surface: ${marker}`);
  }
  for(const locale of ['ko','en','ja','id']){
    for(const key of ['setup.editionUnowned','setup.editionOwned','result.editionCollected','result.editionBest','result.editionVersion']){
      assert.notEqual(dgI18n.t(locale,key),key,`${locale} missing ${key}`);
    }
  }
});
