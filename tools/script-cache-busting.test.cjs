const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('every local runtime script URL changes when its contents change',()=>{
  const scripts=[...html.matchAll(/<script src="([^"?]+)\?v=([a-f0-9]{10})"><\/script>/g)];
  assert.ok(scripts.length>=15,'all local runtime scripts must use a content hash');
  for(const [,file,version] of scripts){
    const bytes=fs.readFileSync(path.join(root,file));
    const expected=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,10);
    assert.equal(version,expected,`${file} changed without refreshing its browser cache key`);
  }
});
