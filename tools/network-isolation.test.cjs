const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');

test('standalone charts and ghost league cannot touch the shared Firestore project',()=>{
  assert.equal(html.includes('firestore.googleapis.com'),false);
  assert.equal(html.includes('AIzaSy'),false);
  assert.equal(html.includes('FS_BASE'),false);
  const fetchBoard=html.slice(html.indexOf('async fetchBoard()'),html.indexOf('// 로딩 표시'));
  assert.equal(fetchBoard.includes('fetch('),false);
  const groupBoard=html.slice(html.indexOf('async fetchGroupBoard()'),html.indexOf('showLeague(){'));
  assert.equal(groupBoard.includes('fetch('),false);
  assert.match(groupBoard,/submitGroup\(\)\{ this\._leagueServer=false; return false; \}/);
});
