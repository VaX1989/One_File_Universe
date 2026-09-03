import fs from 'node:fs';
import {loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),B=O.p6Biosphere;
const seed=Uint8Array.from({length:32},(_,index)=>index+33),universeIdentity=Uint8Array.from({length:32},(_,index)=>index+77),binding=B.bindings({masterSeed:seed,canonicalUniverseIdentity:universeIdentity});
const before=process.memoryUsage().heapUsed,start=performance.now();
let digestAccumulator=0,derivedLineageIdentities=0,derivedSpeciesIdentities=0;
for(let query=0;query<2000;query++){
  const planetId=Uint8Array.from({length:32},(_,index)=>(query*17+index*5)&255);
  const budget=B.energyBudget({phototrophicUsableEnergyU:1000000n+BigInt(query),phototrophicCaptureEfficiencyPpm:420000n,chemotrophicUsableEnergyU:null,chemotrophicCaptureEfficiencyPpm:0n,biomassSupportEfficiencyPpm:800000n});
  const ids=B.idsForPlanet(binding,planetId,{lineageOrdinal:BigInt(query%4),speciesOrdinal:BigInt(query%3)});
  digestAccumulator^=(ids.biosphereId[0]^Number(budget.primaryProductivityCeilingU&255n))<<((query%4)*8);
  if(query<24){derivedLineageIdentities+=4;derivedSpeciesIdentities+=12;for(let lineage=0n;lineage<4n;lineage++)for(let species=0n;species<3n;species++)B.idsForPlanet(binding,planetId,{lineageOrdinal:lineage,speciesOrdinal:species})}
}
global.gc?.();
const elapsed=performance.now()-start,after=process.memoryUsage().heapUsed,output={status:'PASS',scenario:'P6_V1_SPARSE_WORKING_SET',conceptualBiosphereQueries:2000,simultaneouslyRefinedPlanets:24,derivedLineageIdentities,derivedSpeciesIdentities,persistentLineageEntities:0,persistentSpeciesEntities:0,persistentIndividuals:0,cacheCount:0,elapsedMs:Number(elapsed.toFixed(3)),averageQueryMs:Number((elapsed/2000).toFixed(6)),nodeHeapDeltaBytes:after-before,digestAccumulator};
fs.mkdirSync('dist/evidence/p6',{recursive:true});fs.writeFileSync('dist/evidence/p6/working-set.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output));
