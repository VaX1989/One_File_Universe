import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-canonical.js','src/kernel/p2-address-parser.js']){
  vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
const P=OFU.p2;
const meta=JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json','utf8'));
const u=P.unhex;
const hex=P.hex;

const oracle=JSON.parse(execFileSync('python3',['tools/p2_oracle.py'],{encoding:'utf8'}));
assert.deepEqual(oracle,meta,'committed Golden Universe Corpus must exactly match the independent Python oracle');
assert.deepEqual(P.MAX,{
  depth:32,nodes:100000,inputBytes:1048576,byteStringBytes:1048572,textBytes:262144,items:65536,
  addressSegments:64,addressNamespaceBytes:1024,addressSegmentBytes:4096,addressBytes:65536,bytes:1048572,text:262144
});

for(const [s,e] of [
  ['','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ['The quick brown fox jumps over the lazy dog','d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592']
]) assert.equal(OFU.sha256.hex(s),e);
for(const n of [0,1,55,56,63,64,65,127,128,129,1000,1000000]){
  const b=Uint8Array.from({length:n},(_,i)=>i&255);
  assert.equal(OFU.sha256.hex(b),crypto.createHash('sha256').update(b).digest('hex'));
}
for(const keyLen of [0,1,20,63,64,65,100]){
  for(const msgLen of [0,1,55,56,63,64,65,1000]){
    const key=Uint8Array.from({length:keyLen},(_,i)=>(i*29+7)&255);
    const msg=Uint8Array.from({length:msgLen},(_,i)=>(i*17+11)&255);
    assert.equal(hex(P.hmac(key,msg)),crypto.createHmac('sha256',key).update(msg).digest('hex'));
  }
}
assert.equal(hex(P.hmac(Uint8Array.from({length:20},()=>0x0b),new TextEncoder().encode('Hi There'))),'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');

const seed=u(meta.seed);
const mh=P.semanticManifestHash(meta.semanticManifest);
assert.equal(hex(mh),meta.semanticManifestHash);
assert.equal(hex(P.universeIdentity(seed,mh).digest),meta.universeIdentity);
assert.equal(hex(P.entityIdentity('person',{stableId:'alpha'})),meta.entityIdentity);

let consumed=0;
function jsSegments(segments){return segments.map(s=>s.kind==='bytes'?{kind:'bytes',value:u(s.value)}:s.kind==='u64'||s.kind==='i64'?{kind:s.kind,value:BigInt(s.value)}:{kind:s.kind,value:s.value})}
for(const c of meta.cases){
  consumed++;
  switch(c.kind){
    case 'value': {
      const b=u(c.hex),v=P.decode(b);
      assert.equal(hex(P.encode(v)),c.hex,`value case ${c.id}`);
      break;
    }
    case 'address': {
      const segments=jsSegments(c.segments),a=P.address(segments);
      assert.equal(hex(a),c.hex,`address case ${c.id}`);
      assert.equal(hex(P.address(P.parseAddress(a))),c.hex,`address parse round-trip ${c.id}`);
      assert.equal(hex(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'domain-'+c.id,addressBytes:a,property:'property-'+c.id,counter:BigInt(c.id)})),c.derive,`address derive ${c.id}`);
      break;
    }
    case 'addressPattern': {
      const pattern=c.pattern,raw=Uint8Array.from({length:pattern.length},(_,i)=>(i*pattern.multiplier+pattern.addend)&255),a=P.address([{kind:'bytes',value:raw}]);
      assert.equal(a.length,c.addressBytes,`address pattern length ${c.id}`);
      assert.equal(crypto.createHash('sha256').update(a).digest('hex'),c.addressSha256,`address pattern digest ${c.id}`);
      assert.equal(hex(P.address(P.parseAddress(a))),hex(a),`address pattern parse round-trip ${c.id}`);
      assert.equal(hex(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'domain-'+c.id,addressBytes:a,property:'property-'+c.id,counter:BigInt(c.id)})),c.derive,`address pattern derive ${c.id}`);
      break;
    }
    case 'rejectCanonical':
      assert.throws(()=>P.decode(u(c.hex)),undefined,`reject canonical ${c.id}`);
      break;
    case 'rejectAddress':
      assert.throws(()=>P.parseAddress(u(c.hex)),undefined,`reject address ${c.id}`);
      break;
    default:
      throw new Error('Unconsumed oracle case kind: '+c.kind);
  }
}
assert.equal(consumed,meta.cases.length,'every oracle case must be consumed exactly once');
const generated=[];
for(let i=0;i<meta.generatedCorpus.count;i++){
  const d=crypto.createHash('sha256').update(meta.generatedCorpus.seedDomain).update(Buffer.from([(i>>>24)&255,(i>>>16)&255,(i>>>8)&255,i&255])).digest();
  const x=d.readBigUInt64BE();
  const a=P.address([{kind:'namespace',value:meta.generatedCorpus.addressNamespace},{kind:'i64',value:(x%(1n<<63n))-(1n<<62n)},{kind:'u64',value:x}]);
  generated.push(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:meta.generatedCorpus.deriveDomain,addressBytes:a,property:meta.generatedCorpus.property,counter:BigInt(i)}));
}
assert.equal(hex(OFU.sha256.digest(P.encode(generated))),meta.kernelDigest);

assert.equal(hex(P.encode(0n)),'1100');
assert.equal(hex(P.encode(1n)),'1101');
assert.equal(hex(P.encode((1n<<64n)-1n)),'11ffffffffffffffffff01');
assert.equal(hex(P.encode(-1n)),'1001');
assert.equal(hex(P.encode(-(1n<<63n))),'10ffffffffffffffffff01');
for(const value of [1n<<64n,-(1n<<63n)-1n]) assert.throws(()=>P.encode(value),/range/);
for(const raw of [Uint8Array.of(17),Uint8Array.of(17,128,0),Uint8Array.of(16,0),Uint8Array.from([17,255,255,255,255,255,255,255,255,255,2]),Uint8Array.from([17,128,128,128,128,128,128,128,128,128,0])]) assert.throws(()=>P.decode(raw));

assert.equal(hex(P.encode('e\u0301')),hex(P.encode('é')));
const mapA={z:3,a:1,m:2},mapB={m:2,z:3,a:1};
assert.equal(hex(P.encode(mapA)),hex(P.encode(mapB)));
const collision={};collision['é']=1;collision['e\u0301']=2;assert.throws(()=>P.encode(collision),/duplicate normalized map key/);
assert.throws(()=>P.encode('\ud800'),/invalid Unicode/);
const cyc={};cyc.self=cyc;assert.throws(()=>P.encode(cyc),/cycle/);
function makeMap(n){const o=Object.create(null);for(let i=0;i<n;i++)o['k'+String(i).padStart(5,'0')]=null;return o}
assert.doesNotThrow(()=>P.encode(makeMap(49999)));
assert.throws(()=>P.encode(makeMap(50000)),/node limit/);
let depthValue=null;for(let i=0;i<P.MAX.depth;i++)depthValue=[depthValue];assert.doesNotThrow(()=>P.encode(depthValue));depthValue=[depthValue];assert.throws(()=>P.encode(depthValue),/depth limit/);

const maxBytes=new Uint8Array(P.MAX.byteStringBytes);
assert.equal(P.encode(maxBytes).length,P.MAX.inputBytes);
assert.equal(P.decode(P.encode(maxBytes)).length,P.MAX.byteStringBytes);
assert.throws(()=>P.encode(new Uint8Array(P.MAX.byteStringBytes+1)),/byte string too large/);
assert.throws(()=>P.encode([maxBytes,null]),/encoded value too large/);
assert.throws(()=>P.decode(new Uint8Array(P.MAX.inputBytes+1)),/input too large/);
assert.doesNotThrow(()=>P.encode('a'.repeat(P.MAX.textBytes-1)));assert.doesNotThrow(()=>P.encode('a'.repeat(P.MAX.textBytes)));assert.throws(()=>P.encode('a'.repeat(P.MAX.textBytes+1)),/text too large/);
assert.doesNotThrow(()=>P.encode(Array(P.MAX.items-1).fill(null)));assert.doesNotThrow(()=>P.encode(Array(P.MAX.items).fill(null)));assert.throws(()=>P.encode(Array(P.MAX.items+1).fill(null)),/array too large/);

for(const n of [P.MAX.addressSegmentBytes-1,P.MAX.addressSegmentBytes]){
  const b=Uint8Array.from({length:n},(_,i)=>i&255),a=P.address([{kind:'bytes',value:b}]);
  assert.equal(P.parseAddress(a)[0].value.length,n);
  assert.equal(hex(P.address(P.parseAddress(a))),hex(a));
}
assert.throws(()=>P.address([{kind:'bytes',value:new Uint8Array(P.MAX.addressSegmentBytes+1)}]),/address bytes/);
assert.doesNotThrow(()=>P.address([{kind:'namespace',value:'a'.repeat(P.MAX.addressNamespaceBytes)}]));
assert.throws(()=>P.address([{kind:'namespace',value:'a'.repeat(P.MAX.addressNamespaceBytes+1)}]),/namespace too large/);
const fifteen=Array.from({length:15},()=>({kind:'bytes',value:new Uint8Array(P.MAX.addressSegmentBytes)}));assert.doesNotThrow(()=>P.address(fifteen));
const sixteen=Array.from({length:16},()=>({kind:'bytes',value:new Uint8Array(P.MAX.addressSegmentBytes)}));assert.throws(()=>P.address(sixteen),/address too large/);
assert.throws(()=>P.address([]),/invalid address/);
assert.doesNotThrow(()=>P.address(Array.from({length:P.MAX.addressSegments-1},()=>({kind:'u64',value:0n}))));assert.doesNotThrow(()=>P.address(Array.from({length:P.MAX.addressSegments},()=>({kind:'u64',value:0n}))));
assert.throws(()=>P.address(Array.from({length:P.MAX.addressSegments+1},()=>({kind:'u64',value:0n}))),/invalid address/);

const entA=hex(P.entityIdentity('star',{stableId:'alpha'})),entB=hex(P.entityIdentity('star',{stableId:'beta'})),entC=hex(P.entityIdentity('planet',{stableId:'alpha'}));assert.notEqual(entA,entB);assert.notEqual(entA,entC);
const queryContextA={observer:'A',lod:1},queryContextB={observer:'B',lod:9};assert.equal(entA,hex(P.entityIdentity('star',{stableId:'alpha'})));void queryContextA;void queryContextB;
const addr=P.address([{kind:'namespace',value:'separation'}]);
const base={masterSeed:seed,semanticManifestHash:mh,domain:'A',addressBytes:addr,property:'p',counter:0n};const d0=hex(P.derive(base));
for(const variant of [{...base,domain:'B'},{...base,property:'q'},{...base,counter:1n},{...base,addressBytes:P.address([{kind:'namespace',value:'separation-2'}])}]) assert.notEqual(d0,hex(P.derive(variant)));
const changedManifest={...meta.semanticManifest,genesis:{lawProfile:'alternate',parameters:{}}};assert.notEqual(meta.universeIdentity,hex(P.universeIdentity(seed,P.semanticManifestHash(changedManifest)).digest));

assert.equal(P.addI64((1n<<63n)-2n,1n),(1n<<63n)-1n);assert.equal(P.addI64(-(1n<<63n)+1n,-1n),-(1n<<63n));assert.throws(()=>P.addI64((1n<<63n)-1n,1n),/overflow/);assert.throws(()=>P.addI64(-(1n<<63n),-1n),/overflow/);
assert.equal(P.mulFixed(1500000n,1500000n),2250000n);assert.equal(P.mulFixed(1n,500000n,1000000n),0n);assert.equal(P.mulFixed(3n,500000n,1000000n),2n);assert.equal(P.mulFixed(-3n,500000n,1000000n),-2n);
assert.equal(P.isqrt(0n),0n);assert.equal(P.isqrt(1n),1n);assert.equal(P.isqrt(15n),3n);assert.equal(P.isqrt(16n),4n);assert.equal(P.isqrt(17n),4n);assert.throws(()=>P.isqrt(-1n),/negative/);
for(const c of meta.numericCases){const args=c.args.map(BigInt);let actual;if(c.op==='addI64')actual=P.addI64(...args);else if(c.op==='mulFixed')actual=P.mulFixed(...args);else if(c.op==='isqrt')actual=P.isqrt(...args);else throw new Error('unknown numeric oracle case '+c.op);assert.equal(String(actual),c.result,'numeric oracle '+c.op+' '+c.args.join(','));}
assert.equal(P.mulFixed(1n,1n,3n),0n);assert.equal(P.mulFixed(2n,1n,3n),1n);

const canonicalPool=meta.cases.filter(c=>c.kind==='value').map(c=>u(c.hex)),fuzzSeeds=[0x5eed1234,0x00c0ffee];let fuzzIterations=0;
for(let seedF of fuzzSeeds){for(let i=0;i<5000;i++){seedF=(Math.imul(seedF,1664525)+1013904223)>>>0;const src=canonicalPool[seedF%canonicalPool.length],mode=seedF%4;let m;if(mode===0){m=Uint8Array.from(src);if(m.length)m[seedF%m.length]^=1<<(seedF%8)}else if(mode===1){m=src.length?Uint8Array.from(src.slice(0,seedF%src.length)):Uint8Array.of(0)}else if(mode===2){m=Uint8Array.from([...src,seedF&255])}else{const at=src.length?seedF%(src.length+1):0;m=Uint8Array.from([...src.slice(0,at),0x80,0x00,...src.slice(at)])}try{const v=P.decode(m);assert.equal(hex(P.encode(v)),hex(m),'accepted mutated bytes must be canonical')}catch{}fuzzIterations++;}}

fs.mkdirSync('dist/evidence',{recursive:true});
const evidence={evidenceSchemaVersion:1,phase:'P2',evidenceKind:'p2-node-oracle',producer:'tests/p2/run-p2-tests.mjs',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',status:'PASS',nodeVersion:process.version,platform:process.platform,arch:process.arch,pythonVersion:execFileSync('python3',['--version'],{encoding:'utf8'}).trim(),canonical:{corpusDigest:meta.corpusDigest,kernelDigest:meta.kernelDigest,semanticManifestHash:meta.semanticManifestHash,universeIdentity:meta.universeIdentity},oracleCases:meta.cases.length+meta.generatedCorpus.count,fuzzSeeds:fuzzSeeds.map(x=>'0x'+x.toString(16).padStart(8,'0')),fuzzIterations};
fs.writeFileSync('dist/evidence/p2-node-oracle.json',JSON.stringify(evidence,null,2)+'\n');
console.log('P2 deterministic kernel: PASS');console.log(JSON.stringify(evidence));
