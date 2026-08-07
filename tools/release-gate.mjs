import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const gate=JSON.parse(fs.readFileSync(path.join(root,'release-gate.json'),'utf8'));
const releaseClass=process.argv.includes('--production')?'commercial_production':process.argv.includes('--public')?'public_rc':'internal_rc';
const required=gate.checks.filter(check=>(check.required_for||[]).includes(releaseClass));
const blockers=required.filter(check=>check.status!=='pass');
const invalidPass=required.filter(check=>check.status==='pass'&&(!(check.evidence&&check.evidence.length)||check.evidence.some(file=>!fs.existsSync(path.join(root,file)))));

console.log(`Dream Group ${releaseClass}: ${blockers.length||invalidPass.length?'NO-GO':'GO'}`);
for(const check of required) console.log(`${check.status==='pass'?'PASS':'BLOCK'} ${check.id} — ${check.title}`);
if(invalidPass.length) console.error(`Invalid PASS without evidence: ${invalidPass.map(x=>x.id).join(', ')}`);
if(blockers.length) console.error(`Blocking evidence required: ${blockers.map(x=>x.id).join(', ')}`);
if(blockers.length||invalidPass.length) process.exitCode=1;
