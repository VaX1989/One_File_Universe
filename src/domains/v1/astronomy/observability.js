(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Astronomy;
if(!V||!A||!O.v1AstronomyDepth)throw new Error('v1 common and astronomy depth required for observability context');
const VERSION='ofu-v11-astronomy-observability-1';
const SOURCE='research/v1x-15-astronomy-depth-2026-09-06';
const AUTH=V.authority('v1.astronomy.observability','1.0.0',[SOURCE],
  'Bounded deterministic reference-observer geometry and relative-flux context for modeled stellar systems. Reference distances are hypothetical query frames, not inferred positions or survey detections.',[
    'Relative flux uses inverse-square geometry over the existing modeled luminosity proxy; it is not bandpass photometry.',
    'Crowding transmission is a stylized model-derived context factor, not an empirical survey completeness function.',
    'Reference distances are fixed comparison frames and do not claim the selected system is actually that far from any observer.',
    'No extinction, reddening, scanning law, variability, saturation, instrumental response or physical observer position is modeled.'
  ]);
const PPM=1000000,MAX_REFERENCE_FRAMES=3,REFERENCE_DISTANCES_MILLI_PC=Object.freeze([10000,100000,1000000]);
const clamp=x=>Math.max(0,Math.min(PPM,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function crowdingContext(galaxy,region){
 V.assert(galaxy&&region,'astronomy observability context');
 const environment=clamp(galaxy.environmentPpm||0),weights=region.componentWeightsPpm||{};
 const bulge=clamp(weights.bulge||0),disk=clamp(weights.disk||0),halo=clamp(weights.halo||0);
 const morphology=String(galaxy.morphology||'UNKNOWN');
 const morphologyBias=morphology==='SPHEROID'?120000:morphology==='DISK'?70000:morphology==='IRREGULAR'?30000:50000;
 const crowdingPpm=clamp(environment*.38+bulge*.34+disk*.12-halo*.08+morphologyBias);
 return V.freezeDeep({crowdingPpm,inputs:Object.freeze({environmentPpm:environment,bulgePpm:bulge,diskPpm:disk,haloPpm:halo,morphology}),
  model:'STYLIZED_LOCAL_CROWDING_CONTEXT',empiricallyCalibrated:false,observedCrowding:false,authority:AUTH});
}
function atDistance(primary,{distanceMilliPc,crowdingPpm=0,referenceFluxPpm=1000}={}){
 V.assert(primary&&typeof primary==='object','stellar observability primary');
 V.int(distanceMilliPc,'distanceMilliPc',1,1000000000);V.ppm(crowdingPpm,'crowdingPpm');V.int(referenceFluxPpm,'referenceFluxPpm',1,1000000000);
 const luminosityMilliSolar=V.clamp(Math.round(Number(primary.luminosityMilliSolar||0)),0,1000000000);
 const d=BigInt(distanceMilliPc),denom=d*d;
 const relativeFluxAt10PcPpm=Number((BigInt(luminosityMilliSolar)*100000000000n)/denom);
 const flux=BigInt(Math.max(0,relativeFluxAt10PcPpm)),ref=BigInt(referenceFluxPpm),fluxScore=flux===0n?0:Number((flux*1000000n)/(flux+ref));
 const transmission=clamp(PPM-Math.floor(crowdingPpm*3/4));
 const detectabilityScorePpm=clamp(Math.floor(fluxScore*transmission/PPM));
 const parallaxMicroArcsec=Number(1000000000n/d);
 return V.freezeDeep({distanceMilliPc,luminosityMilliSolar,relativeFluxAt10PcPpm,parallaxMicroArcsec,crowdingPpm,crowdingTransmissionPpm:transmission,detectabilityScorePpm,
  geometry:'INVERSE_SQUARE_RELATIVE_FLUX_AND_PARALLAX_REFERENCE',selectionMeaning:'SURVEY_NEUTRAL_HEURISTIC_NOT_COMPLETENESS_PROBABILITY',
  referenceDistanceOnly:true,actualObserverDistanceClaim:false,bandpassPhotometry:false,extinctionModeled:false,variabilityModeled:false,instrumentModel:false,
  probability:false,measured:false,canonicalClaim:false,authority:AUTH});
}
function systemObservability(system){
 V.assert(system&&system.primary&&system.galaxy&&system.region,'stellar system observability input');
 const crowding=crowdingContext(system.galaxy,system.region),referenceSeries=REFERENCE_DISTANCES_MILLI_PC.map(distanceMilliPc=>atDistance(system.primary,{distanceMilliPc,crowdingPpm:crowding.crowdingPpm}));
 for(let i=1;i<referenceSeries.length;i++){
  V.assert(referenceSeries[i].parallaxMicroArcsec<=referenceSeries[i-1].parallaxMicroArcsec,'parallax reference monotonicity');
  V.assert(referenceSeries[i].detectabilityScorePpm<=referenceSeries[i-1].detectabilityScorePpm,'detectability reference monotonicity');
 }
 return V.freezeDeep({version:VERSION,modelClass:'REFERENCE_OBSERVABILITY_CONTEXT',referenceSeries,crowding,maxReferenceFrames:MAX_REFERENCE_FRAMES,bounded:true,
  authority:AUTH,canonicalPromotion:false,observationalCatalogClaim:false,surveyCompletenessProbability:false,researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'OBSERVABILITY_PROXY',researchAuthorityPromoted:false})});
}
const previousSystemBirthContext=A.systemBirthContext;
function systemBirthContext(input){
 const base=previousSystemBirthContext(input),observability=systemObservability(base);
 return V.freezeDeep({...base,observability});
}
O.v1Astronomy=Object.freeze({...A,systemBirthContext});
O.v1AstronomyObservability=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,PPM,MAX_REFERENCE_FRAMES,REFERENCE_DISTANCES_MILLI_PC,crowdingContext,atDistance,systemObservability});
})(globalThis);
