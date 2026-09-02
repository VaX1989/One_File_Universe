import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'collected';
const expectedSha=process.env.OFU_SOURCE_SHA||null;
function walk(p,out=[]){for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,e.name);if(e.isDirectory())walk(q,out);else if(e.isFile()&&e.name.endsWith('.json'))out.push(q)}return out}
const docs=walk(root).map(f=>({file:f,data:JSON.parse(fs.readFileSync(f,'utf8'))})).filter(x=>x.data.phase==='P4');
if(!docs.length)throw new Error('no P4 evidence found');
const node=docs.filter(x=>x.data.evidenceKind==='p4-node-replay');
const browsers=docs.filter(x=>x.data.evidenceKind==='p4-browser-worker');
if(node.length!==1)throw new Error('expected exactly one p4-node-replay evidence file');
const expectedTargets=[['linux','x64','chromium'],['linux','x64','firefox'],['linux','x64','webkit'],['win32','x64','chromium'],['darwin','arm64','webkit']];
for(const x of docs){if(x.data.status!=='PASS')throw new Error('non-PASS P4 evidence: '+x.file);if(expectedSha&&x.data.sourceCommit!==expectedSha)throw new Error('source SHA mismatch: '+x.file);if(x.data.p2FinalCandidate!=='9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883')throw new Error('P2 pin mismatch: '+x.file)}
for(const [platform,arch,browser] of expectedTargets){const m=browsers.filter(x=>x.data.platform===platform&&x.data.arch===arch&&x.data.browser===browser);if(m.length!==1)throw new Error(`expected exactly one ${platform}/${arch}/${browser} evidence file`)}
const canon=browsers.map(x=>JSON.stringify(x.data.canonical));if(new Set(canon).size!==1)throw new Error('cross-runtime canonical mismatch');
const out={evidenceSchemaVersion:1,phase:'P4',evidenceKind:'p4-aggregate',sourceCommit:expectedSha||node[0].data.sourceCommit,p2FinalCandidate:'9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883',status:'CROSS_RUNTIME_VERIFIED',targets:expectedTargets.map(([platform,arch,browser])=>({platform,arch,browser})),nodeGolden:node[0].data.golden,browserCanonical:browsers[0].data.canonical,propertyHistories:node[0].data.propertyHistories,propertyEvents:node[0].data.propertyEvents};
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/p4-aggregate.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
