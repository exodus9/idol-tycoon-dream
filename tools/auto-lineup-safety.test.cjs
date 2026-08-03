const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('automatic lineup never saves a plan with fewer members', () => {
  assert.ok(html.includes('if(plan.n<before.n){'));
  assert.ok(html.includes('편성 보호 · ${before.n}명을 유지할 수 없어 적용하지 않았어'));
  assert.ok(html.includes('if(plan.n<liveBefore.n){'));
  assert.ok(html.includes("toast('편성 인원이 줄어 적용하지 않았어')"));
  assert.match(html, /this\.data\.lineup=Object\.assign\(\{\},plan\.lineup\)/);
});

test('automatic lineup previews member count and role power before applying', () => {
  assert.match(html, /title:'🎯 역할 배치를 바꿀까\?'/);
  assert.match(html, /멤버 <b>\$\{before\.n\}명 → \$\{plan\.n\}명<\/b> 유지/);
  assert.match(html, /ok:'배치 적용',cancel:'그대로 두기'/);
});
