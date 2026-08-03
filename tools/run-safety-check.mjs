import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const i18n = fs.readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../run-migration.js', import.meta.url), 'utf8');
const fail = [];
const need = (ok, msg) => { if (!ok) fail.push(msg); };

need(html.includes('const runDirection=this.runDirection;'), 'new RUN must require an explicit runDirection');
need(html.includes('const {base} = talentOf(runDirection);'), 'growth must initialize from runDirection');
need(!/talentOf\([^)]*idol\.spec/.test(html), 'idol.spec must not initialize growth');
need(!/Game\.selIdol[^\n]*\.spec/.test(html), 'selected idol spec must not drive deck logic');
need(migration.includes('r.legacySpec=r.spec; r.legacyRun=true; delete r.spec;'), 'legacy roster spec must be isolated');
need(migration.includes('if(!r||r.incomplete){ delete g.lineup[sid];'), 'debuted group snapshots must preserve legacy RUN members');
need(migration.includes('g.legacyArchive=archived;'), 'legacy debuted groups must be marked as preserved archives');
need(html.includes('isEligibleRosterMember(r){ return !!(r&&!r.incomplete&&!r.legacyRun); }'), 'all lineup entry points need one eligibility rule');
for (const entry of ['assign(slotId, rid)', 'quickAssign(rid)', 'debutGroup(name, logo)', 'autoFill()']) {
  need(html.includes(entry), `missing lineup entry point: ${entry}`);
}
need(html.includes('if(!this.isEligibleRosterMember(r)) return {err:r.legacyRun'), 'direct and quick assignment must reject legacy RUN cards');
need(html.includes('filter(r=>this.isEligibleRosterMember(r)&&!this.isCommitted'), 'auto lineup must reject legacy RUN cards');
need(html.includes('filter(m=>this.isEligibleRosterMember(m.r))'), 'saved-group battle must reject legacy RUN cards');
need(html.includes('RunMigration.migrateV5'), 'legacy migration must use the tested non-destructive group migration');
need(html.includes('groupRosterMembers(g)'), 'archived group snapshots need a display-only member path');
need(html.includes("if(this.groupMembers(g).length<3)"), 'archived groups must be blocked from competition');
need(migration.includes('function nextLegacyRid(data,group)'), 'archived-group rebuild target must advance member by member');
need(html.includes('const _rebuildRid=_archived?RunMigration.nextLegacyRid(this.data,rep):null;'), 'home recovery CTA must target the next legacy member');
need(html.includes("r.incomplete||r.legacyRun?`<button"), 'committed legacy cards must expose a direct rebuild action');
need(html.includes("if(rep&&DG.groupMembers(rep).length>=3)DG.showBattleLobby(); else DG.showLeague();"), 'stage tab must route archived groups to a recovery screen');
need(html.includes('이전 체계 멤버를 새 RUN 카드로 재제작하면 고스트 리그에 다시 출전'), 'league hub must explain archived-group recovery');
need(html.includes("const arr=['run-v3',r.name,r.grp,r.direction||r.spec,r.overall"), 'share payload must use run-v3 summary');
need(!/\['run-v3'[^\n]*statVals/.test(html), 'share payload must not include six-area stat values');
need(html.indexOf('id="runDirectionPick"') > html.indexOf('id="cardPickHero"'), 'direction picker must be outside the clipped hero');
need(html.includes('if(directionBox) directionBox.innerHTML=directionPick;'), 'direction picker must render into its independent container');
need(i18n.includes('const DECLARED=["ko"];'), 'only fully reviewed languages may be exposed');

const koStart = i18n.indexOf('  ko: {');
const enStart = i18n.indexOf('  en: {');
const ko = i18n.slice(koStart, enStart);
for (const phrase of ['타고난 재능','종합 등급','약점이 없어','실력 스탯','S급 이상 연습생','SS급 연습생']) {
  need(!ko.includes(phrase), `reviewed Korean surface still contains: ${phrase}`);
}
need(html.includes("scoreLabel+` 평균 ${m.best}`"), 'card must expose aggregate RUN result without raw six-area stats');
need(html.includes('역할 기여 +${c.val.toLocaleString()}'), 'battle must expose numeric role contribution');
need(html.includes("langs.length>1?`<div class=\"sheet-lang\">${langBtns}</div>`:''"), 'single-language build must not expose fake language choices');
need(!html.includes('시너지 상한 +40%'), 'synergy help must not claim the removed +40% cap');
need(html.includes('시너지는 조합한 만큼 누적'), 'synergy help must explain the uncapped model');
need(html.includes("StorageJournal.write(localStorage,RUN_SAVE_KEY,RUN_BACKUP_KEY,this.st,validRunSave)"), 'active RUN save must use validated journal writes');
need(html.includes("StorageJournal.read(localStorage,KEY(),KEY()+'_backup_v1',validDgSave)"), 'agency save must recover from a validated backup');
need(!html.includes('${best.grade}등급</small>'), 'individual chart must label grade as RUN completion');

if (fail.length) {
  console.error(fail.map(x => `FAIL: ${x}`).join('\n'));
  process.exit(1);
}
console.log('RUN safety check: OK');
