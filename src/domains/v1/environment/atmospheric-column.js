(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,E=O.v1PlanetEnvironment;
if(!V||!E)throw new Error('v1 common and environment required for atmospheric column context');
const VERSION='ofu-v11-atmospheric-column-context-1';
const SOURCE='research/v1x-16-planetary-causality-2026-09-06';
const R_MICRO_J_PER_MOL_K=8314463n;
const MAX_SCALE_HEIGHT_METERS=100000000n,MAX_SCALE_HEIGHT_TO_RADIUS_PPM=100000n;
const AUTH=V.authority('v1.environment.atmospheric-column','1.0.0',[SOURCE],
  'Bounded ideal-gas isothermal hydrostatic reference diagnostic derived only from existing modeled equilibrium temperature, mean molecular mass and spherical surface gravity. It is an exploration context, not a reconstructed atmosphere.',[
    'Equilibrium temperature is a formation/irradiation proxy, not a measured atmospheric or surface temperature.',
    'Mean molecular mass is the existing modeled composition-family proxy, not a measured abundance or spectroscopic retrieval.',
    'The scale height is a reference calculation only: no vertical pressure profile, atmospheric extent, exobase, weather, circulation or escape history is inferred.',
    'Airless/trace-exosphere cases and states outside the bounded thin-layer reference envelope fail closed.',
    'No P3/P4/P5/P6 canonical state or observational authority is created.'
  ]);
function divHalfEven(n,d){
  if(typeof n!=='bigint'||typeof d!=='bigint'||n<0n||d<=0n)throw new RangeError('positive bigint division required');
  const q=n/d,r=n%d,twice=r*2n;
  return twice>d||(twice===d&&(q&1n)===1n)?q+1n:q;
}
function unsupported(worldIdentity,reason,extra={}){
  return V.freezeDeep({version:VERSION,worldIdentity,supported:false,reason,...extra,authority:AUTH,canonicalPromotion:false,p4Mutation:false,canonicalP5Unchanged:true,canonicalP6Unchanged:true});
}
function diagnose(planet){
  V.assert(planet&&planet.planetIdentity,'atmospheric column planet');
  const c=planet.causal||null,i=c?.inputs||null,f=c?.formation||null,g=c?.gravity||null,a=c?.atmosphere||null;
  if(!i||!f||!g||!a)return unsupported(planet.planetIdentity,'NO_CAUSAL_PLANETOLOGY_STATE');
  const pressure=Number(a.pressureProxyPpm),family=String(a.compositionFamily||'UNKNOWN');
  if(!Number.isSafeInteger(pressure)||pressure<0)return unsupported(planet.planetIdentity,'INVALID_MODELED_PRESSURE_PROXY');
  if(pressure<12000||family==='AIRLESS_OR_TRACE_EXOSPHERE')return unsupported(planet.planetIdentity,'NO_MODELED_COLLISIONAL_ATMOSPHERE',{compositionFamily:family,pressureProxyPpm:pressure});
  const temperatureMilliK=Number(f.equilibriumTemperatureMilliK),meanMolecularMassMilliAmu=Number(a.meanMolecularMassMilliAmu),surfaceGravityMilliMs2=Number(g.surfaceGravityMilliMs2),radiusKm=Number(i.radiusKm);
  const inputs=[temperatureMilliK,meanMolecularMassMilliAmu,surfaceGravityMilliMs2,radiusKm];
  if(!inputs.every(Number.isSafeInteger)||inputs.some(x=>x<=0))return unsupported(planet.planetIdentity,'INVALID_MODELED_REFERENCE_INPUTS');
  const scaleHeight=divHalfEven(R_MICRO_J_PER_MOL_K*BigInt(temperatureMilliK),BigInt(meanMolecularMassMilliAmu)*BigInt(surfaceGravityMilliMs2));
  const radiusMeters=BigInt(radiusKm)*1000n;
  if(scaleHeight<1n||scaleHeight>MAX_SCALE_HEIGHT_METERS)return unsupported(planet.planetIdentity,'OUTSIDE_BOUNDED_SCALE_HEIGHT_ENVELOPE',{referenceScaleHeightMeters:scaleHeight<=BigInt(Number.MAX_SAFE_INTEGER)?Number(scaleHeight):null});
  const ratioPpm=divHalfEven(scaleHeight*1000000n,radiusMeters);
  if(ratioPpm>MAX_SCALE_HEIGHT_TO_RADIUS_PPM)return unsupported(planet.planetIdentity,'OUTSIDE_THIN_LAYER_REFERENCE_ENVELOPE',{referenceScaleHeightMeters:Number(scaleHeight),scaleHeightToRadiusPpm:Number(ratioPpm),maxScaleHeightToRadiusPpm:Number(MAX_SCALE_HEIGHT_TO_RADIUS_PPM)});
  const five=scaleHeight*5n;
  V.assert(scaleHeight<=BigInt(Number.MAX_SAFE_INTEGER)&&five<=BigInt(Number.MAX_SAFE_INTEGER)&&ratioPpm<=BigInt(Number.MAX_SAFE_INTEGER),'atmospheric column safe integer envelope');
  const referenceScaleHeightMeters=Number(scaleHeight),fiveScaleHeightReferenceMeters=Number(five),scaleHeightToRadiusPpm=Number(ratioPpm);
  return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:true,modelId:'v11-ideal-gas-isothermal-scale-height-reference-1',
    compositionFamily:family,pressureProxyPpm:pressure,
    referenceInputs:Object.freeze({temperatureMilliK,temperatureSource:'MODELED_FORMATION_EQUILIBRIUM_TEMPERATURE_PROXY',meanMolecularMassMilliAmu,molecularMassSource:'MODELED_ATMOSPHERIC_COMPOSITION_FAMILY_PROXY',surfaceGravityMilliMs2,gravitySource:'MODELED_SPHERICAL_SURFACE_GRAVITY',radiusKm,radiusSource:'MODELED_WORLD_RADIUS'}),
    referenceScaleHeightMeters,fiveScaleHeightReferenceMeters,scaleHeightToRadiusPpm,
    validity:Object.freeze({relation:'IDEAL_GAS_ISOTHERMAL_HYDROSTATIC_REFERENCE',molarGasConstantMicroJPerMolK:Number(R_MICRO_J_PER_MOL_K),constantClass:'ROUNDED_SI_REFERENCE',maxScaleHeightToRadiusPpm:Number(MAX_SCALE_HEIGHT_TO_RADIUS_PPM),thinLayerEnvelopeSatisfied:true,verticalPressureProfileClaim:false,atmosphericExtentClaim:false,surfacePressureMeasurementClaim:false,temperatureMeasurementClaim:false,compositionMeasurementClaim:false}),
    authority:AUTH,canonicalPromotion:false,p4Mutation:false,canonicalP5Unchanged:true,canonicalP6Unchanged:true,
    provenance:V.provenance('v1.environment.atmospheric-column','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_ATMOSPHERIC_REFERENCE_DIAGNOSTIC',researchAuthorityPromoted:false})});
}
const previousEnrich=E.enrich;
function enrich(base,input){const state=previousEnrich(base,input),atmosphericColumn=diagnose(state);return V.freezeDeep({...state,atmosphericColumn});}
O.v1PlanetEnvironment=Object.freeze({...E,enrich});
O.v1AtmosphericColumn=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,R_MICRO_J_PER_MOL_K,MAX_SCALE_HEIGHT_METERS,MAX_SCALE_HEIGHT_TO_RADIUS_PPM,divHalfEven,diagnose});
})(globalThis);
