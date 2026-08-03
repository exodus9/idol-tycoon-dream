const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function boot(language){
  const store = new Map();
  const context = vm.createContext({
    navigator:{language},
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value))},
    console
  });
  context.window=context;
  vm.runInContext(source, context, {filename:'i18n.js'});
  return context;
}

test('launch locale detection covers Korean, English, Japanese and Indonesian',()=>{
  assert.equal(boot('ko-KR').LANG,'ko');
  assert.equal(boot('en-US').LANG,'en');
  assert.equal(boot('ja-JP').LANG,'ja');
  assert.equal(boot('id-ID').LANG,'id');
  assert.equal(boot('in-ID').LANG,'id');
  assert.deepEqual(Array.from(boot('en-US').langList(),x=>x.code),['ko','en','ja','id']);
  assert.ok(html.includes('src="dg-i18n.js'));
});

test('active global result copy evaluates the RUN production, not a real idol',()=>{
  const banned=[/raw talent/i,/six talents/i,/no weakness/i,/unbeatable/i,/innate/i,/才能すべて/,/弱点がない/,/無敵/,/完成型素材/,/実力ステータス/];
  for(const locale of ['en','ja','id']){
    const w=boot(locale==='id'?'id-ID':`${locale}-${locale.toUpperCase()}`);
    const active=Object.entries(w.I18N[locale]).filter(([key])=>/^(t_tagline|manual_|say_perfect|debut_pass_text|cp_.*_sub|end_|start_log|e_|d_|hall_)/.test(key)).map(([,value])=>String(value)).join('\n');
    for(const pattern of banned) assert.equal(pattern.test(active),false,`${locale} contains ${pattern}`);
    assert.match(active,/RUN|制作|stage|production|ステージ/i);
  }
});
