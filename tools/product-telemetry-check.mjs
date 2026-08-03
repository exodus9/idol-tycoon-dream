import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../product-telemetry.js',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg);};

need(html.includes('product-telemetry.js?v='),'telemetry bridge must load before the game');
for(const event of ['run_start','run_finish','daily_complete','group_debut','stage_strategy','result_share']) need(html.includes(`'${event}'`),`missing funnel event: ${event}`);
need(html.includes('ProductTelemetry.screen(id)'),'screen transitions must be measurable');
need(bridge.includes("type:'DREAM_GROUP_EVENT'"),'native app event bridge is missing');
need(bridge.includes("type:'DREAM_GROUP_READY'"),'native app readiness handshake is missing');
need(bridge.includes("msg.type!=='DREAM_GROUP_CONTEXT'"),'native context receiver is missing');
need(!/localStorage\.getItem\([^)]*(token|jwt)/i.test(bridge),'auth tokens must never be read from localStorage');
need(!/URLSearchParams[^\n]*(token|jwt)/i.test(bridge),'auth tokens must never be accepted from URL parameters');

if(fail.length){console.error(fail.map(x=>`FAIL: ${x}`).join('\n'));process.exit(1);}
console.log('product telemetry check: OK');
