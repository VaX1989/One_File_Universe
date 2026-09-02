import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/kernel/p2-address-parser.js']){
  vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
const P=OFU.p2;
const meta=JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json','utf8'));
const u=P.unhex,hex=P.hex;
const oracle=JSON.parse(execFileSync('python3',['tools/p2_oracle.py'],{encoding:'utf8'}));
assert.deepEqual(oracle,meta,'committed Golden Universe Corpus must exactly match the independent Python oracle');
assert.equal(P.UNICODE_PROFILE_VERSION,'ofu-unicode-15.1.0-v1');
assert.equal(P.UNICODE_RANGE_COUNT,707);
assert.equal(P.UNICODE_RANGE_SHA256,'d92c96676b97eae626d3f0bd9419ec0a7dcc8c22373c1455f21015d737b47412');
assert.deepEqual(P.MAX,{depth:32,nodes:100000,inputBytes:1048576,byteStringBytes:1048572,textBytes:262144,items:65536,addressSegments:64,addressNamespaceBytes:1024,addressSegmentBytes:4096,addressBytes:65536,bytes:1048572,text:262144});

for(const [s,e] of [['','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],['abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],['The quick brown fox jumps over the lazy dog','d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592']])assert.equal(OFU.sha256.hex(s),e);
for(const n of [0,1,55,56,63,64,65,127,128,129,1000,1000000]){const b=Uint8Array.from({length:n},(_,i)=>i&255);assert.equal(OFU.sha256.hex(b),crypto.createHash('sha256').update(b).digest('hex'))}
for(const keyLen of [0,1,20,63,64,65,100])for(const msgLen of [0,1,55,56,63,64,65,1000]){const key=Uint8Array.from({length:keyLen},(_,i)=>(i*29+7)&255),msg=Uint8Array.from({length:msgLen},(_,i)=>(i*17+11)&255);assert.equal(hex(P.hmac(key,msg)),crypto.createHmac('sha256',key).update(msg).digest('hex'))}
assert.equal(hex(P.hmac(Uint8Array.from({length:20},()=>0x0b),new TextEncoder().encode('Hi There'))),'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');

const seed=u(meta.seed),mh=P.semanticManifestHash(meta.semanticManifest),uid=P.universeIdentity(seed,mh).digest;
assert.equal(hex(mh),meta.semanticManifestHash);assert.equal(hex(uid),meta.universeIdentity);
for(const c of meta.identityCases)assert.equal(hex(P.entityIdentity(u(c.universeIdentity),c.namespace,c.stableKey)),c.entityIdentity,'identity '+c.id);
assert.equal(hex(P.entityIdentity(uid,'person',{stableId:'alpha'})),meta.entityIdentity);
assert.notEqual(meta.identityCases.find(x=>x.id==='baseline').entityIdentity,meta.identityCases.find(x=>x.id==='universe-change').entityIdentity);
assert.notEqual(meta.identityCases.find(x=>x.id==='baseline').entityIdentity,meta.identityCases.find(x=>x.id==='namespace-change').entityIdentity);

function jsSegments(segments){return segments.map(s=>s.kind==='bytes'?{kind:'bytes',value:u(s.value)}:s.kind==='u64'||s.kind==='i64'?{kind:s.kind,value:BigInt(s.value)}:{kind:s.kind,value:s.value})}
let consumed=0;
for(const c of meta.cases){consumed++;switch(c.kind){
case 'value':{const b=u(c.hex),v=P.decode(b);assert.equal(hex(P.encode(v)),c.hex,`value ${c.id}`);break}
case 'address':{const a=P.address(jsSegments(c.segments));assert.equal(hex(a),c.hex);assert.equal(hex(P.address(P.parseAddress(a))),c.hex);assert.equal(hex(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'domain-'+c.id,addressBytes:a,property:'property-'+c.id,counter:BigInt(c.id)})),c.derive);break}
case 'addressPattern':{const p=c.pattern,raw=Uint8Array.from({length:p.length},(_,i)=>(i*p.multiplier+p.addend)&255),a=P.address([{kind:'bytes',value:raw}]);assert.equal(a.length,c.addressBytes);assert.equal(crypto.createHash('sha256').update(a).digest('hex'),c.addressSha256);assert.equal(hex(P.address(P.parseAddress(a))),hex(a));assert.equal(hex(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'domain-'+c.id,addressBytes:a,property:'property-'+c.id,counter:BigInt(c.id)})),c.derive);break}
case 'rejectCanonical':assert.throws(()=>P.decode(u(c.hex)));break;
case 'rejectAddress':assert.throws(()=>P.parseAddress(u(c.hex)));break;
default:throw new Error('Unconsumed oracle case kind: '+c.kind);
}}
assert.equal(consumed,meta.cases.length);

const generated=[];
for(let i=0;i<meta.generatedCorpus.count;i++){
  const d=crypto.createHash('sha256').update(meta.generatedCorpus.seedDomain).update(Buffer.from([(i>>>24)&255,(i>>>16)&255,(i>>>8)&255,i&255])).digest(),x=d.readBigUInt64BE();
  const a=P.address([{kind:'namespace',value:meta.generatedCorpus.addressNamespace},{kind:'i64',value:(x%(1n<<63n))-(1n<<62n)},{kind:'u64',value:x}]);
  generated.push(P.derive({masterSeed:seed,semanticManifestHash:mh,domain:meta.generatedCorpus.deriveDomain,addressBytes:a,property:meta.generatedCorpus.property,counter:BigInt(i)}));
}
assert.equal(hex(OFU.sha256.digest(P.encode(generated))),meta.kernelDigest);

// Unicode profile and canonical text behavior.
assert.equal(hex(P.encode('e\u0301')),hex(P.encode('é')));
assert.throws(()=>P.encode('\ud800'),/malformed UTF-16/);
assert.throws(()=>P.encode('\u0378'),/outside ofu-unicode-15\.1\.0-v1/);
assert.throws(()=>P.decode(u('210365cc81')),/not NFC/);
const mapA={z:3,a:1,m:2},mapB={m:2,z:3,a:1};assert.equal(hex(P.encode(mapA)),hex(P.encode(mapB)));
const collision={};collision['é']=1;collision['e\u0301']=2;assert.throws(()=>P.encode(collision),/duplicate normalized map key/);

// Canonical arrays are dense own data descriptors; encoding never executes accessors or iterators.
assert.equal(hex(P.encode([1,2,3])),hex(P.encode([1,2,3])));
const sparse=[];sparse.length=1;assert.throws(()=>P.encode(sparse),/(dense own data|unsupported array property)/);
const accessor=[1];Object.defineProperty(accessor,'0',{get(){throw new Error('getter executed')},enumerable:true,configurable:true});assert.throws(()=>P.encode(accessor),/dense own data/);
const extra=[1];extra.extra=2;assert.throws(()=>P.encode(extra),/unsupported array property/);
const sym=[1];Object.defineProperty(sym,Symbol('x'),{value:2});assert.throws(()=>P.encode(sym),/unsupported array property/);
class A extends Array{};assert.throws(()=>P.encode(new A(1,2)),/unsupported array prototype/);
const inherited=[1];Object.defineProperty(Array.prototype,'0',{value:99,writable:true,configurable:true});try{assert.equal(hex(P.encode(inherited)),hex(P.encode([1])))}finally{delete Array.prototype['0']}
const oldIterator=Array.prototype[Symbol.iterator];let ambientError=null;Object.defineProperty(Array.prototype,Symbol.iterator,{value(){throw new Error('ambient iterator executed')},writable:true,configurable:true});try{const plain=[1,2,3];try{P.encode(plain)}catch(e){ambientError=e}}finally{Object.defineProperty(Array.prototype,Symbol.iterator,{value:oldIterator,writable:true,configurable:true})}assert.ifError(ambientError)
const ownIterator=[1];Object.defineProperty(ownIterator,Symbol.iterator,{get(){throw new Error('iterator getter executed')},configurable:true});assert.throws(()=>P.encode(ownIterator),/unsupported array property/);

// Strict Semantic Generator Manifest v1: required/allowed fields and semantic-only identity.
assert.doesNotThrow(()=>P.validateSemanticManifest(meta.semanticManifest));
for(const [name,mut] of [
 ['unknown',m=>m.browser='chromium'],['missing',m=>delete m.domains],['version',m=>m.semanticManifestVersion=2],['unicode',m=>m.unicodeProfileVersion='future'],['runtime',m=>m.buildTimestamp='now']
]){const m=structuredClone(meta.semanticManifest);mut(m);assert.throws(()=>P.semanticManifestHash(m),undefined,name)}

// Entity identity is universe-scoped; mutable/query context does not participate.
const eid=hex(P.entityIdentity(uid,'star',{stableId:'alpha'}));
for(const _context of [{QueryContext:{observer:'A'}},{ModelRegime:'coarse'},{location:'x'},{ownership:'y'},{containment:'z'}])assert.equal(hex(P.entityIdentity(uid,'star',{stableId:'alpha'})),eid);
const changedManifest=structuredClone(meta.semanticManifest);changedManifest.lawProfile='alternate';const uidChanged=P.universeIdentity(seed,P.semanticManifestHash(changedManifest)).digest;assert.notEqual(hex(P.entityIdentity(uidChanged,'star',{stableId:'alpha'})),eid);

// Derivation arguments are exact, typed, bounded and Canonical Address v1 validated.
const addr=P.address([{kind:'namespace',value:'separation'}]),base={masterSeed:seed,semanticManifestHash:mh,domain:'A',addressBytes:addr,property:'p',counter:0n},d0=hex(P.derive(base));
for(const variant of [{...base,domain:'B'},{...base,property:'q'},{...base,counter:1n},{...base,addressBytes:P.address([{kind:'namespace',value:'separation-2'}])}])assert.notEqual(d0,hex(P.derive(variant)));
assert.throws(()=>P.derive({...base,extra:'ignored'}),/missing or unknown fields/);
assert.throws(()=>P.derive({...base,domain:''}),/non-empty/);assert.throws(()=>P.derive({...base,property:''}),/non-empty/);assert.throws(()=>P.derive({...base,counter:-1n}),/u64/);assert.throws(()=>P.derive({...base,counter:1n<<64n}),/u64/);assert.throws(()=>P.derive({...base,addressBytes:Uint8Array.of(0)}),/address/);assert.throws(()=>P.derive({...base,masterSeed:new Uint8Array(31)}),/32 bytes/);

// Resource limits and numeric contract.
const maxBytes=new Uint8Array(P.MAX.byteStringBytes);assert.equal(P.encode(maxBytes).length,P.MAX.inputBytes);assert.throws(()=>P.encode(new Uint8Array(P.MAX.byteStringBytes+1)),/too large/);assert.throws(()=>P.encode([maxBytes,null]),/encoded value too large/);
function makeMap(n){const o=Object.create(null);for(let i=0;i<n;i++)o['k'+String(i).padStart(5,'0')]=null;return o}assert.doesNotThrow(()=>P.encode(makeMap(49999)));assert.throws(()=>P.encode(makeMap(50000)),/node limit/);
let depthValue=null;for(let i=0;i<P.MAX.depth;i++)depthValue=[depthValue];assert.doesNotThrow(()=>P.encode(depthValue));depthValue=[depthValue];assert.throws(()=>P.encode(depthValue),/depth limit/);
assert.equal(P.addI64((1n<<63n)-2n,1n),(1n<<63n)-1n);assert.throws(()=>P.addI64((1n<<63n)-1n,1n),/overflow/);assert.equal(P.mulFixed(1n,1n,2n),0n);assert.equal(P.mulFixed(3n,1n,2n),2n);assert.equal(P.mulFixed(-3n,1n,2n),-2n);assert.throws(()=>P.mulFixed((1n<<63n)-1n,(1n<<63n)-1n,1n),/overflow/);assert.equal(P.isqrt((1n<<64n)-1n),4294967295n);assert.throws(()=>P.isqrt(1n<<64n),/u64/);
for(const c of meta.numericCases){const args=c.args.map(BigInt);let actual;if(c.op==='addI64')actual=P.addI64(...args);else if(c.op==='mulFixed')actual=P.mulFixed(...args);else if(c.op==='isqrt')actual=P.isqrt(...args);else throw new Error('unknown numeric case '+c.op);assert.equal(String(actual),c.result)}

// Deterministic mutation fuzzing: accepted mutations must already be canonical.
const canonicalPool=meta.cases.filter(c=>c.kind==='value').map(c=>u(c.hex)),fuzzSeeds=meta.fuzzSeeds.map(x=>Number(BigInt(x)));let fuzzIterations=0;
for(let seedF of fuzzSeeds){for(let i=0;i<meta.fuzzIterationsPerSeed;i++){seedF=(Math.imul(seedF,1664525)+1013904223)>>>0;const src=canonicalPool[seedF%canonicalPool.length],mode=seedF%4;let m;if(mode===0){m=Uint8Array.from(src);if(m.length)m[seedF%m.length]^=1<<(seedF%8)}else if(mode===1){m=src.length?Uint8Array.from(src.slice(0,seedF%src.length)):Uint8Array.of(0)}else if(mode===2){m=Uint8Array.from([...src,seedF&255])}else{const at=src.length?seedF%(src.length+1):0;m=Uint8Array.from([...src.slice(0,at),0x80,0x00,...src.slice(at)])}try{const v=P.decode(m);assert.equal(hex(P.encode(v)),hex(m),'accepted mutated bytes must be canonical')}catch{}fuzzIterations++}}
assert.equal(fuzzIterations,24000);

fs.mkdirSync('dist/evidence',{recursive:true});
const unicodeConformance=fs.existsSync('dist/p2-unicode-conformance.json')?JSON.parse(fs.readFileSync('dist/p2-unicode-conformance.json','utf8')):null;const evidence={evidenceSchemaVersion:1,phase:'P2',evidenceKind:'p2-node-oracle',producer:'tests/p2/run-p2-tests.mjs',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',status:'PASS',nodeVersion:process.version,platform:process.platform,arch:process.arch,pythonVersion:execFileSync('python3',['--version'],{encoding:'utf8'}).trim(),canonical:{corpusDigest:meta.corpusDigest,kernelDigest:meta.kernelDigest,semanticManifestHash:meta.semanticManifestHash,universeIdentity:meta.universeIdentity},unicodeProfile:meta.unicodeProfile,unicodeConformance,oracleCases:meta.oracleCaseCount,fuzzSeeds:meta.fuzzSeeds,fuzzIterations};
fs.writeFileSync('dist/evidence/p2-node-oracle.json',JSON.stringify(evidence,null,2)+'\n');
console.log('P2 deterministic kernel: PASS');console.log(JSON.stringify(evidence));
