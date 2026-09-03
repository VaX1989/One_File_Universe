import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'evidence';
const files=[];
function walk(dir){
 for(const name of fs.readdirSync(dir)){
  const p=path.join(dir,name),s=fs.statSync(p);
  if(s.isDirectory())walk(p);
  else if(/^browser-.*\.json$/.test(name))files.push(p);
 }
}
walk(root);
if(files.length!==5)throw new Error(`expected 5 browser witnesses, found ${files.length}: ${files.join(', ')}`);
const rows=files.map(file=>({file,...JSON.parse(fs.readFileSync(file,'utf8'))}));
for(const r of rows){
 if(r.status!=='PASS')throw new Error(`browser witness not PASS: ${r.file}`);
 if(r.unexpectedNetworkRequests!==0)throw new Error(`network activity in ${r.file}`);
 if(r.pageErrors!==0)throw new Error(`page errors in ${r.file}`);
 if(r.before.p4Current!==r.before.p4Replay||r.after.p4Current!==r.after.p4Replay)throw new Error(`P4 replay mismatch in ${r.file}`);
}
const hashes=new Set(rows.map(r=>r.artifactSha256));
if(hashes.size!==1)throw new Error(`artifact SHA drift: ${[...hashes].join(', ')}`);
const witnessKey=r=>JSON.stringify([r.after.p3,r.after.p4Current,r.after.p4Replay,r.after.p5Physical,r.after.p5Terrain]);
const witnesses=new Set(rows.map(witnessKey));
if(witnesses.size!==1)throw new Error('canonical witness drift across runtimes');
const mac=rows.filter(r=>r.platform==='darwin');
if(mac.length!==1||mac[0].arch!=='arm64')throw new Error('expected one darwin arm64 witness');
console.log(JSON.stringify({
 status:'PASS',
 artifactSha256:[...hashes][0],
 canonicalWitness:rows[0].after,
 browserWitnesses:rows.map(r=>({browser:r.browser,platform:r.platform,arch:r.arch,backend:r.backend,frameStats:r.frameStats}))
},null,2));
