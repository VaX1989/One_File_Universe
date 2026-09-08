(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere,CV=O.v2x05ClimateVolatile;
if(!C||!IA||!CV)throw new Error('V2X-05 deep planet dependencies missing');
const VERSION='ofu-v2x-05-deep-planet-provider-3',CONTRACT='ofu-v2x-05-deep-planet-consumer-1',CAPABILITY_CONTRACT='ofu-v2x-05-deep-planet-vertical-2',SURFACE_ADAPTER='ofu-v2x05-v2x06-surface-adapter-1',AUTHORITY=C.AUTHORITY;
const CONTEXTS=Object.freeze(['RENDERING_CONTEXT','INSPECTOR_CONTEXT','ENVIRONMENT_ELIGIBILITY_CONTEXT','ECOLOGY_CONTEXT','GAMEPLAY_CAUSAL_CONTEXT','SURFACE_PROMPT08_CONTEXT']);
const SOURCE_PATHS=Object.freeze(['src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/atmospheric-column.js','src/domains/v1/planetology/volatile-ledger.js','src/domains/v1/environment/seasonal-envelope.js']);
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
  'Regime, interior, atmospheric, climate, volatile, gravity/escape and causal outputs are deterministic reduced-order context, not observations or retrievals.',
  'No calibrated equation of state, general circulation model, weather forecast, photochemistry, plate-tectonic history or atmospheric escape rate is implemented.',
  'Optional XUV history is contextual only and never creates P4 history or integrated physical mass loss.',
  'Normalized causal attribution is explanatory weighting, not conserved energy or causal identification.',
  'Surface integration never converts volatile or cryosphere inventory into water/ice area; convergence must supply those area semantics from their rightful owner or preserve them as unknown.',
  'The model digest is a deterministic non-cryptographic coherence witness, not scientific provenance authentication.'
]);
const DIGEST_ALGORITHM='FNV1A32_DETERMINISTIC_NONCRYPTOGRAPHIC';
function failed(worldIdentity,reason,extra={}){return C.freeze({version:VERSION,contract:CONTRACT,capabilityContract:CAPABILITY_CONTRACT,worldIdentity:worldIdentity||null,supported:false,status:'UNSUPPORTED',reason,...extra,authority:AUTHORITY,limitations:LIMITATIONS,canonicalPromotion:false});}
function fnv1a32(value){let h=0x811c9dc5;const s=String(value);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
function thermalBand(t){if(!Number.isSafeInteger(t))return 'UNKNOWN';if(t<200000)return 'CRYOGENIC_PROXY';if(t<250000)return 'COLD_PROXY';if(t<=330000)return 'TEMPERATE_WINDOW_PROXY';if(t<=500000)return 'HOT_PROXY';return 'EXTREME_HOT_PROXY';}
function bulkDiagnostics(planet,regime){
  const x=C.extract(planet);if(!x.supported)return x;
  const g=x.gravity||{},surfaceGravity=g.surfaceGravityMilliMs2,escapeVelocity=g.escapeVelocityMilliKms;
  if(!C.safe(surfaceGravity,1,1000000))return C.unsupported(x.worldIdentity,'INVALID_GRAVITY_DIAGNOSTIC_STATE');
  const escapeSupported=C.safe(escapeVelocity,1,1000000),density=C.safe(g.bulkDensityKgM3,1,100000)?g.bulkDensityKgM3:null,centralPressure=C.safe(g.centralPressureProxyPpm,0,12000000)?g.centralPressureProxyPpm:null;
  return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:escapeSupported?'PRESENT':'PARTIAL',massMilliEarth:regime.massMilliEarth,radiusKm:regime.radiusKm,ageMyr:x.inputs.ageMyr,surfaceGravityMilliMs2:surfaceGravity,escapeVelocityMilliKms:escapeSupported?escapeVelocity:null,bulkDensityKgM3:density,centralPressureProxyPpm:centralPressure,escapeDiagnosticStatus:escapeSupported?'MODELED_V1_DIAGNOSTIC':'UNAVAILABLE_IN_SOURCE_STATE',isMeasurement:false,gravityLawRecomputed:false,escapeLawRecomputed:false,authority:AUTHORITY,canonicalPromotion:false});
}
function provenanceFor(worldIdentity){return C.freeze({authority:AUTHORITY,modelId:'v2x05.model.deep-planet',modelVersion:VERSION,capabilityContract:CAPABILITY_CONTRACT,sourceWorldIdentity:worldIdentity,sourcePaths:SOURCE_PATHS,researchPromotion:'NONE',uncertainResearchKeptResearchOnly:true,canonicalPromotion:false});}
function causalTraceFor(e){return C.freeze([
  C.freeze({stage:'REGIME',basis:'V1_BULK_COMPOSITION_ATMOSPHERE',result:e.regime.regime}),
  C.freeze({stage:'BULK_GRAVITY_ESCAPE',basis:'V1_GRAVITY_DIAGNOSTICS',result:e.bulkDiagnostics.escapeDiagnosticStatus}),
  C.freeze({stage:'INTERIOR',basis:'V1_INTERIOR_REDUCED_STATE',result:e.interior.geodynamics.supported?'SOLID_GEODYNAMIC_POTENTIAL':'NO_SOLID_SURFACE_GEODYNAMICS'}),
  C.freeze({stage:'ATMOSPHERE',basis:'V1_ATMOSPHERE_COLUMN_AND_FAMILY',result:e.atmosphere.pressureProxyBand}),
  C.freeze({stage:'CLIMATE',basis:'BOUNDED_INTEGER_QUARTER_SEASON_PROXY',result:thermalBand(e.climate.aggregates.meanTemperatureMilliK)}),
  C.freeze({stage:'VOLATILES',basis:'EXACT_BOUNDED_V1_LEDGER_PARTITION',result:e.volatile.surface.oceanCandidate?'OCEAN_CANDIDATE':'NO_OCEAN_CANDIDATE'}),
  C.freeze({stage:'CAUSAL_ATTRIBUTION',basis:'NORMALIZED_MODELED_DRIVER_WEIGHTS',result:'EXPLANATORY_ONLY'})
]);}
function digestForEvaluation(e){
  if(!e||!e.regime||!e.bulkDiagnostics||!e.atmosphere||!e.climate||!e.volatile||!e.causality)return null;
  const drivers=Array.isArray(e.causality.drivers)?e.causality.drivers.map(d=>`${d.driver}:${d.sharePpm}`).join(','):'';
  const reservoirs=Array.isArray(e.volatile.reservoirShares)?e.volatile.reservoirShares.map(r=>`${r.reservoir}:${r.sharePpm}`).join(','):'';
  const parts=[e.worldIdentity,e.regime.regime,e.bulkDiagnostics.massMilliEarth,e.bulkDiagnostics.radiusKm,e.bulkDiagnostics.ageMyr,e.bulkDiagnostics.surfaceGravityMilliMs2,e.bulkDiagnostics.escapeVelocityMilliKms??'NA',e.atmosphere.composition?.family||'UNKNOWN',e.atmosphere.pressureProxyPpm,e.radiative?.modeledSurfaceTemperature?.temperatureMilliK??'NA',e.climate.aggregates?.meanTemperatureMilliK,e.climate.temperatureRangeMilliK?.amplitude,e.climate.aggregates?.liquidWindowSharePpm,e.climate.aggregates?.iceFavoredSharePpm,e.volatile.initialInventoryUnits,reservoirs,drivers];
  return `v2x05:${fnv1a32(parts.join('|'))}`;
}
function evaluate(planet,options={}){
  const regime=C.classify(planet);if(!regime.supported)return failed(regime.worldIdentity,regime.reason,{regime});
  const bulkDiagnosticsPacket=bulkDiagnostics(planet,regime);if(!bulkDiagnosticsPacket.supported)return failed(regime.worldIdentity,bulkDiagnosticsPacket.reason||'BULK_DIAGNOSTIC_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket});
  const interior=IA.interiorState(planet,regime);if(!interior.supported)return failed(regime.worldIdentity,interior.reason||'INTERIOR_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior});
  const atmosphere=IA.atmosphereState(planet,regime,options);if(!atmosphere.supported)return failed(regime.worldIdentity,atmosphere.reason||'ATMOSPHERE_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere});
  const radiative=IA.radiativeState(planet,regime,atmosphere);if(!radiative.supported)return failed(regime.worldIdentity,radiative.reason||'RADIATIVE_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere,radiative});
  const climate=CV.climateEnvelope(planet,regime,radiative,atmosphere);if(!climate.supported)return failed(regime.worldIdentity,climate.reason||'CLIMATE_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere,radiative,climate});
  const volatile=CV.volatilePartition(planet,regime,radiative,climate);if(!volatile.supported)return failed(regime.worldIdentity,volatile.reason||'VOLATILE_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere,radiative,climate,volatile});
  const causality=CV.causalAttribution(planet,regime,interior,atmosphere,volatile);if(!causality.supported)return failed(regime.worldIdentity,causality.reason||'CAUSAL_ATTRIBUTION_STAGE_UNSUPPORTED',{regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere,radiative,climate,volatile,causality});
  const base={version:VERSION,contract:CONTRACT,capabilityContract:CAPABILITY_CONTRACT,worldIdentity:regime.worldIdentity,supported:true,status:'PRESENT',authority:AUTHORITY,lifecycle:'SHIPPING',regime,bulkDiagnostics:bulkDiagnosticsPacket,interior,atmosphere,radiative,climate,volatile,causality,
    fidelity:C.freeze({regime:'deep-planet-reduced-order',validity:'Known V1 planetology bulk regimes inside explicit V2X-05 bounds and exact modeled-state closure checks',resolution:'One selected modeled world with at most 24 climate cells, 6 atmospheric constituent families, 64 optional XUV history samples and 6 bounded consumer contexts',uncertainty:'Heuristic scenario depth only; unsupported physics remains explicit'}),
    bounds:C.freeze({...C.LIMITS,climateCellsObserved:climate.cellCount,constituentsObserved:atmosphere.composition.constituentCount||0,xuvHistorySamplesObserved:atmosphere.retentionEscape.samples||0,consumerContextsObserved:CONTEXTS.length}),limitations:LIMITATIONS,researchRouting:RESEARCH_ROUTING,
    integrity:C.freeze({sourceInputMutation:false,identityConsistencyRequired:true,compositionClosureRequired:true,interiorLayerClosureRequired:true,exactVolatileArithmeticBounded:true,quarterSeasonIntegerKernel:true,crossConsumerDigestRequired:true}),
    claims:C.freeze({canonicalTruthChanged:false,p4HistoryMutated:false,eosCalibrated:false,gcm:false,weatherForecast:false,photochemistry:false,plateTectonicsResolved:false,observationalRetrieval:false,measuredGravityOrEscape:false}),canonicalPromotion:false};
  const modelDigest=digestForEvaluation(base),provenance=provenanceFor(regime.worldIdentity),causalTrace=causalTraceFor({...base,modelDigest});
  return C.freeze({...base,modelDigest,digestAlgorithm:DIGEST_ALGORITHM,provenance,causalTrace});
}
function validEvaluationShape(e){
  if(!e||typeof e!=='object'||e.contract!==CONTRACT||e.capabilityContract!==CAPABILITY_CONTRACT||e.version!==VERSION||e.authority!==AUTHORITY||e.supported!==true||e.status!=='PRESENT'||!Object.isFrozen(e))return false;
  if(typeof e.worldIdentity!=='string'||!e.worldIdentity)return false;
  const objects=['regime','bulkDiagnostics','interior','atmosphere','radiative','climate','volatile','causality','provenance'];
  if(objects.some(k=>!e[k]||typeof e[k]!=='object'||!Object.isFrozen(e[k])))return false;
  if(objects.slice(0,8).some(k=>e[k].worldIdentity!==e.worldIdentity))return false;
  if(typeof e.regime.regime!=='string'||typeof e.regime.solidSurfaceModel!=='boolean')return false;
  if(!C.safe(e.bulkDiagnostics.surfaceGravityMilliMs2,1,1000000)||!(e.bulkDiagnostics.escapeVelocityMilliKms===null||C.safe(e.bulkDiagnostics.escapeVelocityMilliKms,1,1000000)))return false;
  if(!e.interior.geodynamics||typeof e.interior.geodynamics!=='object'||typeof e.interior.geodynamics.supported!=='boolean')return false;
  if(!e.atmosphere.composition||typeof e.atmosphere.composition!=='object'||typeof e.atmosphere.composition.supported!=='boolean'||typeof e.atmosphere.composition.family!=='string'||!e.atmosphere.retentionEscape||typeof e.atmosphere.retentionEscape!=='object'||e.atmosphere.pressureProxyBand!==IA.pressureProxyBand(e.atmosphere.pressureProxyPpm))return false;
  if(e.atmosphere.composition.supported&&e.atmosphere.composition.shareClosurePpm!==C.PPM)return false;
  if(!C.safe(e.atmosphere.pressureProxyPpm,0,12000000)||!C.safe(e.atmosphere.cloudCondensatePotentialPpm,0,C.PPM)||!C.safe(e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,0,970000))return false;
  if(!e.radiative.modeledSurfaceTemperature||typeof e.radiative.modeledSurfaceTemperature!=='object')return false;
  const surfaceT=e.radiative.modeledSurfaceTemperature.temperatureMilliK;if(surfaceT!==null&&!C.safe(surfaceT,20000,3000000))return false;
  if(!e.climate.temperatureRangeMilliK||!C.safe(e.climate.temperatureRangeMilliK.amplitude,0,2980000)||!e.climate.aggregates||typeof e.climate.aggregates!=='object'||!C.safe(e.climate.aggregates.meanTemperatureMilliK,20000,3000000)||!C.safe(e.climate.aggregates.liquidWindowSharePpm,0,C.PPM)||!C.safe(e.climate.aggregates.iceFavoredSharePpm,0,C.PPM))return false;
  if(!e.volatile.surface||typeof e.volatile.surface!=='object'||typeof e.volatile.surface.oceanCandidate!=='boolean'||!C.safe(e.volatile.surface.cryosphereUnits,0,C.LIMITS.exactInventoryUnits)||!Array.isArray(e.volatile.reservoirShares)||e.volatile.reservoirShares.length!==6||e.volatile.reservoirShares.some(v=>!v||typeof v.reservoir!=='string'||!C.safe(v.sharePpm,0,C.PPM))||new Set(e.volatile.reservoirShares.map(v=>v.reservoir)).size!==6||e.volatile.reservoirShares.reduce((n,v)=>n+v.sharePpm,0)!==C.PPM)return false;
  if(!Array.isArray(e.causality.drivers)||e.causality.drivers.length!==6||e.causality.drivers.some(d=>!d||typeof d.driver!=='string'||!C.safe(d.sharePpm,0,C.PPM))||e.causality.drivers.reduce((n,d)=>n+d.sharePpm,0)!==C.PPM)return false;
  if(!Array.isArray(e.causalTrace)||e.causalTrace.length!==7||e.provenance.sourceWorldIdentity!==e.worldIdentity||e.provenance.authority!==AUTHORITY)return false;
  if(e.digestAlgorithm!==DIGEST_ALGORITHM||typeof e.modelDigest!=='string'||e.modelDigest!==digestForEvaluation(e))return false;
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
  if(!CONTEXTS.includes(context))return C.freeze({version:VERSION,contract:CONTRACT,capabilityContract:CAPABILITY_CONTRACT,supported:false,status:'UNSUPPORTED',reason:'UNKNOWN_CONSUMER_CONTEXT',context:String(context),authority:AUTHORITY});
  const e=ensureEvaluation(value,options);if(!e.supported)return C.freeze({version:VERSION,contract:CONTRACT,capabilityContract:CAPABILITY_CONTRACT,worldIdentity:e.worldIdentity||null,supported:false,status:'UNSUPPORTED',reason:e.reason||'DEEP_PLANET_EVALUATION_UNSUPPORTED',context,authority:AUTHORITY});
  let payload;
  if(context==='RENDERING_CONTEXT'){
    const thermal=e.radiative.modeledSurfaceTemperature.temperatureMilliK??e.climate.aggregates.meanTemperatureMilliK;
    const columnCue=C.clamp(Math.round(e.atmosphere.pressureProxyPpm*C.PPM/(e.atmosphere.pressureProxyPpm+250000)),0,C.PPM);
    payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,atmosphereFamily:e.atmosphere.composition.family||'UNKNOWN',pressureProxyPpm:e.atmosphere.pressureProxyPpm,pressureProxyBand:e.atmosphere.pressureProxyBand,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,climateMeanTemperatureMilliK:e.climate.aggregates.meanTemperatureMilliK,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,iceFavoredSharePpm:e.climate.aggregates.iceFavoredSharePpm,cloudCondensatePotentialPpm:e.atmosphere.cloudCondensatePotentialPpm,cryospherePresent:e.volatile.surface.cryosphereUnits>0,appearance:C.freeze({authority:'PRESENTATION_ONLY',sourceAuthority:AUTHORITY,atmosphereColumnCuePpm:columnCue,cloudCuePpm:e.atmosphere.cloudCondensatePotentialPpm,thermalBand:thermalBand(thermal),liquidCuePpm:e.climate.aggregates.liquidWindowSharePpm,iceCuePpm:e.climate.aggregates.iceFavoredSharePpm,noSolidSurface:!e.regime.solidSurfaceModel,canonicalAppearanceClaim:false})};
  } else if(context==='INSPECTOR_CONTEXT')payload={diagnostics:C.freeze({regime:e.regime,bulk:e.bulkDiagnostics,interior:e.interior,atmosphere:e.atmosphere,radiative:e.radiative,climateAggregates:e.climate.aggregates,volatile:e.volatile,causalDrivers:e.causality.drivers}),causalTrace:e.causalTrace,researchRouting:e.researchRouting,limitations:e.limitations,inspectionReadOnly:true,measuredEvidenceClaim:false};
  else if(context==='ENVIRONMENT_ELIGIBILITY_CONTEXT')payload={eligibilityOnly:true,life:C.freeze({eligibilityDecided:false,solidSurfaceAvailable:e.regime.solidSurfaceModel,collisionalAtmosphere:e.atmosphere.composition.supported,pressureProxyBand:e.atmosphere.pressureProxyBand,thermalBand:thermalBand(e.climate.aggregates.meanTemperatureMilliK),liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,iceFavoredSharePpm:e.climate.aggregates.iceFavoredSharePpm,oceanCandidate:e.volatile.surface.oceanCandidate,canonicalHabitabilityClaim:false}),civilization:C.freeze({eligibilityDecided:false,solidSurfaceAvailable:e.regime.solidSurfaceModel,pressureProxyBand:e.atmosphere.pressureProxyBand,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,seasonalMeanAmplitudeMilliK:e.climate.aggregates.seasonalMeanAmplitudeMilliK,liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,canonicalCivilizationViabilityClaim:false}),domainOutcomesModeled:false};
  else if(context==='ECOLOGY_CONTEXT')payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,collisionalAtmosphere:e.atmosphere.composition.supported,pressureProxyBand:e.atmosphere.pressureProxyBand,modeledSurfaceTemperatureMilliK:e.radiative.modeledSurfaceTemperature.temperatureMilliK,climateMeanTemperatureMilliK:e.climate.aggregates.meanTemperatureMilliK,oceanCandidate:e.volatile.surface.oceanCandidate,climateAmplitudeMilliK:e.climate.temperatureRangeMilliK.amplitude,seasonalMeanAmplitudeMilliK:e.climate.aggregates.seasonalMeanAmplitudeMilliK,liquidWindowSharePpm:e.climate.aggregates.liquidWindowSharePpm,iceFavoredSharePpm:e.climate.aggregates.iceFavoredSharePpm,reservoirShares:e.volatile.reservoirShares,canonicalHabitabilityClaim:false};
  else if(context==='GAMEPLAY_CAUSAL_CONTEXT')payload={regime:e.regime.regime,pressureProxyBand:e.atmosphere.pressureProxyBand,surfaceGravityMilliMs2:e.bulkDiagnostics.surfaceGravityMilliMs2,escapeVelocityMilliKms:e.bulkDiagnostics.escapeVelocityMilliKms,escapeContextPpm:e.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,seasonalMeanAmplitudeMilliK:e.climate.aggregates.seasonalMeanAmplitudeMilliK,volcanicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.volcanicPotentialPpm:null,tectonicPotentialPpm:e.interior.geodynamics.supported?e.interior.geodynamics.tectonicPotentialPpm:null,driverAttribution:e.causality.drivers,canonicalEventAdmission:false};
  else {
    const safeInputs=C.freeze({planetIdentity:e.worldIdentity,planetClass:e.regime.regime,noSolidSurface:!e.regime.solidSurfaceModel,tectonicActivityPpm:e.interior.geodynamics.supported?e.interior.geodynamics.tectonicPotentialPpm:null,volcanicActivityPpm:e.interior.geodynamics.supported?e.interior.geodynamics.volcanicPotentialPpm:null,sourceAuthority:AUTHORITY,sourceProvenance:C.freeze(['v2x05.model.deep-planet']),sourceModelDigest:e.modelDigest});
    payload={regime:e.regime.regime,solidSurfaceModel:e.regime.solidSurfaceModel,geodynamics:e.interior.geodynamics,climateAggregates:e.climate.aggregates,volatileSurface:e.volatile.surface,reservoirShares:e.volatile.reservoirShares,v2x06GeographyAdapter:C.freeze({version:SURFACE_ADAPTER,targetComponent:'v2x-06.surface.geography',targetApi:'OFU.v2x06Geography.createModel',contractClass:'PARTIAL_INPUT_CONTRACT',safeInputs,withheldInputs:SURFACE_WITHHELD,safeToDefaultWithheldToZero:false,directInvocationSafe:!e.regime.solidSurfaceModel,integrationRequirement:e.regime.solidSurfaceModel?'SUPPLY_SURFACE_OWNED_AREA_AND_PROCESS_INPUTS_OR_PRESERVE_UNKNOWN':'NO_SOLID_SURFACE_PATH_MAY_CONSUME_SAFE_INPUTS',inventoryToAreaConversionClaim:false}),plateTectonicsResolved:false,surfaceGeometryClaim:false};
  }
  return C.freeze({version:VERSION,contract:CONTRACT,capabilityContract:CAPABILITY_CONTRACT,worldIdentity:e.worldIdentity,supported:true,status:'PRESENT',context,authority:AUTHORITY,readOnly:true,hiddenGlobalRequired:false,modelDigest:e.modelDigest,digestAlgorithm:e.digestAlgorithm,provenance:e.provenance,consumerHook:'OFU.v2x05DeepPlanetProvider.query',payload:C.freeze(payload),canonicalPromotion:false});
}
function limitations(){return LIMITATIONS;}
O.v2x05DeepPlanetProvider=Object.freeze({VERSION,CONTRACT,CAPABILITY_CONTRACT,SURFACE_ADAPTER,SURFACE_WITHHELD,AUTHORITY,CONTEXTS,SOURCE_PATHS,LIMITATIONS,RESEARCH_ROUTING,DIGEST_ALGORITHM,bulkDiagnostics,digestForEvaluation,evaluate,validEvaluationShape,query,limitations});
})(typeof globalThis!=='undefined'?globalThis:this);
