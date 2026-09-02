import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';

const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,T=O.p4,P5=O.p5Planetology,ctx=canonicalContext(A);
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const planet=P5.realizePhysicalPlanet(ctx,A.planetaryInputSnapshot(ctx,chosen.key));
assert.equal(planet.status,'SUPPORTED');
const immutableDigest=P.hex(P5.physicalDigest(planet));
const universeIdentity=P.universeIdentity(ctx.masterSeed,A.semanticManifestHash()).digest,lineage=T.lineageId(universeIdentity,null,'p4-p5-static-binding');
const baseline={p3Epoch:'P4_T0',p5Genesis:planet};
function command(i){return {universeIdentity,lineageId:lineage,time:{seconds:i+1n,micros:0n},type:'core.counter.add',version:1n,operationKey:'p5-static-test-'+i,targets:[planet.planetId],payload:{counter:'integrationCounter',delta:1n},causes:[],preconditionStateDigest:null};}
const commands=Array.from({length:12},(_,i)=>command(BigInt(i))),events=commands.map(T.canonicalEvent);
const full=T.replay({universeIdentity,lineage,baseline,events});
const checkpoint=T.checkpoint({universeIdentity,lineage,baseline,events:events.slice(0,6)}),fromCheckpoint=T.replayFromCheckpoint({checkpoint,events:events.slice(6)});
assert.equal(P.hex(full.digest),P.hex(fromCheckpoint.digest));
assert.equal(P.hex(P5.physicalDigest(full.state.baseline.p5Genesis)),immutableDigest);
let world=T.createLiveWorld({universeIdentity,lineage,baseline,compactionPolicy:{threshold:4,retainTail:1}}),compactions=0;
for(const c of commands){const r=T.commit({world,command:c});world=r.world;if(r.compacted)compactions++;}
assert(compactions>=2,'P4->P5 static binding did not exercise repeated compaction');
const live=T.replayLiveWorld(world);
assert.equal(P.hex(full.digest),P.hex(live.digest),'repeated P4 compaction changed P5-containing world digest');
assert(world.checkpoint,'repeated compaction did not retain a checkpoint');
assert(world.events.length<world.compactionPolicy.threshold,'P4 tail is not bounded after repeated compaction');
assert.equal(P.hex(P5.physicalDigest(live.state.baseline.p5Genesis)),immutableDigest,'repeated compaction rewrote immutable P5 genesis');
assert.equal(planet.temporalBinding.canonicalTimeOwner,'P4');
assert.equal(planet.temporalBinding.persistentMutableP5StatePromoted,false);
assert.equal(planet.temporalBinding.transitionContract,null);
console.log(JSON.stringify({status:'PASS',temporalProtocol:T.VERSION,p5TransitionStatus:'DEFERRED_STATIC_SCOPE',events:events.length,compactions,retainedTail:world.events.length,checkpointCoveredEventCount:String(world.checkpoint.descriptor.coveredEventCount),fullDigest:P.hex(full.digest),checkpointDigest:P.hex(fromCheckpoint.digest),repeatedCompactionDigest:P.hex(live.digest),p5GenesisDigest:immutableDigest},null,2));
