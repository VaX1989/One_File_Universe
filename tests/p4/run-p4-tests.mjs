import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4;
const h=P.hex;
const universe=Uint8Array.from({length:32},(_,i)=>i+1);
const lineage=T.lineageId(universe,null,'canonical');
const a=P.entityIdentity(universe,'synthetic',{id:'A'}),b=P.entityIdentity(universe,'synthetic',{id:'B'}),c=P.entityIdentity(universe,'synthetic',{id:'C'});
function ev({sec=0n,micros=0n,type='core.field.set',op,target=a,payload,causes=[],pre=null,version=1n}){return T.canonicalEvent({universeIdentity:universe,lineageId:lineage,time:{seconds:sec,micros},type,version,operationKey:op,targets:[target],payload,causes,preconditionStateDigest:pre})}
const e1=ev({sec:10n,op:'a-name',payload:{field:'name',value:'Alpha'}});
const e2=ev({sec:10n,op:'a-count',type:'core.counter.add',payload:{counter:'visits',delta:2n}});
const e3=ev({sec:11n,op:'a-link',type:'core.relation.set',payload:{relation:'peer',target:b},causes:[e1.id]});
const e4=ev({sec:12n,op:'b-name',target:b,payload:{field:'name',value:'Beta'}});
const history=[e4,e2,e1,e3];
const full=T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history});
assert.equal(full.state.entities[h(a)].fields.name,'Alpha');
assert.equal(full.state.entities[h(a)].counters.visits,2n);
assert.equal(full.state.entities[h(a)].relations.peer,h(b));
assert.equal(full.state.entities[h(b)].fields.name,'Beta');
assert.equal(h(full.digest),h(T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[e3,e1,e4,e2]}).digest),'delivery permutation must not affect replay');
assert.equal(h(T.sortEvents([e1,e1,e2])[0].id),h(T.sortEvents([e1,e2])[0].id),'duplicate event IDs must be idempotent');
const sameA=ev({sec:20n,op:'same-a',payload:{field:'x',value:1n}}),sameB=ev({sec:20n,op:'same-b',payload:{field:'x',value:2n}});
const ordered=T.sortEvents([sameB,sameA]);assert.notEqual(h(ordered[0].id),h(ordered[1].id));assert.equal(T.compareEvents(ordered[0],ordered[1])<0,true,'same-time events must use deterministic Event ID tie-break');
const cp=T.checkpoint({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[e1,e2]});
const suffix=T.replayFromCheckpoint({checkpoint:cp,events:[e4,e3]});assert.equal(h(full.digest),h(suffix.digest),'checkpoint + suffix must equal full replay');
const compacted=T.compact({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history,keepTail:2});
const compactReplay=T.replayFromCheckpoint({checkpoint:compacted.checkpoint,events:compacted.events});assert.equal(h(full.digest),h(compactReplay.digest),'compaction must preserve state');
const compacted2=T.compact({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:T.sortEvents(history),keepTail:2});assert.equal(h(compacted.checkpoint.id),h(compacted2.checkpoint.id),'recompaction input order must not affect representation');assert.deepEqual(compacted.events.map(x=>h(x.id)),compacted2.events.map(x=>h(x.id)));
const archive=T.exportArchive({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:compacted.events,checkpoint:compacted.checkpoint});
const imported=T.importArchive(archive);const importedReplay=T.replayFromCheckpoint({checkpoint:imported.checkpoint,events:imported.events});assert.equal(h(full.digest),h(importedReplay.digest),'archive round trip must preserve canonical state');
const corrupt=Uint8Array.from(archive);corrupt[corrupt.length-1]^=1;assert.throws(()=>T.importArchive(corrupt),'corrupt archive must fail closed');
const otherUniverse=Uint8Array.from(universe);otherUniverse[0]^=1;assert.throws(()=>T.replay({universeIdentity:universe,lineage,events:[T.canonicalEvent({universeIdentity:otherUniverse,lineageId:lineage,time:{seconds:1n,micros:0n},type:'core.field.set',version:1n,operationKey:'wrong-u',targets:[a],payload:{field:'x',value:1n},causes:[],preconditionStateDigest:null})]}),/universe mismatch/);
assert.throws(()=>T.canonicalTime({seconds:0n,micros:1000000n}),/micros/);assert.throws(()=>T.canonicalTime({seconds:-1n,micros:0n}),/u64/);
assert.throws(()=>T.replay({universeIdentity:universe,lineage,events:[ev({sec:1n,op:'future',version:2n,payload:{field:'x',value:1n}})]}),/unsupported event type/);
assert.throws(()=>T.replayFromCheckpoint({checkpoint:cp,events:[e1]}),/does not follow checkpoint/,'suffix may not sort inside covered prefix');
let world={universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[]};
let current=T.replay({universeIdentity:universe,lineage,baseline:world.baseline,events:[]});
const cmd={universeIdentity:universe,lineageId:lineage,time:{seconds:5n,micros:0n},type:'core.counter.add',version:1n,operationKey:'txn-1',targets:[a],payload:{counter:'score',delta:12n},causes:[],preconditionStateDigest:current.digest};
let committed=T.commit({world,command:cmd});assert.equal(committed.state.entities[h(a)].counters.score,12n,'commit result must contain applied state');world=committed.world;
const dup=T.commit({world,command:cmd});assert.equal(dup.duplicate,true);assert.equal(dup.state.entities[h(a)].counters.score,12n,'duplicate submission must not double apply');
const bad={...cmd,operationKey:'txn-bad',preconditionStateDigest:new Uint8Array(32)};assert.throws(()=>T.commit({world,command:bad}),/precondition failed/);assert.equal(T.replay({universeIdentity:universe,lineage,baseline:world.baseline,events:world.events}).state.entities[h(a)].counters.score,12n,'failed transaction must leave world unchanged');
const plan=T.schedule([{id:c,tier:'COLD',due:{seconds:9n,micros:0n}},{id:b,tier:'HOT',due:{seconds:9n,micros:0n}},{id:a,tier:'IMMEDIATE',due:{seconds:9n,micros:0n}}]);assert.deepEqual(plan.map(x=>x.tier),['IMMEDIATE','HOT','COLD']);
const branch=T.lineageId(universe,cp.id,'branch-1');assert.notEqual(h(branch),h(lineage));
let seed=0x5eed1234,total=0;
for(let round=0;round<2000;round++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=1+(seed%15),events=[];
  for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const sec=BigInt(seed%20);events.push(ev({sec,op:'prop-'+round+'-'+i,type:'core.counter.add',target:[a,b,c][seed%3],payload:{counter:'n',delta:BigInt((seed%7)-3)}}));}
  const canonical=T.replay({universeIdentity:universe,lineage,events});const shuffled=[...events];
  for(let i=shuffled.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const perm=T.replay({universeIdentity:universe,lineage,events:shuffled});assert.equal(h(canonical.digest),h(perm.digest));
  const k=Math.floor(n/2),sorted=T.sortEvents(events),cp2=T.checkpoint({universeIdentity:universe,lineage,events:sorted.slice(0,k)}),rr=T.replayFromCheckpoint({checkpoint:cp2,events:sorted.slice(k)});assert.equal(h(canonical.digest),h(rr.digest));total+=n;
}
fs.mkdirSync('dist/evidence',{recursive:true});
const evidence={evidenceSchemaVersion:1,phase:'P4',evidenceKind:'p4-node-replay',producer:'tests/p4/run-p4-tests.mjs',sourceCommit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',p2FinalCandidate:'9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883',status:'PASS',temporalProtocol:T.VERSION,golden:{universe:h(universe),lineage:h(lineage),stateDigest:h(full.digest),checkpointId:h(cp.id),archiveDigest:OFU.sha256.hex(archive),eventOrder:T.sortEvents(history).map(x=>h(x.id))},propertyHistories:2000,propertyEvents:total};
fs.writeFileSync('dist/evidence/p4-node-replay.json',JSON.stringify(evidence,null,2)+'\n');console.log('P4 temporal kernel: PASS');console.log(JSON.stringify(evidence));
