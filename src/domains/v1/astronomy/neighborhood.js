(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Astronomy;
if(!V||!A)throw new Error('v1 common and astronomy required for galactic neighborhood context');
const VERSION='ofu-v11-galactic-neighborhood-context-1';
const SOURCE='research/v1x-15-astronomy-depth-2026-09-06';
const MAX_PROBES=5,STEP_PPM=100000;
const AUTH=V.authority('v1.astronomy.galactic-neighborhood','1.0.0',[SOURCE],
  'Bounded deterministic parameter-space neighborhood around an already modeled galactic region. It summarizes changes in the existing reduced-order disk/bulge/halo, age and metallicity model without asserting physical coordinates, observed gradients or catalog truth.',[
    'Probe radial/height coordinates are model parameters, not reconstructed physical positions.',
    'Age, metallicity and component-weight deltas are MODEL_DERIVED_SIMULATION from the existing low-dimensional astronomy model, not measurements.',
    'Five fixed probes are an inspection stencil only; they are not global enumeration, spatial interpolation, a density field or a dynamical galactic model.'
  ]);
const clampPpm=x=>V.clamp(Math.round(Number(x)),0,1000000);
function dominantComponent(weights){
  const entries=[['disk',Number(weights.disk||0)],['bulge',Number(weights.bulge||0)],['halo',Number(weights.halo||0)]];
  entries.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return entries[0][0].toUpperCase();
}
function pointKey(p){return p.radialPpm+':'+p.heightPpm;}
function summarize(base,input={}){
  V.assert(base&&base.galaxy&&base.region&&base.ids,'galactic neighborhood system context');
  const radial=clampPpm(input.radialPpm??500000),height=clampPpm(input.heightPpm??0);
  V.ppm(radial,'radialPpm');V.ppm(height,'heightPpm');
  const specs=Object.freeze([
    Object.freeze({label:'CENTER',radialPpm:radial,heightPpm:height}),
    Object.freeze({label:'RADIAL_IN',radialPpm:clampPpm(radial-STEP_PPM),heightPpm:height}),
    Object.freeze({label:'RADIAL_OUT',radialPpm:clampPpm(radial+STEP_PPM),heightPpm:height}),
    Object.freeze({label:'PLANEWARD',radialPpm:radial,heightPpm:clampPpm(height-STEP_PPM)}),
    Object.freeze({label:'OFF_PLANE',radialPpm:radial,heightPpm:clampPpm(height+STEP_PPM)})
  ]);
  V.assert(specs.length===MAX_PROBES,'galactic neighborhood probe bound');
  const probes=specs.map(spec=>{
    const sampleId=V.deriveId('galactic-neighborhood-probe',base.ids.galacticRegionIdentity,spec.label,spec.radialPpm,spec.heightPpm);
    const region=A.regionProfile({galaxy:base.galaxy,galacticRegionIdentity:sampleId,radialPpm:spec.radialPpm,heightPpm:spec.heightPpm});
    return Object.freeze({label:spec.label,sampleIdentity:sampleId,radialPpm:spec.radialPpm,heightPpm:spec.heightPpm,
      componentWeightsPpm:region.componentWeightsPpm,dominantComponent:dominantComponent(region.componentWeightsPpm),
      ageMyr:region.ageMyr,metallicityMilliDex:region.metallicityMilliDex,authority:AUTH,
      canonicalRegionIdentityClaim:false,physicalCoordinateClaim:false});
  });
  const center=probes[0],deltas=probes.slice(1).map(p=>Object.freeze({label:p.label,
    ageDeltaMyr:p.ageMyr-center.ageMyr,metallicityDeltaMilliDex:p.metallicityMilliDex-center.metallicityMilliDex,
    diskDeltaPpm:p.componentWeightsPpm.disk-center.componentWeightsPpm.disk,
    bulgeDeltaPpm:p.componentWeightsPpm.bulge-center.componentWeightsPpm.bulge,
    haloDeltaPpm:p.componentWeightsPpm.halo-center.componentWeightsPpm.halo}));
  const maxAbs=(rows,key)=>rows.reduce((m,r)=>Math.max(m,Math.abs(Number(r[key]||0))),0);
  const maxComponentWeightDeltaPpm=Math.max(maxAbs(deltas,'diskDeltaPpm'),maxAbs(deltas,'bulgeDeltaPpm'),maxAbs(deltas,'haloDeltaPpm'));
  const maxAgeDeltaMyr=maxAbs(deltas,'ageDeltaMyr'),maxMetallicityDeltaMilliDex=maxAbs(deltas,'metallicityDeltaMilliDex');
  const componentGradient=maxComponentWeightDeltaPpm>=100000,chemAgeGradient=maxAgeDeltaMyr>=500||maxMetallicityDeltaMilliDex>=100;
  const neighborhoodClass=componentGradient&&chemAgeGradient?'COMBINED_MODELED_GRADIENT':componentGradient?'MODELED_COMPONENT_GRADIENT':chemAgeGradient?'MODELED_AGE_METALLICITY_GRADIENT':'MODELED_LOCAL_STABILITY';
  const distinctParameterPoints=new Set(probes.map(pointKey)).size;
  return V.freezeDeep({version:VERSION,galaxyIdentity:base.galaxy.galaxyIdentity,galacticRegionIdentity:base.ids.galacticRegionIdentity,
    probes:Object.freeze(probes),deltas:Object.freeze(deltas),summary:Object.freeze({maxComponentWeightDeltaPpm,maxAgeDeltaMyr,maxMetallicityDeltaMilliDex,neighborhoodClass,distinctParameterPoints}),
    bounds:Object.freeze({maxProbes:MAX_PROBES,stepPpm:STEP_PPM,materializedProbes:probes.length,globalEnumeration:false}),
    authority:AUTH,canonicalPromotion:false,measured:false,probability:false,physicalDensityFieldClaim:false,physicalGradientVectorClaim:false,
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_LOCAL_DENSITY_PARAMETER_STENCIL',researchAuthorityPromoted:false})});
}
const previousSystemBirthContext=A.systemBirthContext;
function systemBirthContext(input){const base=previousSystemBirthContext(input);return V.freezeDeep({...base,galacticNeighborhood:summarize(base,input)});}
O.v1Astronomy=Object.freeze({...A,systemBirthContext});
O.v1GalacticNeighborhood=Object.freeze({VERSION,AUTHORITY:AUTH,MAX_PROBES,STEP_PPM,dominantComponent,summarize});
})(globalThis);
