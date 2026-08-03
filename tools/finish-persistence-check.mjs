import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg);};
const finish=html.slice(html.indexOf('  finish(reachedWorld'),html.indexOf('  // 결과 → 공유 링크'));
const onFinish=html.slice(html.indexOf('    onFinish(st, statVals, end)'),html.indexOf('    // ⑳⑲ 드랍 재설계'));

need(!finish.includes('if(!shared) this.clearSave()'),'active RUN must not be deleted before permanent rewards commit');
need(finish.includes('if(!_dg.persisted)')&&finish.includes('this._finished=false')&&finish.includes('진행 중인 RUN 다시 열기'),'failed completion must stay retryable and avoid permanent-reward UI');
need(finish.indexOf('this.clearSave()')>finish.indexOf('if(!_dg.persisted)'),'active RUN may clear only after the persisted-result branch');
need(onFinish.includes('const before=JSON.stringify(this.data)'),'completion must snapshot the in-memory ledger before mutation');
need(onFinish.includes('CompletionTransaction.commit({snapshot:before')&&onFinish.includes('this.data=JSON.parse(raw)'),'failed permanent writes must use the tested rollback transaction');
need(onFinish.includes('return {persisted:true'),'successful completion must explicitly prove persistence to the caller');

if(fail.length){console.error(fail.map(x=>`FAIL: ${x}`).join('\n'));process.exit(1);}
console.log('finish persistence check: OK');
