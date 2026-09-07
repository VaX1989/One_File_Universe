(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere,CV=O.v2x05ClimateVolatile;
if(!C||!IA||!CV)throw new Error('V2X-05 deep planet dependencies missing');
const VERSION='ofu-v2x-05-deep-planet-provider-2',CONTRACT='ofu-v2x-05-deep-planet-consumer-1',AUTHORITY=C.AUTHORITY;
const CONTEXTS=Object.freeze(['RENDERING_CONTEXT','ECOLOGY_CONTEXT','GAMEPLAY_CAUSAL_CONTEXT','SURFACE_PROMPT08_CONTEXT']);
const RESEARCH_ROUTING=Object.freeze([
  Object.freeze({feature:'CALIBRATED_INTERIOR_EOS_OR_MASS_RADIUS_INVERSION',status:'RESEARCH_REQUIRED',route:'PROMPT_17_PLANETOLOGY_FRONTIER'}),
  Object.freeze({feature:'ATMOSPHERIC_ESCAPE_RATE_OR_INTEGRATED_MASS_LOSS',status:'RESEARCH_REQUIRED',route:'ATMOSPHERE-ESCAPE-02'}),
  Object.freeze({feature:'CALIBRATED_ENERGY_BALANCE_OR_EFFECTIVE_EMISSION_TEMPERATURE',status:'RESEARCH_REQUIRED',route:'CLIMATE-EBM-02'}),
  Object.freeze({feature:'RESOLVED_GEODYNAMIC_OR_TECTONIC_HISTORY',status:'RESEARCH_REQUIRED',route:'GEODYNAMICS-02'}),
  Object.freeze({feature:'PHYSICAL_OCEAN_CRYOSPHERE_CYCLING_OR_DEPTH',status:'RESEARCH_REQUIRED',route:'VOLATILE-SURFACE-02'})
]);
const LIMITATIONS=Object.freeze([
  'Consumes existing V1 model-derived planetology state and never promotes it to canonical truth.',
  'Regime, interior, atmospheric, climate, volatile and causal outputs are deterministic reduced-order context, not observations or retrievals.',
  'No calibrated equation of state, general circulation model, weather forecast, photochemistry, plate-tectonic history or atmospheric escape rate is implemented.',
  'Optional XUV history is contextual only and never creates P4 history or integrated physical mass loss.',
  'Normalized causal attribution is explanatory weighting, not conserved energy or causal identification.'
]);
function failed(worldIdentity,reason,extra={}){return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:worldIdentity||null,supported:false,status:'UNSUPPORTED',reason,...extra,authority:AUTHORITY,limitations:LIMITATIONS,canonicalPromotion:false});}
function evaluate(planet,options={}){
  const regime=C.classify(planet);if(!regime.supported)return failed(regime.worldIdentity,regime.reason,{regime});
  const interior=IA.interiorState(planet,regime);if(!interior.supported)return failed(regime.worldIdentity,interior.reason||'INTERIOR_STAGE_UNSUPPORTED',{regime,interior});
  const atmosphere=IA.atmosphereState(planet,regime,options);if(!atmosphere.supported)return failed(regime.worldIdentity,atmosphere.reason||'ATMOSPHERE_STAGE_UNSUPPORTED',{regime,interior,atmosphere});
  const radiative=IA.radiativeState(planet,regime,atmosphere);if(!radiative.supported)return failed(regime.worldIdentity,radiative.reason||'RADIATIVE_STAGE_UNSUPPORTED',{regime,interior,atmosphere,radiative});
  const climate=CV.climateEnvelope(planet,regime,radiative,atmosphere);if(!climate.supported)return failed(regime.worldIdentity,climate.reason||'CLIMATE_STAGE_UNSUPPORTED',{regime,interior,atmosphere,radiative,climate});
  const volatile=CV.volatilePartition(planet,regime,radiative,climate);if(!volatile.supported)return failed(regime.worldIdentity,volatile.reason||'VOLATILE_STAGE_UNSUPPORTED',{regime,interior,atmosphere,radiative,climate,volatile});
  const causality=CV.causalAttribution(planet,regime,interior,atmosphere,volatile);if(!causality.supported)return failed(regime.worldIdentity,causality.reason||'CAUSAL_ATTRIBUTION_STAGE_UNSUPPORTED',{regime,interior,atmosphere,radiative,climate,volatile,causality});
  return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:regime.worldIdentity,supported:true,status:'PRESENT',authority:AUTHORITY,lifecycle:'SHIPPING',regime,interior,atmosphere,radiative,climate,volatile,causality,
    fidelity:C.freeze({regime:'deep-planet-reduced-order',validity:'Known V1 planetology bulk regimes inside explicit V2X-05 bounds and exact modeled-state closure checks',resolution:'One selected modeled world with at most 24 climate cells, 6 atmospheric constituent families and 64 optional XUV history samples',uncertainty:'Heuristic scenario depth only; unsupported physics remains explicit'}),
    bounds:C.freeze({...C.LIMITS,climateCellsObserved:climate.cellCount,constituentsObserved:atmosphere.composition.constituentCount||0,xuvHistorySamplesObserved:atmosphere.retentionEscape.samples||0}),limitations:LIMITATIONS,researchRouting:RESEARCH_ROUTING,
    integrity:C.freeze({sourceInputMutation:false,identityConsistencyRequired:true,compositionClosureRequired:true,interiorLayerClosureRequired:true,exactVolatileArithmeticBounded:true,quarterSeasonIntegerKernel:true}),
    claims:C.freeze({canonicalTruthChanged:false,p4HistoryMutated:false,eosCalibrated:false,gcm:false,weatherForecast:false,photochemistry:false,plateTectonicsResolved:false,observationalRetrieval:false}),canonicalPromotion:false});
}
function validEvaluationShape(e){
  if(!e||typeof e!=='object'||e.contract!==CONTRACT||e.version!==VERSION||e.authority!==AUTHORITY||e.supported!==true||e.status!=='PRESENT'||!Object.isFrozen(e))return false;
  if(typeof e.worldIdentity!=='string'||!e.worldIdentity)return false;
  const objects=['regime','interior','atmosphere','radiative','climate','volatile','causality'];
  if(objects.some(k=>!e[k]||typeof e[k]!=='object'||!Object.isFrozen(e[k])))return false;
  if(objects.some(k=>e[k].worldIdentity!==e.worldIdentity))return false;
  if(typeof e.regime.regime!=='string'||typeof e.regime.solidSurfaceModel!=='boolean')return false;
  if(!e.interior.geodynamics||typeof e.interior.geodynamics!=='object'||typeof e.interior.geodynamics.supported!=='boolean')return false;
  if(!e.atmosphere.composition||typeof e.atmosphere.composition!=='object'||typeof e.atmosphere.composition.supported!=='boolean'||typeof e.atmosphere.composition.family!=='string'||!e.atmosphere.retentionEscape||typeof e.atmosphere.retentionEscape!=='object')return false;
  if(e.atmosphere.composition.supported&&e.atmosphere.composition.shareClosurePpm!==C.PPM)return false;
  if(!C.safe(e.atmosphere.pressureProxyPpm,0,12000000)||!C.safe(e.atmosphere.cloudCondensatePotentialPpm,0,C.PPM)||!C.safe(e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,0,970000))return false;
  if(!e.radiative.modeledSurfaceTemperature||typeof e.radiative.modeledSurfaceTemperature!=='object')return false;
  const surfaceT=e.radiative.modeledSurfaceTemperature.temperatureMilliK;if(surfaceT!==null&&!C.safe(surfaceT,20000,3000000))return false;
  if(!e.climate.temperatureRangeMilliK||!C.safe(e.climate.temperatureRangeMilliK.amplitude,0,2980000))return false;
  if(!e.volatile.surface||typeof e.volatile.surface!=='object'||typeof e.volatile.surface.oceanCandidate!=='boolean'||!C.safe(e.volatile.surface.cryosphereUnits,0,C.LIMITS.exactInventoryUnits))return false;
  if(!Array.isArray(e.causality.drivers)||e.causality.drivers.length!==6||e.causality.drivers.some(d=>!d||typeof d.driver!=='string'||!C.safe(d.sharePpm,0,C.PPM))||e.causality.drivers.reduce((n,d)=>n+d.sharePpm,0)!==C.PPM)return false;
  return true;
}
function ensureEvaluation(value,options){
  if(value&&value.contract===CONTRACT){
    if(validEvaluationShape(value))return value;
    return failed(value.worldIdentity||null,'MALFORMED_PRECOMPUTED_EVALUATION');
  }
  return evaluate(value,options);
}
function query(value,context,options={}){
  if(!CONTEXTS.includes(context))return C.freeze({version:VERSION,contract:CONTRACT,supported:false,status:'UNSUPPORTED',reason:'UNKNOWN_CONSUMER_CONTEXT',context:String(context),authority:AUTHORITY});
  const e=ensureEvaluation(value,options);if(!e.supported)return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:e.worldIdentity||null,supported:false,status:'UNSUPPORTED',reason:e.reason||'DEEP_PLANET_EVALUATION_UNSUPPORTED',context,authority:AUTHORITY});
  let payload;
  if(context==='RENDERING_CONTEXT')payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,atmosphereFamily:e.atmosphere.composition.family||'UNKNOWN',pressureProxyPpm:e.atmosphere.pressureProxyPpm,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,cloudCondensatePotentialPpm:e.atmosphere.cloudCondensatePotentialPpm,cryospherePresent:e.volatile.surface.cryosphereUnits>0};
  else if(context==='ECOLOGY_CONTEXT')payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,collisionalAtmosphere:e.atmosphere.composition.supported,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,oceanCandidate:e.volatile.surface.oceanCandidate,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,canonicalHabitabilityClaim:false};
  else if(context==='GAMEPLAY_CAUSAL_CONTEXT')payload={regime:e.regime.regime,escapeContextPpm:e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,volcanicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.volcanicPotentialPpm:null,tectonicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.tectonicPotentialPpm:null,driverAttribution:e.causality.drivers,canonicalEventAdmission:false};
  else payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,geodynamics:e.interior.geodynamics,volatileSurface:e.volatile.surface,plateTectonicsResolved:false,surfaceGeometryClaim:false};
  return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:e.worldIdentity,supported:true,status:'PRESENT',context,authority:AUTHORITY,readOnly:true,hiddenGlobalRequired:false,payload:C.freeze(payload),canonicalPromotion:false});
}
function limitations(){return LIMITATIONS;}
O.v2x05DeepPlanetProvider=Object.freeze({VERSION,CONTRACT,AUTHORITY,CONTEXTS,LIMITATIONS,RESEARCH_ROUTING,evaluate,validEvaluationShape,query,limitations});
})(typeof globalThis!=='undefined'?globalThis:this);
