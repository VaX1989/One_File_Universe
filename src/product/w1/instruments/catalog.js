import {W1_AUTHORITY} from '../../contracts/w1-observation-contracts.js';
import {SCIENTIFIC_WHY_NODE_TYPE} from '../scientific-why.js';

export const SCIENTIFIC_INSTRUMENT_PROVIDER_ID='ofu.product.w1.scientific-instruments';
export const SCIENTIFIC_INSTRUMENT_PROVIDER_VERSION='ofu-prod-w1-scientific-instruments-provider-1';
export const SCIENTIFIC_INSTRUMENT_PROJECTION_CONTRACT='ofu-prod-w1-scientific-instrument-projection-1';
export const SCIENTIFIC_INSTRUMENT_READING_CONTRACT='ofu-prod-w1-scientific-instrument-reading-1';
export const SCIENTIFIC_INSTRUMENT_STATUS=Object.freeze({VALUE:'VALUE',UNKNOWN:'UNKNOWN',UNSUPPORTED:'UNSUPPORTED'});
export const SCIENTIFIC_INSTRUMENT_KIND=Object.freeze({
  PLANET_RADIUS:'PLANET_RADIUS',SURFACE_GRAVITY:'SURFACE_GRAVITY',MEAN_DENSITY:'MEAN_DENSITY',
  SURFACE_TEMPERATURE:'SURFACE_TEMPERATURE',SURFACE_LATITUDE:'SURFACE_LATITUDE',
  SURFACE_LONGITUDE:'SURFACE_LONGITUDE',SAMPLE_COMPONENT_COUNT:'SAMPLE_COMPONENT_COUNT'
});
export const SCIENTIFIC_INSTRUMENT_UNCERTAINTY_KIND=Object.freeze({INTERVAL:'INTERVAL',QUALITATIVE:'QUALITATIVE',UNKNOWN:'UNKNOWN'});
export const SCIENTIFIC_INSTRUMENT_DEFAULT_LIMITS=Object.freeze({maxRequests:32,maxTextBytes:2048,maxCanonicalBytes:262144});
export const AUTHORITY_RANK=Object.freeze({
  [W1_AUTHORITY.UNKNOWN]:0,[W1_AUTHORITY.PRESENTATION_ONLY]:1,[W1_AUTHORITY.ANALYSIS_ONLY]:2,
  [W1_AUTHORITY.MODEL_DERIVED]:3,[W1_AUTHORITY.CANONICAL]:4
});
export const INSTRUMENTS=Object.freeze({
  [SCIENTIFIC_INSTRUMENT_KIND.PLANET_RADIUS]:Object.freeze({
    sourcePath:'planet.meanRadiusM',sourceDomain:'physicalPlanet',sourceUnit:'m',hashKey:'planet',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'m',units:Object.freeze({m:0,km:-3})}),
  [SCIENTIFIC_INSTRUMENT_KIND.SURFACE_GRAVITY]:Object.freeze({
    sourcePath:'planet.surfaceGravityMicroMs2',sourceDomain:'physicalPlanet',sourceUnit:'um/s^2',hashKey:'planet',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'m/s^2',units:Object.freeze({'m/s^2':-6})}),
  [SCIENTIFIC_INSTRUMENT_KIND.MEAN_DENSITY]:Object.freeze({
    sourcePath:'planet.meanDensityKgM3',sourceDomain:'physicalPlanet',sourceUnit:'kg/m^3',hashKey:'planet',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'kg/m^3',units:Object.freeze({'kg/m^3':0})}),
  [SCIENTIFIC_INSTRUMENT_KIND.SURFACE_TEMPERATURE]:Object.freeze({
    sourcePath:'environment.climate.surfaceTemperatureMilliK',sourceDomain:'environment',sourceUnit:'mK',hashKey:'planet',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.MODEL_OUTPUT,defaultUnit:'K',basisPath:'environment.climate.model',units:Object.freeze({K:-3,mK:0})}),
  [SCIENTIFIC_INSTRUMENT_KIND.SURFACE_LATITUDE]:Object.freeze({
    sourcePath:'surface.latitudeMicroDeg',sourceDomain:'surface',sourceUnit:'microdeg',hashKey:'surface',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'deg',units:Object.freeze({deg:-6})}),
  [SCIENTIFIC_INSTRUMENT_KIND.SURFACE_LONGITUDE]:Object.freeze({
    sourcePath:'surface.longitudeMicroDeg',sourceDomain:'surface',sourceUnit:'microdeg',hashKey:'surface',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'deg',units:Object.freeze({deg:-6})}),
  [SCIENTIFIC_INSTRUMENT_KIND.SAMPLE_COMPONENT_COUNT]:Object.freeze({
    sourcePath:'sample.componentCount',sourceDomain:'sample',sourceUnit:'count',hashKey:'sample',
    whyNodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,defaultUnit:'count',units:Object.freeze({count:0})})
});
