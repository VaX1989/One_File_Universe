import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4,h=P.hex,E=new TextEncoder();
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function domainHash(tag,value){return OFU.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
const universe=Uint8Array.from({length:32},(_,i)=>i+1),lineage=T.lineageId(universe,null,'canonical');
const a=P.entityIdentity(universe,'synthetic',{id:'A'}),b=P.entityIdentity(universe,'synthetic',{id:'B'}),c=P.entityIdentity(universe,'synthetic',{id:'C'});
function ev({sec=0n,micros=0n,type='core.field.set',op,target=a,payload,causes=[],pre=null,version=1n,lineageId=lineage,universeIdentity=universe}){return T.canonicalEvent({universeIdentity,lineageId,time:{seconds:sec,micros},type,version,operationKey:op,targets:[target],payload,causes,preconditionStateDigest:pre})}
const e1=ev({sec:10n,op:'a-name',payload:{field:'name',value:'Alpha'}}),e2=ev({sec:10n,op:'a-count',type:'core.counter.add',payload:{counter:'visits',delta:2n}}),e3=ev({sec:11n,op:'a-link',type:'core.relation.set',payload:{relation:'peer',target:b},causes:[e1.id]}),e4=ev({sec:12n,op:'b-name',target:b,payload:{field:'name',value:'Beta'}}),history=[e4,e2,e1,e3];
const full=T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history});
assert.equal(full.state.entities[h(a)].fields.name,'Alpha');assert.equal(full.state.entities[h(a)].counters.visits,2n);assert.equal(full.state.entities[h(a)].relations.peer,h(b));assert.equal(full.state.entities[h(b)].fields.name,'Beta');
assert.equal(h(full.digest),h(T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[e3,e1,e4,e2]}).digest));assert.equal(T.sortEvents([e1,e1,e2]).length,2);
const cp=T.checkpoint({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[e1,e2]}),suffix=T.replayFromCheckpoint({checkpoint:cp,events:[e4,e3]});assert.equal(h(full.digest),h(suffix.digest));
const compacted=T.compact({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history,keepTail:2});assert.equal(h(full.digest),h(T.replayFromCheckpoint({checkpoint:compacted.checkpoint,events:compacted.events}).digest));
const archive=T.exportArchive({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:compacted.events,checkpoint:compacted.checkpoint}),imported=T.importArchive(archive);assert.equal(h(full.digest),h(T.replayLiveWorld(imported).digest));
const corrupt=Uint8Array.from(archive);corrupt[corrupt.length-1]^=1;assert.throws(()=>T.importArchive(corrupt));
const future=P.decode(archive);future.payload.archiveSchemaVersion=T.ARCHIVE_SCHEMA+1n;future.integrity=domainHash('OFU-P4-ARCHIVE-v2',future.payload);assert.throws(()=>T.importArchive(P.encode(future)),/unsupported archive version/);
assert.throws(()=>T.canonicalTime({seconds:-1n,micros:0n}),/u64/);assert.throws(()=>T.canonicalTime({seconds:0n,micros:1000000n}),/micros/);
const wrongU=Uint8Array.from(universe);wrongU[0]^=1;assert.throws(()=>T.replay({universeIdentity:universe,lineage,events:[ev({sec:1n,op:'wrong-u',payload:{field:'x',value:1n},universeIdentity:wrongU})]}),/universe mismatch/);
const plan=T.schedule([{id:c,tier:'COLD',due:{seconds:9n,micros:0n}},{id:b,tier:'HOT',due:{seconds:9n,micros:0n}},{id:a,tier:'IMMEDIATE',due:{seconds:9n,micros:0n}}]);assert.deepEqual(plan.map(x=>x.tier),['IMMEDIATE','HOT','COLD']);
let seed=0x5eed1234,total=0;
for(let round=0;round<2000;round++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=1+(seed%15),events=[];
  for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;events.push(ev({sec:BigInt(seed%20),op:'prop-'+round+'-'+i,type:'core.counter.add',target:[a,b,c][seed%3],payload:{counter:'n',delta:BigInt((seed%7)-3)}}));}
  const canonical=T.replay({universeIdentity:universe,lineage,events}),shuffled=[...events];for(let i=shuffled.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  assert.equal(h(canonical.digest),h(T.replay({universeIdentity:universe,lineage,events:shuffled}).digest));const sorted=T.sortEvents(events),k=Math.floor(n/2),cp2=T.checkpoint({universeIdentity:universe,lineage,events:sorted.slice(0,k)});assert.equal(h(canonical.digest),h(T.replayFromCheckpoint({checkpoint:cp2,events:sorted.slice(k)}).digest));total+=n;
}
function crossRuntimeScenario(){const l=T.lineageId(universe,null,'browser'),aa=P.entityIdentity(universe,'synthetic',{id:'A'}),bb=P.entityIdentity(universe,'synthetic',{id:'B'});const make=(sec,op,target,type,payload)=>T.canonicalEvent({universeIdentity:universe,lineageId:l,time:{seconds:BigInt(sec),micros:0n},type,version:1n,operationKey:op,targets:[target],payload,causes:[],preconditionStateDigest:null});const events=[make(2,'b',bb,'core.field.set',{field:'name',value:'B'}),make(1,'a',aa,'core.field.set',{field:'name',value:'A'}),make(2,'n',aa,'core.counter.add',{counter:'n',delta:3n})],r=T.replay({universeIdentity:universe,lineage:l,events}),sorted=T.sortEvents(events),cp0=T.checkpoint({universeIdentity:universe,lineage:l,events:sorted.slice(0,1)}),suffix0=T.replayFromCheckpoint({checkpoint:cp0,events:sorted.slice(1)}),arc=T.exportArchive({universeIdentity:universe,lineage:l,events});assert.equal(h(r.digest),h(suffix0.digest));return{stateDigest:h(r.digest),eventRoot:h(T.eventRoot(events)),archiveDigest:OFU.sha256.hex(arc),order:sorted.map(e=>h(e.id))}}
const crossRuntime=crossRuntimeScenario();fs.mkdirSync('dist/evidence/p4',{recursive:true});const evidence={evidenceSchemaVersion:1,phase:'P4',evidenceKind:'p4-node-replay',producer:'tests/p4/run-p4-tests.mjs',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',p2FinalCandidate:'9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883',status:'PASS',temporalProtocol:T.VERSION,golden:{universe:h(universe),lineage:h(lineage),stateDigest:h(full.digest),checkpointId:h(cp.id),archiveDigest:OFU.sha256.hex(archive),eventOrder:T.sortEvents(history).map(x=>h(x.id)),transitionContractDigest:h(T.transitionContractDigest(T.CORE_TRANSITION_DESCRIPTOR))},crossRuntime,propertyHistories:2000,propertyEvents:total};
fs.writeFileSync('dist/evidence/p4/p4-node-replay.json',JSON.stringify(evidence,null,2)+'\n');console.log('P4 temporal kernel: PASS');console.log(JSON.stringify(evidence));
