(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2,P5=O.p5Planetology;
if(!P||!P5)throw new Error('OFU P5 Environment v2 requires frozen P2 and P5 v1');

const VERSION='p5-environment-2';
const SCHEMA_VERSION=2n;
const CONTRACT_ID='ofu-p5-p6-environment-v2';
const ATMOSPHERE_STATE_CONTRACT='ofu-p5-atmosphere-state-v2';
const AUTHORITY='P5_CANONICAL';
const BASELINE_EPOCH='P4_T0';
const ATMOSPHERE_LAW='p5-atmosphere-conservation-tg-v1';
const PRESSURE_LAW='p5-global-column-pressure-v1';
const RADIATIVE_LAW='p5-radiative-equilibrium-s1361-sigma-codata2022-v1';
const EVIDENCE_POLICY='p5-evidence-policy-1';
const GENESIS_POLICY='NO_CANONICAL_GENESIS';
const TRANSITION_POLICY='NO_ENDOGENOUS_ATMOSPHERE_LOSS';
const MASS_UNIT='TERAGRAM_1E9_KG';
const U64_MAX=(1n<<64n)-1n;
const P3_INSOLATION_MAX_PPM=1000000000000n;
const FRACTION_PPM=1000000n;
const KG_PER_TG=1000000000n;
const MICRO=1000000n;
const EARTH_MASS_KG=5972200000000000000000000n;
const PI_NUM=355n,PI_DEN=113n;
const NOMINAL_SOLAR_IRRADIANCE_WM2=1361n;
// CODATA 2022 gives sigma = 5.670 374 419...e-8 W m^-2 K^-4. The
// canonical model freezes the shown 10-digit decimal as this exact rational.
const SIGMA_NUM=5670374419n,SIGMA_DEN=100000000000000000n;
const MILLIKELVIN_PER_K=1000n;
const MILLIKELVIN4=MILLIKELVIN_PER_K**4n;

function fail(m){throw new Error('OFU P5 Environment v2: '+m)}
function freeze(v){return Object.freeze(v)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function text(v,n){if(typeof v!=='string'||v.length===0)fail(n+' must be non-empty text');return v}
function sameBytes(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&P.hex(a)===P.hex(b)}
function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d<=0n)fail('positive denominator required');const neg=n<0n;if(neg)n=-n;let q=n/d;const r=n%d,t=2n*r;if(t>d||(t===d&&(q&1n)===1n))q++;return neg?-q:q}
function pow4(x){const y=x*x;return y*y}
function fourthRootFloor(n){if(n<0n)fail('negative fourth-root input');if(n<2n)return n;let lo=0n,hi=1n;while(pow4(hi)<=n)hi<<=1n;while(lo+1n<hi){const mid=(lo+hi)>>1n;if(pow4(mid)<=n)lo=mid;else hi=mid}return lo}
function roundFourthRootRatioHalfEven(n,d){n=BigInt(n);d=BigInt(d);if(n<0n||d<=0n)fail('invalid fourth-root ratio');if(n===0n)return 0n;const q=fourthRootFloor(n/d),mid2=2n*q+1n,left=16n*n,right=d*pow4(mid2);if(left>right||(left===right&&(q&1n)===1n))return q+1n;return q}

const MANIFEST=freeze({
  semanticManifestVersion:1n,
  canonicalProtocolVersion:'ofu-cbv-1',
  canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',
  numericContractVersion:1n,
  generatorSuite:'p5-environment',
  generatorSuiteVersion:2n,
  subsystems:freeze({environment:2n,atmosphere:1n,radiativeTier0:1n}),
  domains:freeze({planetaryEnvironment:2n}),
  dependencies:freeze({p2:'ofu-cbv-1',astronomy:'p3-astronomy-1',temporal:'ofu-p4-temporal-v1',planetPhysical:'p5-planet-physical-1',terrain:'p5-cube-sphere-topology-1'}),
  lawProfile:'p5-environment-v2-atmosphere-pressure-radiative-tier0',
  genesis:freeze({
    baselineEpoch:BASELINE_EPOCH,
    schemaVersion:SCHEMA_VERSION,
    modelVersion:VERSION,
    environmentContractId:CONTRACT_ID,
    atmosphereStateLawProfile:ATMOSPHERE_LAW,
    radiativeTier0LawProfile:RADIATIVE_LAW,
    evidencePolicyVersion:EVIDENCE_POLICY,
    genesisPolicyVersion:'no-canonical-volatile-genesis-v1',
    transitionPolicyVersion:'no-endogenous-atmosphere-loss-v1'
  })
});
P.validateSemanticManifest(MANIFEST);

const EVIDENCE=freeze({
  atmosphereSchema:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',validityDomain:'mass bookkeeping for canonical P5 v1 terrestrial planets',excludedRegimes:'none for bookkeeping; genesis is separately UNKNOWN',sources:freeze(['MASS_CONSERVATION'])}),
  volatileGenesis:freeze({evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',validityDomain:'no promoted inventory prior',excludedRegimes:'all generated volatile inventories',sources:freeze(['MORBIDELLI_2012','ELKINS_TANTON_2012','TIAN_2015'])}),
  columnPressure:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'global mean column weight over frozen spherical P5 v1 radius at frozen surface gravity',excludedRegimes:'local weather pressure, strongly non-spherical gravity fields, no-defined-surface planets',sources:freeze(['NASA_PRESSURE_FORCE','NASA_WEIGHT','JPL_AIR_MASS_PRESSURE'])}),
  radiativeTier0:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'uniform global radiative equilibrium with unit longwave emissivity, no greenhouse/internal heat/background floor',excludedRegimes:'surface temperature, greenhouse climate, regional transport',sources:freeze(['IAU_2015_B3','NIST_CODATA_2022','NASA_CERES_ENERGY_BALANCE'])}),
  albedoDomain:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',validityDomain:'dimensionless Bond albedo physical domain 0..1 only',excludedRegimes:'no probability distribution or terrestrial prior is implied',sources:freeze(['NASA_ALBEDO_DEFINITION'])})
});

function semanticManifest(){return MANIFEST}
function semanticManifestHash(){return P.semanticManifestHash(MANIFEST)}
function requireCanonicalPlanet(planet){
  if(P5.VERSION!=='p5-planet-physical-1'||P5.PHYSICAL_CONTRACT!=='ofu-p5-planet-physical-v1')fail('frozen P5 v1 dependency mismatch');
  if(!planet||planet.contractId!==P5.PHYSICAL_CONTRACT||planet.status!=='SUPPORTED')fail('supported canonical P5 v1 physical planet required');
  if(planet.baselineEpoch!==BASELINE_EPOCH)fail('P5 baseline epoch mismatch');
  if(planet.upstreamBaseline?.formation?.bulkPriorClass!=='TERRESTRIAL')fail('Environment v2 supports canonical terrestrial P5 v1 only');
  const m=planet.upstreamBaseline.formation.baselineMassMilliEarth;if(typeof m!=='bigint'||m<1000n||m>8000n)fail('Environment v2 mass domain is 1-8 Mearth');
  return planet;
}
function planetMassTgAtBaseline(planet){requireCanonicalPlanet(planet);return roundHalfEvenRatio(EARTH_MASS_KG*planet.upstreamBaseline.formation.baselineMassMilliEarth,1000n*KG_PER_TG)}
function deriveEnvironmentBytes(ctx,planetId,property,counter=0n){
  if(!ctx||!(ctx.masterSeed instanceof Uint8Array)||ctx.masterSeed.length!==32)fail('P2 32-byte masterSeed required');
  if(!(planetId instanceof Uint8Array)||planetId.length!==32)fail('planetId must be 32 bytes');
  text(property,'property');u64(counter,'counter');
  const addressBytes=P.address([{kind:'namespace',value:'p5.environment.v2'},{kind:'bytes',value:planetId}]);
  return P.derive({masterSeed:ctx.masterSeed,semanticManifestHash:semanticManifestHash(),domain:'ofu.p5.environment.v2',addressBytes,property,counter});
}

function unknownAtmosphereState(planet){
  requireCanonicalPlanet(planet);
  return freeze({contractId:ATMOSPHERE_STATE_CONTRACT,version:SCHEMA_VERSION,authority:AUTHORITY,epistemicStatus:'UNKNOWN',provenance:'NO_CANONICAL_VOLATILE_GENESIS',genesisPolicy:GENESIS_POLICY,unit:MASS_UNIT,reference:'ABSOLUTE_MASS_NO_DENOMINATOR',totalVolatileMassTg:null,atmosphericRetainedMassTg:null,condensedSurfaceMassTg:null,subsurfaceInteriorMassTg:null,lostMassTg:null,evidence:EVIDENCE.volatileGenesis});
}
function validateConservedAtmosphereState(planet,state){
  requireCanonicalPlanet(planet);if(!state||typeof state!=='object'||Array.isArray(state))fail('atmosphere state must be a map');
  if(state.contractId!==ATMOSPHERE_STATE_CONTRACT||state.version!==SCHEMA_VERSION)fail('atmosphere state contract mismatch');
  if(state.unit!==MASS_UNIT||state.reference!=='ABSOLUTE_MASS_NO_DENOMINATOR')fail('atmosphere mass representation mismatch');
  if(state.epistemicStatus==='UNKNOWN'){
    if(state.authority!==AUTHORITY||state.genesisPolicy!==GENESIS_POLICY)fail('unknown atmosphere authority mismatch');
    for(const k of ['totalVolatileMassTg','atmosphericRetainedMassTg','condensedSurfaceMassTg','subsurfaceInteriorMassTg','lostMassTg'])if(state[k]!==null)fail('unknown atmosphere cannot contain mass values');
    return state;
  }
  if(!['KNOWN','HYPOTHETICAL_MODEL_VALUE'].includes(state.epistemicStatus))fail('atmosphere epistemic status unsupported');
  if(state.authority==='P5_RESEARCH_DRAFT')fail('research atmosphere cannot masquerade as canonical v2');
  if(state.epistemicStatus==='KNOWN'&&state.authority!=='P5_CANONICAL_STATE')fail('known atmosphere requires P5 canonical state authority');
  if(state.epistemicStatus==='HYPOTHETICAL_MODEL_VALUE'&&state.authority!=='P5_MODEL_HYPOTHESIS')fail('hypothetical atmosphere requires explicit model-hypothesis authority');
  text(state.provenance,'atmosphere provenance');
  const total=u64(state.totalVolatileMassTg,'totalVolatileMassTg'),atm=u64(state.atmosphericRetainedMassTg,'atmosphericRetainedMassTg'),cond=u64(state.condensedSurfaceMassTg,'condensedSurfaceMassTg'),interior=u64(state.subsurfaceInteriorMassTg,'subsurfaceInteriorMassTg'),lost=u64(state.lostMassTg,'lostMassTg');
  if(atm+cond+interior+lost!==total)fail('volatile mass conservation failure');
  if(total>planetMassTgAtBaseline(planet))fail('volatile inventory exceeds immutable baseline planet mass');
  return state;
}

function globalSurfaceColumnPressurePa(planet,atmosphericMassTg){
  requireCanonicalPlanet(planet);const atm=u64(atmosphericMassTg,'atmosphericMassTg');if(atm>planetMassTgAtBaseline(planet))fail('atmospheric mass exceeds immutable baseline planet mass');if(atm===0n)return 0n;
  const g=u64(planet.physical.surfaceGravityMicroMs2,'surfaceGravityMicroMs2'),r=u64(planet.physical.meanRadiusM,'meanRadiusM');
  const numerator=atm*KG_PER_TG*g*PI_DEN;
  const denominator=4n*PI_NUM*r*r*MICRO;
  const pa=roundHalfEvenRatio(numerator,denominator);if(pa<0n||pa>U64_MAX)fail('column pressure overflow');return pa;
}
function pressureFromAtmosphereState(planet,state){
  validateConservedAtmosphereState(planet,state);
  if(state.epistemicStatus==='UNKNOWN')return freeze({kind:'GLOBAL_SURFACE_COLUMN_PRESSURE',epistemicStatus:'UNKNOWN',authority:AUTHORITY,provenance:'ATMOSPHERIC_MASS_UNKNOWN',pressurePa:null,evidence:EVIDENCE.columnPressure});
  const pressurePa=globalSurfaceColumnPressurePa(planet,state.atmosphericRetainedMassTg),status=state.epistemicStatus==='KNOWN'?'DERIVED':'HYPOTHETICAL_MODEL_VALUE';
  return freeze({kind:'GLOBAL_SURFACE_COLUMN_PRESSURE',epistemicStatus:status,authority:state.authority,provenance:'DERIVED_FROM_'+state.provenance,pressurePa,evidence:EVIDENCE.columnPressure});
}

function radiativeEffectiveTemperatureMilliK(insolationPpm,bondAlbedoPpm){
  const s=u64(insolationPpm,'insolationPpm'),a=u64(bondAlbedoPpm,'bondAlbedoPpm');if(s>P3_INSOLATION_MAX_PPM)fail('insolation exceeds frozen P3 v1 domain');if(a>FRACTION_PPM)fail('Bond albedo must be 0..1000000 ppm');if(s===0n||a===FRACTION_PPM)return 0n;
  const absorbed=FRACTION_PPM-a;
  const numerator=NOMINAL_SOLAR_IRRADIANCE_WM2*s*absorbed*SIGMA_DEN*MILLIKELVIN4;
  const denominator=4n*FRACTION_PPM*FRACTION_PPM*SIGMA_NUM;
  const milliK=roundFourthRootRatioHalfEven(numerator,denominator);if(milliK<0n||milliK>U64_MAX)fail('radiative temperature overflow');return milliK;
}
function radiativePhysicalDomainEnvelope(insolationPpm){
  const s=u64(insolationPpm,'insolationPpm');if(s>P3_INSOLATION_MAX_PPM)fail('insolation exceeds frozen P3 v1 domain');
  return freeze({epistemicStatus:'DERIVED',authority:AUTHORITY,provenance:'FULL_PHYSICAL_BOND_ALBEDO_DOMAIN_NOT_A_PRIOR',bondAlbedoDomainPpm:freeze([0n,FRACTION_PPM]),effectiveTemperatureMilliK:freeze([0n,radiativeEffectiveTemperatureMilliK(s,0n)]),evidence:EVIDENCE.albedoDomain});
}

function unsupportedField(reason,evidence=null){return freeze({epistemicStatus:'UNSUPPORTED',authority:AUTHORITY,provenance:reason,value:null,evidence});}
function unknownField(reason,evidence=null){return freeze({epistemicStatus:'UNKNOWN',authority:AUTHORITY,provenance:reason,value:null,evidence});}
function environmentV2Projection(planet,topology=null){
  requireCanonicalPlanet(planet);if(topology&&topology.version!==P5.TERRAIN_TOPOLOGY_VERSION)fail('canonical P5 terrain topology mismatch');
  const v1=P5.p6EnvironmentalProjection(planet,topology),atmosphere=unknownAtmosphereState(planet),pressure=pressureFromAtmosphereState(planet,atmosphere),insolation=planet.upstreamBaseline.orbit.baselineInsolationPpm;
  return freeze({
    contractId:CONTRACT_ID,version:SCHEMA_VERSION,modelVersion:VERSION,authority:AUTHORITY,baselineEpoch:BASELINE_EPOCH,planetId:new Uint8Array(planet.planetId),semanticManifestHash:semanticManifestHash(),
    canonicalV1:freeze({contractId:v1.contractId,version:v1.version,status:v1.status,gravityMicroMs2:v1.gravityMicroMs2,meanDensityKgM3:v1.meanDensityKgM3,meanRadiusM:v1.meanRadiusM,terrain:v1.terrain}),
    epistemicVocabulary:freeze(['KNOWN','DERIVED','HYPOTHETICAL_MODEL_VALUE','UNKNOWN','UNSUPPORTED']),
    atmosphere,
    pressure,
    radiativeTier0:freeze({
      law:RADIATIVE_LAW,
      insolation:freeze({epistemicStatus:'KNOWN',authority:'P3_CANONICAL',provenance:'ofu-p3-p5-planetary-input-v1.baselineInsolationPpm',valuePpm:insolation}),
      bondAlbedo:unknownField('NO_CANONICAL_BOND_ALBEDO_MODEL',EVIDENCE.albedoDomain),
      effectiveTemperature:unknownField('BOND_ALBEDO_UNKNOWN',EVIDENCE.radiativeTier0),
      physicalDomainEnvelope:radiativePhysicalDomainEnvelope(insolation),
      surfaceTemperature:unsupportedField('NO_PROMOTED_GREENHOUSE_OR_SURFACE_CLIMATE_MODEL'),
      greenhouseResponse:unsupportedField('NO_PROMOTED_GREENHOUSE_MODEL'),
      evidence:EVIDENCE.radiativeTier0
    }),
    waterPhase:unsupportedField('DEFERRED_OUT_OF_ENVIRONMENT_V2_SCOPE'),
    xuvEvolution:unsupportedField('STELLAR_XUV_HISTORY_AND_UPPER_ATMOSPHERE_STATE_UNAVAILABLE'),
    atmosphericEscapeHistory:unsupportedField('NO_PROMOTED_P4_BOUND_ESCAPE_TRANSITION_LAW'),
    geologicalActivity:unsupportedField('DEFERRED_OUT_OF_ENVIRONMENT_V2_SCOPE'),
    geochemicalEnergyAvailability:unsupportedField('DEFERRED_OUT_OF_ENVIRONMENT_V2_SCOPE'),
    oceanAreaFraction:unsupportedField('PHYSICAL_HYPSOMETRY_UNAVAILABLE'),
    spatial:freeze({topologyVersion:topology?topology.version:null,regionalEnvironment:'UNSUPPORTED',independentGridCreated:false}),
    temporal:freeze({canonicalTimeOwner:'P4',baselineEpoch:BASELINE_EPOCH,endogenousAtmosphereLossTransitions:'UNSUPPORTED',privateClock:false,transitionPolicy:TRANSITION_POLICY}),
    numeric:freeze({atmosphereMass:freeze({storage:'u64 BigInt',unit:MASS_UNIT,reference:'ABSOLUTE_MASS_NO_DENOMINATOR',rounding:'not applicable for stored state'}),pressure:freeze({storage:'u64 BigInt',unit:'PASCAL',rounding:'nearest ties-to-even rational',law:PRESSURE_LAW}),effectiveTemperature:freeze({storage:'u64 BigInt',unit:'MILLIKELVIN',rounding:'nearest ties-to-even exact rational fourth-root',law:RADIATIVE_LAW})}),
    evidence:freeze({atmosphereSchema:EVIDENCE.atmosphereSchema,volatileGenesis:EVIDENCE.volatileGenesis,columnPressure:EVIDENCE.columnPressure,radiativeTier0:EVIDENCE.radiativeTier0})
  });
}
function environmentDigest(env){return O.sha256.digest(P.encode(env))}

O.p5EnvironmentV2=freeze({VERSION,SCHEMA_VERSION,CONTRACT_ID,ATMOSPHERE_STATE_CONTRACT,AUTHORITY,BASELINE_EPOCH,ATMOSPHERE_LAW,PRESSURE_LAW,RADIATIVE_LAW,EVIDENCE_POLICY,GENESIS_POLICY,TRANSITION_POLICY,MASS_UNIT,P3_INSOLATION_MAX_PPM,FRACTION_PPM,NOMINAL_SOLAR_IRRADIANCE_WM2,SIGMA_NUM,SIGMA_DEN,MANIFEST,EVIDENCE,semanticManifest,semanticManifestHash,planetMassTgAtBaseline,deriveEnvironmentBytes,unknownAtmosphereState,validateConservedAtmosphereState,globalSurfaceColumnPressurePa,pressureFromAtmosphereState,radiativeEffectiveTemperatureMilliK,radiativePhysicalDomainEnvelope,environmentV2Projection,environmentDigest});
})(typeof globalThis!=='undefined'?globalThis:this);
