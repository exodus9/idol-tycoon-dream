import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const daily=fs.readFileSync(new URL('../daily-retention.js',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg);};

need(html.includes('run-memory.js?v='),'run memory module must load');
need(html.includes('id="runPromisePick"'),'promise choice must be mounted in the RUN setup');
need(html.includes('this.promiseMoment(')&&html.includes('promise_checkpoint'),'the guaranteed checkpoint scene is missing');
need(html.includes('RunMemory.evaluate(s)')&&html.includes('promise_result'),'promise success/failure must be decided at finish');
need(html.includes('this.data.runRecords.push(record)'),'every RUN must append to the immutable record ledger');
need(html.includes('bestRunId'),'the displayed best card must point at, not replace, a RUN record');
need(html.includes('bestRunNo'),'the best card must display its source RUN, not the latest attempt number');
need(!html.includes("memories.filter(m=>m.run!==(r.runs||1))"),'same-number attempts must not disappear from the album');
need(html.includes('showRunRecord(')&&html.includes("'run_record_open'"),'individual album records must open and be measurable');
need(html.includes('unresolvedPromise')&&html.includes('retryOf'),'failed promises must feed the next RUN retry');
need(html.includes('rr.unresolvedPromise||rr.lastRunMemory'),'an older unresolved promise must survive unrelated RUN results');
need(html.includes('retrainFromPromiseReply')&&html.includes("'promise_reply_to_retrain'"),'the next-day reply must convert directly into the same idol retrain');
need(html.includes('replyPromiseSource')&&html.includes('reply_run_id')&&html.includes('reply_promise_id'),'reply RUN identity must survive through retrain_started and run_start');
need(html.includes('if(exactSource&&!linkedSource)'),'exact-source CTA must reject a mismatched immutable RUN promise');
need(html.includes('retrainFromRunRecord')&&html.includes("source:'run_record'"),'album retry CTA must bind to the selected immutable RUN record');
need(html.includes('RunMemory.recordSource(this.data.runRecords'),'album and reply retries must validate an exact RUN and promise pair');
need(html.includes('RUN 기록에서 이어진 약속'),'RUN setup must disclose that the promise came from the selected album record');
need(html.includes('promiseTitle:record.runMemory.title'),'the exact RUN scene must queue a next-day reply');
for(const unsafe of ['프로듀서님','제일 좋아','저만 봐','손 놓','우리 둘','책임져','안 뺏','프로듀서님만 믿','프로듀서님 얼굴','프로듀서님 없었으면']) need(!html.includes(unsafe),`unsafe real-idol intimacy copy remains: ${unsafe}`);
need(daily.includes('promiseStatus:input.promiseStatus'),'next-day echo storage must preserve the result state');

if(fail.length){console.error(fail.map(x=>`FAIL: ${x}`).join('\n'));process.exit(1);}
console.log('run memory check: OK');
