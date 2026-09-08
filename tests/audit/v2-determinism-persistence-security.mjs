import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const BASE_SHA='2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7';
const BASE_TREE='99e6b5ff6229d9c34d381e778c5689bf2367d256';
const O=globalThis.OFU ||= {};
for(const f of ['src/kernel/sha256.js','src/kernel/canonical.js','src/persistence/save.js']){
  if((f.endsWith('sha256.js')&&!O.sha256)||(f.endsWith('canonical.js')&&!O.canonical)||(f.endsWith('save.js')&&!O.save)) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
let cases=0;
const run=(file)=>{
  const r=spawnSync(process.execPath,[file],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,OFU_AUDIT_BASE_SHA:BASE_SHA,OFU_AUDIT_BASE_TREE:BASE_TREE},maxBuffer:32*1024*1024});
  assert.equal(r.status,0,`${file} failed\nSTDOUT:\n${r.stdout}\nSTDERR:\n${r.stderr}`);
  assert.equal(r.signal,null,`${file} terminated by signal ${r.signal}`);
  return {stdout:r.stdout.replace(/\r\n/g,'\n'),stderr:r.stderr.replace(/\r\n/g,'\n')};
};

// Metamorphic deterministic replay: the same exact-source witness must produce identical observable output twice.
for(const file of [
  'tests/extensions/registry.mjs',
  'tests/p4/semantic-closure-tests.mjs',
  'tests/v2x-03/continuity-identity.mjs',
  'tests/v1/session-persistence.mjs'
]){
  const a=run(file),b=run(file);
  assert.equal(a.stdout,b.stdout,`${file} stdout diverged across identical executions`);
  assert.equal(a.stderr,b.stderr,`${file} stderr diverged across identical executions`);
  cases+=4;
}

const seed='0123456789abcdef'.repeat(4),manifest='fedcba9876543210'.repeat(4);
const base={masterSeed256:seed,manifestHash:manifest,events:[{type:'audit',data:{alpha:1,beta:2,gamma:'é'}}]};
const canonical=O.save.exportPortable(base);
for(let i=0;i<64;i++){
  const keys=i%2?['gamma','alpha','beta']:['beta','gamma','alpha'];
  const data={};for(const k of keys)data[k]=base.events[0].data[k];
  const variant={events:[{data,type:'audit'}],manifestHash:manifest,masterSeed256:seed};
  assert.equal(O.save.exportPortable(variant),canonical,'object insertion order changed portable bytes');
  assert.equal(O.save.stateDigest(O.save.importPortable(canonical,{manifestHash:manifest,masterSeed256:seed})),O.save.stateDigest(O.save.payload(base)),'round-trip digest diverged');
  cases+=2;
}

const reject=(value,re)=>{assert.throws(()=>O.save.exportPortable(value),re);cases++;};
reject({...base,events:Array.from({length:O.save.LIMITS.events+1},(_,i)=>({type:'x',data:i}))},/invalid events|event count|limit/i);
reject({...base,events:[{type:'x'.repeat(O.save.LIMITS.eventTypeBytes+1),data:0}]},/event type|bytes|limit/i);
reject({...base,events:[{type:'x',data:'a'.repeat(O.save.LIMITS.stringBytes+1)}]},/string|bytes|limit/i);
reject({...base,events:[{type:'x',data:Array(O.save.LIMITS.arrayItems+1).fill(0)}]},/array|items|limit/i);
const accessor={};Object.defineProperty(accessor,'x',{enumerable:true,get(){return 1}});reject({...base,events:[{type:'x',data:accessor}]},/accessor/i);
const hidden={x:1};Object.defineProperty(hidden,'secret',{enumerable:false,value:2});reject({...base,events:[{type:'x',data:hidden}]},/non-enumerable|hidden/i);
const sym={x:1};sym[Symbol('secret')]=2;reject({...base,events:[{type:'x',data:sym}]},/symbol/i);
const sparse=[];sparse[2]=1;reject({...base,events:[{type:'x',data:sparse}]},/sparse/i);
const collision={};collision['é']=1;collision['e\u0301']=2;reject({...base,events:[{type:'x',data:collision}]},/duplicate normalized key/i);

const parsed=JSON.parse(canonical);
parsed.payload.events[0].data.alpha=9;
assert.throws(()=>O.save.importPortable(O.save.stableJson(parsed),{manifestHash:manifest,masterSeed256:seed}),/integrity mismatch/i);cases++;
assert.throws(()=>O.save.importPortable('['.repeat(O.save.MAX_PARSE_DEPTH+1)+'0'+']'.repeat(O.save.MAX_PARSE_DEPTH+1)),/parser nesting limit/i);cases++;
assert.throws(()=>O.save.importPortable(' '.repeat(O.save.MAX_SAVE_BYTES+1),{manifestHash:manifest,masterSeed256:seed}),/exceeds limit/i);cases++;

const authority=JSON.parse(fs.readFileSync('docs/parallel/V2_CENTRAL_AUTHORITY_MAP.json','utf8'));
assert.equal(authority.singleWriterLaw,true);assert.equal(authority.duplicateAuthorityPolicy,'FAIL_CLOSED');
for(const [name,entry] of Object.entries(authority.authorities)){assert.equal(entry.owner,'CONVERGENCE_OWNER',`${name} central authority drift`);assert.equal(entry.mode,'SINGLE_PRIMARY',`${name} lost single-primary law`);cases+=2;}

console.log(JSON.stringify({status:'PASS',suite:'v2-determinism-persistence-security-falsification',baseSha:BASE_SHA,baseTree:BASE_TREE,cases,determinismWitnesses:4,repetitions:2,productionWrites:0}));
