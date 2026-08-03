import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../product-telemetry.js',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg);};

need(html.includes('product-telemetry.js?v='),'telemetry bridge must load before the game');
for(const event of ['run_start','run_finish','daily_complete','daily_reply_open','mentor_offer','mentor_select','mentor_home_start','mentor_moment','promise_offer','promise_selected','promise_checkpoint','promise_result','run_album_open','run_record_open','retrain_started','promise_reply_open','promise_reply_to_retrain','group_debut','stage_strategy','result_share']) need(html.includes(`'${event}'`),`missing funnel event: ${event}`);
need(html.includes('ProductTelemetry.screen(id)'),'screen transitions must be measurable');
need(html.includes("ProductTelemetry.track('run_start'")&&html.includes('...replyLink')&&html.includes("ProductTelemetry.track('retrain_started'")&&html.includes('...link}'),'reply origin must join retrain_started to run_start');
need(html.includes("window.addEventListener('dream-group-context'"),'verified app favorite context must reach the first-RUN selection flow');
need(bridge.includes("type:'DREAM_GROUP_EVENT'"),'native app event bridge is missing');
need(bridge.includes("type:'DREAM_GROUP_READY'"),'native app readiness handshake is missing');
need(bridge.includes("new CustomEvent('dream-group-context'"),'received app context must notify the game runtime');
need(bridge.includes("raw.source!==root"),'cross-frame context messages must be rejected');
need(!bridge.includes("scalar('user_id'")&&bridge.includes("scalar('favorite_id'")&&!bridge.includes("scalar('token'"),'app context must expose favorite UX fields only');
need(bridge.includes("msg.type!=='DREAM_GROUP_CONTEXT'"),'native context receiver is missing');
need(!/localStorage\.getItem\([^)]*(token|jwt)/i.test(bridge),'auth tokens must never be read from localStorage');
need(!/URLSearchParams[^\n]*(token|jwt)/i.test(bridge),'auth tokens must never be accepted from URL parameters');

if(fail.length){console.error(fail.map(x=>`FAIL: ${x}`).join('\n'));process.exit(1);}
console.log('product telemetry check: OK');
