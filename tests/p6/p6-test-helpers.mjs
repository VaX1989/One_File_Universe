import fs from 'node:fs';
import vm from 'node:vm';

const RUNTIME_FILES=[
  'src/kernel/sha256.js',
  'src/kernel/canonical.js',
  'src/persistence/save.js',
  'src/kernel/p2-unicode.js',
  'src/kernel/p2-canonical.js',
  'src/domains/astronomy/p3-skeleton.js',
  'src/domains/astronomy/p3-canonical.js',
  'src/temporal/p4-temporal.js',
  'src/domains/planetology/p5-canonical.js',
  'src/domains/planetology/p5-environment-v2.js',
  'src/domains/biosphere/p6-canonical.js'
];

export function loadP6(){
  globalThis.OFU={};
  for(const file of RUNTIME_FILES)vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
  return globalThis.OFU;
}

export function canonicalContext(O){
  const masterSeed=Uint8Array.from({length:32},(_,index)=>index+11);
  const astronomyContext={masterSeed,semanticManifestHash:O.p3Astronomy.semanticManifestHash()};
  const universeIdentity=O.p2.universeIdentity(masterSeed,O.p3Astronomy.semanticManifestHash()).digest;
  return {masterSeed,astronomyContext,universeIdentity};
}

export function findCanonicalTerrestrial(O){
  const A=O.p3Astronomy,P5=O.p5Planetology,{masterSeed,astronomyContext,universeIdentity}=canonicalContext(O),galaxies=[];
  for(let index=0;index<30000&&galaxies.length<16;index++){
    const key={x:BigInt((index%120)-60),y:BigInt((Math.floor(index/120)%120)-60),z:BigInt(Math.floor(index/14400)-1)};
    if(A.resolveGalaxy(astronomyContext,key).status==='PRESENT')galaxies.push(key);
  }
  for(const galaxy of galaxies){
    const base={galaxyX:galaxy.x,galaxyY:galaxy.y,galaxyZ:galaxy.z};
    for(let index=0n;index<100000n;index++){
      const key={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:index%512n,siteY:(index/512n)%512n,siteZ:(index/(512n*512n))%512n};
      const system=A.resolveSystem(astronomyContext,key);
      if(system.status!=='PRESENT'||system.facts.planetCount===0n)continue;
      for(let orbitSlot=0n;orbitSlot<system.facts.planetCount;orbitSlot++){
        const planetKey={...key,orbitSlot},snapshot=A.planetaryInputSnapshot(astronomyContext,planetKey);
        if(snapshot.status==='ABSENT')continue;
        try{
          const planet=P5.realizePhysicalPlanet(astronomyContext,snapshot);
          if(planet.status==='SUPPORTED')return {masterSeed,universeIdentity,astronomyContext,planetKey,planet,topology:P5.createTerrainTopology(planet)};
        }catch{}
      }
    }
  }
  throw new Error('no supported canonical terrestrial planet');
}

// This fixture is intentionally test-only and is never embedded by tools/build-ofu-p6.mjs.
export function conformanceFixture(B,binding,planetId){
  const authority='P6_CONFORMANCE_ONLY';
  const budget=B.energyBudget({phototrophicUsableEnergyU:5000000000n,phototrophicCaptureEfficiencyPpm:420000n,chemotrophicUsableEnergyU:null,chemotrophicCaptureEfficiencyPpm:0n,biomassSupportEfficiencyPpm:800000n});
  const ids=B.idsForPlanet(binding,planetId),trophic=B.transferCeilings(budget.primaryProductivityCeilingU,[100000n]);
  const macro={authority,canonicalBiologyEstablished:false,level:'MACRO',planetId,biosphereId:ids.biosphereId,commitments:{viableMedium:'LIQUID_MEDIUM',energySource:budget.energySource,primaryProductivityCeilingU:budget.primaryProductivityCeilingU,sustainableBiomassCeilingU:budget.sustainableBiomassCeilingU},trophic};
  const lineage={authority,canonicalBiologyEstablished:false,lineageId:ids.lineageId,biosphereId:ids.biosphereId,lineageOrdinal:0n,viableMedium:'LIQUID_MEDIUM',energyCeilingU:budget.primaryProductivityCeilingU};
  const species={authority,canonicalBiologyEstablished:false,speciesId:ids.speciesId,lineageId:ids.lineageId,speciesOrdinal:0n,viableMedium:'LIQUID_MEDIUM',energyCeilingU:budget.primaryProductivityCeilingU};
  const meso={authority,canonicalBiologyEstablished:false,level:'MESO',planetId,biosphereId:ids.biosphereId,lineages:[lineage],species:[species]};
  const micro={authority,canonicalBiologyEstablished:false,level:'MICRO',persistent:false,individualIdentityPromoted:false,planetId,biosphereId:ids.biosphereId,lineageId:ids.lineageId,speciesId:ids.speciesId,ordinal:0n,viableMedium:'LIQUID_MEDIUM',energyCeilingU:budget.primaryProductivityCeilingU};
  return {authority,budget,ids,macro,meso,micro};
}
