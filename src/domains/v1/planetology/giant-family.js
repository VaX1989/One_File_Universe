(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,E=O.v1PlanetEnvironment;
if(!V||!E)throw new Error('v1 common and environment required for giant family context');
const VERSION='ofu-v11-giant-family-context-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const MIN_MASS_MILLI_EARTH=20000,MAX_MASS_MILLI_EARTH=6356000,PPM=1000000;
const AUTH=V.authority('v1.planetology.giant-family','1.0.0',[SOURCE],
  'Bounded low-fidelity giant-planet family context derived from an already modeled giant bulk prior, mass and composition proxy. It provides family-level exploration diversity only and never predicts radius, atmosphere or canonical composition.',[
    'Family bins are a research taxonomy over a bounded mass envelope; they are not an observational catalog class or validated population posterior.',
    'Heavy-element fraction is explicitly the existing model proxy 1 - lightVolatilePpm, not an inferred physical heavy-element abundance.',
    'Irradiation is carried as existing MODEL_DERIVED_SIMULATION context and does not alter the family bin in this version.',
    'No radius, cooling track, atmospheric composition, metallicity measurement, EOS result, P4 event, P5/P6 canonical state or P3 identity is created.'
  ]);
const clamp=x=>Math.max(0,Math.min(PPM,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function familyForMass(massMilliEarth){
  V.int(massMilliEarth,'giant family massMilliEarth',MIN_MASS_MILLI_EARTH,MAX_MASS_MILLI_EARTH);
  return massMilliEarth<60000?'NEPTUNE_MASS_GIANT_CANDIDATE':massMilliEarth<150000?'SUB_SATURN_CANDIDATE':massMilliEarth<700000?'JOVIAN_CANDIDATE':'SUPER_JOVIAN_CANDIDATE';
}
function irradiationClass(irradiationPpm){
  V.int(irradiationPpm,'giant family irradiationPpm',0,1000000000);
  return irradiationPpm<100000?'LOW_MODELED_IRRADIATION':irradiationPpm<1000000?'MODERATE_MODELED_IRRADIATION':irradiationPpm<10000000?'HIGH_MODELED_IRRADIATION':'EXTREME_MODELED_IRRADIATION';
}
function classify(planet){
  V.assert(planet&&planet.planetIdentity,'giant family planet');
  const c=planet.causal||null,i=c?.inputs||null,composition=c?.composition||null,formation=c?.formation||null;
  if(!i||!composition||!formation)return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'NO_CAUSAL_PLANETOLOGY_STATE',authority:AUTH,canonicalPromotion:false});
  if(!['ICE_GIANT','GAS_GIANT'].includes(i.bulkPriorClass))return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'NON_GIANT_BULK_PRIOR',bulkPriorClass:i.bulkPriorClass,authority:AUTH,canonicalPromotion:false});
  const mass=Number(i.massMilliEarth);
  if(!Number.isSafeInteger(mass)||mass<MIN_MASS_MILLI_EARTH||mass>MAX_MASS_MILLI_EARTH)return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'OUTSIDE_RESEARCH_MASS_ENVELOPE',massMilliEarth:Number.isSafeInteger(mass)?mass:null,minMassMilliEarth:MIN_MASS_MILLI_EARTH,maxMassMilliEarth:MAX_MASS_MILLI_EARTH,authority:AUTH,canonicalPromotion:false});
  const lightVolatilePpm=clamp(composition.lightVolatilePpm),heavyElementFractionPpm=PPM-lightVolatilePpm;
  const heavyElementMassMilliEarth=Math.floor(mass*heavyElementFractionPpm/PPM),irradiationPpm=Math.max(0,Math.min(1000000000,Math.round(Number(formation.irradiationPpm||0))));
  return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:true,modelId:'rd16-giant-family-envelope-1',family:familyForMass(mass),bulkPriorClass:i.bulkPriorClass,massMilliEarth:mass,
    researchMassEnvelope:Object.freeze({minMassMilliEarth:MIN_MASS_MILLI_EARTH,maxMassMilliEarth:MAX_MASS_MILLI_EARTH}),
    compositionProxy:Object.freeze({definition:'HEAVY_ELEMENT_PROXY_EQUALS_ONE_MINUS_MODELED_LIGHT_VOLATILE_FRACTION',heavyElementFractionPpm,heavyElementMassMilliEarth,lightVolatilePpm,physicalAbundanceInferenceClaim:false}),
    irradiation:Object.freeze({irradiationPpm,class:irradiationClass(irradiationPpm),familyBinAffected:false}),
    radiusPrediction:null,atmospherePrediction:null,coolingTrackPrediction:null,canonicalCompositionClaim:false,observationalClassificationClaim:false,populationCalibrationClaim:false,
    authority:AUTH,canonicalPromotion:false,p4Mutation:false,canonicalP5Unchanged:true,canonicalP6Unchanged:true,
    provenance:V.provenance('v1.planetology.giant-family','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'LOW_FIDELITY_GIANT_FAMILY_TAXONOMY',researchAuthorityPromoted:false})});
}
const previousEnrich=E.enrich;
function enrich(base,input){const state=previousEnrich(base,input),giantFamily=classify(state);return V.freezeDeep({...state,giantFamily});}
O.v1PlanetEnvironment=Object.freeze({...E,enrich});
O.v1GiantFamily=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,MIN_MASS_MILLI_EARTH,MAX_MASS_MILLI_EARTH,PPM,familyForMass,irradiationClass,classify});
})(globalThis);
