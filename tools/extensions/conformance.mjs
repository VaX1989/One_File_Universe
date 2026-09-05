import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadComponents} from './components.mjs';
const TIERS=['FAST_LOCAL','LANE_TARGETED','INTEGRATION','CUMULATIVE','RELEASE'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const check=(ok,m)=>{if(!ok)throw new Error('PX conformance: '+m);};
export function loadConformance(root=process.cwd()){
 const dir=path.join(root,'config/conformance'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort(),all=[];
 check(files.length<=128,'manifest count');
 for(const f of files){const stat=fs.lstatSync(path.join(dir,f));check(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=1048576,'manifest size/type');const v=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));check(v.schema==='ofu-conformance-1'&&Array.isArray(v.tests),'schema');all.push(...v.tests);}
 return validateConformance(all,root);
}
export function validateConformance(inputs,root=process.cwd()){
 check(Array.isArray(inputs)&&inputs.length<=1024,'bounded tests');const ids=new Set(),oracles=new Set();
 const result=inputs.map(t=>{check(t&&typeof t==='object'&&Object.keys(t).length===7&&['id','owner','tier','command','providers','oracle','timeoutMs'].every(k=>Object.hasOwn(t,k)),'test schema');
  check(typeof t.id==='string'&&/^[a-z][a-z0-9._-]{0,127}$/.test(t.id)&&typeof t.owner==='string'&&/^[a-z][a-z0-9._-]{0,63}$/.test(t.owner),'identity/owner');check(!ids.has(t.id),'duplicate test '+t.id);ids.add(t.id);
  check(TIERS.includes(t.tier),'tier');check(typeof t.oracle==='string'&&t.oracle.length>0&&t.oracle.length<=128&&!oracles.has(t.oracle),'oracle collision');oracles.add(t.oracle);
  check(Array.isArray(t.command)&&t.command.length>=2&&t.command.length<=8&&['node','python3'].includes(t.command[0]),'command executable');
  check(/^tests\/[A-Za-z0-9_./-]+\.(mjs|py)$/.test(t.command[1])&&!t.command[1].split('/').includes('..'),'test entrypoint');
  check(t.command.slice(2).every(a=>typeof a==='string'&&/^[A-Za-z0-9_.=/-]{1,128}$/.test(a)),'test arguments');
  const file=fs.realpathSync(path.join(root,t.command[1]));check(file.startsWith(fs.realpathSync(path.join(root,'tests'))+path.sep),'test path escape');
  check(Number.isSafeInteger(t.timeoutMs)&&t.timeoutMs>=1000&&t.timeoutMs<=900000,'bounded timeout');
  check(Array.isArray(t.providers)&&t.providers.length>0&&t.providers.length<=512&&new Set(t.providers).size===t.providers.length,'provider coverage');
  return Object.freeze({...t,command:Object.freeze([...t.command]),providers:Object.freeze([...t.providers]),sourceSha256:sha(fs.readFileSync(file))});
 });
 return Object.freeze(result.sort((a,b)=>TIERS.indexOf(a.tier)-TIERS.indexOf(b.tier)||(a.id<b.id?-1:1)));
}
export function validateCoverage(catalogs,tests){
 const testsById=new Map(tests.map(t=>[t.id,t])),providers=catalogs.flatMap(c=>c.providers),ids=new Set(providers.map(p=>p.id));
 for(const p of providers){for(const ref of p.evidence){const t=testsById.get(ref.id);check(t&&t.owner===p.owner&&t.tier===ref.tier&&t.providers.includes(p.id),'unowned/missing test for '+p.id+':'+ref.id);}
  if(p.mandatory)for(const tier of ['FAST_LOCAL','INTEGRATION','RELEASE'])check(p.evidence.some(e=>e.tier===tier),'mandatory tier missing '+p.id+':'+tier);
 }
 for(const t of tests)for(const id of t.providers)check(ids.has(id),'test references absent provider '+id);
 return providers;
}
export function runConformance(tier,{root=process.cwd(),exact=false}={}){
 check(TIERS.includes(tier),'unknown tier');const tests=loadConformance(root),catalogs=loadComponents(root).filter(c=>c.id.startsWith('px.providers.')).map(c=>JSON.parse(c.content));
 validateCoverage(catalogs.filter(c=>c.schema==='ofu-provider-catalog-1'),tests);const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),dirty=execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0;
 if(exact){check(!dirty,'exact evidence requires clean source');check(!process.env.OFU_SOURCE_SHA||process.env.OFU_SOURCE_SHA===source,'source SHA mismatch');}
 const results=[];
 for(const t of tests.filter(t=>TIERS.indexOf(t.tier)<=TIERS.indexOf(tier))){const start=performance.now(),command=t.command[0]==='node'?process.execPath:t.command[0],r=spawnSync(command,t.command.slice(1),{cwd:root,env:process.env,encoding:'utf8',timeout:t.timeoutMs,maxBuffer:8*1024*1024});
  check(!r.error&&r.status===0,t.id+' failed\n'+String(r.stderr||r.error||r.stdout).slice(-4000));
  const lines=r.stdout.trim().split('\n');let value;try{value=JSON.parse(lines.at(-1));}catch{throw new Error('PX conformance: '+t.id+' missing JSON result');}
  check(value.status==='PASS',t.id+' did not report PASS');
  results.push({id:t.id,owner:t.owner,tier:t.tier,oracle:t.oracle,providers:t.providers,testSourceSha256:t.sourceSha256,result:value,durationMs:Math.round(performance.now()-start),stdoutSha256:sha(r.stdout)});
 }
 const record={schema:'ofu-conformance-evidence-1',status:'PASS',tier,sourceSha:source,sourceTree:tree,exactSource:!dirty,results,manifestSha256:sha(JSON.stringify(tests))};
 const dir=path.join(root,'dist/evidence/px');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'conformance-'+tier.toLowerCase()+'.json'),JSON.stringify(record,null,2)+'\n');return record;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const record=runConformance(process.argv[2]||'FAST_LOCAL',{exact:process.argv.includes('--exact')});console.log(JSON.stringify(record));}
