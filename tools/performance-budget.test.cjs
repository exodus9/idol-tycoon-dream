const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('standalone startup assets stay inside the mobile transfer budget',()=>{
  const files=['index.html','i18n.js','dg-i18n.js','idols.js','assets/Jua-400.ttf','assets/mascot.png','assets/agency-lounge-dark-v1.jpg'];
  const bytes=files.reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0);
  assert.ok(bytes<=4.5*1024*1024,`startup payload ${Math.round(bytes/1024)} KiB exceeds 4.5 MiB`);
});

test('large decorative backgrounds use compressed delivery formats',()=>{
  for(const file of ['assets/agency-lounge-dark-v1.jpg','assets/agency-stage-v1.jpg'])assert.ok(fs.statSync(path.join(root,file)).size<500*1024,`${file} exceeds 500 KiB`);
});
