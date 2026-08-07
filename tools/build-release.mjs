import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const value=(name,fallback='')=>{const i=args.indexOf(name);return i>=0&&args[i+1]?args[i+1]:fallback;};
const positional=args.find(x=>!x.startsWith('--')&&args[args.indexOf(x)-1]!=='--source'&&args[args.indexOf(x)-1]!=='--sha');
const source=path.resolve(value('--source',root)),out=path.resolve(root,positional||'_site');
const sha=value('--sha',process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'})).trim();
const tracked=execFileSync('git',['ls-files','-z'],{cwd:source,encoding:'buffer'}).toString().split('\0').filter(Boolean);
const sourceHtml=fs.readFileSync(path.join(source,'index.html'),'utf8');
const superseded=new Set(sourceHtml.includes('agency-lounge-dark-v1.jpg')?['assets/agency-lounge-dark-v1.png','assets/agency-stage-v1.png']:[]);
const releaseFiles=tracked.filter(file=>!superseded.has(file)&&(file==='index.html'||(/^[^/]+\.js$/.test(file))||file.startsWith('assets/'))).sort();
if(!releaseFiles.includes('index.html'))throw new Error('index_missing');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of releaseFiles){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(source,file),target);}
const refs=[...sourceHtml.matchAll(/(?:src|href)="([^"?$]+)(?:\?[^"$]*)?"/g),...sourceHtml.matchAll(/url\(['"]?([^)'"?$]+)(?:\?[^)'"$]*)?['"]?\)/g)].map(match=>match[1]).filter(ref=>!ref.includes('${')&&!ref.startsWith('data:')&&!/^[a-z]+:/i.test(ref));
for(const ref of new Set(refs)){if(!releaseFiles.includes(ref))throw new Error(`release_reference_missing:${ref}`);}
const files={};
for(const file of releaseFiles){const body=fs.readFileSync(path.join(out,file));files[file]={bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex')};}
const manifest={schema:'dream-group-release-v1',sha,source_date_epoch:process.env.SOURCE_DATE_EPOCH||null,file_count:releaseFiles.length,files};
fs.writeFileSync(path.join(out,'release.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`release ${sha.slice(0,12)}: ${releaseFiles.length} files -> ${path.relative(root,out)}`);
