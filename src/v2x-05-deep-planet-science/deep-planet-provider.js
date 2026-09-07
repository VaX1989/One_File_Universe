(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere,CV=O.v2x05ClimateVolatile;
if(!C||!IA||!CV)throw new Error('V2X-05 deep planet dependencies missing');
const VERSION='ofu-v2x-05-deep-planet-provider-1',CONTRACT='ofu-v2x-05-deep-planet-consumer-1',AUTHORITY=C.AUTHORITY;
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
function evaluate(planet,options={}){
  const regime=C.classify(planet);if(!regime.supported)return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:regime.worldIdentity||null,supported:false,status:'UNSUPPORTED',reason:regime.reason,regime,authority:AUTHORITY,limitations:LIMITATIONS,canonicalPromotion:false});
  const interior=IA.interiorState(planet,regime),atmosphere=IA.atmosphereState(planet,regime,options),radiative=IA.radiativeState(planet,regime,atmosphere);
  if(!interior.supported||!atmosphere.supported||!radiative.supported)return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:regime.worldIdentity,supported:false,status:'UNSUPPORTED',reason:'DEPENDENT_DEEP_PLANET_STAGE_UNSUPPORTED',regime,interior,atmosphere,radiative,authority:AUTHORITY,limitations:LIMITATIONS,canonicalPromotion:false});
  const climate=CV.climateEnvelope(planet,regime,radiative,atmosphere),volatile=CV.volatilePartition(planet,regime,radiative,climate);
  if(!climate.supported||!volatile.supported)return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:regime.worldIdentity,supported:false,status:'UNSUPPORTED',reason:'CLIMATE_OR_VOLATILE_STAGE_UNSUPPORTED',regime,interior,atmosphere,radiative,climate,volatile,authority:AUTHORITY,limitations:LIMITATIONS,canonicalPromotion:false});
  const causality=CV.causalAttribution(planet,regime,interior,atmosphere,volatile);
  return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:regime.worldIdentity,supported:true,status:'PRESENT',authority:AUTHORITY,lifecycle:'SHIPPING',regime,interior,atmosphere,radiative,climate,volatile,causality,
    fidelity:C.freeze({regime:'deep-planet-reduced-order',validity:'Known V1 planetology bulk regimes inside explicit V2X-05 bounds',resolution:'One selected modeled world with at most 24 climate cells, 6 atmospheric constituent families and 64 optional XUV history samples',uncertainty:'Heuristic scenario depth only; unsupported physics remains explicit'}),
    bounds:C.freeze({...C.LIMITS,climateCellsObserved:climate.cellCount,constituentsObserved:atmosphere.composition.constituentCount||0,xuvHistorySamplesObserved:atmosphere.retentionEscape.samples||0}),limitations:LIMITATIONS,researchRouting:RESEARCH_ROUTING,
    claims:C.freeze({canonicalTruthChanged:false,p4HistoryMutated:false,eosCalibrated:false,gcm:false,weatherForecast:false,photochemistry:false,plateTectonicsResolved:false,observationalRetrieval:false}),canonicalPromotion:false});
}
function ensureEvaluation(value,options){return value&&value.contract===CONTRACT&&Object.prototype.hasOwnProperty.call(value,'regime')?value:evaluate(value,options);}
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
O.v2x05DeepPlanetProvider=Object.freeze({VERSION,CONTRACT,AUTHORITY,CONTEXTS,LIMITATIONS,RESEARCH_ROUTING,evaluate,query,limitations});
})(typeof globalThis!=='undefined'?globalThis:this);
