(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere,CV=O.v2x05ClimateVolatile;
if(!C||!IA||!CV)throw new Error('V2X-05 deep planet dependencies missing');
const VERSION='ofu-v2x-05-deep-planet-provider-2',CONTRACT='ofu-v2x-05-deep-planet-consumer-1',SURFACE_ADAPTER='ofu-v2x05-v2x06-surface-adapter-1',AUTHORITY=C.AUTHORITY;
const CONTEXTS=Object.freeze(['RENDERING_CONTEXT','ECOLOGY_CONTEXT','GAMEPLAY_CAUSAL_CONTEXT','SURFACE_PROMPT08_CONTEXT']);
const SURFACE_WITHHELD=C.freeze([
  C.freeze({field:'waterAreaPpm',status:'WITHHELD',reason:'V2X05_VOLATILE_INVENTORY_IS_NOT_SURFACE_AREA'}),
  C.freeze({field:'iceAreaPpm',status:'WITHHELD',reason:'V2X05_CRYOSPHERE_INVENTORY_IS_NOT_SURFACE_AREA'}),
  C.freeze({field:'erosionActivityPpm',status:'WITHHELD',reason:'SURFACE_PROCESS_OWNER_REQUIRED'}),
  C.freeze({field:'aridityPpm',status:'WITHHELD',reason:'SURFACE_CLIMATE_COUPLING_OWNER_REQUIRED'}),
  C.freeze({field:'impactActivityPpm',status:'WITHHELD',reason:'NO_V2X05_IMPACT_HISTORY_AUTHORITY'})
]);
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
  'Normalized causal attribution is explanatory weighting, not conserved energy or causal identification.',
  'Surface integration never converts volatile or cryosphere inventory into water/ice area; convergence must supply those area semantics from their rightful owner or preserve them as unknown.'
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
  if(!e.atmosphere.composition||typeof e.atmosphere.composition!=='object'||typeof e.atmosphere.composition.supported!=='boolean'||typeof e.atmosphere.composition.family!=='string'||!e.atmosphere.retentionEscape||typeof e.atmosphere.retentionEscape!=='object'||e.atmosphere.pressureProxyBand!==IA.pressureProxyBand(e.atmosphere.pressureProxyPpm))return false;
  if(e.atmosphere.composition.supported&&e.atmosphere.composition.shareClosurePpm!==C.PPM)return false;
  if(!C.safe(e.atmosphere.pressureProxyPpm,0,12000000)||!C.safe(e.atmosphere.cloudCondensatePotentialPpm,0,C.PPM)||!C.safe(e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,0,970000))return false;
  if(!e.radiative.modeledSurfaceTemperature||typeof e.radiative.modeledSurfaceTemperature!=='object')return false;
  const surfaceT=e.radiative.modeledSurfaceTemperature.temperatureMilliK;if(surfaceT!==null&&!C.safe(surfaceT,20000,3000000))return false;
  if(!e.climate.temperatureRangeMilliK||!C.safe(e.climate.temperatureRangeMilliK.amplitude,0,2980000)||!e.climate.aggregates||typeof e.climate.aggregates!=='object'||!C.safe(e.climate.aggregates.meanTemperatureMilliK,20000,3000000)||!C.safe(e.climate.aggregates.liquidWindowSharePpm,0,C.PPM)||!C.safe(e.climate.aggregates.iceFavoredSharePpm,0,C.PPM))return false;
  if(!e.volatile.surface||typeof e.volatile.surface!=='object'||typeof e.volatile.surface.oceanCandidate!=='boolean'||!C.safe(e.volatile.surface.cryosphereUnits,0,C.LIMITS.exactInventoryUnits)||!Array.isArray(e.volatile.reservoirShares)||e.volatile.reservoirShares.length!==6||e.volatile.reservoirShares.some(v=>!v||typeof v.reservoir!=='string'||!C.safe(v.sharePpm,0,C.PPM))||new Set(e.volatile.reservoirShares.map(v=>v.reservoir)).size!==6||e.volatile.reservoirShares.reduce((n,v)=>n+v.sharePpm,0)!==C.PPM)return false;
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
  if(context==='RENDERING_CONTEXT')payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,atmosphereFamily:e.atmosphere.composition.family||'UNKNOWN',pressureProxyPpm:e.atmosphere.pressureProxyPpm,pressureProxyBand:e.atmosphere.pressureProxyBand,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,climateMeanTemperatureMilliK:e.climate.aggregates.meanTemperatureMilliK,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,iceFavoredSharePpm:e.climate.aggregates.iceFavoredSharePpm,cloudCondensatePotentialPpm:e.atmosphere.cloudCondensatePotentialPpm,cryospherePresent:e.volatile.surface.cryosphereUnits>0};
  else if(context==='ECOLOGY_CONTEXT')payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,collisionalAtmosphere:e.atmosphere.composition.supported,pressureProxyBand:e.atmosphere.pressureProxyBand,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,climateMeanTemperatureMilliK:e.climate.aggregates.meanTemperatureMilliK,oceanCandidate:e.volatile.surface.oceanCandidate,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,seasonalMeanAmplitudeMilliK:e.climate.aggregates.seasonalMeanAmplitudeMilliK,liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,iceFavoredSharePpm:e.climate.aggregates.iceFavoredSharePpm,reservoirShares:e.volatile.reservoirShares,canonicalHabitabilityClaim:false};
  else if(context==='GAMEPLAY_CAUSAL_CONTEXT')payload={regime:e.regime.regime,pressureProxyBand:e.atmosphere.pressureProxyBand,escapeContextPpm:e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,seasonalMeanAmplitudeMilliK:e.climate.aggregates.seasonalMeanAmplitudeMilliK,volcanicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.volcanicPotentialPpm:null,tectonicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.tectonicPotentialPpm:null,driverAttribution:e.causality.drivers,canonicalEventAdmission:false};
  else {
    const safeInputs=C.freeze({planetIdentity:e.worldIdentity,planetClass:e.regime.regime,noSolidSurface:!e.regime.solidSurfaceModel,tectonicActivityPpm:e.interior.geodynamics.supported?e.interior.geodynamics.tectonicPotentialPpm:null,volcanicActivityPpm:e.interior.geodynamics.supported?e.interior.geodynamics.volcanicPotentialPpm:null,sourceAuthority:AUTHORITY,sourceProvenance:C.freeze(['v2x05.model.deep-planet'])});
    payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,geodynamics:e.interior.geodynamics,climateAggregates:e.climate.aggregates,volatileSurface:e.volatile.surface,reservoirShares:e.volatile.reservoirShares,v2x06GeographyAdapter:C.freeze({version:SURFACE_ADAPTER,targetComponent:'v2x-06.surface.geography',targetApi:'OFU.v2x06Geography.createModel',contractClass:'PARTIAL_INPUT_CONTRACT',safeInputs,withheldInputs:SURFACE_WITHHELD,safeToDefaultWithheldToZero:false,directInvocationSafe:!e.regime.solidSurfaceModel,integrationRequirement:e.regime.solidSurfaceModel?'SUPPLY_SURFACE_OWNED_AREA_AND_PROCESS_INPUTS_OR_PRESERVE_UNKNOWN':'NO_SOLID_SURFACE_PATH_MAY_CONSUME_SAFE_INPUTS',inventoryToAreaConversionClaim:false}),plateTectonicsResolved:false,surfaceGeometryClaim:false};
  }
  return C.freeze({version:VERSION,contract:CONTRACT,worldIdentity:e.worldIdentity,supported:true,status:'PRESENT',context,authority:AUTHORITY,readOnly:true,hiddenGlobalRequired:false,payload:C.freeze(payload),canonicalPromotion:false});
}
function limitations(){return LIMITATIONS;}
O.v2x05DeepPlanetProvider=Object.freeze({VERSION,CONTRACT,SURFACE_ADAPTER,SURFACE_WITHHELD,AUTHORITY,CONTEXTS,LIMITATIONS,RESEARCH_ROUTING,evaluate,validEvaluationShape,query,limitations});
})(typeof globalThis!=='undefined'?globalThis:this);
