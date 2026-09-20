import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const p2=JSON.parse(fs.readFileSync('conformance/iw0/p2-vectors.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('conformance/iw0/manifest.json','utf8'));
const source='native/p2-core/ofu_p2_native.cpp';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-native-p2-'));
const hexText=s=>Buffer.from(s,'utf8').toString('hex');

function wireValue(n){
  if(n===null)return'N';
  if(typeof n==='boolean')return n?'T':'F';
  if(typeof n==='bigint'||typeof n==='number')return'I'+String(n)+';';
  if(typeof n==='string')return'S'+hexText(n)+';';
  if(n instanceof Uint8Array||Buffer.isBuffer(n))return'B'+Buffer.from(n).toString('hex')+';';
  if(Array.isArray(n))return'A'+n.length+':'+n.map(wireValue).join('');
  if(typeof n==='object'){
    const es=Object.entries(n);
    return'M'+es.length+':'+es.map(e=>hexText(e[0])+':'+wireValue(e[1])).join('');
  }
  throw new Error('unsupported wire value');
}
function corpusValue(n){
  switch(n.kind){
    case'null':return null;
    case'bool':return n.value;
    case'int':return BigInt(n.decimal);
    case'bytes':return Buffer.from(n.hex,'hex');
    case'text':return n.value;
    case'array':return n.items.map(corpusValue);
    case'map':return Object.fromEntries(n.entries.map(e=>[e.key,corpusValue(e.value)]));
    default:throw new Error('unknown corpus kind '+n.kind);
  }
}
function segmentValue(s){
  let v=s.value;
  if(s.kind==='u64'||s.kind==='i64')v=BigInt(v);
  if(s.kind==='bytes')v=Buffer.from(v,'hex');
  return{kind:s.kind,value:v};
}
function has(cmd){return spawnSync(cmd,['--version'],{encoding:'utf8'}).status===0}
const compilers=['g++','clang++'].filter(has);
assert.deepEqual(compilers,['g++','clang++'],'IND-NATIVE-P2 requires both GCC and Clang on the governed verification runner');

function build(cxx){
  const out=path.join(tmp,cxx.replace(/\+/g,'p'));
  const r=spawnSync(cxx,['-std=c++17','-O2','-Wall','-Wextra','-pedantic',source,'-o',out],{encoding:'utf8',maxBuffer:4*1024*1024});
  if(r.status!==0)throw new Error(cxx+' compile failed\n'+r.stdout+'\n'+r.stderr);
  return out;
}
function session(bin){
  const lines=[];
  return {
    run(command){
      const r=spawnSync(bin,[],{input:command+'\n',encoding:'utf8',maxBuffer:4*1024*1024,timeout:15000});
      assert.equal(r.status,0,'native process failed: '+command.slice(0,120)+'\n'+r.stderr);
      const out=r.stdout.trim();
      assert.ok(out.startsWith('OK')||out.startsWith('ERR '),'bad native output '+out);
      lines.push(out);
      return out;
    },
    lines
  };
}
function ok(s,cmd,expected=''){
  const out=s.run(cmd);
  assert.ok(out.startsWith('OK'),cmd.slice(0,100)+' -> '+out);
  if(expected!=='')assert.equal(out,'OK '+expected);
  return out.slice(2).trim();
}
function err(s,cmd,code){
  const out=s.run(cmd);
  assert.equal(out,'ERR '+code,cmd.slice(0,100)+' rejection');
}
function customMapCollision(){
  return 'M2:'+hexText('é')+':I1;'+hexText('e\u0301')+':I2;';
}
function nested(depth){let v='N';for(let i=0;i<depth;i++)v='A1:'+v;return v}
function mapNullPairs(n){let w='M'+n+':';for(let i=0;i<n;i++)w+=hexText('k'+String(i).padStart(5,'0'))+':N';return w}
function nullArray(n){return'A'+n+':'+('N'.repeat(n))}
function clone(x){return structuredClone(x)}
function mutateManifest(kind){
  const m=clone(p2.semantic_manifest);
  if(kind==='add-unknown-field')m.browser='chromium';
  else if(kind==='delete-domains')delete m.domains;
  else if(kind==='semantic-version-2')m.semanticManifestVersion=2;
  return m;
}
function runSuite(bin){
  const s=session(bin);let positive=0,rejections=0,numeric=0;
  for(const c of p2.positive_canonical_values){
    const w=wireValue(corpusValue(c.input));
    ok(s,'ENC '+w,c.expected_hex);ok(s,'DEC '+c.expected_hex);positive++;
  }
  for(const c of p2.malformed_canonical_bytes){err(s,'DEC '+c.input_hex,c.expected_rejection);rejections++;}
  const addr=new Map();
  for(const c of p2.positive_addresses){
    const av=c.segments.map(segmentValue),wire=wireValue(av);
    ok(s,'ADDR '+wire,c.expected_hex);ok(s,'PARSEADDR '+c.expected_hex);
    const d=c.derive;
    const got=ok(s,'DERIVE '+p2.seed_hex+' '+p2.semantic_manifest_hash+' '+hexText(d.domain)+' '+c.expected_hex+' '+hexText(d.property)+' '+d.counter);
    assert.equal(got,d.expected_hex,'derive '+c.id);addr.set(c.id,c.expected_hex);positive++;
  }
  for(const c of p2.malformed_addresses){err(s,'PARSEADDR '+c.input_hex,c.expected_rejection);rejections++;}
  ok(s,'MH '+wireValue(p2.semantic_manifest),p2.semantic_manifest_hash);positive++;
  const u=ok(s,'UNIVERSE '+p2.seed_hex+' '+p2.semantic_manifest_hash);
  assert.equal(u,p2.universe_descriptor_hex+' '+p2.universe_identity);positive++;
  for(const c of p2.identity_cases){
    const got=ok(s,'ENTITY '+c.universe_identity+' '+hexText(c.namespace)+' '+wireValue(corpusValue(c.stable_key)));
    assert.equal(got,c.expected_entity_identity,'entity '+c.id);positive++;
  }
  for(const c of p2.derivation_separation){
    const got=ok(s,'DERIVE '+p2.seed_hex+' '+p2.semantic_manifest_hash+' '+hexText(c.domain)+' '+addr.get(c.address_ref)+' '+hexText(c.property)+' '+c.counter);
    assert.equal(got,c.expected_hex,'derive separation '+c.id);positive++;
  }

  for(const c of p2.generated_rejections){
    const p=c.pattern;let cmd;
    if(p.kind==='map-normalization-collision')cmd='ENC '+customMapCollision();
    else if(p.kind==='integer')cmd='ENC I'+p.decimal+';';
    else if(p.kind==='nested-array-depth')cmd='ENC '+nested(p.depth);
    else if(p.kind==='map-null-pairs')cmd='ENC '+mapNullPairs(p.pairs);
    else if(p.kind==='zero-bytes')cmd='ENC B'+('00'.repeat(p.length))+';';
    else if(p.kind==='ascii-text')cmd='ENC S'+('61'.repeat(p.length))+';';
    else if(p.kind==='null-array')cmd='ENC '+nullArray(p.length);
    else if(p.kind==='namespace')cmd='ADDR '+wireValue([{kind:'namespace',value:'a'.repeat(p.length)}]);
    else if(p.kind==='bytes')cmd='ADDR '+wireValue([{kind:'bytes',value:Buffer.alloc(p.length)}]);
    else if(p.kind==='manifest-mutation')cmd='MH '+wireValue(mutateManifest(p.mutation));
    else throw new Error('unhandled rejection '+p.kind);
    err(s,cmd,c.expected_rejection);rejections++;
  }

  const numericCases=[
    ['ADD 9223372036854775806 1','9223372036854775807'],
    ['ADD -9223372036854775807 -1','-9223372036854775808'],
    ['MUL 1500000 1500000 1000000','2250000'],
    ['MUL 1 1 3','0'],['MUL 2 1 3','1'],['MUL 1 1 2','0'],['MUL 3 1 2','2'],['MUL -3 1 2','-2'],
    ['ISQRT 0','0'],['ISQRT 1','1'],['ISQRT 15','3'],['ISQRT 16','4'],['ISQRT 17','4'],['ISQRT 18446744073709551615','4294967295']
  ];
  for(const x of numericCases){ok(s,x[0],x[1]);numeric++;}
  err(s,'ADD 9223372036854775807 1','OVERFLOW');rejections++;
  err(s,'ADD -9223372036854775808 -1','OVERFLOW');rejections++;
  err(s,'MUL 9223372036854775807 9223372036854775807 1','OVERFLOW');rejections++;
  err(s,'ISQRT 18446744073709551616','OUT_OF_DOMAIN');rejections++;

  ok(s,'ENC S65cc81;','2102c3a9');positive++;
  err(s,'DEC 2102c328','INVALID_UTF8');rejections++;
  err(s,'DEC 210365cc81','NON_NFC');rejections++;
  err(s,'ENC Scdb8;','OUT_OF_DOMAIN');rejections++;

  return{positive,rejections,numeric,transcript:s.lines};
}

try{
  const results=[];
  for(const cxx of compilers){const bin=build(cxx);const r=runSuite(bin);results.push({compiler:cxx,positive:r.positive,rejections:r.rejections,numeric:r.numeric,transcript:r.transcript});}
  assert.deepEqual(results[1].transcript,results[0].transcript,'GCC/Clang native outputs diverged');
  const evidence={
    schema:'ofu-ind-native-p2-evidence-v1',
    prompt_id:'IND-NATIVE-P2',
    status:'PASS',
    source_commit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',
    corpus_digest:manifest.corpus_digest,
    corpus_revision:manifest.corpus_revision,
    compilers:results.map(x=>x.compiler),
    positive_checks:results[0].positive,
    rejection_checks:results[0].rejections,
    numeric_checks:results[0].numeric,
    cross_compiler_transcript_equal:true,
    implementation:'native/p2-core/ofu_p2_native.cpp',
    authority:'FROZEN_P2_CORPUS_PARITY_EXPERIMENT_ONLY',
    runtime_ported:false,
    js_fallback:false,
    python_fallback:false
  };
  fs.mkdirSync('dist/evidence/industrialization',{recursive:true});
  fs.writeFileSync('dist/evidence/industrialization/ind-native-p2.json',JSON.stringify(evidence,null,2)+'\n');
  console.log('IND-NATIVE-P2 native frozen-corpus parity: PASS');
  console.log(JSON.stringify(evidence));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
