import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{ if(!ok)fail.push(msg); };

need(html.includes('FandomOnboarding.shouldPrompt({week:w,debutWeek:sc.debut,fanBondMoments:s.fanBondMoments})'),'first audition must use the tested fandom onboarding decision');
need(html.includes("this.bondTalk(()=>{ s.busy=false; this.save(); this.debutJudge(); },'predebut')"),'first fandom contact must resolve into the audition instead of consuming a training week');
need(html.includes("const forced=forcedId&&BOND_TALKS.find(e=>e.id===forcedId&&catOk(e))"),'guaranteed onboarding must reuse a valid fandom scenario');
need(html.includes('{id:"predebut"')&&html.includes('이번 RUN 연습 영상에 응원 댓글이 달렸어요'),'pre-debut contact must not pretend an idol with zero fans already received fan mail');
need(html.includes("ProductTelemetry.track('fandom_first_contact'"),'first fandom choice must be measurable');

if(fail.length){ console.error(fail.map(x=>`- ${x}`).join('\n')); process.exit(1); }
console.log('fandom onboarding check: OK');
