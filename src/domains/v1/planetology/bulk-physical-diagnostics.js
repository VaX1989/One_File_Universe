(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,E=O.v1PlanetEnvironment;
if(!V||!E)throw new Error('v1 common and environment required for bulk physical diagnostics');
const VERSION='ofu-v11-bulk-physical-diagnostics-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const PPM=1000000;
const EARTH_MASS_KG=5972200000000000000000000n;
const G_NUM=667430n,G_DEN=10000000000000000n;
const PI_NUM=355n,PI_DEN=113n;
const AUTH=V.authority('v1.planetology.bulk-diagnostics','1.0.0',[SOURCE],
  'Deterministic spherical-body reference diagnostics derived from the existing modeled mass/radius inputs. The witness cross-checks reduced-order gravity/density outputs without upgrading those inputs or the diagnostic to canonical physical truth.',[
    'Mass and radius are consumed from the existing planetology causal input and retain their prior authority; this component does not establish their measurement or canonicality.',
    'Surface gravity assumes a spherical non-rotating body and mean density assumes a uniform volume definition; oblateness, rotation, pressure structure and EOS effects are not modeled.',
    'Reference constants and rational pi are arithmetic inputs to a reproducibility witness, not a claim of metrological or observational precision.',
    'Agreement residuals compare two model-derived calculations only; they are not empirical error bars, calibration residuals or probabilities.'
  ]);
function divHalfEven(n,d){
  V.assert(typeof n==='bigint'&&typeof d==='bigint'&&n>=0n&&d>0n,'bulk diagnostics bigint division');
  let q=n/d,r=n%d;const twice=r*2n;
  if(twice>d||(twice===d&&(q&1n)===1n))q++;
  return q;
}
function safeNumber(n,label){V.assert(n>=0n&&n<=BigInt(Number.MAX_SAFE_INTEGER),label+' safe integer');return Number(n);}
function ppmDelta(a,b){
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b<=0)return null;
  return safeNumber(divHalfEven(BigInt(Math.abs(a-b))*1000000n,BigInt(b)),'bulk diagnostics ppm delta');
}
function derive(planet){
  V.assert(planet&&planet.planetIdentity,'bulk diagnostics planet');V.text(String(planet.planetIdentity),'planetIdentity',128);
  const c=planet.causal||null,i=c?.inputs||null;
  if(!i)return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'NO_CAUSAL_PLANETOLOGY_STATE',authority:AUTH,canonicalPromotion:false});
  const massMilliEarth=Number(i.massMilliEarth),radiusKm=Number(i.radiusKm);
  if(!Number.isSafeInteger(massMilliEarth)||massMilliEarth<=0||!Number.isSafeInteger(radiusKm)||radiusKm<=0)
    return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'INVALID_MODELED_MASS_OR_RADIUS',authority:AUTH,canonicalPromotion:false});
  const massKg=divHalfEven(EARTH_MASS_KG*BigInt(massMilliEarth),1000n),radiusM=BigInt(radiusKm)*1000n;
  const surfaceGravityMilliMs2=safeNumber(divHalfEven(G_NUM*massKg*1000n,G_DEN*radiusM*radiusM),'surface gravity');
  const meanDensityKgM3=safeNumber(divHalfEven(3n*massKg*PI_DEN,4n*PI_NUM*radiusM*radiusM*radiusM),'mean density');
  const modelGravity=Number(c.gravity?.surfaceGravityMilliMs2),modelDensity=Number(c.composition?.bulkDensityKgM3);
  const gravityAgreement=Number.isSafeInteger(modelGravity)?Object.freeze({existingReducedModelValue:modelGravity,referenceDiagnosticValue:surfaceGravityMilliMs2,signedResidual:modelGravity-surfaceGravityMilliMs2,absoluteDeltaPpm:ppmDelta(modelGravity,surfaceGravityMilliMs2),empiricalErrorBarClaim:false}):null;
  const densityAgreement=Number.isSafeInteger(modelDensity)?Object.freeze({existingReducedModelValue:modelDensity,referenceDiagnosticValue:meanDensityKgM3,signedResidual:modelDensity-meanDensityKgM3,absoluteDeltaPpm:ppmDelta(modelDensity,meanDensityKgM3),empiricalErrorBarClaim:false}):null;
  return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:true,modelId:'rd16-spherical-bulk-diagnostic-1',
    inputs:Object.freeze({massMilliEarth,radiusKm,inputAuthority:'EXISTING_PLANETOLOGY_CAUSAL_INPUT',inputCanonicalityUpgraded:false}),
    diagnostics:Object.freeze({surfaceGravityMilliMs2,meanDensityKgM3,geometry:'SPHERICAL_REFERENCE_BODY',rotationCorrectionApplied:false,oblatenessCorrectionApplied:false,eosApplied:false}),
    agreement:Object.freeze({surfaceGravity:gravityAgreement,meanDensity:densityAgreement,comparisonClass:'MODEL_TO_REFERENCE_DIAGNOSTIC_ONLY'}),
    referenceConstants:Object.freeze({earthMassKg:String(EARTH_MASS_KG),gravitationalConstant:'6.67430e-11 m3 kg-1 s-2',piRational:'355/113',metrologicalClaim:false}),
    arithmetic:Object.freeze({integerIntermediate:true,rounding:'ROUND_HALF_TO_EVEN',deterministic:true}),
    authority:AUTH,canonicalPromotion:false,measurementClaim:false,calibrationClaim:false,probabilityClaim:false,p4Mutation:false,canonicalP5Unchanged:true,canonicalP6Unchanged:true,
    provenance:V.provenance('v1.planetology.bulk-diagnostics','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'PURE_DERIVED_SPHERICAL_GRAVITY_DENSITY_DIAGNOSTIC',researchAuthorityPromoted:false})});
}
const previousEnrich=E.enrich;
function enrich(base,input){const state=previousEnrich(base,input),bulkPhysicalDiagnostics=derive(state);return V.freezeDeep({...state,bulkPhysicalDiagnostics});}
O.v1PlanetEnvironment=Object.freeze({...E,enrich});
O.v1BulkPhysicalDiagnostics=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,PPM,derive,divHalfEven,ppmDelta});
})(globalThis);
