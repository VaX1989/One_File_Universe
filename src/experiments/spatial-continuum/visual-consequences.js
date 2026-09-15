import { AUTHORITY } from './constants.js';
import { deriveCausalDriverAxes, deriveCausalWorldRegime, PLANET_PRESENTATION_GRAMMARS } from './causal-regimes.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const round=(value,digits=4)=>Number(Number(value).toFixed(digits));
const lerp=(a,b,t)=>a+(b-a)*clamp(t);
const freezeInputs=inputs=>Object.freeze(inputs.map(input=>Object.freeze(input)));
const channel=(status,basisClass,inputs,values,unsupported=[])=>Object.freeze({
  status,
  basisClass,
  outputClass:CAUSAL_PRESENTATION_CLASS.PRESENTATION_ONLY,
  outputAuthority:AUTHORITY.PRESENTATION_ONLY,
  inputs:freezeInputs(inputs),
  unsupported:Object.freeze(unsupported),
  scientificClaim:false,
  ...values
});
const input=(path,authority)=>({path,authority,class:authority===AUTHORITY.CANONICAL?CAUSAL_PRESENTATION_CLASS.CANONICAL_INPUT:authority===AUTHORITY.MODEL_DERIVED?CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED:CAUSAL_PRESENTATION_CLASS.UNKNOWN});
const statusFor=(...flags)=>flags.every(Boolean)?'SUPPORTED':flags.some(Boolean)?'PARTIAL':'UNKNOWN_UNSUPPORTED';
const fnv1a=value=>{let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16).padStart(8,'0')};
const q=value=>round(clamp(value),4);

export const CAUSAL_PRESENTATION_CLASS=Object.freeze({
  CANONICAL_INPUT:'CANONICAL_INPUT_CONSUMPTION',
  MODEL_DERIVED:'MODEL_DERIVED_CONSEQUENCE',
  PRESENTATION_ONLY:'PRESENTATION_ONLY_GRAMMAR',
  UNKNOWN:'UNKNOWN_UNSUPPORTED'
});

export const CAUSAL_PRESENTATION_VECTOR_FIELDS=Object.freeze([
  'illuminationKey','illuminationDiffuse','exposureCompensation','skyHaze','horizonClarity','surfaceSheen','iceEmphasis','thermalStress','gravityRelief','geologyRoughness','ridgeEmphasis','basinEmphasis','craterEmphasis','materialMicrocontrast','historyMaturity'
]);

function forcingFamily(forcing){return forcing<.35?'SUBDUED_FORCING':forcing<.85?'LOW_FORCING':forcing<1.45?'MODERATE_FORCING':forcing<2.4?'HIGH_FORCING':'EXTREME_FORCING'}
function atmosphereFamily(value){return value<.04?'AIRLESS_DARK':value<.25?'THIN_SCATTERING':value<.62?'SCATTERING_VEIL':'DENSE_DIFFUSE'}
function volatileFamily(water,ice){if(ice>=.45)return water>=.12?'MIXED_CRYOGENIC_VOLATILE':'CRYOGENIC_DOMINANT';if(water>=.45)return'LIQUID_PROXY_DOMINANT';if(water>=.08)return'PATCHY_CONDENSED_VOLATILE';return'DRY_OR_UNRESOLVED'}
function thermalFamily(k){return k<180?'DEEP_COLD':k<260?'COLD':k<360?'TEMPERATE_MODEL_RANGE':k<650?'HOT':'EXTREME_HEAT'}
function gravityFamily(g){return g<3?'LOW_GRAVITY_PRESENTATION':g<13?'MODERATE_GRAVITY_PRESENTATION':g<25?'HIGH_GRAVITY_PRESENTATION':'EXTREME_GRAVITY_PRESENTATION'}
function geologyFamily(regime){return String(regime?.family||PLANET_PRESENTATION_GRAMMARS.MIXED_LITHIC)}
function materialFamily(axes,regime){
  if(regime?.solidSurfaceSupported===false)return'NO_SOLID_SURFACE';
  if(axes.ice>=.45||axes.bulk.includes('ICE'))return'CRYOGENIC_SURFACE_SIGNAL';
  if(axes.availability.metal||axes.availability.silicate||axes.availability.volatile){const top=Math.max(axes.metal,axes.silicate,axes.volatile);if(top===axes.metal&&top>.45)return'METAL_ENRICHED_SIGNAL';if(top===axes.volatile&&top>.4)return'VOLATILE_RICH_SIGNAL';if(top===axes.silicate&&top>.45)return'SILICATE_DOMINANT_SIGNAL';}
  return axes.bulk==='UNKNOWN'?'UNKNOWN_MATERIAL_SIGNAL':'BULK_CLASS_MATERIAL_SIGNAL';
}
function historyFamily(axes){if(!axes.availability.age)return'UNKNOWN_HISTORY';return axes.ageMyr<800?'YOUNG_HISTORY_PROXY':axes.ageMyr<3500?'INTERMEDIATE_HISTORY_PROXY':axes.ageMyr<8000?'MATURE_HISTORY_PROXY':'ANCIENT_HISTORY_PROXY'}

export function deriveCausalPresentationConsequences({scientificState=null,planet=null,stellar=null,environment=null,regime=null}={}){
  const resolvedPlanet=planet||scientificState?.planet||{};
  const resolvedStellar=stellar||scientificState?.stellar||{};
  const resolvedEnvironment=environment||scientificState?.environment||{};
  const axes=deriveCausalDriverAxes({planet:resolvedPlanet,stellar:resolvedStellar,environment:resolvedEnvironment});
  const resolvedRegime=regime||deriveCausalWorldRegime({planet:resolvedPlanet,stellar:resolvedStellar,environment:resolvedEnvironment});
  const a=axes.availability,d=axes.driverAuthority;

  const illuminationKey=q(clamp(.42+Math.log2(1+axes.forcingRel)*.42-axes.atmosphere*.12,.28,1.35)/1.35);
  const illuminationDiffuse=q(.12+axes.atmosphere*.78);
  const exposureCompensation=q(clamp(1.08/(.55+axes.forcingRel*.48),.5,1.45)/1.45);
  const illumination=channel(statusFor(a.forcing,a.atmosphere),a.forcing&&d.forcing===AUTHORITY.CANONICAL?CAUSAL_PRESENTATION_CLASS.CANONICAL_INPUT:CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input(a.forcing&&d.forcing===AUTHORITY.CANONICAL?'planet.insolationPpm':'environment.climate.stellarFluxPpm',d.forcing),input('environment.atmosphere.inventoryUnits',d.atmosphere)],{
    family:a.forcing?forcingFamily(axes.forcingRel):'UNKNOWN_FORCING',keyLightScale:round(lerp(.38,1.8,illuminationKey),3),diffuseFraction:illuminationDiffuse,exposureCompensation:round(lerp(.72,1.28,exposureCompensation),3),directionMode:'USE_EXISTING_GEOMETRIC_STAR_DIRECTION_IF_AVAILABLE'
  },Object.freeze([{field:'lightDirection',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'No stellar direction vector is carried by the R6-E scientific/presentation profile.'},{field:'spectralColor',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Forcing is not a stellar spectrum or atmospheric chemistry measurement.'}]));

  const skyHaze=q(axes.atmosphere*(.62+.22*clamp((axes.temperatureK-180)/420)));
  const horizonClarity=q(1-skyHaze*.82);
  const sky=channel(statusFor(a.atmosphere),CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input('environment.atmosphere.inventoryUnits',d.atmosphere),input('environment.climate.surfaceTemperatureMilliK',d.temperature)],{
    family:a.atmosphere?atmosphereFamily(axes.atmosphere):'UNKNOWN_SKY',scatteringStrength:q(.04+axes.atmosphere*.82),hazeOpacity:skyHaze,horizonClarity,skyHueMode:'CHEMISTRY_UNSPECIFIED_NEUTRAL'
  },Object.freeze([{field:'calibratedRayleighMieColor',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Atmospheric composition and calibrated pressure are not asserted by this mapping.'}]));

  const surfaceSheen=q(axes.water*(.42+.38*axes.atmosphere));
  const iceEmphasis=q(axes.ice*(.62+.28*clamp((270-axes.temperatureK)/120)));
  const hydrosphere=channel(statusFor(a.water,a.ice),CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input('environment.hydrosphere.waterAreaPpm',d.water),input('environment.hydrosphere.iceFractionPpm',d.ice)],{
    family:(a.water||a.ice)?volatileFamily(axes.water,axes.ice):'UNKNOWN_VOLATILE_SURFACE',surfaceSheen,lowlandContrast:q(axes.water*(.35+.45*axes.erosion)),iceEmphasis,canonicalOceanClaim:false
  },Object.freeze([{field:'actualOceanGeometry',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Water-area and ice fractions are model proxies, not canonical mapped coastlines.'}]));

  const coldStress=clamp((245-axes.temperatureK)/115),hotStress=clamp((axes.temperatureK-360)/420);
  const thermalStress=q(Math.max(coldStress,hotStress));
  const thermal=channel(statusFor(a.temperature),CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input('environment.climate.surfaceTemperatureMilliK',d.temperature),input('environment.hydrosphere.iceFractionPpm',d.ice),input('environment.surfaceProcesses.erosionPotentialPpm',d.erosion)],{
    family:a.temperature?thermalFamily(axes.temperatureK):'UNKNOWN_THERMAL',freezeFractureEmphasis:q(coldStress*(.25+.75*axes.ice)),weatheringEmphasis:q(axes.erosion*(1-coldStress*.35)),desiccationEmphasis:q(hotStress*(1-axes.water*.75)),thermalStress
  },Object.freeze([{field:'actualWeather',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Thermal regime does not establish a time-resolved weather state.'}]));

  const gravityRelief=q(clamp(9.81/axes.gravityMs2,.42,2.3)/2.3);
  const gravity=channel(statusFor(a.gravity),CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input('planet.surfaceGravityMicroMs2',d.gravity)],{
    family:a.gravity?gravityFamily(axes.gravityMs2):'UNKNOWN_GRAVITY',reliefPresentationScale:round(lerp(.55,1.75,gravityRelief),3),looseMaterialSpread:q(1-clamp(axes.gravityMs2/28)),settlingVisualBias:q(clamp(axes.gravityMs2/28)),gravityRelief
  },Object.freeze([{field:'calibratedSettlingVelocity',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'No particle size, fluid density, or drag model is available.'}]));

  const structure=resolvedRegime?.structuralWeights||{};
  const ridge=q(structure.ridge??axes.tectonic),basin=q(structure.basin??axes.erosion*axes.water),crater=q(structure.crater??axes.impact),fracture=q(structure.fracture??axes.ice),smooth=q(structure.smooth??axes.erosion*axes.water);
  const geologyRoughness=q(clamp(.18+ridge*.34+crater*.28+fracture*.22-smooth*.2));
  const geology=channel(statusFor(a.tectonic,a.erosion,a.impact),CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED,[input('environment.surfaceProcesses.tectonicActivityPpm',d.tectonic),input('environment.surfaceProcesses.erosionPotentialPpm',d.erosion),input('environment.surfaceProcesses.impactRetentionPpm',d.impact)],{
    family:geologyFamily(resolvedRegime),roughness:geologyRoughness,ridgeEmphasis:ridge,basinEmphasis:basin,craterEmphasis:crater,fractureEmphasis:fracture,smoothingEmphasis:smooth
  },Object.freeze([{field:'specificLandformPlacement',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'The regime governs grammar only; it does not assert real crater, ridge, basin, or fracture locations.'}]));

  const compositionKnown=a.metal||a.silicate||a.volatile;
  const materialMicrocontrast=q(clamp(.26+axes.metal*.22+axes.silicate*.18+axes.volatile*.12+geologyRoughness*.28-axes.water*.12));
  const material=channel(statusFor(a.bulk,compositionKnown),compositionKnown?CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED:a.bulk?CAUSAL_PRESENTATION_CLASS.CANONICAL_INPUT:CAUSAL_PRESENTATION_CLASS.UNKNOWN,[input('planet.bulkPriorClass',d.bulkPriorClass),input('environment.composition',d.composition)],{
    family:materialFamily(axes,resolvedRegime),roughness:q(clamp(.28+geologyRoughness*.52+axes.silicate*.12-axes.water*.16)),reflectanceSpread:q(clamp(.22+axes.metal*.18+axes.ice*.28+axes.water*.18)),microcontrast:materialMicrocontrast
  },Object.freeze([{field:'exactMineralogy',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Bulk/composition priors do not establish exact local mineralogy.'}]));

  const historyMaturity=a.age?q(clamp(Math.log10(1+axes.ageMyr)/4.1)):0;
  const history=channel(a.age?'SUPPORTED':'UNKNOWN_UNSUPPORTED',a.age&&d.age===AUTHORITY.CANONICAL?CAUSAL_PRESENTATION_CLASS.CANONICAL_INPUT:a.age?CAUSAL_PRESENTATION_CLASS.MODEL_DERIVED:CAUSAL_PRESENTATION_CLASS.UNKNOWN,[input(a.age&&d.age===AUTHORITY.CANONICAL?'stellar.ageMyr':'environment.formation.ageMyr',d.age),input('environment.surfaceProcesses.impactRetentionPpm',d.impact),input('environment.surfaceProcesses.erosionPotentialPpm',d.erosion)],{
    family:historyFamily(axes),maturity:historyMaturity,patinaEmphasis:a.age?q(historyMaturity*axes.erosion):0,retainedImpactTexture:a.age?q(historyMaturity*axes.impact*(1-axes.atmosphere*.35)):0,historyIsSurfaceExposureAge:false
  },Object.freeze([{field:'surfaceExposureAge',class:CAUSAL_PRESENTATION_CLASS.UNKNOWN,reason:'Formation/system age is only a bounded history proxy, not a measured surface age.'}]));

  const vector=Object.freeze({illuminationKey,illuminationDiffuse,exposureCompensation,skyHaze,horizonClarity,surfaceSheen,iceEmphasis,thermalStress,gravityRelief,geologyRoughness,ridgeEmphasis:ridge,basinEmphasis:basin,craterEmphasis:crater,materialMicrocontrast,historyMaturity});
  const semanticDescriptor=Object.freeze({illumination:illumination.family,sky:sky.family,hydrosphere:hydrosphere.family,thermal:thermal.family,gravity:gravity.family,geology:geology.family,material:material.family,history:history.family});
  const fingerprintSource=JSON.stringify({semanticDescriptor,vector});
  return Object.freeze({
    contract:'ofu-r6-w0-causal-presentation-consequences-1',regimeFamily:resolvedRegime.family,channels:Object.freeze({illumination,sky,hydrosphere,thermal,gravity,geology,material,history}),semanticDescriptor,descriptorVector:vector,descriptorVectorFields:CAUSAL_PRESENTATION_VECTOR_FIELDS,perceptualFingerprint:'r6e-'+fnv1a(fingerprintSource),authority:AUTHORITY.PRESENTATION_ONLY,scientificClaimsAdded:false,deterministic:true
  });
}
