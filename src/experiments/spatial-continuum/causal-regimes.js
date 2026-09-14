import { AUTHORITY } from './constants.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const ratio=value=>clamp(Number(value)/1000000);
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const normalizedBulk=value=>String(value||'UNKNOWN').toUpperCase();

export const PLANET_PRESENTATION_GRAMMARS=Object.freeze({
  BANDED_FLUID:'BANDED_FLUID_PRESENTATION',
  FRACTURED_CRYOGENIC:'FRACTURED_CRYOGENIC_PRESENTATION',
  TECTONIC_RIDGE:'TECTONIC_RIDGE_PRESENTATION',
  ERODED_BASIN:'ERODED_BASIN_PRESENTATION',
  CRATERED_HIGHLAND:'CRATERED_HIGHLAND_PRESENTATION',
  MIXED_LITHIC:'MIXED_LITHIC_PRESENTATION'
});

const weights=(crater,ridge,basin,fracture,smooth)=>Object.freeze({
  crater:Number(clamp(crater).toFixed(4)),ridge:Number(clamp(ridge).toFixed(4)),basin:Number(clamp(basin).toFixed(4)),fracture:Number(clamp(fracture).toFixed(4)),smooth:Number(clamp(smooth).toFixed(4))
});

// This classifier consumes only canonical or existing MODEL_DERIVED inputs. Its
// result selects a visual grammar; it does not assert that the rendered landform
// exists on the modeled body.
export function deriveCausalWorldRegime({planet={},environment={}}={}){
  const bulk=normalizedBulk(planet.bulkPriorClass),temperatureK=finite(environment.surfaceTemperatureMilliK,finite(planet.equilibriumTemperatureMilliK,280000))/1000,tectonic=ratio(environment.tectonicActivityPpm),erosion=ratio(environment.erosionPotentialPpm),impact=ratio(environment.impactRetentionPpm),water=ratio(environment.waterAreaPpm),ice=ratio(environment.iceFractionPpm),atmosphere=clamp(Math.log10(1+Math.max(0,finite(environment.atmosphereInventoryUnits)))/7),gravity=finite(planet.surfaceGravityMicroMs2,9810000)/1e6;
  const fluidBody=bulk.includes('GAS_GIANT')||bulk.includes('ICE_GIANT');let family,structuralWeights,localGrammar;
  if(fluidBody){family=PLANET_PRESENTATION_GRAMMARS.BANDED_FLUID;structuralWeights=weights(0,0,0,.12,.92);localGrammar='NO_SOLID_SURFACE'}
  else if(ice>=.34||temperatureK<215||bulk.includes('ICE')){family=PLANET_PRESENTATION_GRAMMARS.FRACTURED_CRYOGENIC;structuralWeights=weights(.18,.22,.12,.94,.36);localGrammar='ANGULAR_ICE_FRACTURE_FIELD'}
  else if(tectonic>=.58){family=PLANET_PRESENTATION_GRAMMARS.TECTONIC_RIDGE;structuralWeights=weights(impact*.28,.96,.18,.34,.18);localGrammar='UPLIFTED_LITHIC_FIELD'}
  else if(erosion>=.38&&water>=.08){family=PLANET_PRESENTATION_GRAMMARS.ERODED_BASIN;structuralWeights=weights(impact*.12,.32,.92,.12,.72);localGrammar='ROUNDED_SEDIMENT_FIELD'}
  else if(impact>=.58&&atmosphere<.56){family=PLANET_PRESENTATION_GRAMMARS.CRATERED_HIGHLAND;structuralWeights=weights(.98,.24,.3,.16,.12);localGrammar='ANGULAR_EJECTA_FIELD'}
  else {family=PLANET_PRESENTATION_GRAMMARS.MIXED_LITHIC;structuralWeights=weights(.42,.52,.38,.28,.34);localGrammar='MIXED_LITHIC_FIELD'}
  const thermalBand=temperatureK<180?'DEEP_COLD':temperatureK<260?'COLD':temperatureK<360?'TEMPERATE_MODEL_RANGE':temperatureK<650?'HOT':'EXTREME_HEAT',gravityBand=gravity<3?'LOW':gravity<13?'MODERATE':gravity<25?'HIGH':'EXTREME';
  return Object.freeze({contract:'ofu-r6-causal-world-regime-1',family,localGrammar,solidSurfaceSupported:!fluidBody,thermalBand,gravityBand,drivers:Object.freeze({bulkPriorClass:bulk,surfaceTemperatureMilliK:Math.round(temperatureK*1000),tectonicActivityPpm:Math.round(tectonic*1000000),erosionPotentialPpm:Math.round(erosion*1000000),impactRetentionPpm:Math.round(impact*1000000),waterAreaPpm:Math.round(water*1000000),iceFractionPpm:Math.round(ice*1000000),atmosphereInventoryUnits:Math.max(0,Math.round(finite(environment.atmosphereInventoryUnits)))}),structuralWeights,authority:AUTHORITY.PRESENTATION_ONLY,inputAuthority:AUTHORITY.MODEL_DERIVED,scientificLandformClaim:false});
}
