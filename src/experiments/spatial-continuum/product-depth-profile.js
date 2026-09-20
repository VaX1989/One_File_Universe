import { deriveCausalPresentationConsequences } from './visual-consequences.js';

export const PRODUCT_DEPTH_PROFILE_CONTRACT='ofu-r6-w1-product-depth-profile-1';
export const PRODUCT_DEPTH_AUTHORITY='PRESENTATION_ONLY';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const q=(value,digits=5)=>Number(Number(value||0).toFixed(digits));
const vector3=(value,fallback)=>Object.freeze((Array.isArray(value)&&value.length>=3?value:fallback).slice(0,3).map(item=>q(clamp(item),5)));
const mix=(a,b,t)=>Number(a)+(Number(b)-Number(a))*Number(t);
const mix3=(a,b,t)=>Object.freeze(a.map((value,index)=>q(clamp(mix(value,b[index],t)),5)));
const flattenPalette=palette=>Object.freeze(['low','mid','high'].flatMap(key=>vector3(palette?.[key],[.18,.24,.2])));

function normalizedHorizonRelief(world,place){
  const relief=Math.max(0,Number(place?.horizon?.reliefM)||0);
  const macro=Math.max(1,Number(world?.generative?.presentation?.terrain?.macroAmplitudeM)||Number(world?.terrainTarget?.profile?.macroAmplitudeM)||800);
  return q(clamp(relief/Math.max(24,macro*.38)),5);
}

function qobsDescriptors({world,place,causal,palette}){
  const geology=causal.channels.geology,material=causal.channels.material,thermal=causal.channels.thermal,gravity=causal.channels.gravity,history=causal.channels.history,regime=world.generative?.presentation?.regime||{},density=clamp((Number(world.generative?.presentation?.localDensity)||1)/1.8),clusters=clamp((place?.clusterAnchors?.length||0)/5),voidRatio=clamp((Number(place?.voidRadiusM)||0)/(32*.45)),scale=place?.scaleBands||{near:.7,mid:1,far:1.36};
  return Object.freeze({
    silhouetteTopography:Object.freeze([
      q(geology.ridgeEmphasis),q(geology.basinEmphasis),q(geology.craterEmphasis),q(geology.fractureEmphasis),q(geology.smoothingEmphasis)
    ]),
    horizonLandformProfile:Object.freeze([
      normalizedHorizonRelief(world,place),q(causal.channels.sky.horizonClarity),q(gravity.gravityRelief),q(place?.roughness??geology.roughness)
    ]),
    spatialFrequencyRoughness:Object.freeze([
      q(geology.roughness),q(material.roughness),q(material.microcontrast),q(thermal.thermalStress)
    ]),
    atmosphereSkyRegime:String(causal.semanticDescriptor.sky),
    materialFamily:String(causal.semanticDescriptor.material),
    objectDensityClustering:Object.freeze([q(density),q(clusters),q(1-voidRatio),q(regime.structuralWeights?.crater??0),q(regime.structuralWeights?.fracture??0)]),
    scaleDistribution:Object.freeze([q(clamp(Number(scale.near)/2)),q(clamp(Number(scale.mid)/2)),q(clamp(Number(scale.far)/2))]),
    palette:flattenPalette(palette),
    causalFingerprint:String(causal.perceptualFingerprint),
    microstructureTopology:Object.freeze([
      q(material.roughness),q(material.reflectanceSpread),q(thermal.freezeFractureEmphasis),q(thermal.desiccationEmphasis)
    ])
  });
}

export function deriveProductDepthProfile({world,place}={}){
  const scientificState=world?.generative?.scientificState,regime=world?.generative?.presentation?.regime;
  if(!scientificState||!regime)throw new TypeError('Product depth requires governed R6 scientific state and presentation regime');
  if(!place||place.authority!=='PRESENTATION_ONLY'||!place.aerialPerspective)throw new TypeError('Product depth requires the governed HUMAN place grammar');
  const causal=deriveCausalPresentationConsequences({scientificState,regime}),presentation=world.generative.presentation,palette=presentation.terrainPalette||{},low=vector3(palette.low,[.18,.24,.2]),mid=vector3(palette.mid,[.34,.43,.28]),high=vector3(palette.high,[.64,.57,.46]),sky=causal.channels.sky,material=causal.channels.material,hydro=causal.channels.hydrosphere,history=causal.channels.history,aerial=clamp(place.aerialPerspective.strength),haze=clamp(sky.hazeOpacity),clarity=clamp(sky.horizonClarity),fogMix=clamp(.28+haze*.42+aerial*.18),fogColor=mix3(high,mid,fogMix),fogDensityPerM=q(clamp(.00008+aerial*.00024+haze*.00018,.00008,.00052),7),farFieldContrast=q(clamp(.64+clarity*.24+material.microcontrast*.12-haze*.08,.54,1.05)),farFieldAlpha=q(clamp(.55+clarity*.18-haze*.08,.42,.78)),localSpecular=q(clamp(.06+hydro.surfaceSheen*.36+material.reflectanceSpread*.22,0,.56)),localPatina=q(clamp(history.patinaEmphasis*.55+history.retainedImpactTexture*.25,0,.55));
  return Object.freeze({
    contract:PRODUCT_DEPTH_PROFILE_CONTRACT,
    authority:PRODUCT_DEPTH_AUTHORITY,
    deterministic:true,
    scientificClaimsAdded:false,
    causalFingerprint:causal.perceptualFingerprint,
    semanticDescriptor:causal.semanticDescriptor,
    qobs:qobsDescriptors({world,place,causal,palette}),
    visual:Object.freeze({
      aerialStrength:q(aerial),
      hazeOpacity:q(haze),
      horizonClarity:q(clarity),
      fogMode:'EXP2',
      fogDensityPerM,
      fogColor,
      farFieldContrast,
      farFieldAlpha,
      localSpecular,
      localPatina,
      reliefCue:q(causal.channels.gravity.gravityRelief),
      thermalStress:q(causal.channels.thermal.thermalStress),
      historyMaturity:q(causal.channels.history.maturity)
    }),
    provenance:Object.freeze({
      scientificStateContract:String(scientificState.contract||'UNDECLARED_SOURCE_SHAPE'),
      representationContract:String(presentation.contract||'ofu-r6-world-representation-profile-1'),
      placeGrammarContract:String(place.contract),
      causalPresentationContract:String(causal.contract)
    }),
    unsupported:Object.freeze({
      actualWeatherInvented:false,
      calibratedAtmosphereSpectrumInvented:false,
      oceanGeometryInvented:false,
      exactMineralogyInvented:false,
      landformPlacementInvented:false,
      surfaceExposureAgeInvented:false,
      physicalObjectScaleMutated:false
    }),
    limitations:Object.freeze([
      'Depth cues are presentation-only and never mutate canonical or model-derived world state.',
      'Fog and contrast encode bounded aerial perspective; they are not a calibrated atmospheric spectrum or weather state.',
      'QOBS topology fields are perceptual descriptors, not measured local microstructure.',
      'No depth cue changes physical object position or world-space scale.'
    ])
  });
}
