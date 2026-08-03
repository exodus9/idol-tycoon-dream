const assert=require('node:assert/strict');
const {migrateV5}=require('../run-migration.js');

const stats={vocal:100,acting:100,dance:100,visual:100,charm:100,creative:100};
const slots=[{sid:1,type:'leader'},{sid:2,type:'center'},{sid:3,type:'dancer'}];
const deps={posScore:()=>100,grade:()=> 'C'};

// 정상 v4: 카드·현재 편성·데뷔 그룹·대표 그룹을 한 번도 무력화하면 안 된다.
const v4={
  v:4,slots,
  roster:[1,2,3].map(rid=>({rid,idkey:`i:${rid}`,spec:'vocal',stats:{...stats},grade:'C'})),
  lineup:{1:1,2:2,3:3},
  groups:[{gid:7,name:'기존 그룹',lineup:{1:1,2:2,3:3},slots,n:3,sum:900,grade:'B'}],
  repGid:7,
};
const v4Result=migrateV5(v4,deps,null);
assert.equal(v4Result.changed,true);
assert.equal(v4Result.recoveredLineup,false);
assert.deepEqual(v4.lineup,{1:1,2:2,3:3},'existing editable lineup must remain playable');
assert.deepEqual(v4.groups[0].lineup,{1:1,2:2,3:3},'debuted group must remain playable');
assert.equal(v4.groups[0].n,3);
assert.equal(v4.groups[0].legacyArchive,false);
assert.equal(v4.groups[0].needsRebuild,false);
assert.equal(v4.repGid,7);
assert.ok(v4.roster.every(r=>r.runDirection==='archive'&&!('spec' in r)&&!r.legacyRun&&!('legacySpec' in r)));

// 실패 배포를 이미 한 번 연 사용자: primary 편성이 비었어도 v4 backup에서 복구한다.
const damaged={
  v:5,slots,
  roster:[1,2,3].map(rid=>({rid,idkey:`i:${rid}`,legacySpec:'vocal',legacyRun:true,stats:{...stats},grade:'C'})),
  lineup:{},groups:[],repGid:null,
};
const backup={v:4,lineup:{1:1,2:2,3:3}};
const recovered=migrateV5(damaged,deps,backup);
assert.equal(recovered.recoveredLineup,true);
assert.deepEqual(damaged.lineup,{1:1,2:2,3:3},'failed-deploy lineup must recover from journal backup');
assert.ok(damaged.roster.every(r=>!r.legacyRun&&r.runDirection==='archive'));

// 이미 데뷔 그룹이 있으면 예전 작업중 편성을 되살려 전속 멤버를 중복 배치하지 않는다.
const debuted={
  v:5,slots,
  roster:[1,2,3].map(rid=>({rid,idkey:`i:${rid}`,legacyRun:true,stats:{...stats},grade:'C'})),
  lineup:{},groups:[{gid:8,name:'완성 그룹',lineup:{1:1,2:2,3:3},slots}],repGid:8,
};
const debutedResult=migrateV5(debuted,deps,backup);
assert.equal(debutedResult.recoveredLineup,false);
assert.deepEqual(debuted.lineup,{});
assert.equal(debuted.groups[0].n,3);
assert.equal(debuted.groups[0].needsRebuild,false);

// backup도 덮인 경우: 사용 가능 카드 3장을 첫 3자리에 자동 복구해 막다른 길을 없앤다.
const noBackup={
  v:5,slots,
  roster:[1,2,3].map(rid=>({rid,idkey:`i:${rid}`,legacyRun:true,stats:{...stats},grade:'C'})),
  lineup:{},groups:[],repGid:null,
};
const fallback=migrateV5(noBackup,deps,null);
assert.equal(fallback.recoveredLineup,true);
assert.equal(Object.keys(noBackup.lineup).length,3);
assert.deepEqual(new Set(Object.values(noBackup.lineup)),new Set([1,2,3]));

const modern={roster:[{rid:10,stats:{...stats}}],lineup:{1:10},groups:[{gid:9,lineup:{1:10},slots:[{sid:1,type:'leader'}]}],repGid:9};
const modernResult=migrateV5(modern,deps,null);
assert.equal(modernResult.changed,true,'recomputed group metadata must be persisted');
assert.deepEqual(modern.lineup,{1:10});
assert.equal(modern.groups[0].sum,100);
const stableResult=migrateV5(modern,deps,null);
assert.equal(stableResult.changed,false,'stable v5 data must not be rewritten on every load');

console.log('run migration compatibility: OK');
