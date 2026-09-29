import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const p2=JSON.parse(fs.readFileSync('conformance/iw0/p2-vectors.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('conformance/iw0/manifest.json','utf8'));
const nativeSource='native/p2-core/ofu_p2_native.cpp';
const wrapperSource='native/cabi/ofu_p2_cabi.cpp';
const hostSource='native/cabi/microhost.c';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-cabi-p2-'));
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
    return'M'+es.length+':'+es.map(([k,v])=>hexText(k)+':'+wireValue(v)).join('');
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
function customMapCollision(){return'M2:'+hexText('é')+':I1;'+hexText('e\u0301')+':I2;'}
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
function buildCommands(){
  const commands=[],addresses=new Map();
  for(const c of p2.positive_canonical_values){
    const w=wireValue(corpusValue(c.input));
    commands.push('ENC '+w,'DEC '+c.expected_hex);
  }
  for(const c of p2.malformed_canonical_bytes)commands.push('DEC '+c.input_hex);
  for(const c of p2.positive_addresses){
    const wire=wireValue(c.segments.map(segmentValue));
    commands.push('ADDR '+wire,'PARSEADDR '+c.expected_hex);
    const d=c.derive;
    commands.push('DERIVE '+p2.seed_hex+' '+p2.semantic_manifest_hash+' '+hexText(d.domain)+' '+c.expected_hex+' '+hexText(d.property)+' '+d.counter);
    addresses.set(c.id,c.expected_hex);
  }
  for(const c of p2.malformed_addresses)commands.push('PARSEADDR '+c.input_hex);
  commands.push('MH '+wireValue(p2.semantic_manifest));
  commands.push('UNIVERSE '+p2.seed_hex+' '+p2.semantic_manifest_hash);
  for(const c of p2.identity_cases)commands.push('ENTITY '+c.universe_identity+' '+hexText(c.namespace)+' '+wireValue(corpusValue(c.stable_key)));
  for(const c of p2.derivation_separation)commands.push('DERIVE '+p2.seed_hex+' '+p2.semantic_manifest_hash+' '+hexText(c.domain)+' '+addresses.get(c.address_ref)+' '+hexText(c.property)+' '+c.counter);

  for(const c of p2.generated_rejections){
    const p=c.pattern;
    if(p.kind==='map-normalization-collision')commands.push('ENC '+customMapCollision());
    else if(p.kind==='integer')commands.push('ENC I'+p.decimal+';');
    else if(p.kind==='nested-array-depth')commands.push('ENC '+nested(p.depth));
    else if(p.kind==='map-null-pairs')commands.push('ENC '+mapNullPairs(p.pairs));
    else if(p.kind==='zero-bytes')commands.push('ENC B'+('00'.repeat(p.length))+';');
    else if(p.kind==='ascii-text')commands.push('ENC S'+('61'.repeat(p.length))+';');
    else if(p.kind==='null-array')commands.push('ENC '+nullArray(p.length));
    else if(p.kind==='namespace')commands.push('ADDR '+wireValue([{kind:'namespace',value:'a'.repeat(p.length)}]));
    else if(p.kind==='bytes')commands.push('ADDR '+wireValue([{kind:'bytes',value:Buffer.alloc(p.length)}]));
    else if(p.kind==='manifest-mutation')commands.push('MH '+wireValue(mutateManifest(p.mutation)));
    else throw new Error('unhandled rejection '+p.kind);
  }

  for(const [cmd] of [
    ['ADD 9223372036854775806 1'],['ADD -9223372036854775807 -1'],
    ['MUL 1500000 1500000 1000000'],['MUL 1 1 3'],['MUL 2 1 3'],['MUL 1 1 2'],
    ['MUL 3 1 2'],['MUL -3 1 2'],['ISQRT 0'],['ISQRT 1'],['ISQRT 15'],['ISQRT 16'],
    ['ISQRT 17'],['ISQRT 18446744073709551615']
  ])commands.push(cmd);
  commands.push('ADD 9223372036854775807 1','ADD -9223372036854775808 -1','MUL 9223372036854775807 9223372036854775807 1','ISQRT 18446744073709551616');
  commands.push('ENC S65cc81;','DEC 2102c328','DEC 210365cc81','ENC Scdb8;');
  return commands;
}

function has(cmd){return spawnSync(cmd,['--version'],{encoding:'utf8'}).status===0}
const families=[
  {name:'gcc',cxx:'g++',cc:'gcc'},
  {name:'clang',cxx:'clang++',cc:'clang'}
].filter(f=>has(f.cxx)&&has(f.cc));
assert.deepEqual(families.map(f=>f.name),['gcc','clang'],'IND-CABI-MICROHOST requires GCC/G++ and Clang/Clang++ on the governed verification runner');

function exec(cmd,args,options={}){
  const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:96*1024*1024,timeout:120000,...options});
  if(r.status!==0)throw new Error(cmd+' '+args.join(' ')+' failed ('+r.status+')\n'+r.stdout+'\n'+r.stderr);
  return r;
}
function build(f){
  const tag=f.name,direct=path.join(tmp,tag+'-native'),wrapper=path.join(tmp,tag+'-cabi.o'),host=path.join(tmp,tag+'-host.o'),micro=path.join(tmp,tag+'-microhost');
  exec(f.cxx,['-std=c++17','-O2','-Wall','-Wextra','-pedantic',nativeSource,'-o',direct]);
  exec(f.cxx,['-std=c++17','-O2','-Wall','-Wextra','-pedantic','-I','native/cabi','-c',wrapperSource,'-o',wrapper]);
  exec(f.cc,['-std=c11','-O2','-Wall','-Wextra','-pedantic','-I','native/cabi','-c',hostSource,'-o',host]);
  exec(f.cxx,[wrapper,host,'-o',micro]);
  return{...f,direct,micro};
}
function lines(bin,args,commands){
  const input=commands.join('\n')+'\n';
  const r=exec(bin,args,{input});
  const out=r.stdout.replace(/\r/g,'').trimEnd().split('\n');
  assert.equal(out.length,commands.length,bin+' transcript length');
  return out;
}

const rejectionMap=new Map([
  ['SCHEMA_VIOLATION',1],['OUT_OF_DOMAIN',2],['LIMIT_EXCEEDED',3],['NON_MINIMAL',4],
  ['OVERFLOW',5],['TRUNCATED',6],['TRAILING_BYTES',7],['UNKNOWN_TAG',8],
  ['NON_CANONICAL_ORDER',9],['DUPLICATE_KEY',10],['DUPLICATE_NORMALIZED_KEY',11],
  ['NON_NFC',12],['UNSUPPORTED_VERSION',13],['NON_CANONICAL',14],['INVALID_UTF8',15],
  ['INTERNAL',255]
]);

const commands=buildCommands();
assert.ok(commands.length>100,'full frozen P2/Core command corpus must cross the C ABI');
const results=[];
try{
  for(const family of families){
    const b=build(family);
    const self=exec(b.micro,['--self-test']).stdout.trim();
    assert.equal(self,'OFU_P2_CABI_SELF_TEST=PASS',family.name+' ABI misuse/ownership self-test');

    const direct=lines(b.direct,[],commands);
    const viaAbi=lines(b.micro,[],commands);
    assert.deepEqual(viaAbi,direct,family.name+' C ABI transcript must equal direct Native P2 transcript');

    const meta=lines(b.micro,['--meta'],commands);
    let rejected=0,ok=0;
    for(let i=0;i<meta.length;i++){
      const m=/^META (-?\d+) (-?\d+) (\d+) (\d+)\|(.*)$/.exec(meta[i]);
      assert.ok(m,'bad metadata line '+meta[i].slice(0,160));
      const status=Number(m[1]),rejection=Number(m[2]),written=Number(m[3]),required=Number(m[4]),transcript=m[5];
      assert.equal(transcript,direct[i],'metadata transcript '+i);
      assert.equal(written,Buffer.byteLength(transcript),'bytes_written '+i);
      assert.equal(required,written,'bytes_required '+i);
      if(transcript.startsWith('ERR ')){
        rejected++;
        const code=transcript.slice(4);
        assert.equal(status,3,'rejection status '+code);
        assert.equal(rejection,rejectionMap.get(code),'structured rejection class '+code);
      }else{
        ok++;
        assert.ok(transcript==='OK'||transcript.startsWith('OK '),'unexpected success transcript');
        assert.equal(status,0,'success status '+i);
        assert.equal(rejection,0,'success rejection class '+i);
      }
    }
    results.push({compiler_family:family.name,direct,viaAbi,ok,rejected,self_test:true});
  }
  assert.deepEqual(results[1].direct,results[0].direct,'GCC/Clang direct Native P2 transcript diverged');
  assert.deepEqual(results[1].viaAbi,results[0].viaAbi,'GCC/Clang C ABI transcript diverged');
  assert.equal(results[0].rejected,results[1].rejected);
  assert.ok(results[0].rejected>=40,'expected broad malformed/rejection coverage through ABI');

  const evidence={
    schema:'ofu-ind-cabi-microhost-evidence-v1',
    prompt_id:'IND-CABI-MICROHOST',
    status:'PASS',
    source_commit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',
    native_dependency_head:'9311307326adc4bc5a72fe74030b8eb038524fb9',
    corpus_digest:manifest.corpus_digest,
    corpus_revision:manifest.corpus_revision,
    command_count:commands.length,
    success_count:results[0].ok,
    rejection_count:results[0].rejected,
    compiler_families:results.map(x=>x.compiler_family),
    direct_native_vs_cabi_transcript_equal:true,
    cross_compiler_transcript_equal:true,
    abi_version:1,
    caller_owned_output_buffer:true,
    heap_ownership_crosses_abi:false,
    opaque_handles:false,
    no_partial_write_on_small_buffer:true,
    explicit_length_and_version:true,
    structured_rejection_classes:true,
    exception_containment_self_test:true,
    runtime_ported:false,
    broad_abi_frozen:false,
    authority:'FROZEN_P2_CORE_CABI_FEASIBILITY_ONLY'
  };
  fs.mkdirSync('dist/evidence/industrialization',{recursive:true});
  fs.writeFileSync('dist/evidence/industrialization/ind-cabi-microhost.json',JSON.stringify(evidence,null,2)+'\n');
  console.log('IND-CABI-MICROHOST frozen-core C ABI parity: PASS');
  console.log(JSON.stringify(evidence));
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
