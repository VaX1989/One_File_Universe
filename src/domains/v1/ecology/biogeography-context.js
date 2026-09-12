(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,N=O.v1EcologyCausalNiche;
if(!V||!W||!N)throw new Error('v1 common, world context and causal niche required');
const VERSION='ofu-v11-ecology-local-biogeography-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.ecology.local-biogeography','1.0.0',[SOURCE],
  'Bounded deterministic neighborhood comparison over modeled local environments and lineage presence. This is descriptive MODEL_DERIVED_SIMULATION, not measured biogeography, species-range inference or canonical biology.',[
    'Neighborhood cells are fixed local probes around the selected modeled location, not a global survey.',
    'Lineage turnover is set overlap over already modeled local populations; absence from a probe is not empirical absence.',
    'Environmental gradients are differences between reduced-order modeled descriptors, not observations or validated habitat limits.',
    'No dispersal, migration, selection, adaptation, extinction, abundance or P4/P6 state is inferred or mutated.'
  ]);
const LIMIT=1000000,MAX_SITES=5,MAX_POPULATIONS_PER_SITE=12,DELTA_MICRO_DEG=2500000;
const OFFSETS=Object.freeze([
  Object.freeze({id:'CENTER',dLat:0,dLon:0}),
  Object.freeze({id:'NORTH',dLat:DELTA_MICRO_DEG,dLon:0}),
  Object.freeze({id:'SOUTH',dLat:-DELTA_MICRO_DEG,dLon:0}),
  Object.freeze({id:'EAST',dLat:0,dLon:DELTA_MICRO_DEG}),
  Object.freeze({id:'WEST',dLat:0,dLon:-DELTA_MICRO_DEG})
]);
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
const latClamp=x=>Math.max(-90000000,Math.min(90000000,Math.round(x)));
const uniq=xs=>Object.freeze([...new Set(xs.filter(x=>x!==null&&x!==undefined&&String(x).length))].map(String).sort());
function setOverlap(a,b){
  const A=new Set(a),B=new Set(b),union=new Set([...A,...B]),shared=[...A].filter(x=>B.has(x)).length;
  const jaccardPpm=union.size===0?LIMIT:Math.round(shared*LIMIT/union.size);
  return Object.freeze({sharedCount:shared,unionCount:union.size,jaccardPpm:clamp(jaccardPpm),turnoverPpm:clamp(LIMIT-jaccardPpm)});
}
function envVector(environment){
  const e=environment||{};
  return Object.freeze({
    temperatureCompatibilityPpm:clamp(e.temperatureCompatibilityPpm),
    stableSolventPpm:clamp(e.stableSolventPpm),
    nutrientAvailabilityPpm:clamp(e.nutrientAvailabilityPpm),
    freeEnergyAvailabilityPpm:clamp(e.freeEnergyAvailabilityPpm),
    disturbancePpm:clamp(e.disturbancePpm)
  });
}
function envDistance(a,b){
  const keys=['temperatureCompatibilityPpm','stableSolventPpm','nutrientAvailabilityPpm','freeEnergyAvailabilityPpm','disturbancePpm'];
  return clamp(keys.reduce((sum,k)=>sum+Math.abs((a?.[k]||0)-(b?.[k]||0)),0)/keys.length);
}
function siteSummary(id,point,surface,life){
  const populations=(life?.local?.populations||[]).slice(0,MAX_POPULATIONS_PER_SITE);
  const lineageIds=uniq(populations.map(p=>p.lineageId));
  const roles=uniq(populations.map(p=>String(p.role||'UNKNOWN').toUpperCase()));
  return V.freezeDeep({id,point,locationIdentity:point.locationIdentity,surfaceState:String(surface?.hydrology?.surfaceState||'UNKNOWN'),
    populationCount:populations.length,lineageIds,roles,environment:envVector(life?.environment),
    bounded:true,maxPopulations:MAX_POPULATIONS_PER_SITE,authority:AUTH,canonicalBiologyClaim:false});
}
function classify(environmentGradientPpm,lineageTurnoverPpm){
  const env=clamp(environmentGradientPpm),turn=clamp(lineageTurnoverPpm);
  if(env>=250000&&turn>=250000)return 'COMBINED_MODELED_TRANSITION';
  if(env>=250000)return 'MODELED_ENVIRONMENTAL_GRADIENT';
  if(turn>=250000)return 'MODELED_LINEAGE_TURNOVER';
  return 'MODELED_LOCAL_HOMOGENEITY';
}
function summarizeSites(sites){
  V.assert(Array.isArray(sites)&&sites.length>0&&sites.length<=MAX_SITES,'biogeography site bound');
  const center=sites[0];
  V.assert(center.id==='CENTER','biogeography center ordering');
  if(center.populationCount===0)return V.freezeDeep({version:VERSION,supported:false,reason:'NO_MODELED_LOCAL_POPULATIONS',sites:Object.freeze(sites),
    comparisons:Object.freeze([]),siteCount:sites.length,maxSites:MAX_SITES,maxPopulationObservations:MAX_SITES*MAX_POPULATIONS_PER_SITE,
    authority:AUTH,canonicalP6Unchanged:true,globalEnumeration:false});
  const comparisons=sites.slice(1).map(site=>{
    const lineage=setOverlap(center.lineageIds,site.lineageIds),role=setOverlap(center.roles,site.roles),environmentDeltaPpm=envDistance(center.environment,site.environment);
    return V.freezeDeep({siteId:site.id,locationIdentity:site.locationIdentity,environmentDeltaPpm,lineage,role,
      class:classify(environmentDeltaPpm,lineage.turnoverPpm),authority:AUTH});
  });
  const mean=x=>comparisons.length?clamp(comparisons.reduce((s,c)=>s+x(c),0)/comparisons.length):0;
  const meanEnvironmentGradientPpm=mean(c=>c.environmentDeltaPpm),meanLineageTurnoverPpm=mean(c=>c.lineage.turnoverPpm),meanRoleTurnoverPpm=mean(c=>c.role.turnoverPpm);
  return V.freezeDeep({version:VERSION,supported:true,sites:Object.freeze(sites),comparisons:Object.freeze(comparisons),siteCount:sites.length,
    maxSites:MAX_SITES,maxPopulationsPerSite:MAX_POPULATIONS_PER_SITE,maxPopulationObservations:MAX_SITES*MAX_POPULATIONS_PER_SITE,
    meanEnvironmentGradientPpm,meanLineageTurnoverPpm,meanRoleTurnoverPpm,
    neighborhoodClass:classify(meanEnvironmentGradientPpm,meanLineageTurnoverPpm),
    probeGeometry:Object.freeze({kind:'FIXED_CROSS_AROUND_SELECTED_MODELED_LOCATION',deltaMicroDeg:DELTA_MICRO_DEG,globalEnumeration:false}),
    authority:AUTH,canonicalP6Unchanged:true,measuredBiogeography:false,speciesRangeClaim:false,dispersalClaim:false,
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_SPATIAL_ECOLOGY_RECONCILIATION',researchAuthorityPromoted:false})});
}
function probe(world,point,{seasonPpm=0}={}){
  V.assert(world&&world.planetology&&world.planetIdentity,'biogeography world');
  V.assert(point&&point.planetIdentity===world.planetIdentity,'biogeography world identity');
  V.int(seasonPpm,'seasonPpm',0,LIMIT);
  const sites=[];
  for(const offset of OFFSETS){
    const p=W.location(world.planetIdentity,latClamp(point.latMicroDeg+offset.dLat),point.lonMicroDeg+offset.dLon);
    const surface=W.sample(world.planetology,p,seasonPpm),life=W.queryLife(world,p,surface);
    sites.push(siteSummary(offset.id,p,surface,life));
  }
  V.assert(sites.length===MAX_SITES,'biogeography fixed probe count');
  return summarizeSites(sites);
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),biogeography=probe(world,point,options||{});
  return V.freezeDeep({...base,biogeography});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1EcologyBiogeography=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,MAX_SITES,MAX_POPULATIONS_PER_SITE,DELTA_MICRO_DEG,OFFSETS,setOverlap,envVector,envDistance,siteSummary,classify,summarizeSites,probe});
})(globalThis);
