import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
const freezeDeep=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freezeDeep(v);Object.freeze(value);}return value;};
const V={
  authority(){return Object.freeze({class:'MODEL_DERIVED_SIMULATION'});},
  assert(ok,msg){if(!ok)throw new Error(msg);},
  freezeDeep,
  int(v,name,min,max){if(!Number.isSafeInteger(v)||v<min||v>max)throw new RangeError(name);return v;},
  text(v,name,max){if(typeof v!=='string'||v.length===0||v.length>max)throw new TypeError(name);return v;}
};
const planetIdentity='p'.repeat(64),ORDER=Object.freeze(['STELLAR_FORCING','ATMOSPHERE_RETENTION','INTERIOR_GEODYNAMICS','SURFACE_VOLATILES']);
const populations=Object.freeze([
  Object.freeze({populationId:'a'.repeat(64),lineageId:'1'.repeat(64),role:'PRIMARY_PRODUCER',trophicLevel:1,localDensityPpm:720000}),
  Object.freeze({populationId:'b'.repeat(64),lineageId:'2'.repeat(64),role:'CONSUMER',trophicLevel:2,localDensityPpm:460000}),
  Object.freeze({populationId:'c'.repeat(64),lineageId:'3'.repeat(64),role:'PREDATOR',trophicLevel:3,localDensityPpm:280000})
]);
const environment=Object.freeze({temperatureCompatibilityPpm:800000,stableSolventPpm:700000,nutrientAvailabilityPpm:650000,freeEnergyAvailabilityPpm:700000,disturbancePpm:150000});
const trace=freezeDeep({local:{processes:ORDER.map((id,i)=>({id,influenceSharePpm:[350000,200000,250000,200000][i]}))}});
const normalizeLon=x=>((x+180000000)%360000000+360000000)%360000000-180000000;
function location(id,lat,lon){return Object.freeze({planetIdentity:id,latMicroDeg:lat,lonMicroDeg:normalizeLon(lon),locationIdentity:`loc:${lat}:${normalizeLon(lon)}`});}
const basePoint=location(planetIdentity,0,0);
const initialWorldContext={
  location,
  sample(_planet,point,seasonPpm){return freezeDeep({location:point,hydrology:{surfaceState:'LAND_OR_EXPOSED_SUBSTRATE'},seasonPpm});},
  queryLife(_world,point){const localPops=point.latMicroDeg>1000000?populations.slice(0,2):point.lonMicroDeg>1000000?populations.slice(1):populations;return freezeDeep({environment,local:{populations:localPops}});},
  localContext(){return freezeDeep({planetIdentity,point:basePoint,planetaryCausality:trace,life:{environment,local:{populations}},rootWitness:'BASE_CONTEXT'});}
};
const ecology={trophicNetwork(){return freezeDeep({worldIdentity:planetIdentity,generation:7,nodes:populations,edges:[
  {interactionId:'edge-1',fromPopulationId:populations[1].populationId,toPopulationId:populations[0].populationId,type:'TROPHIC',strengthPpm:320000,energyTransferEfficiencyPpm:120000},
  {interactionId:'edge-2',fromPopulationId:populations[2].populationId,toPopulationId:populations[1].populationId,type:'TROPHIC',strengthPpm:240000,energyTransferEfficiencyPpm:90000}
]});}};
globalThis.OFU={v1Common:V,v1WorldContext:Object.freeze(initialWorldContext),v1PlanetaryCausalityTrace:Object.freeze({ORDER}),v1Ecology:ecology};
for(const rel of ['src/domains/v1/ecology/causal-niche.js','src/domains/v1/ecology/biogeography-context.js','src/domains/v1/ecology/local-trophic-context.js']){
  vm.runInThisContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),{filename:rel});
}
const world={planetIdentity,planetology:{planetIdentity},biology:{ecosystem:{state:'MODELED_BIOSPHERE'}}};
const a=OFU.v1WorldContext.localContext(world,basePoint,{seasonPpm:250000}),b=OFU.v1WorldContext.localContext(world,basePoint,{seasonPpm:250000});
assert.deepEqual(a,b);
assert.equal(a.rootWitness,'BASE_CONTEXT');
assert.equal(a.planetaryCausality,trace);
assert.equal(a.ecologyCausality.supported,true);assert.equal(a.ecologyCausality.populationCount,3);
assert.equal(a.biogeography.supported,true);assert.equal(a.biogeography.siteCount,5);assert.equal(a.biogeography.maxPopulationObservations,60);
assert.equal(a.localInteractionNetwork.supported,true);assert.equal(a.localInteractionNetwork.nodeCount,3);assert.equal(a.localInteractionNetwork.edgeCount,2);
assert.equal(a.localInteractionNetwork.syntheticEdgesAdded,false);assert.equal(a.localInteractionNetwork.canonicalP6Unchanged,true);
assert.equal(a.ecologyCausality.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.biogeography.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.localInteractionNetwork.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(OFU.v1EcologyCausalNiche.VERSION,'ofu-v11-ecology-causal-niche-1');assert.equal(OFU.v1EcologyBiogeography.VERSION,'ofu-v11-ecology-local-biogeography-1');assert.equal(OFU.v1EcologyLocalInteractionNetwork.VERSION,'ofu-v11-ecology-local-interaction-network-1');
console.log(JSON.stringify({status:'PASS',suite:'v1.1 local ecology wrapper composition',fields:['planetaryCausality','ecologyCausality','biogeography','localInteractionNetwork'],populations:a.ecologyCausality.populationCount,sites:a.biogeography.siteCount,edges:a.localInteractionNetwork.edgeCount}));
