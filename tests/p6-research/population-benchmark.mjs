import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {adaptP5EnvironmentV02,createP2BiosphereBindings,generateBiosphereMacro,materializeMeso,materializeIndividual} from '../../research/p6/biosphere-model.mjs';

for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js']){
  globalThis.OFU=globalThis.OFU||{};
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
const P=OFU.p2;
const seed=Uint8Array.from({length:32},(_,i)=>(i*29+3)&255);
const mh=Uint8Array.from({length:32},(_,i)=>(i*13+91)&255);
const uid=P.universeIdentity(seed,mh).digest;
const bindings=createP2BiosphereBindings({p2:P,masterSeed:seed,semanticManifestHash:mh,universeIdentity:uid});

function makeEnv(i){
  const planetId=P.entityIdentity(uid,'p3.planet',{benchmark:BigInt(i)});
  return adaptP5EnvironmentV02({
    version:'p6-environment-research-v0.2',authority:'P5_RESEARCH_DRAFT',planetId,
    environmentalEpochRef:'BENCHMARK_T0',spatialRef:{contract:'BENCHMARK_CELL_V0',cell:`cell-${i}`},
    energy:{baselineInsolationPpm:300000+(i%17)*70000},
    temperature:{meanK:220+(i%13)*11,minSeasonalK:190+(i%11)*8,maxSeasonalK:260+(i%9)*13,highLatitudeSeasonalityK:15+(i%8)*18},
    atmosphere:{pressurePa:15000+(i%19)*18000,columnEquivalentPressurePa:15000+(i%19)*18000,pressureInterpretation:'SURFACE_COLUMN_PRESSURE_PROXY',heavyGasRetentionProxy:0.3+(i%7)*0.09,xuvEscapeKgS:200+(i%23)*90},
    solvent:{surfaceWaterRegime:i%5===0?'TRACE_OR_ABSENT':'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'SHALLOW_TO_MODERATE_RESERVOIR'},
    geology:{activityProxy:0.1+(i%12)*0.09,regimeProxy:'BENCHMARK_PROXY'},
    terrain:{oceanFractionPpm:i%5===0?0:150000+(i%8)*90000,reliefScaleM:1500+(i%13)*650},
    radiation:{xuvFractionProxy:0.000001*(1+(i%15))}
  });
}

const PLANETS=2000;
const ACTIVE=24;
const before=process.memoryUsage().heapUsed;
const t0=performance.now();
let digestAccumulator=0;
let activeSpecies=0,activeIndividuals=0,totalLineages=0;
for(let i=0;i<PLANETS;i++){
  const env=makeEnv(i),macro=generateBiosphereMacro(env,bindings);
  totalLineages+=macro.commitments.lineageCount;
  digestAccumulator=(digestAccumulator+macro.biosphereId[0]+macro.biosphereId[31])>>>0;
  if(i<ACTIVE){
    const indexes=Array.from({length:Math.min(4,macro.commitments.lineageCount)},(_,j)=>j);
    const meso=materializeMeso(env,macro,bindings,{lineageIndexes:indexes,speciesPerLineage:3});
    activeSpecies+=meso.species.length;
    for(const species of meso.species.slice(0,4)){
      const micro=materializeIndividual(env,macro,species,bindings,0);
      digestAccumulator=(digestAccumulator+micro.individualId[0])>>>0;
      activeIndividuals++;
    }
  }
}
const elapsedMs=performance.now()-t0;
if(global.gc)global.gc();
const after=process.memoryUsage().heapUsed;
const report={
  status:'PASS',scenario:'P6_BOUNDED_RANDOM_ACCESS_RESEARCH_V0_1',conceptualPlanetsQueried:PLANETS,
  simultaneouslyRefinedPlanets:ACTIVE,totalLineagesVisited:totalLineages,activeSpeciesMaterialized:activeSpecies,
  activeIndividualsMaterialized:activeIndividuals,elapsedMs:Number(elapsedMs.toFixed(3)),
  averageQueryMs:Number((elapsedMs/PLANETS).toFixed(6)),heapDeltaBytes:after-before,
  digestAccumulator,claim:'The benchmark queries many conceptual biospheres while refining only a bounded active set; it is research evidence, not a browser memory certification.'
};
console.log(JSON.stringify(report,null,2));
