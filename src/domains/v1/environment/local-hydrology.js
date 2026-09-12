(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W||!O.v1SeasonalEnvironment)throw new Error('v1 world context and seasonal environment required for local hydrology context');
const VERSION='ofu-v11-local-hydrology-context-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const PPM=1000000,MAX_PROBES=9,STEP_MICRO_DEG=500000;
const STENCIL=Object.freeze([
  Object.freeze({label:'CENTER',dLat:0,dLon:0}),
  Object.freeze({label:'N',dLat:STEP_MICRO_DEG,dLon:0}),
  Object.freeze({label:'S',dLat:-STEP_MICRO_DEG,dLon:0}),
  Object.freeze({label:'E',dLat:0,dLon:STEP_MICRO_DEG}),
  Object.freeze({label:'W',dLat:0,dLon:-STEP_MICRO_DEG}),
  Object.freeze({label:'NE',dLat:STEP_MICRO_DEG,dLon:STEP_MICRO_DEG}),
  Object.freeze({label:'NW',dLat:STEP_MICRO_DEG,dLon:-STEP_MICRO_DEG}),
  Object.freeze({label:'SE',dLat:-STEP_MICRO_DEG,dLon:STEP_MICRO_DEG}),
  Object.freeze({label:'SW',dLat:-STEP_MICRO_DEG,dLon:-STEP_MICRO_DEG})
]);
const AUTH=V.authority('v1.environment.local-hydrology','1.0.0',[SOURCE],
  'Bounded deterministic local hydrology/topography inspection over an exact modeled location. Nine fixed probes summarize modeled relief, water activity and nearby surface-state variation without asserting real drainage networks or measured hydrology.',[
    'Probe elevations and hydrology remain MODEL_DERIVED_SIMULATION and are not surveyed terrain, river paths or watershed boundaries.',
    'The downhill witness identifies only the lowest sampled modeled neighbor; it does not establish flow direction, flow rate, erosion transport or connectivity beyond the bounded stencil.',
    'Water activity is a descriptive maximum over existing modeled liquid/runoff/precipitation/ice/material signals, not an empirical hydrological index.',
    'No P4 event is admitted and no P5/P6 canonical authority is promoted.'
  ]);
const clamp=x=>Math.max(0,Math.min(PPM,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function waterActivity(surface){
  const h=surface?.hydrology||{},c=surface?.climate||{},m=surface?.material||{};
  return clamp(Math.max(h.surfaceLiquid?PPM:0,h.runoffPpm||0,h.subsurfaceIcePotentialPpm||0,c.precipitationPotentialPpm||0,m.waterContentPpm||0));
}
function probeRecord(label,point,surface){
  const h=surface?.hydrology||{},c=surface?.climate||{},m=surface?.material||{},t=surface?.topography||{};
  const state=String(h.surfaceState||'UNKNOWN'),solidSurface=state!=='NO_SOLID_SURFACE_REFERENCE';
  return V.freezeDeep({label,sourceLocationIdentity:point.locationIdentity,sampleLocationIdentity:surface?.location?.locationIdentity||null,
    latMicroDeg:point.latMicroDeg,lonMicroDeg:point.lonMicroDeg,elevationMeters:Number(t.elevationMeters||0),slopePpm:clamp(t.slopePpm),
    runoffPpm:clamp(h.runoffPpm),precipitationPotentialPpm:clamp(c.precipitationPotentialPpm),waterContentPpm:clamp(m.waterContentPpm),
    subsurfaceIcePotentialPpm:clamp(h.subsurfaceIcePotentialPpm),waterActivityPpm:waterActivity(surface),surfaceState:state,
    surfaceLiquid:!!h.surfaceLiquid,solidSurface,authority:'MODEL_DERIVED_SIMULATION'});
}
function analyze(planetIdentity,point,probes){
  V.text(planetIdentity,'planetIdentity',128);V.assert(point?.planetIdentity===planetIdentity,'local hydrology source identity');
  V.assert(Array.isArray(probes)&&probes.length===MAX_PROBES,'local hydrology exact probe bound');
  const labels=new Set(probes.map(p=>p.label));V.assert(labels.size===MAX_PROBES&&STENCIL.every(s=>labels.has(s.label)),'local hydrology probe labels');
  const center=probes.find(p=>p.label==='CENTER');V.assert(center,'local hydrology center probe');
  const elevations=probes.filter(p=>p.solidSurface).map(p=>p.elevationMeters),water=probes.map(p=>p.waterActivityPpm);
  const reliefMeters=elevations.length?Math.max(...elevations)-Math.min(...elevations):0;
  const neighbors=probes.filter(p=>p.label!=='CENTER'&&p.solidSurface).sort((a,b)=>a.elevationMeters-b.elevationMeters||a.label.localeCompare(b.label));
  const low=neighbors[0]||null;
  const descentWitness=center.solidSurface&&low&&low.elevationMeters<center.elevationMeters?Object.freeze({
    class:'TOPOGRAPHIC_LOW_NEIGHBOR_WITNESS',fromLocationIdentity:center.sourceLocationIdentity,toLocationIdentity:low.sourceLocationIdentity,
    direction:low.label,elevationDropMeters:center.elevationMeters-low.elevationMeters,physicalFlowPathClaim:false,flowRateClaim:false,watershedBoundaryClaim:false
  }):null;
  const wetProbeCount=probes.filter(p=>p.waterActivityPpm>=250000).length,liquidProbeCount=probes.filter(p=>p.surfaceLiquid).length,
    cryosphereProbeCount=probes.filter(p=>p.subsurfaceIcePotentialPpm>=400000).length,
    surfaceStateTransitions=probes.filter(p=>p.label!=='CENTER'&&p.surfaceState!==center.surfaceState).length;
  let contextClass;
  if(!center.solidSurface)contextClass='NO_SOLID_SURFACE_REFERENCE';
  else if(center.surfaceLiquid)contextClass='MODELED_SURFACE_LIQUID_CONTEXT';
  else if(descentWitness&&wetProbeCount>=3)contextClass='MODELED_WET_DRAINAGE_POTENTIAL';
  else if(wetProbeCount>=3)contextClass='MODELED_WET_SURFACE_CONTEXT';
  else if(cryosphereProbeCount>=3)contextClass='MODELED_CRYOSPHERIC_CONTEXT';
  else if(descentWitness)contextClass='MODELED_TOPOGRAPHIC_DESCENT_CONTEXT';
  else contextClass='MODELED_LOW_WATER_ACTIVITY_CONTEXT';
  return V.freezeDeep({center,reliefMeters,waterActivityRangePpm:Object.freeze({min:Math.min(...water),max:Math.max(...water),amplitude:Math.max(...water)-Math.min(...water)}),
    wetProbeCount,liquidProbeCount,cryosphereProbeCount,surfaceStateTransitions,distinctLocations:new Set(probes.map(p=>p.sourceLocationIdentity)).size,
    descentWitness,contextClass,physicalDrainageNetworkClaim:false,watershedBoundaryClaim:false,measuredHydrologyClaim:false});
}
function summarize(planet,point,{seasonPpm=0,centerSample=null}={}){
  V.assert(planet&&typeof planet==='object','local hydrology planet');V.assert(point?.planetIdentity===planet.planetIdentity,'local hydrology exact world/location identity');
  V.int(seasonPpm,'seasonPpm',0,PPM);
  const probes=STENCIL.map(spec=>{
    const lat=Math.max(-90000000,Math.min(90000000,point.latMicroDeg+spec.dLat)),at=W.location(planet.planetIdentity,lat,point.lonMicroDeg+spec.dLon);
    let surface;
    if(spec.label==='CENTER'&&centerSample){
      V.assert(centerSample.location?.latMicroDeg===point.latMicroDeg&&centerSample.location?.lonMicroDeg===point.lonMicroDeg,'local hydrology reused center sample identity');surface=centerSample;
    }else surface=W.sample(planet,at,seasonPpm);
    return probeRecord(spec.label,at,surface);
  });
  const summary=analyze(planet.planetIdentity,point,probes);
  return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,locationIdentity:point.locationIdentity,seasonPpm,modelClass:'BOUNDED_LOCAL_HYDROLOGY_NEIGHBORHOOD',
    probes:Object.freeze(probes),summary,bounds:Object.freeze({maxProbes:MAX_PROBES,materializedProbes:probes.length,stepMicroDeg:STEP_MICRO_DEG,additionalSurfaceQueries:centerSample?MAX_PROBES-1:MAX_PROBES,globalEnumeration:false}),
    authority:AUTH,canonicalPromotion:false,measured:false,physicalFlowPathClaim:false,watershedBoundaryClaim:false,riverNetworkClaim:false,floodRiskClaim:false,
    p4HistoryMutated:false,canonicalP5Unchanged:true,canonicalP6Unchanged:true,
    provenance:V.provenance('v1.environment.local-hydrology','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_LOCAL_HYDROLOGY_AND_RELIEF_INSPECTION',researchAuthorityPromoted:false})});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options={}){
  const base=previousLocalContext(world,point,options),seasonPpm=Number(options?.seasonPpm??0),localHydrology=summarize(world.planetology,point,{seasonPpm,centerSample:base.surface});
  return V.freezeDeep({...base,localHydrology});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1LocalHydrology=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,PPM,MAX_PROBES,STEP_MICRO_DEG,STENCIL,waterActivity,probeRecord,analyze,summarize});
})(globalThis);
