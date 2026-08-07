const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_site');

test('release artifact is allowlisted, complete and hash-verifiable',()=>{
  execFileSync(process.execPath,['tools/build-release.mjs'],{cwd:root,stdio:'pipe'});
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'release.json'),'utf8'));
  assert.equal(manifest.schema,'dream-group-release-v1');
  assert.ok(manifest.files['index.html']);
  for(const [file,meta] of Object.entries(manifest.files)){
    assert.ok(file==='index.html'||/^[^/]+\.js$/.test(file)||file.startsWith('assets/'),`unexpected public file: ${file}`);
    const body=fs.readFileSync(path.join(out,file));
    assert.equal(body.length,meta.bytes);
    assert.equal(crypto.createHash('sha256').update(body).digest('hex'),meta.sha256);
  }
  for(const forbidden of ['docs','tools','outputs','.git','sync.log'])assert.equal(fs.existsSync(path.join(out,forbidden)),false);
});

test('literal runtime script references exist in the artifact',()=>{
  if(!fs.existsSync(out))execFileSync(process.execPath,['tools/build-release.mjs'],{cwd:root});
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  const scripts=[...html.matchAll(/<script\s+src="([^"?$]+)(?:\?[^"$]*)?"/g)].map(match=>match[1]);
  assert.ok(scripts.length>=10);
  for(const script of scripts)assert.equal(fs.existsSync(path.join(out,script)),true,`missing ${script}`);
});
