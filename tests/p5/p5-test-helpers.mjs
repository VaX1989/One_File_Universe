import fs from 'node:fs';
import vm from 'node:vm';

export function loadP5Runtime(){
  globalThis.OFU=globalThis.OFU||{};
  for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js','src/temporal/p4-temporal.js','src/domains/planetology/p5-canonical.js']){
    vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
  }
  return globalThis.OFU;
}

export function canonicalContext(A,offset=0){
  const masterSeed=Uint8Array.from({length:32},(_,i)=>(i+offset)&255);
  return {masterSeed,semanticManifestHash:A.semanticManifestHash()};
}

export function findPlanet(A,ctx,predicate=()=>true){
  const galaxies=[];
  for(let i=0;i<30000&&galaxies.length<24;i++){
    const key={x:BigInt((i%120)-60),y:BigInt((Math.floor(i/120)%120)-60),z:BigInt(Math.floor(i/14400)-1)};
    const g=A.resolveGalaxy(ctx,key);if(g.status==='PRESENT')galaxies.push(key);
  }
  for(const galaxy of galaxies){
    const base={galaxyX:galaxy.x,galaxyY:galaxy.y,galaxyZ:galaxy.z};
    for(let i=0n;i<100000n;i++){
      const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:(i/(512n*512n))%512n};
      const system=A.resolveSystem(ctx,k);if(system.status!=='PRESENT'||system.facts.planetCount===0n)continue;
      for(let slot=0n;slot<system.facts.planetCount;slot++){
        const key={...k,orbitSlot:slot},planet=A.resolvePlanet(ctx,key);if(planet.status!=='PRESENT')continue;
        const snapshot=A.planetaryInputSnapshot(ctx,key);
        if(predicate(snapshot,planet))return {key,planet,snapshot,system};
      }
    }
  }
  throw new Error('no P3 planet satisfying test predicate was found');
}
