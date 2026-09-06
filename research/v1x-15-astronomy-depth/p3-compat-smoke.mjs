import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createProvider} from './model.mjs';

globalThis.OFU={};
for(const file of [
  'src/kernel/sha256.js',
  'src/kernel/p2-unicode.js',
  'src/kernel/p2-canonical.js',
  'src/domains/astronomy/p3-skeleton.js',
  'src/domains/astronomy/p3-canonical.js'
]) vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});

const P=OFU.p2,A=OFU.p3Astronomy;
assert.equal(A.VERSION,'p3-astronomy-1');
const seed=Uint8Array.from({length:32},(_,i)=>i);
const manifestHash=A.semanticManifestHash();
const ctx={masterSeed:seed,semanticManifestHash:manifestHash};
const provider=createProvider({p2:P,p3:A});

let galaxyKey=null;
for(let i=0;i<30000&&!galaxyKey;i++){
  const key={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
  if(A.resolveGalaxy(ctx,key).status==='PRESENT')galaxyKey=key;
}
assert(galaxyKey,'V1X-15 smoke: representative galaxy not found within bounded search');
const canonicalGalaxy=A.resolveGalaxy(ctx,galaxyKey);
const depthGalaxy=provider.resolveGalaxyDepth(ctx,galaxyKey);
assert.deepEqual(depthGalaxy.sourceEntityId,canonicalGalaxy.id);
assert.equal(depthGalaxy.mutationAuthority,false);
assert.equal(depthGalaxy.spatialPrior.coordinateAuthority,'NONE');

const base={galaxyX:galaxyKey.x,galaxyY:galaxyKey.y,galaxyZ:galaxyKey.z,sectorX:0n,sectorY:0n,sectorZ:0n};
let systemKey=null,canonicalSystem=null;
for(let i=0n;i<60000n&&!systemKey;i++){
  const key={...base,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};
  const system=A.resolveSystem(ctx,key);
  if(system.status==='PRESENT'){systemKey=key;canonicalSystem=system;}
}
assert(systemKey,'V1X-15 smoke: representative system not found within bounded search');
const baselineBytes=P.encode(A.canonicalEnvelope(canonicalSystem));
const depthSystem=provider.resolveSystemDepth(ctx,systemKey);
assert.deepEqual(depthSystem.sourceEntityId,canonicalSystem.id);
assert.equal(depthSystem.mutationAuthority,false);
assert.deepEqual(P.encode(A.canonicalEnvelope(A.resolveSystem(ctx,systemKey))),baselineBytes,'research provider mutated or destabilized P3 canonical system facts');

const starKey={...systemKey,componentIndex:0n};
const canonicalStar=A.resolveStar(ctx,starKey);
const near=provider.observeStar(ctx,starKey,{distanceMilliPc:10000n,crowdingQ16:0n});
const far=provider.observeStar(ctx,starKey,{distanceMilliPc:20000n,crowdingQ16:0n});
assert.deepEqual(near.sourceEntityId,canonicalStar.id);
assert.deepEqual(far.sourceEntityId,canonicalStar.id);
assert.equal(near.observerAffectsIdentity,false);
assert(near.observability.detectabilityScoreQ16>far.observability.detectabilityScoreQ16);

console.log(JSON.stringify({status:'PASS',test:'V1X-15-P3-COMPAT-SMOKE',p3Model:A.VERSION,galaxyId:P.hex(canonicalGalaxy.id),systemId:P.hex(canonicalSystem.id),starId:P.hex(canonicalStar.id)},null,2));
