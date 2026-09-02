import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js','src/temporal/p4-temporal.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,A=OFU.p3Astronomy,T=OFU.p4;
const seed=Uint8Array.from({length:32},(_,i)=>i);
const manifestHash=A.semanticManifestHash();
const ctx={masterSeed:seed,semanticManifestHash:manifestHash};
const universe=P.universeIdentity(seed,manifestHash).digest;
const lineage=T.lineageId(universe,null,'p3-p4-integration');
const hex=P.hex;

function findPlanet(){
  let galaxyKey=null;
  for(let i=0;i<30000&&!galaxyKey;i++){
    const key={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
    if(A.resolveGalaxy(ctx,key).status==='PRESENT') galaxyKey=key;
  }
  assert(galaxyKey,'representative galaxy not found');
  const base={galaxyX:galaxyKey.x,galaxyY:galaxyKey.y,galaxyZ:galaxyKey.z,sectorX:0n,sectorY:0n,sectorZ:0n};
  for(let i=0n;i<60000n;i++){
    const sysKey={...base,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};
    const system=A.resolveSystem(ctx,sysKey);
    if(system.status!=='PRESENT'||system.facts.planetCount<1) continue;
    const planetKey={...sysKey,orbitSlot:0n};
    const planet=A.resolvePlanet(ctx,planetKey);
    if(planet.status==='PRESENT') return {systemKey:sysKey,planetKey,system,planet};
  }
  assert.fail('representative planet not found');
}

const found=findPlanet();
const star=A.resolveStar(ctx,{...found.systemKey,componentIndex:0n});
assert.equal(star.status,'PRESENT');
const baseline={
  contract:'ofu-integration-p3-baseline-v1',
  p3ManifestHash:manifestHash,
  system:A.canonicalEnvelope(found.system),
  star:A.canonicalEnvelope(star),
  planet:A.canonicalEnvelope(found.planet)
};
const baselineBytes=P.encode(baseline);

// Query order and unrelated queries cannot alter the canonical P3 baseline.
A.resolveRegion(ctx,{x:11n,y:-7n,z:3n});
A.resolveGalaxy(ctx,{x:-2n,y:1n,z:0n});
const systemAgain=A.resolveSystem(ctx,found.systemKey);
const starAgain=A.resolveStar(ctx,{...found.systemKey,componentIndex:0n});
const planetAgain=A.resolvePlanet(ctx,found.planetKey);
const reorderedBaseline={contract:'ofu-integration-p3-baseline-v1',p3ManifestHash:manifestHash,system:A.canonicalEnvelope(systemAgain),star:A.canonicalEnvelope(starAgain),planet:A.canonicalEnvelope(planetAgain)};
assert.deepEqual(P.encode(reorderedBaseline),baselineBytes,'P3 baseline changed with query order');
assert.deepEqual(planetAgain.id,found.planet.id,'P3 entity identity drifted');

function command(sec,op,type,payload){return {universeIdentity:universe,lineageId:lineage,time:{seconds:BigInt(sec),micros:0n},type,version:1n,operationKey:op,targets:[found.planet.id],payload,causes:[],preconditionStateDigest:null};}
const commands=[
  command(1,'observe-1','core.field.set',{field:'integrationState',value:'A'}),
  command(2,'count-1','core.counter.add',{counter:'ticks',delta:1n}),
  command(3,'count-2','core.counter.add',{counter:'ticks',delta:2n}),
  command(4,'observe-2','core.field.set',{field:'integrationState',value:'B'}),
  command(5,'count-3','core.counter.add',{counter:'ticks',delta:3n}),
  command(6,'observe-3','core.field.set',{field:'integrationState',value:'C'})
];
const events=commands.map(T.canonicalEvent);

// Full replay is delivery-order independent.
const full=T.replay({universeIdentity:universe,lineage,baseline,events});
const shuffled=T.replay({universeIdentity:universe,lineage,baseline,events:[events[4],events[1],events[5],events[0],events[3],events[2]]});
assert.equal(hex(full.digest),hex(shuffled.digest),'P3+P4 digest depends on delivery order');

// Checkpoint placement cannot alter final persistent state.
for(const cut of [1,2,3,5]){
  const cp=T.checkpoint({universeIdentity:universe,lineage,baseline,events:events.slice(0,cut)});
  const r=T.replayFromCheckpoint({checkpoint:cp,events:events.slice(cut)});
  assert.equal(hex(r.digest),hex(full.digest),`checkpoint placement ${cut} changed final digest`);
}

// Repeated bounded-tail compaction must equal full-history replay without restoring discarded prefix.
let world=T.createLiveWorld({universeIdentity:universe,lineage,baseline,compactionPolicy:{threshold:3,retainTail:1}});
let compactions=0;
for(const c of commands){const r=T.commit({world,command:c});world=r.world;if(r.compacted)compactions++;}
assert(compactions>=2,'test did not exercise repeated live compaction');
const live=T.replayLiveWorld(world);
assert.equal(hex(live.digest),hex(full.digest),'repeated live compaction changed final digest');
assert(world.checkpoint,'repeated compaction did not produce checkpoint');
assert(world.events.length<world.compactionPolicy.threshold,'tail is not bounded after compaction');

// P3 remains the baseline/identity authority; P4 overlays mutation without rewriting it.
assert.deepEqual(P.encode(live.state.baseline),baselineBytes,'P4 rewrote P3 baseline authority');
const entity=live.state.entities[hex(found.planet.id)];
assert(entity,'P4 did not target the P3 EntityIdentity');
assert.equal(entity.fields.integrationState,'C');
assert.equal(entity.counters.ticks,6n);

console.log(JSON.stringify({status:'PASS',test:'P3-P4-INTEGRATION-v1',p3Model:A.VERSION,p4Protocol:T.VERSION,universe:hex(universe),planetId:hex(found.planet.id),baselineDigest:OFU.sha256.hex(baselineBytes),finalStateDigest:hex(full.digest),compactions,retainedTail:world.events.length,checkpointCoveredEventCount:String(world.checkpoint.descriptor.coveredEventCount)},null,2));
