const CONTRACT_ID='ofu-p5-p6-environment-research-v2';
const CONTRACT_VERSION=2n;
const AUTHORITY='P5_RESEARCH_DRAFT';
const EARTH_MASS_KG=5972200000000000000000000n;
const PI_NUM=355n,PI_DEN=113n;
const WATER_TRIPLE_K=273.16;
const WATER_TRIPLE_PA=611.657;
const WATER_CRITICAL_K=647.096;
const WATER_CRITICAL_PA=22064000;

function fail(m){throw new Error('P5 environment research v2: '+m)}
function freeze(v){return Object.freeze(v)}
function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d<=0n)fail('positive denominator required');const neg=n<0n;if(neg)n=-n;let q=n/d;const r=n%d,t=2n*r;if(t>d||(t===d&&(q&1n)===1n))q++;return neg?-q:q}
function massKgFromMilliEarth(m){return roundHalfEvenRatio(EARTH_MASS_KG*BigInt(m),1000n)}
function u32(b){return ((b[0]<<24)>>>0)+(b[1]<<16)+(b[2]<<8)+b[3]}
function u01FromBytes(b){return u32(b)/4294967296}

export const evidence=freeze({
  volatileInventoryHypothesis:freeze({evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',validityDomain:'canonical P5 v1 terrestrial 1-8 Mearth only',extrapolationPolicy:'UNSUPPORTED outside domain'}),
  hydrostaticColumnPressure:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'thin atmosphere represented by total atmospheric mass over a spherical planet',extrapolationPolicy:'do not interpret as local weather pressure'}),
  radiativeEquilibriumEnvelope:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'global radiative reference using canonical insolation and explicit Bond-albedo bracket',extrapolationPolicy:'not surface temperature; no greenhouse claim'}),
  waterPhase:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'surface water phase classification; deep high-pressure EOS excluded',extrapolationPolicy:'high-pressure/deep states become UNSUPPORTED'}),
  xuvEscape:freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'diagnostic only; stellar rotation/XUV history required for evolutionary mass loss',extrapolationPolicy:'UNSUPPORTED for canonical loss history'}),
  spatialReference:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',validityDomain:'canonical P5 cube-sphere topology references',extrapolationPolicy:'no independent ecology grid'})
});

function requireCanonical(P5,planet,topology){
  if(!P5||P5.VERSION!=='p5-planet-physical-1')fail('frozen P5 v1 runtime required');
  if(!planet||planet.contractId!==P5.PHYSICAL_CONTRACT||planet.status!=='SUPPORTED')fail('supported canonical P5 physical planet required');
  if(planet.upstreamBaseline?.formation?.bulkPriorClass!=='TERRESTRIAL')fail('only canonical terrestrial P5 v1 domain is supported');
  if(topology&&topology.version!==P5.TERRAIN_TOPOLOGY_VERSION)fail('canonical terrain topology mismatch');
}

function deriveResearchBytes(P,P5,ctx,planet,property){
  const addr=P.address([{kind:'namespace',value:'p5.environment.research.v2'},{kind:'bytes',value:planet.planetId}]);
  return P.derive({masterSeed:ctx.masterSeed,semanticManifestHash:P5.semanticManifestHash(),domain:'ofu.p5.environment.research.v2',addressBytes:addr,property,counter:0n});
}

export function volatileInventoryHypothesis(P,P5,ctx,planet){
  requireCanonical(P5,planet,null);
  const draw=deriveResearchBytes(P,P5,ctx,planet,'volatile-total-mass-ppb');
  const partitionDraw=deriveResearchBytes(P,P5,ctx,planet,'volatile-atmosphere-partition-ppm');
  const totalMassPpb=100000n+BigInt(u32(draw)%9900001); // 100 ppm .. 1 wt%, deliberately broad research prior
  const atmospherePartitionPpm=10000n+BigInt(u32(partitionDraw)%190001); // 1% .. 20% of volatile inventory
  const atmosphericRetainedMassPpb=roundHalfEvenRatio(totalMassPpb*atmospherePartitionPpm,1000000n);
  const condensedSurfaceMassPpb=roundHalfEvenRatio(totalMassPpb*300000n,1000000n);
  const subsurfaceInteriorMassPpb=totalMassPpb-atmosphericRetainedMassPpb-condensedSurfaceMassPpb;
  if(subsurfaceInteriorMassPpb<0n)fail('volatile conservation partition negative');
  return freeze({status:'RESEARCH_HYPOTHESIS',totalMassPpb,atmosphericRetainedMassPpb,condensedSurfaceMassPpb,subsurfaceInteriorMassPpb,lostMassPpb:0n,conservationPpb:atmosphericRetainedMassPpb+condensedSurfaceMassPpb+subsurfaceInteriorMassPpb,evidence:evidence.volatileInventoryHypothesis});
}

export function surfaceColumnPressurePa(planet,atmosphericMassPpb){
  const atm=BigInt(atmosphericMassPpb);
  if(atm<0n)fail('negative atmospheric inventory');
  if(atm===0n)return 0n;
  const massKg=massKgFromMilliEarth(planet.upstreamBaseline.formation.baselineMassMilliEarth);
  const atmosphericMassKg=roundHalfEvenRatio(massKg*atm,1000000000n);
  const gMicro=planet.physical.surfaceGravityMicroMs2;
  const r=planet.physical.meanRadiusM;
  const numerator=atmosphericMassKg*gMicro*PI_DEN;
  const denominator=4n*PI_NUM*r*r*1000000n;
  return roundHalfEvenRatio(numerator,denominator);
}

export function radiativeEquilibriumEnvelope(planet,{bondAlbedoMin=0.10,bondAlbedoMax=0.60}={}){
  if(!(bondAlbedoMin>=0&&bondAlbedoMax<1&&bondAlbedoMin<=bondAlbedoMax))fail('invalid Bond albedo bracket');
  const s=Number(planet.upstreamBaseline.orbit.baselineInsolationPpm)/1e6;
  const calc=a=>278.3*Math.pow(Math.max(0,s)*(1-a)/0.7,0.25);
  const cold=calc(bondAlbedoMax),warm=calc(bondAlbedoMin);
  return freeze({status:'DERIVED_REFERENCE_ENVELOPE',insolationAuthority:'P3_CANONICAL',bondAlbedoAuthority:'P5_RESEARCH_BRACKET',bondAlbedoRange:freeze([bondAlbedoMin,bondAlbedoMax]),effectiveTemperatureK:freeze([cold,warm]),surfaceTemperatureK:null,greenhouseResponse:'UNSUPPORTED',numericAuthority:'FLOATING_SCIENTIFIC_REFERENCE_ONLY',evidence:evidence.radiativeEquilibriumEnvelope});
}

export function classifyWaterSurfaceRegime({temperatureK,pressurePa,waterMassPpb}){
  if(BigInt(waterMassPpb)<100n)return freeze({status:'SUPPORTED_CLASSIFICATION',regime:'TRACE_OR_ABSENT',evidence:evidence.waterPhase});
  const T=Number(temperatureK),P=Number(pressurePa);
  if(!Number.isFinite(T)||!Number.isFinite(P)||T<=0||P<0)fail('invalid water phase inputs');
  if(T>=WATER_CRITICAL_K)return freeze({status:'SUPPORTED_CLASSIFICATION',regime:P>=WATER_CRITICAL_PA?'SUPERCRITICAL_CAPABLE':'HOT_STEAM_VAPOR',deepRegime:'UNSUPPORTED_HIGH_PRESSURE_EOS',evidence:evidence.waterPhase});
  if(P<WATER_TRIPLE_PA)return freeze({status:'SUPPORTED_CLASSIFICATION',regime:T<WATER_TRIPLE_K?'LOW_PRESSURE_ICE_OR_VAPOR':'LOW_PRESSURE_VAPOR',deepRegime:'UNSUPPORTED_HIGH_PRESSURE_EOS',evidence:evidence.waterPhase});
  if(T<WATER_TRIPLE_K)return freeze({status:'SUPPORTED_CLASSIFICATION',regime:'SURFACE_ICE_CAPABLE',deepRegime:'UNSUPPORTED_HIGH_PRESSURE_EOS',evidence:evidence.waterPhase});
  return freeze({status:'BOUNDED_CAPABILITY_ONLY',regime:'LIQUID_OR_VAPOR_REQUIRES_SATURATION_CURVE',deepRegime:'UNSUPPORTED_HIGH_PRESSURE_EOS',evidence:evidence.waterPhase});
}

export function xuvEscapeDiagnostic(planet){
  const ageMyr=planet.upstreamBaseline.system.baselineAgeMyr;
  return freeze({status:'UNSUPPORTED_EVOLUTIONARY_RATE',reason:'STELLAR_ROTATION_XUV_HISTORY_NOT_CANONICALLY_AVAILABLE',systemAgeMyr:ageMyr,energyLimitedEscape:'DIAGNOSTIC_FORMULA_NOT_EVALUATED',jeansEscape:'UPPER_ATMOSPHERE_STATE_UNKNOWN',evidence:evidence.xuvEscape});
}

export function spatialEnvironmentReference(P5,topology,patchKey=null){
  if(!topology)return freeze({scope:'PLANET',topologyVersion:null,patch:null,evidence:evidence.spatialReference});
  const key=patchKey?P5.validatePatchKey(patchKey):null;
  return freeze({scope:key?'PATCH':'PLANET',topologyVersion:topology.version,patch:key,evidence:evidence.spatialReference});
}

export function researchEnvironmentV2(P,P5,ctx,planet,topology=null,patchKey=null){
  requireCanonical(P5,planet,topology);
  const canonical=P5.p6EnvironmentalProjection(planet,topology);
  const inventory=volatileInventoryHypothesis(P,P5,ctx,planet);
  const pressurePa=surfaceColumnPressurePa(planet,inventory.atmosphericRetainedMassPpb);
  const thermal=radiativeEquilibriumEnvelope(planet);
  const waterMassPpb=inventory.condensedSurfaceMassPpb;
  const tMid=(thermal.effectiveTemperatureK[0]+thermal.effectiveTemperatureK[1])/2;
  const water=classifyWaterSurfaceRegime({temperatureK:tMid,pressurePa,waterMassPpb});
  return freeze({contractId:CONTRACT_ID,version:CONTRACT_VERSION,authority:AUTHORITY,status:'RESEARCH_DRAFT',planetId:new Uint8Array(planet.planetId),canonicalBase:freeze({contractId:canonical.contractId,version:canonical.version,status:canonical.status,gravityMicroMs2:canonical.gravityMicroMs2,meanDensityKgM3:canonical.meanDensityKgM3,meanRadiusM:canonical.meanRadiusM,terrain:canonical.terrain}),research:freeze({volatileInventory:inventory,pressure:freeze({kind:'SURFACE_COLUMN_PRESSURE',pressurePa,evidence:evidence.hydrostaticColumnPressure}),thermal,water,xuvEscape:xuvEscapeDiagnostic(planet),geologicalActivity:'UNSUPPORTED',geochemicalEnergyAvailability:'UNSUPPORTED',oceanAreaFraction:'UNSUPPORTED'}),spatial:spatialEnvironmentReference(P5,topology,patchKey),temporal:freeze({canonicalTimeOwner:'P4',staticGenesis:['volatileInventoryHypothesis'],derivedFromCurrentUpstream:['pressure','radiativeEquilibriumEnvelope','waterPhase'],persistentMutableCandidates:['atmosphericRetainedMassPpb','lostMassPpb'],researchOnlyTransient:['effectiveTemperatureK'],privateClock:false,transitionContract:'p5-environment-transition-research-v1'}),numeric:freeze({pressurePa:'BigInt integer Pa; half-even rational rounding',inventory:'BigInt ppb of planet mass',temperature:'floating scientific reference only; fixed-point promotion unresolved'})});
}

export function applyAtmosphereLossTransition(prior,{acceptedByP4,timeKey,lostMassPpb}){
  if(acceptedByP4!==true)fail('transition requires P4-accepted event');
  if(timeKey===undefined||timeKey===null)fail('P4 time key required');
  const loss=BigInt(lostMassPpb);if(loss<0n)fail('negative loss');
  const a=prior.atmosphericRetainedMassPpb;if(loss>a)fail('loss exceeds atmosphere');
  return freeze({...prior,atmosphericRetainedMassPpb:a-loss,lostMassPpb:prior.lostMassPpb+loss,conservationPpb:(a-loss)+prior.condensedSurfaceMassPpb+prior.subsurfaceInteriorMassPpb+prior.lostMassPpb+loss,p4TimeKey:timeKey,transitionVersion:'p5-environment-transition-research-v1'});
}

export const constants=freeze({CONTRACT_ID,CONTRACT_VERSION,AUTHORITY,WATER_TRIPLE_K,WATER_TRIPLE_PA,WATER_CRITICAL_K,WATER_CRITICAL_PA});
