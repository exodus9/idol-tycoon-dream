const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const I18n=require('../dg-i18n.js');

test('a completed RUN turns its support drop into an immediate playable loadout',()=>{
  assert.match(html,/retrainWithRewards\(rid,direction,encodedIds\)/);
  assert.match(html,/support_reward_reuse/);
  assert.match(html,/rewardIds\.map\(encodeURIComponent\)/);
  assert.match(html,/this\.equipped=\[\.\.\.new Set\(candidates\)\]/);
});

test('the reward-to-next-RUN promise is explicit in every release locale',()=>{
  for(const locale of ['ko','en','ja','id']){
    const t=I18n.createTranslator(locale);
    for(const key of ['result.supportUseTitle','result.supportUseCopy','result.supportUseButton','support.rewardEquippedToast']){
      assert.notEqual(t(key,{cards:'CARD',direction:'VOCAL',name:'IDOL'}),key,`${locale} missing ${key}`);
    }
  }
});
