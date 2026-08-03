const assert=require('node:assert/strict');
const {migrateV5,nextLegacyRid}=require('../run-migration.js');

const stats={vocal:100,acting:100,dance:100,visual:100,charm:100,creative:100};
const data={
  v:4,
  roster:[1,2,3].map(rid=>({rid,idkey:`i:${rid}`,spec:'vocal',stats:{...stats},grade:'C'})),
  lineup:{1:1,2:2,3:3},
  groups:[{gid:7,name:'기존 그룹',lineup:{1:1,2:2,3:3},slots:[{sid:1,type:'leader'},{sid:2,type:'center'},{sid:3,type:'dancer'}],n:3,sum:900,grade:'B'}],
  repGid:7,
};
const deps={posScore:()=>100,grade:()=> 'C'};
const result=migrateV5(data,deps);

assert.equal(result.changed,true);
assert.deepEqual(data.lineup,{},'legacy cards must leave the editable lineup');
assert.deepEqual(data.groups[0].lineup,{1:1,2:2,3:3},'debuted group snapshot must be preserved');
assert.equal(data.groups[0].n,3);
assert.equal(data.groups[0].legacyArchive,true);
assert.equal(data.groups[0].needsRebuild,true);
assert.equal(data.repGid,7,'representative group identity must be preserved');
assert.ok(data.roster.every(r=>r.legacyRun&&!('spec' in r)));
assert.equal(nextLegacyRid(data,data.groups[0]),1,'first archived member must be the initial rebuild target');
delete data.roster[0].legacyRun;
assert.equal(nextLegacyRid(data,data.groups[0]),2,'rebuild target must advance after the first member is recrafted');
delete data.roster[1].legacyRun;
delete data.roster[2].legacyRun;
assert.equal(nextLegacyRid(data,data.groups[0]),null,'rebuild target must clear after every member is recrafted');
const rebuiltResult=migrateV5(data,deps);
assert.equal(rebuiltResult.changed,true);
assert.equal(data.groups[0].legacyArchive,false,'fully recrafted group must leave archive state');
assert.equal(data.groups[0].needsRebuild,false,'fully recrafted 3-member group must become competition-eligible');
assert.equal(data.groups[0].sum,300,'fully recrafted group power snapshot must be recalculated');

const modern={roster:[{rid:10,stats:{...stats}}],lineup:{1:10},groups:[{gid:9,lineup:{1:10},slots:[{sid:1,type:'leader'}]}],repGid:9};
const modernResult=migrateV5(modern,deps);
assert.equal(modernResult.changed,true,'recomputed group metadata must be persisted');
assert.deepEqual(modern.lineup,{1:10});
assert.equal(modern.groups[0].legacyArchive,false);
assert.equal(modern.groups[0].sum,100);

const stableResult=migrateV5(modern,deps);
assert.equal(stableResult.changed,false,'stable v5 data must not be rewritten on every load');
console.log('run migration: OK');
