import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/kernel/p2-address-parser.js','src/temporal/p4-temporal.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
const P=OFU.p2,T=OFU.p4;
const corpus=JSON.parse(fs.readFileSync('security/iw0/ind-sec-b/hostile-input-corpus-v1.json','utf8'));
const meta=JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json','utf8'));
const executed=new Set();
const failures=[];
const mark=fp=>{executed.add(fp);};
const reject=(fp,fn)=>{let rejected=false;try{fn()}catch{rejected=true}if(!rejected)failures.push(fp+': hostile input was accepted');mark(fp);};
const hex=b=>Buffer.from(b).toString('hex');
const unhex=s=>Uint8Array.from(s.match(/../g).map(x=>Number.parseInt(x,16)));
function uleb(value){let x=BigInt(value);const out=[];do{let b=Number(x&127n);x>>=7n;if(x)b|=128;out.push(b)}while(x);return Uint8Array.from(out)}
function cat(...parts){return Uint8Array.from(parts.flatMap(p=>[...p]))}
function nested(depth){let v=null;for(let i=0;i<depth;i++)v=[v];return v}
function id(byte){const x=new Uint8Array(32);x[31]=byte;return x}
function cloneManifest(){return structuredClone(meta.semanticManifest)}

reject('SEC-B-P2-CBV-INPUT-BYTES',()=>P.decode(new Uint8Array(P.MAX.inputBytes+1)));
reject('SEC-B-P2-CBV-UNKNOWN-TAG',()=>P.decode(Uint8Array.of(0xff)));
reject('SEC-B-P2-CBV-VARINT-OVERFLOW',()=>P.decode(Uint8Array.from([P.T.UINT,...Array(10).fill(0x80)])));
reject('SEC-B-P2-CBV-NONMINIMAL-VARINT',()=>P.decode(Uint8Array.of(P.T.UINT,0x80,0x00)));
reject('SEC-B-P2-CBV-NONCANONICAL-SINT',()=>P.decode(Uint8Array.of(P.T.SINT,0x00)));
reject('SEC-B-P2-CBV-BYTESTRING-LENGTH',()=>P.decode(cat(Uint8Array.of(P.T.BYTES),uleb(BigInt(P.MAX.byteStringBytes)+1n))));
reject('SEC-B-P2-CBV-ARRAY-COUNT',()=>P.decode(cat(Uint8Array.of(P.T.ARRAY),uleb(BigInt(P.MAX.items)+1n))));
reject('SEC-B-P2-CBV-DEPTH',()=>P.encode(nested(P.MAX.depth+1)));
const accessor={};Object.defineProperty(accessor,'x',{enumerable:true,get(){return 1}});reject('SEC-B-P2-CBV-ACCESSOR',()=>P.encode(accessor));
const collision={};collision['é']=1;collision['e\u0301']=2;reject('SEC-B-P2-CBV-NORMALIZED-KEY-COLLISION',()=>P.encode(collision));
reject('SEC-B-P2-UNICODE-INVALID-UTF8',()=>P.decode(Uint8Array.of(P.T.TEXT,1,0xff)));
reject('SEC-B-P2-UNICODE-NONNFC-WIRE',()=>P.decode(Uint8Array.of(P.T.TEXT,3,0x65,0xcc,0x81)));
reject('SEC-B-P2-UNICODE-SURROGATE',()=>P.encode('\ud800'));
assert.equal(P.encode(new Uint8Array(P.MAX.byteStringBytes)).length,P.MAX.inputBytes);
assert.doesNotThrow(()=>P.encode(nested(P.MAX.depth)));

const address0=unhex(meta.cases.find(x=>x.kind==='address'&&x.id===0).hex);
const badVersion=Uint8Array.from(address0);badVersion[4]=2;reject('SEC-B-P2-ADDRESS-VERSION',()=>P.parseAddress(badVersion));
reject('SEC-B-P2-ADDRESS-SEGMENT-COUNT',()=>P.parseAddress(cat(Uint8Array.from([79,70,85,65,1]),uleb(65))));
reject('SEC-B-P2-ADDRESS-UNKNOWN-TAG',()=>P.parseAddress(Uint8Array.from([79,70,85,65,1,1,0xff])));
reject('SEC-B-P2-ADDRESS-TRAILING',()=>P.parseAddress(Uint8Array.from([...address0,0])));
reject('SEC-B-P2-ADDRESS-NAMESPACE-LENGTH',()=>P.parseAddress(cat(Uint8Array.from([79,70,85,65,1,1,1]),uleb(1025))));
assert.doesNotThrow(()=>P.address(Array.from({length:P.MAX.addressSegments},(_,i)=>({kind:'u64',value:BigInt(i)}))));
assert.doesNotThrow(()=>P.address([{kind:'namespace',value:'a'.repeat(P.MAX.addressNamespaceBytes)}]));
assert.doesNotThrow(()=>P.address([{kind:'bytes',value:new Uint8Array(P.MAX.addressSegmentBytes)}]));

const manifestVersion=cloneManifest();manifestVersion.semanticManifestVersion=2;reject('SEC-B-P2-MANIFEST-VERSION',()=>P.semanticManifestHash(manifestVersion));
const manifestExtra=cloneManifest();manifestExtra.extra='x';reject('SEC-B-P2-MANIFEST-UNKNOWN-FIELD',()=>P.semanticManifestHash(manifestExtra));
reject('SEC-B-P2-IDENTITY-LENGTH',()=>P.universeIdentity(new Uint8Array(31),new Uint8Array(32)));
const seed=unhex(meta.seed),manifestHash=P.semanticManifestHash(meta.semanticManifest);
reject('SEC-B-P2-DERIVE-COUNTER',()=>P.derive({masterSeed:seed,semanticManifestHash:manifestHash,domain:'d',addressBytes:address0,property:'p',counter:1n<<64n}));
reject('SEC-B-P2-DERIVE-ADDRESS',()=>P.derive({masterSeed:seed,semanticManifestHash:manifestHash,domain:'d',addressBytes:Uint8Array.of(0),property:'p',counter:0n}));
reject('SEC-B-P2-NUMERIC-ADD-OVERFLOW',()=>P.addI64((1n<<63n)-1n,1n));
reject('SEC-B-P2-NUMERIC-MUL-OVERFLOW',()=>P.mulFixed((1n<<63n)-1n,(1n<<63n)-1n,1n));
reject('SEC-B-P2-NUMERIC-SQRT-RANGE',()=>P.isqrt(1n<<64n));

const universe=Uint8Array.from({length:32},(_,i)=>i+1),lineage=T.lineageId(universe,null,'ind-sec-b'),entity=P.entityIdentity(universe,'security',{id:'target'});
const command=(seconds,op,{micros=0n,universeIdentity=universe,lineageId=lineage,targets=[entity],causes=[],version=1n,preconditionStateDigest=null}={})=>({
  universeIdentity,lineageId,time:{seconds:BigInt(seconds),micros},type:'core.field.set',version,operationKey:op,targets,payload:{field:'v',value:op},causes,preconditionStateDigest
});
reject('SEC-B-P4-TIME-MICROS',()=>T.canonicalTime({seconds:0n,micros:1000000n}));
reject('SEC-B-P4-EVENT-VERSION',()=>T.canonicalEvent(command(1,'bad-version',{version:0n})));
reject('SEC-B-P4-EVENT-TARGET-COUNT',()=>T.canonicalEvent(command(1,'targets',{targets:Array.from({length:65},(_,i)=>id(i+1))})));
reject('SEC-B-P4-EVENT-CAUSE-COUNT',()=>T.canonicalEvent(command(1,'causes',{causes:Array.from({length:65},(_,i)=>id(i+1))})));
reject('SEC-B-P4-EVENT-DUPLICATE-TARGET',()=>T.canonicalEvent(command(1,'dupe',{targets:[entity,entity]})));
reject('SEC-B-P4-HISTORY-COUNT',()=>T.sortEvents(new Array(T.MAX_HISTORICAL_EVENTS+1)));
const otherUniverse=Uint8Array.from(universe);otherUniverse[0]^=0xff;
const wrongUniverse=T.canonicalEvent(command(1,'wrong-u',{universeIdentity:otherUniverse}));reject('SEC-B-P4-CROSS-UNIVERSE',()=>T.replay({universeIdentity:universe,lineage,events:[wrongUniverse]}));
const otherLineage=T.lineageId(universe,null,'other'),wrongLineage=T.canonicalEvent(command(1,'wrong-l',{lineageId:otherLineage}));reject('SEC-B-P4-CROSS-LINEAGE',()=>T.replay({universeIdentity:universe,lineage,events:[wrongLineage]}));
let world=T.createLiveWorld({universeIdentity:universe,lineage});world=T.commit({world,command:command(10,'frontier')}).world;reject('SEC-B-P4-FRONTIER-RETROACTIVE',()=>T.commit({world,command:command(9,'retro')}));
const fakePre=id(0xee);reject('SEC-B-P4-PRECONDITION',()=>T.commit({world:T.createLiveWorld({universeIdentity:universe,lineage}),command:command(1,'pre',{preconditionStateDigest:fakePre})}));
reject('SEC-B-P4-TRANSITION-SCHEMA',()=>T.transitionContractDigest({...T.CORE_TRANSITION_DESCRIPTOR,transitionContractSchemaVersion:2n}));
reject('SEC-B-P4-TRANSITION-SEMVER',()=>T.transitionContractDigest({...T.CORE_TRANSITION_DESCRIPTOR,semanticVersion:'1'}));
reject('SEC-B-P4-TRANSITION-COMPATIBILITY',()=>T.transitionContractDigest({...T.CORE_TRANSITION_DESCRIPTOR,compatibility:'compatible'}));
reject('SEC-B-P4-TRANSITION-DUPLICATE-FAMILY',()=>T.transitionContractDigest({...T.CORE_TRANSITION_DESCRIPTOR,eventFamilies:[...T.CORE_TRANSITION_DESCRIPTOR.eventFamilies,T.CORE_TRANSITION_DESCRIPTOR.eventFamilies[0]]}));
assert.doesNotThrow(()=>T.canonicalTime({seconds:(1n<<64n)-1n,micros:999999n}));

const retryWorld=T.createLiveWorld({universeIdentity:universe,lineage});const first=T.commit({world:retryWorld,command:command(20,'retry')});const retry=T.commit({world:first.world,command:command(20,'retry')});assert.equal(retry.duplicate,true);assert.equal(retry.world.events.length,first.world.events.length);
const unknownCause=id(0x77);assert.doesNotThrow(()=>T.canonicalEvent(command(30,'unknown-cause',{causes:[unknownCause]})));

const canonicalPool=meta.cases.filter(c=>c.kind==='value').map(c=>unhex(c.hex));
function step(x){return (Math.imul(x,1664525)+1013904223)>>>0}
let cbvMutations=0,addressMutations=0,frontierRounds=0;
for(const seedText of corpus.fuzz.seeds){
  let state=Number(BigInt(seedText));
  for(let i=0;i<corpus.fuzz.cbv_mutations_per_seed;i++){
    state=step(state);const src=canonicalPool[state%canonicalPool.length],mode=state%4;let mutated;
    if(mode===0){mutated=Uint8Array.from(src);if(mutated.length)mutated[state%mutated.length]^=1<<(state%8)}
    else if(mode===1)mutated=src.length?Uint8Array.from(src.slice(0,state%src.length)):Uint8Array.of(0);
    else if(mode===2)mutated=Uint8Array.from([...src,state&255]);
    else {const at=src.length?state%(src.length+1):0;mutated=Uint8Array.from([...src.slice(0,at),0x80,0x00,...src.slice(at)])}
    try{const value=P.decode(mutated);assert.equal(hex(P.encode(value)),hex(mutated),'accepted CBV mutation must be canonical')}catch{}
    cbvMutations++;
  }
  for(let i=0;i<corpus.fuzz.address_mutations_per_seed;i++){
    state=step(state);let mutated=Uint8Array.from(address0),mode=state%4;
    if(mode===0)mutated[state%mutated.length]^=1<<(state%8);
    else if(mode===1)mutated=Uint8Array.from(mutated.slice(0,state%mutated.length));
    else if(mode===2)mutated=Uint8Array.from([...mutated,state&255]);
    else {const at=state%(mutated.length+1);mutated=Uint8Array.from([...mutated.slice(0,at),0x80,0x00,...mutated.slice(at)])}
    try{const value=P.parseAddress(mutated);assert.equal(hex(P.address(value)),hex(mutated),'accepted address mutation must be canonical')}catch{}
    addressMutations++;
  }
  for(let i=0;i<corpus.fuzz.p4_frontier_rounds_per_seed;i++){
    state=step(state);const sec=1000n+BigInt(i),a=T.canonicalEvent(command(sec,'fuzz-a-'+seedText+'-'+i)),b=T.canonicalEvent(command(sec,'fuzz-b-'+seedText+'-'+i)),pair=T.sortEvents([a,b]);
    const from=e=>({universeIdentity:e.descriptor.universeIdentity,lineageId:e.descriptor.lineageId,time:e.descriptor.time,type:e.descriptor.type,version:e.descriptor.version,operationKey:e.descriptor.operationKey,targets:e.descriptor.targets,payload:e.descriptor.payload,causes:e.descriptor.causes,preconditionStateDigest:e.descriptor.preconditionStateDigest});
    let w=T.createLiveWorld({universeIdentity:universe,lineage});w=T.commit({world:w,command:from(pair[0])}).world;w=T.commit({world:w,command:from(pair[1])}).world;assert.throws(()=>T.commit({world:w,command:from(pair[0])}));
    frontierRounds++;
  }
}

const declared=new Set(corpus.gating_cases.map(x=>x.fingerprint));
for(const fp of declared)assert(executed.has(fp),'declared hostile-input case was not executed: '+fp);
for(const fp of executed)assert(declared.has(fp),'executed security fingerprint missing from corpus: '+fp);
if(failures.length)throw new Error('IND-SEC-B hostile-input regression failures:\n'+failures.join('\n'));

const evidence={
  promptId:'IND-SEC-B',status:'PASS',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',
  explicitRejectionFingerprints:executed.size,cbvMutations,addressMutations,frontierRounds,
  fuzzSeeds:corpus.fuzz.seeds,g0aCorpusDigest:corpus.gate_binding.corpus_digest,
  residualDebtFingerprints:corpus.non_gating_residuals.map(x=>x.fingerprint)
};
console.log('IND-SEC-B post-G0A hostile-input corpus: PASS');
console.log(JSON.stringify(evidence));
