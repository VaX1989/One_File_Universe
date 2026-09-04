// P5 Environment-next Wave IV frontier. RESEARCH ONLY. NON-CANONICAL.
export const CONTRACT_ID='ofu-p5-environment-next-frontier-research-v4';
export const AUTHORITY='P5_RESEARCH_DRAFT';
export const PREVIOUS_FRONTIER='ofu-p5-environment-next-frontier-research-v3';
export const SOURCE_RECORD_CONTRACT='ofu-scientific-source-record-v1';
export const PRODUCER_RECORD_CONTRACT='ofu-p5-state-producer-record-research-v1';
export const THERMAL_STATE_CONTRACT='ofu-p5-thermal-state-research-v1';
export const WATER_MEDIUM_CONTRACT='ofu-p5-water-medium-assessment-research-v1';
export const ENVIRONMENT_PREREQUISITE_CONTRACT='ofu-p5-environment-prerequisite-research-v1';
export const ESCAPE_DEPENDENCY_CONTRACT='ofu-p5-escape-dependency-witness-research-v1';
export const ENVIRONMENT_TRANSITION_CONTRACT='ofu-p5-environment-transition-envelope-research-v1';
export const P6_READINESS_CONTRACT='ofu-p5-p6-environment-readiness-research-v2';
export const RESEARCH_SIMULATION_CONTRACT='ofu-research-simulation-mode-v1';
export const P4_PROTOCOL='ofu-p4-temporal-v1';
export const U64_MAX=(1n<<64n)-1n;
export const MAX_TEMPERATURE_MILLIK=10000000n;
export const MAX_SOURCE_ASSUMPTIONS=16;
export const MAX_DEPENDENCIES=32;
export const MAX_ENVIRONMENT_TRANSITION_CHANGES=16;
export const EVIDENCE_CLASSES=Object.freeze(['ESTABLISHED','EMPIRICALLY_CONSTRAINED','HYPOTHETICAL','SPECULATIVE','FICTIONAL']);
export const FIDELITIES=Object.freeze(['FORMAL','HIGH_FIDELITY','APPROXIMATE','STYLIZED','METAPHORICAL']);
export const SOURCE_TYPES=Object.freeze(['PRIMARY_LITERATURE','REVIEW_LITERATURE','AUTHORITATIVE_REFERENCE','EXTERNAL_DATASET','RESEARCH_FIXTURE']);
export const PRODUCER_DISPOSITIONS=Object.freeze(['CANONICAL_INPUT','SOURCE_BOUND_EXTERNAL_STATE','DERIVED_STATE','RESEARCH_FIXTURE','UNSUPPORTED']);
export const PRODUCER_DISPOSITION_POLICY=Object.freeze({
  CANONICAL_INPUT:Object.freeze({currentAvailability:'UNAVAILABLE_REQUIRES_SEPARATE_CANONICAL_PROMOTION',mayCreateVolatileInventory:false}),
  SOURCE_BOUND_EXTERNAL_STATE:Object.freeze({currentAvailability:'RESEARCH_ACCEPTED_WITH_PROVENANCE',mayCreateVolatileInventory:true}),
  DERIVED_STATE:Object.freeze({currentAvailability:'RESEARCH_ACCEPTED_ONLY_FROM_EXPLICIT_DEPENDENCIES',mayCreateVolatileInventory:false}),
  RESEARCH_FIXTURE:Object.freeze({currentAvailability:'RESEARCH_ONLY',mayCreateVolatileInventory:true}),
  UNSUPPORTED:Object.freeze({currentAvailability:'EXPLICIT_ABSTENTION',mayCreateVolatileInventory:false})
});
export const ABIogenesis_STATUS=Object.freeze({
  canonical:'NO_CANONICAL_GENESIS_MODEL',
  supportedModes:Object.freeze(['EXTERNAL_POST_GENESIS_SEED','RESEARCH_FIXTURE_ONLY']),
  predictionAvailable:false
});

const EVIDENCE=Object.freeze({
  sourceGovernance:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'software provenance and authority semantics only; source presence does not make a physical hypothesis true'}),
  thermalSeparation:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'surface-minus-effective temperature is an arithmetic diagnostic, not a causal greenhouse attribution'}),
  surfaceTemperature:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',claimLimit:'no universal mapping from radiative effective temperature to surface temperature is promoted'}),
  waterMedium:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'APPROXIMATE',claimLimit:'global idealized phase plausibility only; not ocean coverage, persistence, local climate, solvent chemistry, or biological viability'}),
  escapeDependencies:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',claimLimit:'dependency readiness only; no universal energy-limited escape rate is produced'}),
  environmentHistory:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'typed P4-owned transition envelope only; P5 retains no private history log'}),
  p6Readiness:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'research post-genesis eligibility cannot authorize abiogenesis or canonical biology'})
});

function freeze(v){return Object.freeze(v)}
function fail(m){throw new Error('P5 Environment-next Wave IV: '+m)}
function exact(o,keys,n){if(!o||typeof o!=='object'||Array.isArray(o))fail(n+' must be map');const a=Object.keys(o).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((x,i)=>x!==b[i]))fail(n+' fields invalid');return o}
function text(v,n,max=256){if(typeof v!=='string'||v.length===0||v.length>max||v!==v.normalize('NFC'))fail(n+' must be bounded NFC text');return v}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function bool(v,n){if(typeof v!=='boolean')fail(n+' must be boolean');return v}
function enumValue(v,allowed,n){if(!allowed.includes(v))fail(n+' unsupported');return v}
function hex64(v,n){text(v,n,64);if(!/^[0-9a-f]{64}$/.test(v))fail(n+' must be 64 lowercase hex characters');return v}
function boundedTextArray(a,n,maxCount=MAX_DEPENDENCIES,maxLen=192){if(!Array.isArray(a)||a.length>maxCount)fail(n+' must be bounded array');return freeze(a.map((v,i)=>text(v,n+'['+i+']',maxLen)))}
function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d===0n)fail('zero denominator');const neg=(n<0n)!=(d<0n);if(n<0n)n=-n;if(d<0n)d=-d;let q=n/d,r=n%d,t=2n*r;if(t>d||(t===d&&(q&1n)===1n))q++;return neg?-q:q}

export function validateScientificSource(source){
  exact(source,['contractId','sourceId','sourceVersion','locator','retrievedDate','sourceType','evidenceClass','fidelity','validityDomain','assumptions','uncertainty','units'],'scientific source');
  if(source.contractId!==SOURCE_RECORD_CONTRACT)fail('source contract mismatch');
  text(source.sourceId,'sourceId',128);text(source.sourceVersion,'sourceVersion',128);text(source.locator,'locator',512);text(source.retrievedDate,'retrievedDate',32);
  enumValue(source.sourceType,SOURCE_TYPES,'sourceType');enumValue(source.evidenceClass,EVIDENCE_CLASSES,'source evidenceClass');enumValue(source.fidelity,FIDELITIES,'source fidelity');
  text(source.validityDomain,'validityDomain',1024);boundedTextArray(source.assumptions,'assumptions',MAX_SOURCE_ASSUMPTIONS,256);text(source.uncertainty,'uncertainty',512);text(source.units,'units',128);
  return source;
}

export function producerDisposition(kind){enumValue(kind,PRODUCER_DISPOSITIONS,'producer disposition');return PRODUCER_DISPOSITION_POLICY[kind]}

export function validateStateProducerRecord(record){
  exact(record,['contractId','disposition','epistemicStatus','authority','evidenceClass','fidelity','source','provenance','dependencies'],'state producer record');
  if(record.contractId!==PRODUCER_RECORD_CONTRACT)fail('producer contract mismatch');
  enumValue(record.disposition,PRODUCER_DISPOSITIONS,'producer disposition');text(record.authority,'producer authority',128);enumValue(record.evidenceClass,EVIDENCE_CLASSES,'producer evidenceClass');enumValue(record.fidelity,FIDELITIES,'producer fidelity');text(record.provenance,'producer provenance',512);
  const dependencies=boundedTextArray(record.dependencies,'producer dependencies');
  if(record.disposition==='CANONICAL_INPUT')fail('CANONICAL_INPUT requires a separate canonical promotion transaction and cannot be instantiated by this research contract');
  if(record.disposition==='SOURCE_BOUND_EXTERNAL_STATE'){
    if(record.epistemicStatus!=='KNOWN')fail('source-bound external state must be KNOWN within its supplied source scope');
    if(record.authority!=='P5_RESEARCH_SOURCE_BOUND')fail('source-bound authority mismatch');
    validateScientificSource(record.source);if(record.source.sourceType==='RESEARCH_FIXTURE')fail('source-bound external state cannot cite a research fixture as its authority');if(record.evidenceClass!==record.source.evidenceClass||record.fidelity!==record.source.fidelity)fail('source-bound producer claim metadata must match its source record');
  }else if(record.disposition==='RESEARCH_FIXTURE'){
    if(record.epistemicStatus!=='HYPOTHETICAL_MODEL_VALUE'||record.authority!=='P5_RESEARCH_FIXTURE')fail('research fixture epistemic/authority mismatch');
    validateScientificSource(record.source);if(record.source.sourceType!=='RESEARCH_FIXTURE')fail('research fixture requires RESEARCH_FIXTURE source type');if(record.evidenceClass!==record.source.evidenceClass||record.fidelity!==record.source.fidelity)fail('fixture producer claim metadata must match its source record');
  }else if(record.disposition==='DERIVED_STATE'){
    if(!['DERIVED','HYPOTHETICAL_MODEL_VALUE'].includes(record.epistemicStatus)||record.authority!=='P5_RESEARCH_DERIVED')fail('derived-state epistemic/authority mismatch');
    if(record.source!==null)validateScientificSource(record.source);if(dependencies.length===0)fail('derived state requires explicit dependencies');
  }else if(record.disposition==='UNSUPPORTED'){
    if(record.epistemicStatus!=='UNSUPPORTED'||record.source!==null||record.authority!=='P5_RESEARCH_ABSTENTION')fail('unsupported producer must be explicit abstention');
  }
  return freeze({...record,dependencies});
}

export function validateThermalState(state){
  exact(state,['contractId','kind','epistemicStatus','authority','provenance','evidenceClass','fidelity','temperatureMilliKLower','temperatureMilliKUpper','source','dependencies'],'thermal state');
  if(state.contractId!==THERMAL_STATE_CONTRACT)fail('thermal contract mismatch');
  enumValue(state.kind,['EFFECTIVE_RADIATIVE_TEMPERATURE','SURFACE_TEMPERATURE'],'thermal kind');
  enumValue(state.epistemicStatus,['KNOWN','DERIVED','BOUNDED_APPROXIMATION','RESEARCH_FIXTURE_ONLY','UNKNOWN'],'thermal epistemicStatus');
  text(state.authority,'thermal authority',128);text(state.provenance,'thermal provenance',512);enumValue(state.evidenceClass,EVIDENCE_CLASSES,'thermal evidenceClass');enumValue(state.fidelity,FIDELITIES,'thermal fidelity');
  const dependencies=boundedTextArray(state.dependencies,'thermal dependencies');
  if(state.epistemicStatus==='UNKNOWN'){
    if(state.temperatureMilliKLower!==null||state.temperatureMilliKUpper!==null)fail('unknown thermal state cannot contain temperatures');
  }else{
    const lo=u64(state.temperatureMilliKLower,'temperature lower'),hi=u64(state.temperatureMilliKUpper,'temperature upper');if(lo>hi||hi>MAX_TEMPERATURE_MILLIK)fail('thermal interval invalid or exceeds research bound');
    if(state.kind==='SURFACE_TEMPERATURE'&&state.source===null)fail('non-unknown surface temperature requires explicit scientific source/provenance record');
  }
  if(state.source!==null)validateScientificSource(state.source);
  return freeze({...state,dependencies});
}

export function surfaceTemperatureFromEffectiveTemperature(effectiveRadiativeTemperatureState){
  const e=validateThermalState(effectiveRadiativeTemperatureState);if(e.kind!=='EFFECTIVE_RADIATIVE_TEMPERATURE')fail('effective radiative thermal state required');
  return freeze({contractId:THERMAL_STATE_CONTRACT,kind:'SURFACE_TEMPERATURE',epistemicStatus:'UNKNOWN',authority:AUTHORITY,provenance:'NO_UNIVERSAL_EFFECTIVE_TO_SURFACE_TEMPERATURE_MAPPING',evidenceClass:EVIDENCE.surfaceTemperature.evidenceClass,fidelity:EVIDENCE.surfaceTemperature.fidelity,temperatureMilliKLower:null,temperatureMilliKUpper:null,source:null,dependencies:freeze([PREVIOUS_FRONTIER])});
}

export function thermalSeparationDiagnostic({effectiveRadiativeTemperatureState,surfaceTemperatureState}){
  const e=validateThermalState(effectiveRadiativeTemperatureState),s=validateThermalState(surfaceTemperatureState);if(e.kind!=='EFFECTIVE_RADIATIVE_TEMPERATURE'||s.kind!=='SURFACE_TEMPERATURE')fail('effective and surface thermal states required');
  if(e.epistemicStatus==='UNKNOWN'||s.epistemicStatus==='UNKNOWN')return freeze({epistemicStatus:'UNKNOWN',surfaceMinusEffectiveTemperatureIntervalMilliK:null,causalAttribution:'NOT_INFERRED',reason:'THERMAL_INPUT_UNKNOWN',evidence:EVIDENCE.thermalSeparation});
  const lower=s.temperatureMilliKLower-e.temperatureMilliKUpper,upper=s.temperatureMilliKUpper-e.temperatureMilliKLower;
  const epistemicStatus=(s.epistemicStatus==='RESEARCH_FIXTURE_ONLY'||e.epistemicStatus==='RESEARCH_FIXTURE_ONLY')?'RESEARCH_FIXTURE_ONLY':(s.epistemicStatus==='BOUNDED_APPROXIMATION'||e.epistemicStatus==='BOUNDED_APPROXIMATION')?'BOUNDED_APPROXIMATION':'DERIVED';
  return freeze({epistemicStatus,surfaceMinusEffectiveTemperatureIntervalMilliK:freeze([lower,upper]),causalAttribution:'NOT_INFERRED',includesPotentialContributions:freeze(['GREENHOUSE','HEAT_REDISTRIBUTION','CLOUD_ALBEDO_FEEDBACK','INTERNAL_HEAT','SURFACE_ENERGY_BALANCE_EFFECTS']),claimLimit:EVIDENCE.thermalSeparation.claimLimit,evidence:EVIDENCE.thermalSeparation});
}

export function waterMediumPlausibility({surfaceTemperatureState,waterInventory,waterSaturationDiagnostic,totalPressurePa}){
  const s=validateThermalState(surfaceTemperatureState);if(s.kind!=='SURFACE_TEMPERATURE')fail('surface temperature required');
  exact(waterInventory,['h2oCondensedSurfaceTg','compositionComplete'],'water inventory');const condensed=u64(waterInventory.h2oCondensedSurfaceTg,'h2oCondensedSurfaceTg');bool(waterInventory.compositionComplete,'compositionComplete');
  exact(waterSaturationDiagnostic,['epistemicStatus','regime','waterPartialPressurePa','saturationPressurePa','sourceContract'],'water saturation diagnostic');text(waterSaturationDiagnostic.epistemicStatus,'water saturation epistemicStatus',64);text(waterSaturationDiagnostic.regime,'water saturation regime',96);text(waterSaturationDiagnostic.sourceContract,'water saturation sourceContract',128);
  if(waterSaturationDiagnostic.waterPartialPressurePa!==null)u64(waterSaturationDiagnostic.waterPartialPressurePa,'waterPartialPressurePa');if(waterSaturationDiagnostic.saturationPressurePa!==null)u64(waterSaturationDiagnostic.saturationPressurePa,'saturationPressurePa');u64(totalPressurePa,'totalPressurePa');
  const base={contractId:WATER_MEDIUM_CONTRACT,authority:AUTHORITY,globalOceanEstablished:false,viableBiologicalMediumEstablished:false,evidence:EVIDENCE.waterMedium};
  if(!waterInventory.compositionComplete)return freeze({...base,epistemicStatus:'UNKNOWN',phasePlausibility:'UNKNOWN',reason:'INCOMPLETE_WATER_INVENTORY'});
  if(s.epistemicStatus==='UNKNOWN')return freeze({...base,epistemicStatus:'UNKNOWN',phasePlausibility:'UNKNOWN',reason:'SURFACE_TEMPERATURE_UNKNOWN'});
  if(s.temperatureMilliKLower!==s.temperatureMilliKUpper)return freeze({...base,epistemicStatus:'BOUNDED_APPROXIMATION',phasePlausibility:'INTERVAL_REQUIRES_PHASE_RESOLUTION',reason:'SURFACE_TEMPERATURE_INTERVAL_NOT_POINT_STATE'});
  const t=s.temperatureMilliKLower;
  if(t<273160n)return freeze({...base,epistemicStatus:'UNSUPPORTED',phasePlausibility:'UNKNOWN',reason:'ICE_VAPOR_OR_SUPERCOOLED_BOUNDARY_NOT_ADJUDICATED_IN_THIS_CONTRACT'});
  if(t>647096n)return freeze({...base,epistemicStatus:'DERIVED',phasePlausibility:'NO_ORDINARY_LIQUID_VAPOR_BOUNDARY',reason:'ABOVE_WATER_CRITICAL_TEMPERATURE'});
  if(condensed===0n)return freeze({...base,epistemicStatus:'DERIVED',phasePlausibility:'NOT_ESTABLISHED',reason:'NO_SUPPLIED_CONDENSED_SURFACE_H2O'});
  if(['SUPERSATURATED_CONDENSATION_FAVORED','BOUNDARY_ROUNDING_SENSITIVE'].includes(waterSaturationDiagnostic.regime))return freeze({...base,epistemicStatus:'BOUNDED_APPROXIMATION',phasePlausibility:'LIQUID_WATER_THERMODYNAMICALLY_PERMITTED_GLOBAL_IDEALIZED',reason:'POINT_TEMPERATURE_IN_IAPWS_LIQUID_VAPOR_DOMAIN_WITH_CONDENSED_H2O_AND_NON_SUBSATURATED_VAPOR'});
  if(waterSaturationDiagnostic.regime==='SUBSATURATED_VAPOR')return freeze({...base,epistemicStatus:'BOUNDED_APPROXIMATION',phasePlausibility:'GLOBAL_MEAN_LIQUID_PERSISTENCE_NOT_SUPPORTED',reason:'SUBSATURATED_WATER_VAPOR_UNDER_IDEAL_MIXTURE_DIAGNOSTIC'});
  return freeze({...base,epistemicStatus:'UNKNOWN',phasePlausibility:'UNKNOWN',reason:'SATURATION_REGIME_NOT_SUFFICIENT_FOR_LIQUID_PHASE_ASSESSMENT'});
}

export function validateEnvironmentPrerequisiteState(state){
  exact(state,['contractId','kind','status','authorityClass','evidenceClass','fidelity','provenance','sourceId'],'environment prerequisite');if(state.contractId!==ENVIRONMENT_PREREQUISITE_CONTRACT)fail('prerequisite contract mismatch');
  enumValue(state.kind,['VIABLE_MEDIUM','USABLE_ENERGY','NUTRIENT_REDOX'],'prerequisite kind');enumValue(state.status,['AVAILABLE','PARTIAL','UNKNOWN','UNSUPPORTED'],'prerequisite status');enumValue(state.authorityClass,['SOURCE_BOUND_EXTERNAL','RESEARCH_FIXTURE','UNSUPPORTED'],'prerequisite authorityClass');enumValue(state.evidenceClass,EVIDENCE_CLASSES,'prerequisite evidenceClass');enumValue(state.fidelity,FIDELITIES,'prerequisite fidelity');text(state.provenance,'prerequisite provenance',512);text(state.sourceId,'prerequisite sourceId',128);
  if(state.status==='AVAILABLE'&&state.authorityClass==='UNSUPPORTED')fail('available prerequisite cannot have unsupported authority');if(state.status==='UNSUPPORTED'&&state.authorityClass!=='UNSUPPORTED')fail('unsupported prerequisite requires unsupported authority');return freeze({...state});
}

export function escapeDependencyWitness(input){
  exact(input,['stellarXuvHistory','upperAtmosphereComposition','absorptionRadiusModel','heatingEfficiencyModel','escapeRegimeAssessment','p4AcceptedHistory'],'escape dependencies');bool(input.p4AcceptedHistory,'p4AcceptedHistory');
  const fields=['stellarXuvHistory','upperAtmosphereComposition','absorptionRadiusModel','heatingEfficiencyModel','escapeRegimeAssessment'];const missing=[];const sources=[];
  for(const k of fields){if(input[k]===null){missing.push(k);continue}validateScientificSource(input[k]);sources.push(input[k].sourceId)}if(!input.p4AcceptedHistory)missing.push('p4AcceptedHistory');
  return freeze({contractId:ESCAPE_DEPENDENCY_CONTRACT,authority:AUTHORITY,epistemicStatus:missing.length?'INSUFFICIENT_INPUTS':'DEPENDENCIES_PRESENT_MODEL_STILL_NOT_UNIVERSALLY_AUTHORIZED',missing:freeze(missing),sourceIds:freeze(sources),escapeRate:null,energyLimitedModelAutomaticallyAuthorized:false,evidence:EVIDENCE.escapeDependencies});
}

export function validateEnvironmentTransitionEnvelope(event){
  exact(event,['contractId','p4Protocol','transitionType','operationKey','sourceDigestHex','source','changes'],'environment transition envelope');if(event.contractId!==ENVIRONMENT_TRANSITION_CONTRACT||event.p4Protocol!==P4_PROTOCOL)fail('environment transition/P4 contract mismatch');text(event.transitionType,'transitionType',128);text(event.operationKey,'operationKey',256);hex64(event.sourceDigestHex,'sourceDigestHex');validateScientificSource(event.source);
  if(!Array.isArray(event.changes)||event.changes.length===0||event.changes.length>MAX_ENVIRONMENT_TRANSITION_CHANGES)fail('transition changes must be bounded non-empty array');
  const changes=event.changes.map((c,i)=>{exact(c,['field','beforeDigestHex','afterDigestHex'],'transition change '+i);text(c.field,'change field',128);hex64(c.beforeDigestHex,'beforeDigestHex');hex64(c.afterDigestHex,'afterDigestHex');if(c.beforeDigestHex===c.afterDigestHex)fail('zero-change transition is not meaningful');return freeze({...c})});
  return freeze({...event,changes:freeze(changes),retainedP5HistoryEntries:0,persistenceOwner:'P4',evidence:EVIDENCE.environmentHistory});
}

function readinessEntry(name,required,available,authorityClass,evidenceClass,fidelity,reason){return freeze({name,required,available,authorityClass,evidenceClass,fidelity,reason})}
export function p6EnvironmentReadinessWitnessV2({volatileProducer,acceptedP4History,volatileCompositionComplete,surfaceTemperatureState,viableMediumState,energyState,nutrientRedoxState,postGenesisAuthority}){
  const producer=validateStateProducerRecord(volatileProducer),surface=validateThermalState(surfaceTemperatureState),medium=validateEnvironmentPrerequisiteState(viableMediumState),energy=validateEnvironmentPrerequisiteState(energyState),nutrient=validateEnvironmentPrerequisiteState(nutrientRedoxState);bool(acceptedP4History,'acceptedP4History');bool(volatileCompositionComplete,'volatileCompositionComplete');enumValue(postGenesisAuthority,['NO_CANONICAL_GENESIS_MODEL','EXTERNAL_POST_GENESIS_SEED','RESEARCH_FIXTURE_ONLY','UNSUPPORTED'],'postGenesisAuthority');
  if(medium.kind!=='VIABLE_MEDIUM'||energy.kind!=='USABLE_ENERGY'||nutrient.kind!=='NUTRIENT_REDOX')fail('prerequisite kinds are bound to medium/energy/nutrient inputs');
  const producerAvailable=!['UNSUPPORTED'].includes(producer.disposition);const surfaceAvailable=surface.epistemicStatus!=='UNKNOWN';
  const dependencies=freeze([
    readinessEntry('volatileStateProducer',true,producerAvailable,producer.disposition,producer.evidenceClass,producer.fidelity,producerAvailable?'EXPLICIT_RESEARCH_PRODUCER_PRESENT':'NO_PRODUCER'),
    readinessEntry('acceptedP4History',true,acceptedP4History,acceptedP4History?'P4_ACCEPTED':'UNAVAILABLE','ESTABLISHED','FORMAL',acceptedP4History?'P4_HISTORY_ACCEPTED':'P4_HISTORY_REQUIRED'),
    readinessEntry('completeVolatileComposition',true,volatileCompositionComplete,'P5_RESEARCH_STATE','ESTABLISHED','FORMAL',volatileCompositionComplete?'COMPLETE':'PARTIAL_OR_UNKNOWN'),
    readinessEntry('surfaceTemperatureState',true,surfaceAvailable,surface.authority,surface.evidenceClass,surface.fidelity,surfaceAvailable?'SEPARATELY_SUPPLIED_OR_DERIVED_WITH_SOURCE':'SURFACE_TEMPERATURE_UNKNOWN'),
    readinessEntry('viableBiologicalMediumState',true,medium.status==='AVAILABLE',medium.authorityClass,medium.evidenceClass,medium.fidelity,medium.status),
    readinessEntry('usableEnergyState',true,energy.status==='AVAILABLE',energy.authorityClass,energy.evidenceClass,energy.fidelity,energy.status),
    readinessEntry('nutrientRedoxValidityState',true,nutrient.status==='AVAILABLE',nutrient.authorityClass,nutrient.evidenceClass,nutrient.fidelity,nutrient.status),
    readinessEntry('postGenesisAuthority',true,['EXTERNAL_POST_GENESIS_SEED','RESEARCH_FIXTURE_ONLY'].includes(postGenesisAuthority),postGenesisAuthority,'HYPOTHETICAL','STYLIZED',postGenesisAuthority)
  ]);
  const researchPostGenesisEligible=dependencies.every(d=>!d.required||d.available);
  return freeze({contractId:P6_READINESS_CONTRACT,authority:AUTHORITY,epistemicStatus:researchPostGenesisEligible?'RESEARCH_POST_GENESIS_ELIGIBLE':'INSUFFICIENT_ENVIRONMENT',researchPostGenesisEligible,canAuthorizeCanonicalBiology:false,canonicalGenesisAvailable:false,canonicalPositivePath:false,canonicalReason:'NO_CANONICAL_GENESIS_MODEL_AND_NO_PROMOTED_CANONICAL_ENVIRONMENT_PRODUCER',abiogenesisStatus:'NO_CANONICAL_GENESIS_MODEL',dependencies,optionalContextNotByItselfEligibility:freeze(['xuvEscapeHistory','geologicalActivity','oceanCoverage','regionalClimate']),failureSemantics:'ABSTAIN_FAIL_CLOSED_FOR_CANONICAL_BIOLOGY',evidence:EVIDENCE.p6Readiness});
}

export function researchSimulationModeDescriptor(){return freeze({contractId:RESEARCH_SIMULATION_CONTRACT,mode:'RESEARCH_ONLY',planetStateAuthority:'NOT_CANONICAL_PLANET_STATE',genesisAuthority:'NO_CANONICAL_GENESIS',productAuthority:'NO_PRODUCT_TRUTH',canonicalMutationAllowed:false,positiveBiologyScope:'POST_GENESIS_RESEARCH_FIXTURE_OR_EXTERNAL_SEED_ONLY'});}

export const evidence=EVIDENCE;
export const numericPolicy=freeze({integerDomain:'BIGINT_BOUNDED',ratioRounding:'NEAREST_TIES_TO_EVEN',historyRetention:'P4_OWNED_ONLY',privateP5HistoryEntries:0,roundHalfEvenRatio});
