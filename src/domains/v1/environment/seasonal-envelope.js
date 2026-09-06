(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W)throw new Error('v1 common and world context required for seasonal environment envelope');
const VERSION='ofu-v11-seasonal-environment-envelope-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const AUTH=V.authority('v1.environment.seasonal-envelope','1.0.0',[SOURCE],
  'Bounded deterministic four-phase seasonal envelope over an exact modeled location. It summarizes the existing reduced-order environment model and does not create measured weather, empirical climate normals or canonical environmental facts.',[
    'Four fixed phase samples are a model-inspection seam, not a forecast or observational time series.',
    'World-context location identity and environment-sample location identity are distinct deterministic namespaces and are never conflated.',
    'Temperature, precipitation, hydrology and surface-state outputs remain MODEL_DERIVED_SIMULATION.',
    'No P4 history is admitted or mutated and no P5/P6 canonical authority is promoted.'
  ]);
const LIMIT=1000000,MAX_SAMPLES=4;
const SEASON_MARKS=Object.freeze([0,250000,500000,750000]);
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function samplePhase(planet,point,seasonPpm){
  V.int(seasonPpm,'seasonPpm',0,LIMIT);
  const surface=W.sample(planet,point,seasonPpm),environment=W.localEnvironment(planet,surface);
  const h=surface.hydrology||{},c=surface.climate||{},m=surface.material||{};
  const liquid=h.surfaceLiquid?LIMIT:0;
  const waterActivityPpm=clamp(Math.max(liquid,h.runoffPpm||0,h.subsurfaceIcePotentialPpm||0,m.waterContentPpm||0,c.precipitationPotentialPpm||0));
  return V.freezeDeep({
    seasonPpm,
    sourceLocationIdentity:point.locationIdentity,
    sampleLocationIdentity:surface.location.locationIdentity,
    latMicroDeg:point.latMicroDeg,
    lonMicroDeg:point.lonMicroDeg,
    localMeanTemperatureMilliK:Number(c.localMeanTemperatureMilliK||0),
    precipitationPotentialPpm:clamp(c.precipitationPotentialPpm),
    aridityPpm:clamp(c.aridityPpm),
    waterActivityPpm,
    runoffPpm:clamp(h.runoffPpm),
    subsurfaceIcePotentialPpm:clamp(h.subsurfaceIcePotentialPpm),
    temperatureCompatibilityPpm:clamp(environment.temperatureCompatibilityPpm),
    mediumAvailable:!!environment.mediumAvailable,
    surfaceState:String(h.surfaceState||'UNKNOWN'),
    surfaceLiquid:!!h.surfaceLiquid,
    authority:'MODEL_DERIVED_SIMULATION'
  });
}
function range(values){
  const min=Math.min(...values),max=Math.max(...values);
  return Object.freeze({min,max,amplitude:max-min});
}
function summarize(planet,point){
  V.assert(planet&&typeof planet==='object','seasonal envelope planet');
  V.assert(point&&point.planetIdentity===planet.planetIdentity,'seasonal envelope exact world/location identity');
  const snapshots=Object.freeze(SEASON_MARKS.map(season=>samplePhase(planet,point,season)));
  V.assert(snapshots.length===MAX_SAMPLES,'seasonal sample bound');
  V.assert(new Set(snapshots.map(x=>x.sourceLocationIdentity)).size===1,'seasonal source location identity continuity');
  V.assert(new Set(snapshots.map(x=>x.sampleLocationIdentity)).size===1,'seasonal sample location identity continuity');
  const temperature=range(snapshots.map(x=>x.localMeanTemperatureMilliK));
  const precipitation=range(snapshots.map(x=>x.precipitationPotentialPpm));
  const waterActivity=range(snapshots.map(x=>x.waterActivityPpm));
  let surfaceStateTransitions=0;
  for(let i=0;i<snapshots.length;i++)if(snapshots[i].surfaceState!==snapshots[(i+1)%snapshots.length].surfaceState)surfaceStateTransitions++;
  const mediumAvailableSeasons=snapshots.filter(x=>x.mediumAvailable).length;
  return V.freezeDeep({
    version:VERSION,
    worldIdentity:planet.planetIdentity,
    locationIdentity:point.locationIdentity,
    sampleLocationIdentity:snapshots[0].sampleLocationIdentity,
    locationIdentitySemantics:'WORLD_CONTEXT_SOURCE_AND_ENVIRONMENT_SAMPLE_IDENTITIES_ARE_DISTINCT',
    modelClass:'BOUNDED_FOUR_PHASE_SEASONAL_ENVIRONMENT_ENVELOPE',
    seasonMarksPpm:SEASON_MARKS,
    sampleCount:snapshots.length,
    maxSamples:MAX_SAMPLES,
    snapshots,
    temperatureMilliK:temperature,
    precipitationPotentialPpm:precipitation,
    waterActivityPpm:waterActivity,
    mediumAvailableSeasons,
    surfaceStateTransitions,
    surfaceStates:Object.freeze([...new Set(snapshots.map(x=>x.surfaceState))]),
    bounded:true,
    globalEnumeration:false,
    weatherForecastClaim:false,
    empiricalClimateNormalClaim:false,
    measuredClimateClaim:false,
    canonicalClimateClaim:false,
    p4HistoryMutated:false,
    canonicalP5Unchanged:true,
    canonicalP6Unchanged:true,
    authority:AUTH,
    provenance:V.provenance('v1.environment.seasonal-envelope','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_SEASONAL_LOCAL_ENVIRONMENT_INSPECTION',researchAuthorityPromoted:false})
  });
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),seasonalEnvironment=summarize(world.planetology,point);
  return V.freezeDeep({...base,seasonalEnvironment});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1SeasonalEnvironment=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,MAX_SAMPLES,SEASON_MARKS,samplePhase,summarize});
})(globalThis);
