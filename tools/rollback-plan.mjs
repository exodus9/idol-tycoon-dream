import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const target=process.argv[2]||execFileSync('git',['rev-parse','HEAD^'],{cwd:root,encoding:'utf8'}).trim();
execFileSync('git',['cat-file','-e',`${target}^{commit}`],{cwd:root});
const full=execFileSync('git',['rev-parse',target],{cwd:root,encoding:'utf8'}).trim();
console.log(JSON.stringify({schema:'dream-group-rollback-plan-v1',target_sha:full,steps:[`gh workflow run deploy.yml --ref main -f rollback_sha=${full}`],verification:['Wait for Pages workflow success','Open /release.json and verify sha equals target_sha','Run the live mobile smoke checklist'],destructive:false},null,2));
