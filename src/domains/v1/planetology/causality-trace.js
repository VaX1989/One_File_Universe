(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W)throw new Error('v1 common and world context required for planetary causality trace');
const VERSION='ofu-v1-planetary-causality-trace-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const AUTH=V.authority('v1.planetology.causality-trace','1.0.0',[SOURCE],
  'Bounded deterministic cross-scale attribution over already modeled planetary state. Normalized shares are a formal explanatory seam, not conserved physical energy and not canonical fact.',[
    'All inputs are existing MODEL_DERIVED_SIMULATION state; no P3/P4/P5/P6 authority is promoted.',
    'Influence shares are normalized heuristic attribution, not measured flux fractions or causal identification.',
    'Local responses summarize the selected modeled location only; they are not a global field or observational product.'
  ]);
const LIMIT=1000000,ORDER=Object.freeze(['STELLAR_FORCING','ATMOSPHERE_RETENTION','INTERIOR_GEODYNAMICS','SURFACE_VOLATILES']);
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
const avg=(...xs)=>clamp(xs.reduce((a,x)=>a+clamp(x),0)/Math.max(1,xs.length));
function normalize(raw){
  const rows=ORDER.map((id,i)=>({id,raw:clamp(raw[i])}));
  const sum=rows.reduce((a,r)=>a+r.raw,0);
  if(sum===0)return Object.freeze(rows.map(r=>Object.freeze({id:r.id,inputSignalPpm:0,influenceSharePpm:250000})));
  let used=0;
  const work=rows.map((r,i)=>{const scaled=r.raw*LIMIT,share=Math.floor(scaled/sum),rem=scaled-share*sum;used+=share;return{id:r.id,inputSignalPpm:r.raw,influenceSharePpm:share,rem,i};});
  let left=LIMIT-used;
  const rank=[...work].sort((a,b)=>b.rem-a.rem||a.i-b.i);
  for(let i=0;i<left;i++)rank[i%rank.length].influenceSharePpm++;
  return Object.freeze(work.sort((a,b)=>a.i-b.i).map(({id,inputSignalPpm,influenceSharePpm})=>Object.freeze({id,inputSignalPpm,influenceSharePpm})));
}
function globalSignals(planet){
  const causal=planet?.causal||{},formation=causal.formation||{},atmosphere=planet?.atmosphere||{},interior=planet?.interior||{},geology=planet?.geology||{},hydrology=planet?.hydrology||{},climate=planet?.climate||{};
  const stellar=clamp(formation.irradiationPpm??climate.stellarFluxPpm);
  const atmosphereRetention=avg(atmosphere.pressureProxyPpm,atmosphere.inventoryUnits?Math.min(LIMIT,Number(atmosphere.inventoryUnits)*1000):0,climate.greenhouseDeltaMilliK?Number(climate.greenhouseDeltaMilliK)*2:0);
  const geodynamics=avg(interior.convectiveVigorPpm,interior.volcanismPpm,geology.volcanicActivityPpm,geology.upliftPpm);
  const surfaceVolatiles=avg(hydrology.oceanFractionPpm,hydrology.cyclingPpm,hydrology.iceCoverPpm,planet?.material?.waterContentPpm);
  return Object.freeze([stellar,atmosphereRetention,geodynamics,surfaceVolatiles]);
}
function localResponses(sample){
  const climate=sample?.climate||{},hydrology=sample?.hydrology||{},geology=sample?.geology||{},material=sample?.material||{},topography=sample?.topography||{};
  const temp=Number(climate.localMeanTemperatureMilliK??climate.surfaceTemperatureMilliK??0);
  const temperatureCompatibilityPpm=temp>0?clamp(LIMIT-Math.abs(temp-288000)*LIMIT/240000):0;
  const liquid=hydrology.surfaceLiquid?LIMIT:0;
  const waterActivityPpm=clamp(Math.max(liquid,hydrology.runoffPpm||0,hydrology.subsurfaceIcePotentialPpm||0,material.waterContentPpm||0,climate.precipitationPotentialPpm||0));
  const geodynamicExpressionPpm=avg(geology.volcanicActivityPpm,geology.erosionPpm,topography.slopePpm);
  const atmosphereClimateResponsePpm=avg(temperatureCompatibilityPpm,climate.precipitationPotentialPpm,climate.aridityPpm==null?0:LIMIT-clamp(climate.aridityPpm));
  return Object.freeze({temperatureCompatibilityPpm,waterActivityPpm,geodynamicExpressionPpm,atmosphereClimateResponsePpm,surfaceState:String(hydrology.surfaceState||'UNKNOWN')});
}
function summarize(planet,sample){
  V.assert(planet&&typeof planet==='object','planetary causality planet');
  V.text(String(planet.planetIdentity),'planetIdentity',128);
  const global=normalize(globalSignals(planet)),local=localResponses(sample);
  const globalBy=Object.fromEntries(global.map(x=>[x.id,x.influenceSharePpm]));
  const localRaw=[
    avg(globalBy.STELLAR_FORCING,local.temperatureCompatibilityPpm),
    avg(globalBy.ATMOSPHERE_RETENTION,local.atmosphereClimateResponsePpm),
    avg(globalBy.INTERIOR_GEODYNAMICS,local.geodynamicExpressionPpm),
    avg(globalBy.SURFACE_VOLATILES,local.waterActivityPpm)
  ];
  const localized=normalize(localRaw),globalClosure=global.reduce((a,x)=>a+x.influenceSharePpm,0),localClosure=localized.reduce((a,x)=>a+x.influenceSharePpm,0);
  V.assert(globalClosure===LIMIT&&localClosure===LIMIT,'planetary causality normalized closure');
  return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,locationIdentity:sample?.location?.locationIdentity||null,
    modelClass:'FORMAL_NORMALIZED_CAUSAL_TRACE',authority:AUTH,canonicalClaim:false,physicalConservationClaim:false,
    global:Object.freeze({processes:global,attributionClosurePpm:globalClosure,closureResidualPpm:LIMIT-globalClosure}),
    local:Object.freeze({responses:local,processes:localized,attributionClosurePpm:localClosure,closureResidualPpm:LIMIT-localClosure}),
    provenance:V.provenance('v1.planetology.causality-trace','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'FORMAL_PLANET_TO_REGION_ATTRIBUTION_SEAM',researchAuthorityPromoted:false})
  });
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),trace=summarize(world.planetology,base.surface);
  return V.freezeDeep({...base,planetaryCausality:trace});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1PlanetaryCausalityTrace=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,ORDER,normalize,globalSignals,localResponses,summarize});
})(globalThis);
