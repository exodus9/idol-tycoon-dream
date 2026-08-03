import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const moduleSource=fs.readFileSync(new URL('../mentor-inheritance.js',import.meta.url),'utf8');
const need=(condition,message)=>{ if(!condition) throw new Error(message); };

need(html.includes('mentor-inheritance.js?v='),'mentor inheritance runtime is not loaded');
need(html.includes('id="mentorPick"'),'mentor selection mount is missing');
need(html.includes("ProductTelemetry.track('mentor_select'"),'mentor selection telemetry is missing');
need(html.includes("ProductTelemetry.track('mentor_offer'"),'mentor offer telemetry is missing');
need(html.includes("ProductTelemetry.track('mentor_home_start'"),'mentor home CTA telemetry is missing');
need(html.includes("ProductTelemetry.track('mentor_moment'"),'mentor moment telemetry is missing');
need(html.includes('mentorWeek=s.mode===\'quick\'?4:7'),'guaranteed mentor timing is missing');
need(html.indexOf('if(s.mentor&&!s.mentorMomentDone') < html.indexOf('Math.random()<0.25'),'mentor moment must preempt random overlays');
need(html.includes('saved.mentorRid=st.mentor.rid'),'mentor lineage is not persisted');
need(html.includes('멘토 링크 · ${esc(r.mentorName)}'),'mentor lineage is not visible in roster detail');
need(html.includes('mentorHomeOffer()'),'mentor value is not exposed on the return home');
need(html.includes("run_id:s.runId||''"),'mentor events are not joinable to their RUN');
need(!html.includes('.slice(0,12)'),'mentor candidates are silently truncated');
need(moduleSource.includes('r.idkey!==target.idkey'),'same-idol mentor exclusion is missing');

const statMapAt=html.indexOf('const STATNM=');
need(statMapAt>0,'STATNM declaration is missing');
need(!html.slice(0,statMapAt).includes('STATNM['),'pre-DG game flow references scoped STATNM');

console.log('mentor inheritance integration: OK');
