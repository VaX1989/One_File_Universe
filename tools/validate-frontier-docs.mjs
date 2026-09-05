import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

/** Restricted JSON Schema evaluator for the vocabulary used by this checked-in
 * planning schema. Unknown schema keywords fail closed rather than being ignored.
 * This validates governance metadata, not canonical universe or runtime state. */
export function validateFrontier(dag,schema,{repositoryRoot=root,checkRatification=true}={}) {
 const failures=[],allowed=new Set(['$schema','$id','title','type','required','additionalProperties','properties','const','enum','pattern','minLength','minItems','maxItems','items','uniqueItems']);
 function check(value,s,at){
  for(const key of Object.keys(s))if(!allowed.has(key))failures.push(`${at}: unsupported schema keyword ${key}`);
  if('const' in s&&JSON.stringify(value)!==JSON.stringify(s.const))failures.push(`${at}: constant mismatch`);
  if(s.enum&&!s.enum.includes(value))failures.push(`${at}: enum mismatch`);
  if(s.type==='object'){
   if(!isRecord(value)){failures.push(`${at}: expected object`);return;}
   for(const key of s.required||[])if(!Object.hasOwn(value,key))failures.push(`${at}: missing ${key}`);
   for(const [key,child] of Object.entries(value)){
    if(Object.hasOwn(s.properties||{},key))check(child,s.properties[key],`${at}.${key}`);
    else if(s.additionalProperties===false)failures.push(`${at}: unknown field ${key}`);
   }
  }else if(s.type==='array'){
   if(!Array.isArray(value)){failures.push(`${at}: expected array`);return;}
   if(value.length<(s.minItems||0)||value.length>(s.maxItems||512))failures.push(`${at}: array bounds`);
   if(s.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)failures.push(`${at}: duplicate items`);
   if(s.items)for(let i=0;i<Math.min(value.length,512);i++)check(value[i],s.items,`${at}[${i}]`);
  }else if(s.type==='string'){
   if(typeof value!=='string'){failures.push(`${at}: expected string`);return;}
   if(value.length<(s.minLength||0)||value.length>16384)failures.push(`${at}: string bounds`);
   if(s.pattern&&!new RegExp(s.pattern).test(value))failures.push(`${at}: pattern mismatch`);
  }else if(s.type==='boolean'&&typeof value!=='boolean')failures.push(`${at}: expected boolean`);
  else if(s.type&&!['object','array','string','boolean'].includes(s.type))failures.push(`${at}: unsupported type ${s.type}`);
 }
 if(!isRecord(dag)||!isRecord(schema))return['root and schema must be objects'];
 check(dag,schema,'frontier');
 if(failures.length)return[...new Set(failures)];
 const streams=dag.workstreams,ids=new Set(),byId=new Map();
 for(const ws of streams){
  if(ids.has(ws.id))failures.push(`duplicate workstream id: ${ws.id}`);
  ids.add(ws.id);byId.set(ws.id,ws);
 }
 for(const ws of streams)for(const dep of ws.dependencies){
  if(!ids.has(dep))failures.push(`${ws.id}: missing dependency ${dep}`);
  if(dep===ws.id)failures.push(`${ws.id}: self dependency`);
 }
 const visiting=new Set(),visited=new Set();
 function visit(id,trail=[]){
  if(visiting.has(id)){failures.push(`cycle: ${[...trail,id].join(' -> ')}`);return;}
  if(visited.has(id))return;
  visiting.add(id);
  for(const dep of byId.get(id)?.dependencies||[])visit(dep,[...trail,id]);
  visiting.delete(id);visited.add(id);
 }
 for(const id of ids)visit(id);
 if(checkRatification){
  const program=dag.implementationProgram;
  if(!fs.existsSync(path.join(repositoryRoot,program.authorityDocument)))failures.push('implementation authority document missing');
  const entries=fs.readdirSync(path.join(repositoryRoot,'docs/adr')).sort();
  for(const id of program.ratifiedAdrs){
   const names=entries.filter(p=>p.startsWith(id+'-')&&p.endsWith('.md'));
   if(names.length!==1){failures.push(`${id}: exactly one decision record required`);continue;}
   const text=fs.readFileSync(path.join(repositoryRoot,'docs/adr',names[0]),'utf8');
   if(!/^\*\*Status:\*\* Accepted$/m.test(text)||!/^\*\*Ratified:\*\* 2026-09-05 /m.test(text))failures.push(`${id}: accepted founder ratification missing`);
  }
 }
 return[...new Set(failures)];
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dag=JSON.parse(fs.readFileSync(path.join(root,'docs/frontier/WORKSTREAM_DAG.json'),'utf8'));
 const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/frontier/WORKSTREAM_DAG.schema.json'),'utf8'));
 const failures=validateFrontier(dag,schema);
 if(failures.length){console.error('OFU frontier documentation validation: FAIL\n'+failures.map(f=>'- '+f).join('\n'));process.exit(1);}
 console.log(`OFU frontier documentation validation: PASS (${dag.workstreams.length} workstreams, acyclic, founder-ratified active program)`);
}
