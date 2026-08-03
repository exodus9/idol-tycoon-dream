import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fail=[];
const need=(ok,msg)=>{ if(!ok)fail.push(msg); };

need(html.includes('const BGM_SONGS={'),'BGM must define separate song forms per screen theme');
for(const theme of ['home','train','battle']){
  need(new RegExp(`${theme}:\\[\\{prog:`).test(html),`missing ${theme} chord progression`);
  need(html.includes(`theme==='${theme}'`)||theme==='train',`missing ${theme} arrangement branch`);
}
need(html.includes("type:'sawtooth'")&&html.includes("A마이너 중심"),'battle theme needs a distinct driving minor arrangement');
need(html.includes('넓은 패드와 두 박마다 울리는 낮은 벨'),'home theme needs a distinct sparse arrangement');
need(html.includes('const BGM_THEME_BUSES={}')&&html.includes("oldBus.gain.exponentialRampToValueAtTime(.0001,now+.16)")&&html.includes("newBus.gain.exponentialRampToValueAtTime(1,now+.16)"),'theme changes must crossfade isolated buses instead of mixing old tails into the new song');
need(!html.includes('const BGM_SONG=['),'one shared BGM song must not masquerade as three themes');

if(fail.length){ console.error(fail.map(x=>`- ${x}`).join('\n')); process.exit(1); }
console.log('audio theme check: OK');
