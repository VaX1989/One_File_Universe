import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4,h=P.hex,E=new TextEncoder();
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function domainHash(tag,value){return OFU.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
const universe=Uint8Array.from({length:32},(_,i)=>0xa0+i),lineage=T.lineageId(universe,null,'semantic-closure'),entity=P.entityIdentity(universe,'synthetic',{id:'live'});
function cmd(sec,op,delta=1n,{micros=0n,pre=null,causes=[]}={}){return{universeIdentity:universe,lineageId:lineage,time:{seconds:BigInt(sec),micros},type:'core.counter.add',version:1n,operationKey:op,targets:[entity],payload:{counter:'n',delta},causes,preconditionStateDigest:pre}}
function commit(world,command){return T.commit({world,command})}

let world=T.createLiveWorld({universeIdentity:universe,lineage,compactionPolicy:{threshold:8,retainTail:0}});
world=commit(world,cmd(10,'f-10')).world;world=commit(world,cmd(11,'f-11')).world;
const retro=cmd(9,'retro');assert.throws(()=>commit(world,retro),/does not advance frontier/);
assert.equal(commit(world,cmd(11,'f-11')).duplicate,true);
const compacted=T.compactLiveWorld({world});assert.equal(compacted.events.length,0);assert.throws(()=>commit(compacted,retro),/does not advance frontier/);assert.equal(commit(compacted,cmd(11,'f-11')).duplicate,true);

const equalA=T.canonicalEvent(cmd(20,'same-a')),equalB=T.canonicalEvent(cmd(20,'same-b')),pair=T.sortEvents([equalA,equalB]),low=pair[0],high=pair[1];
const fromEvent=e=>({universeIdentity:e.descriptor.universeIdentity,lineageId:e.descriptor.lineageId,time:e.descriptor.time,type:e.descriptor.type,version:e.descriptor.version,operationKey:e.descriptor.operationKey,targets:e.descriptor.targets,payload:e.descriptor.payload,causes:e.descriptor.causes,preconditionStateDigest:e.descriptor.preconditionStateDigest});
let equalWorld=T.createLiveWorld({universeIdentity:universe,lineage,compactionPolicy:{threshold:8,retainTail:1}});equalWorld=commit(equalWorld,fromEvent(low)).world;equalWorld=commit(equalWorld,fromEvent(high)).world;assert.throws(()=>commit(equalWorld,fromEvent(low)),/does not advance frontier/);
let reverse=T.createLiveWorld({universeIdentity:universe,lineage,compactionPolicy:{threshold:8,retainTail:1}});reverse=commit(reverse,fromEvent(high)).world;assert.throws(()=>commit(reverse,fromEvent(low)),/does not advance frontier/);

const history=[];let live=T.createLiveWorld({universeIdentity:universe,lineage,compactionPolicy:{threshold:32,retainTail:4}}),compactions=0,maxTail=0;
for(let i=1;i<=2048;i++){const c=cmd(100+i,'cycle-'+i,BigInt((i%5)-2)),e=T.canonicalEvent(c);history.push(e);const r=commit(live,c);live=r.world;if(r.compacted)compactions++;maxTail=Math.max(maxTail,live.events.length);if(i%128===0)assert.equal(h(T.replay({universeIdentity:universe,lineage,events:history}).digest),h(T.replayLiveWorld(live).digest));}
const reference=T.replay({universeIdentity:universe,lineage,events:history}),liveResult=T.replayLiveWorld(live);assert.equal(h(reference.digest),h(liveResult.digest));assert.ok(compactions>10);assert.ok(maxTail<32);assert.ok(live.events.length<32);assert.ok(live.checkpoint);assert.equal(live.checkpoint.descriptor.coveredEventCount+BigInt(live.events.length),2048n);assert.equal(h(live.checkpoint.descriptor.coveredEventRoot),h(T.eventRoot(history.slice(0,Number(live.checkpoint.descriptor.coveredEventCount)))));
const roundTrip=T.importArchive(T.exportArchive({universeIdentity:universe,lineage,baseline:live.baseline,checkpoint:live.checkpoint,events:live.events,compactionPolicy:live.compactionPolicy}));assert.equal(h(reference.digest),h(T.replayLiveWorld(roundTrip).digest));

let time=100000n;const seedEvent=T.canonicalEvent(cmd(time++,'large-seed')),seedCp=T.checkpoint({universeIdentity:universe,lineage,events:[seedEvent]}),largeCp=P.decode(P.encode(seedCp));largeCp.descriptor.coveredEventCount=BigInt(T.MAX_HISTORICAL_EVENTS);largeCp.id=domainHash('OFU-P4-CHECKPOINT-v1',largeCp.descriptor);assert.doesNotThrow(()=>T.verifyCheckpoint(largeCp));let post=T.createLiveWorld({universeIdentity:universe,lineage,checkpoint:largeCp,events:[],compactionPolicy:{threshold:16,retainTail:2}});for(let i=0;i<100;i++)post=commit(post,cmd(time++,'post-'+i)).world;assert.ok(post.checkpoint.descriptor.coveredEventCount>BigInt(T.MAX_HISTORICAL_EVENTS));assert.ok(post.events.length<16);

const alt=T.createTransitionContract({contractId:'ofu.p4.core-transition',semanticVersion:'1.1.0',compatibility:'exact',eventFamilies:T.CORE_TRANSITION_DESCRIPTOR.eventFamilies,reducers:new Map(T.CORE_TRANSITION_CONTRACT.reducers)});
assert.throws(()=>T.replayFromCheckpoint({checkpoint:live.checkpoint,events:live.events,transition:alt}),/transition contract mismatch/);
const liveArchive=T.exportArchive({universeIdentity:universe,lineage,checkpoint:live.checkpoint,events:live.events,compactionPolicy:live.compactionPolicy});assert.throws(()=>T.importArchive(liveArchive,{transition:alt}),/archive transition contract mismatch/);
const forged=P.decode(liveArchive);forged.payload.transitionContract.semanticVersion='9.0.0';forged.integrity=domainHash('OFU-P4-ARCHIVE-v2',forged.payload);assert.throws(()=>T.importArchive(P.encode(forged)),/archive transition contract mismatch/);
const mismatch=P.decode(liveArchive);mismatch.payload.transitionContract=alt.descriptor;mismatch.integrity=domainHash('OFU-P4-ARCHIVE-v2',mismatch.payload);assert.throws(()=>T.importArchive(P.encode(mismatch),{transition:alt}),/checkpoint transition contract mismatch/);
assert.throws(()=>T.createTransitionContract({contractId:'x',semanticVersion:'1',eventFamilies:['core.counter.add@1'],reducers:new Map([['core.counter.add@1',()=>{}]])}),/SemVer/);

const unknownCause=new Uint8Array(32);unknownCause.fill(7);const caused=T.canonicalEvent(cmd(time++,'cause-provenance',1n,{causes:[unknownCause]}));assert.doesNotThrow(()=>T.replay({universeIdentity:universe,lineage,events:[caused]}));
const op1=T.canonicalEvent(cmd(time,'op-1')),op2=T.canonicalEvent(cmd(time,'op-2'));assert.notEqual(h(op1.id),h(op2.id));
const fakePre=new Uint8Array(32);fakePre.fill(3);const acceptedBytes=T.canonicalEvent(cmd(time+1n,'pre-replay',1n,{pre:fakePre}));assert.doesNotThrow(()=>T.replay({universeIdentity:universe,lineage,events:[acceptedBytes]}));let admission=T.createLiveWorld({universeIdentity:universe,lineage});assert.throws(()=>commit(admission,cmd(1,'pre-reject',1n,{pre:fakePre})),/precondition failed/);

const evidence={evidenceSchemaVersion:1,phase:'P4',evidenceKind:'p4-semantic-closure',producer:'tests/p4/semantic-closure-tests.mjs',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',p2FinalCandidate:'9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883',status:'PASS',metamorphicEvents:2048,compactions,maxTail,coveredEventCount:String(live.checkpoint.descriptor.coveredEventCount),continuationStartCount:String(largeCp.descriptor.coveredEventCount),retainedTail:live.events.length,transitionContract:{contractId:T.CORE_TRANSITION_DESCRIPTOR.contractId,semanticVersion:T.CORE_TRANSITION_DESCRIPTOR.semanticVersion}};fs.mkdirSync('dist/evidence/p4',{recursive:true});fs.writeFileSync('dist/evidence/p4/p4-semantic-closure.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
