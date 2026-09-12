import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
const freezeDeep=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freezeDeep(v);Object.freeze(value);}return value;};
const V={
  authority(_id,_version,_sources,_summary,_limits){return Object.freeze({class:'MODEL_DERIVED_SIMULATION'});},
  assert(ok,msg){if(!ok)throw new Error(msg);},
  freezeDeep,
  int(v,name,min,max){if(!Number.isSafeInteger(v)||v<min||v>max)throw new RangeError(name);return v;},
  text(v,name,max){if(typeof v!=='string'||v.length===0||v.length>max)throw new TypeError(name);return v;}
};
const planetIdentity='p'.repeat(64);
const normalizeLon=x=>((x+180000000)%360000000+360000000)%360000000-180000000;
function location(id,lat,lon){return Object.freeze({planetIdentity:id,latMicroDeg:lat,lonMicroDeg:normalizeLon(lon),locationIdentity:`${lat}:${normalizeLon(lon)}`});}
function envFor(point){
  if(point.latMicroDeg>1000000)return {temperatureCompatibilityPpm:400000,stableSolventPpm:250000,nutrientAvailabilityPpm:350000,freeEnergyAvailabilityPpm:420000,disturbancePpm:650000};
  if(point.latMicroDeg<-1000000)return {temperatureCompatibilityPpm:850000,stableSolventPpm:820000,nutrientAvailabilityPpm:780000,freeEnergyAvailabilityPpm:760000,disturbancePpm:120000};
  if(point.lonMicroDeg>1000000)return {temperatureCompatibilityPpm:300000,stableSolventPpm:150000,nutrientAvailabilityPpm:250000,freeEnergyAvailabilityPpm:300000,disturbancePpm:800000};
  return {temperatureCompatibilityPpm:800000,stableSolventPpm:760000,nutrientAvailabilityPpm:720000,freeEnergyAvailabilityPpm:740000,disturbancePpm:150000};
}
function populationsFor(point){
  if(point.latMicroDeg>1000000)return [{populationId:'n1',lineageId:'L1',role:'PRIMARY_PRODUCER'},{populationId:'n2',lineageId:'L3',role:'PREDATOR'}];
  if(point.latMicroDeg<-1000000)return [{populationId:'s1',lineageId:'L4',role:'CHEMOTROPH'}];
  if(point.lonMicroDeg>1000000)return [{populationId:'e1',lineageId:'L5',role:'EXTREMOPHILE'}];
  return [{populationId:'c1',lineageId:'L1',role:'PRIMARY_PRODUCER'},{populationId:'c2',lineageId:'L2',role:'CONSUMER'}];
}
const W={
  location,
  sample(_planet,point,seasonPpm){return Object.freeze({location:point,hydrology:{surfaceState:'LAND_OR_EXPOSED_SUBSTRATE'},seasonPpm});},
  queryLife(_world,point){return freezeDeep({local:{populations:populationsFor(point)},environment:envFor(point)});},
  localContext(_world,point){return freezeDeep({planetIdentity,point,baseWitness:'PRESERVED',ecologyCausality:{supported:true}});}
};
globalThis.OFU={v1Common:V,v1WorldContext:W,v1EcologyCausalNiche:{VERSION:'mock'}};
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/domains/v1/ecology/biogeography-context.js'),'utf8'),{filename:'biogeography-context.js'});
const B=OFU.v1EcologyBiogeography;
assert.equal(B.VERSION,'ofu-v11-ecology-local-biogeography-1');
assert.equal(B.AUTHORITY.class,'MODEL_DERIVED_SIMULATION');
assert.equal(B.OFFSETS.length,5);assert.equal(B.MAX_SITES,5);assert.equal(B.MAX_POPULATIONS_PER_SITE,12);
const overlap=B.setOverlap(['L1','L2'],['L1','L3']);
assert.deepEqual(overlap,{sharedCount:1,unionCount:3,jaccardPpm:333333,turnoverPpm:666667});
assert.equal(B.setOverlap([],[]).jaccardPpm,1000000);
const point=location(planetIdentity,0,0),world={planetIdentity,planetology:{planetIdentity}};
const a=B.probe(world,point,{seasonPpm:250000}),b=B.probe(world,point,{seasonPpm:250000});
assert.deepEqual(a,b);assert.equal(a.supported,true);assert.equal(a.siteCount,5);assert.equal(a.maxPopulationObservations,60);assert.equal(a.comparisons.length,4);
assert.equal(a.measuredBiogeography,false);assert.equal(a.speciesRangeClaim,false);assert.equal(a.dispersalClaim,false);assert.equal(a.canonicalP6Unchanged,true);
assert.ok(a.meanEnvironmentGradientPpm>0);assert.ok(a.meanLineageTurnoverPpm>0);
assert.ok(['COMBINED_MODELED_TRANSITION','MODELED_ENVIRONMENTAL_GRADIENT','MODELED_LINEAGE_TURNOVER','MODELED_LOCAL_HOMOGENEITY'].includes(a.neighborhoodClass));
const north=a.comparisons.find(x=>x.siteId==='NORTH'),east=a.comparisons.find(x=>x.siteId==='EAST');
assert.ok(north.lineage.turnoverPpm>0);assert.ok(east.environmentDeltaPpm>0);assert.equal(east.lineage.turnoverPpm,1000000);
const composed=OFU.v1WorldContext.localContext(world,point,{seasonPpm:250000});
assert.equal(composed.baseWitness,'PRESERVED');assert.equal(composed.ecologyCausality.supported,true);assert.equal(composed.biogeography.siteCount,5);
const emptySite=(id)=>freezeDeep({id,locationIdentity:id,populationCount:0,lineageIds:[],roles:[],environment:B.envVector({}),authority:B.AUTHORITY});
const unsupported=B.summarizeSites([emptySite('CENTER'),emptySite('NORTH')]);
assert.equal(unsupported.supported,false);assert.equal(unsupported.reason,'NO_MODELED_LOCAL_POPULATIONS');
assert.throws(()=>B.summarizeSites(Array.from({length:6},(_,i)=>emptySite(i===0?'CENTER':String(i)))));
const nearPole=location(planetIdentity,89500000,179000000),polar=B.probe(world,nearPole,{seasonPpm:0});
assert.equal(polar.siteCount,5);assert.ok(polar.sites.every(s=>s.point.latMicroDeg<=90000000&&s.point.latMicroDeg>=-90000000));
assert.ok(polar.sites.every(s=>s.point.lonMicroDeg<180000000&&s.point.lonMicroDeg>=-180000000));
console.log(JSON.stringify({status:'PASS',suite:'v1.1 local biogeography',version:B.VERSION,sites:a.siteCount,observations:a.maxPopulationObservations,class:a.neighborhoodClass}));
