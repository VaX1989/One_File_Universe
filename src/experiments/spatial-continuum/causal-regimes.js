import { AUTHORITY } from './constants.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const normalizedBulk=value=>String(value||'UNKNOWN').toUpperCase();
const present=value=>value!==null&&value!==undefined&&Number.isFinite(Number(value));
const pickFinite=(...values)=>values.find(present);
const ppm=value=>clamp(Number(value)/1000000);
const rounded=(value,digits=4)=>Number(Number(value).toFixed(digits));

export const PLANET_PRESENTATION_GRAMMARS=Object.freeze({
  BANDED_FLUID:'BANDED_FLUID_PRESENTATION',
  FRACTURED_CRYOGENIC:'FRACTURED_CRYOGENIC_PRESENTATION',
  TECTONIC_RIDGE:'TECTONIC_RIDGE_PRESENTATION',
  ERODED_BASIN:'ERODED_BASIN_PRESENTATION',
  CRATERED_HIGHLAND:'CRATERED_HIGHLAND_PRESENTATION',
  MIXED_LITHIC:'MIXED_LITHIC_PRESENTATION'
});

const weights=(crater,ridge,basin,fracture,smooth)=>Object.freeze({
  crater:rounded(clamp(crater)),ridge:rounded(clamp(ridge)),basin:rounded(clamp(basin)),fracture:rounded(clamp(fracture)),smooth:rounded(clamp(smooth))
});

export function deriveCausalDriverAxes({planet={},stellar={},environment={}}={}){
  const climate=environment?.climate||{},hydrosphere=environment?.hydrosphere||{},surfaceProcesses=environment?.surfaceProcesses||{},atmosphereState=environment?.atmosphere||{},composition=environment?.composition||{},formation=environment?.formation||{};
  const rawTemperature=pickFinite(environment.surfaceTemperatureMilliK,climate.surfaceTemperatureMilliK,planet.equilibriumTemperatureMilliK);
  const rawForcing=pickFinite(environment.stellarFluxPpm,climate.stellarFluxPpm,planet.insolationPpm);
  const rawTectonic=pickFinite(environment.tectonicActivityPpm,surfaceProcesses.tectonicActivityPpm);
  const rawErosion=pickFinite(environment.erosionPotentialPpm,surfaceProcesses.erosionPotentialPpm);
  const rawImpact=pickFinite(environment.impactRetentionPpm,surfaceProcesses.impactRetentionPpm);
  const rawWater=pickFinite(environment.waterAreaPpm,hydrosphere.waterAreaPpm);
  const rawIce=pickFinite(environment.iceFractionPpm,hydrosphere.iceFractionPpm);
  const rawAtmosphere=pickFinite(environment.atmosphereInventoryUnits,atmosphereState.inventoryUnits);
  const rawGravity=pickFinite(planet.surfaceGravityMicroMs2);
  const rawAge=pickFinite(environment.ageMyr,formation.ageMyr,stellar.ageMyr);
  const rawMetal=pickFinite(environment.metalPpm,composition.metalPpm);
  const rawSilicate=pickFinite(environment.silicatePpm,composition.silicatePpm);
  const rawVolatile=pickFinite(environment.volatilePpm,composition.volatilePpm);
  const bulk=normalizedBulk(planet.bulkPriorClass);
  const temperatureK=finite(rawTemperature,280000)/1000;
  const forcingRel=Math.max(0,finite(rawForcing,1000000)/1000000);
  const tectonic=ppm(rawTectonic),erosion=ppm(rawErosion),impact=ppm(rawImpact),water=ppm(rawWater),ice=ppm(rawIce);
  const atmosphere=clamp(Math.log10(1+Math.max(0,finite(rawAtmosphere)))/7);
  const gravityMs2=Math.max(.01,finite(rawGravity,9810000)/1000000);
  const ageMyr=Math.max(0,finite(rawAge));
  const metal=ppm(rawMetal),silicate=ppm(rawSilicate),volatile=ppm(rawVolatile);
  const availability=Object.freeze({
    bulk:bulk!=='UNKNOWN',temperature:present(rawTemperature),forcing:present(rawForcing),tectonic:present(rawTectonic),erosion:present(rawErosion),impact:present(rawImpact),water:present(rawWater),ice:present(rawIce),atmosphere:present(rawAtmosphere),gravity:present(rawGravity),age:present(rawAge),metal:present(rawMetal),silicate:present(rawSilicate),volatile:present(rawVolatile)
  });
  const driverAuthority=Object.freeze({
    bulkPriorClass:availability.bulk?AUTHORITY.CANONICAL:AUTHORITY.UNKNOWN,
    forcing:availability.forcing?(present(environment.stellarFluxPpm)||present(climate.stellarFluxPpm)?AUTHORITY.MODEL_DERIVED:AUTHORITY.CANONICAL):AUTHORITY.UNKNOWN,
    temperature:availability.temperature?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    tectonic:availability.tectonic?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    erosion:availability.erosion?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    impact:availability.impact?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    water:availability.water?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    ice:availability.ice?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    atmosphere:availability.atmosphere?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    gravity:availability.gravity?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,
    age:availability.age?(present(environment.ageMyr)||present(formation.ageMyr)?AUTHORITY.MODEL_DERIVED:AUTHORITY.CANONICAL):AUTHORITY.UNKNOWN,
    composition:(availability.metal||availability.silicate||availability.volatile)?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN
  });
  return Object.freeze({contract:'ofu-r6-causal-driver-axes-1',bulk,temperatureK:rounded(temperatureK,3),forcingRel:rounded(forcingRel,4),tectonic:rounded(tectonic),erosion:rounded(erosion),impact:rounded(impact),water:rounded(water),ice:rounded(ice),atmosphere:rounded(atmosphere),gravityMs2:rounded(gravityMs2,6),ageMyr:rounded(ageMyr,3),metal:rounded(metal),silicate:rounded(silicate),volatile:rounded(volatile),availability,driverAuthority,authority:AUTHORITY.PRESENTATION_ONLY,scientificClaim:false});
}

// This classifier consumes only canonical or existing MODEL_DERIVED inputs. Its
// result selects a visual grammar; it does not assert that the rendered landform
// exists on the modeled body.
export function deriveCausalWorldRegime({planet={},stellar={},environment={}}={}){
  const axes=deriveCausalDriverAxes({planet,stellar,environment});
  const {bulk,temperatureK,tectonic,erosion,impact,water,ice,atmosphere,gravityMs2}=axes;
  const fluidBody=bulk.includes('GAS_GIANT')||bulk.includes('ICE_GIANT');
  const coldness=clamp((270-temperatureK)/120),wetErosion=erosion*water,airless=1-atmosphere;
  let family,structuralWeights,localGrammar;
  if(fluidBody){
    family=PLANET_PRESENTATION_GRAMMARS.BANDED_FLUID;
    structuralWeights=weights(0,0,0,.08+.1*ice,.9+.08*atmosphere);
    localGrammar='NO_SOLID_SURFACE';
  } else if(ice>=.34||temperatureK<215||bulk.includes('ICE')){
    family=PLANET_PRESENTATION_GRAMMARS.FRACTURED_CRYOGENIC;
    structuralWeights=weights(.08+impact*.24*airless,.12+tectonic*.28,.06+wetErosion*.24,.58+ice*.3+coldness*.18,.18+ice*.18+atmosphere*.1);
    localGrammar='ANGULAR_ICE_FRACTURE_FIELD';
  } else if(tectonic>=.58){
    family=PLANET_PRESENTATION_GRAMMARS.TECTONIC_RIDGE;
    structuralWeights=weights(.08+impact*.2*airless,.58+tectonic*.4,.1+wetErosion*.34,.12+ice*.3+coldness*.12,.1+erosion*.18+water*.12);
    localGrammar='UPLIFTED_LITHIC_FIELD';
  } else if(erosion>=.38&&water>=.08){
    family=PLANET_PRESENTATION_GRAMMARS.ERODED_BASIN;
    structuralWeights=weights(.04+impact*.12*airless,.14+tectonic*.26,.5+erosion*.28+water*.18,.06+ice*.28,.38+erosion*.28+water*.2+atmosphere*.08);
    localGrammar='ROUNDED_SEDIMENT_FIELD';
  } else if(impact>=.58&&atmosphere<.56){
    family=PLANET_PRESENTATION_GRAMMARS.CRATERED_HIGHLAND;
    structuralWeights=weights(.58+impact*.38*(.7+.3*airless),.1+tectonic*.24,.08+wetErosion*.25,.06+ice*.24+coldness*.08,.05+erosion*.16+atmosphere*.1);
    localGrammar='ANGULAR_EJECTA_FIELD';
  } else {
    family=PLANET_PRESENTATION_GRAMMARS.MIXED_LITHIC;
    structuralWeights=weights(.16+impact*.3*(.72+.28*airless),.2+tectonic*.36,.16+wetErosion*.4,.1+ice*.38+coldness*.12,.16+erosion*.2+water*.16+atmosphere*.08);
    localGrammar='MIXED_LITHIC_FIELD';
  }
  const thermalBand=temperatureK<180?'DEEP_COLD':temperatureK<260?'COLD':temperatureK<360?'TEMPERATE_MODEL_RANGE':temperatureK<650?'HOT':'EXTREME_HEAT';
  const gravityBand=gravityMs2<3?'LOW':gravityMs2<13?'MODERATE':gravityMs2<25?'HIGH':'EXTREME';
  return Object.freeze({
    contract:'ofu-r6-causal-world-regime-2',family,localGrammar,solidSurfaceSupported:!fluidBody,thermalBand,gravityBand,
    drivers:Object.freeze({bulkPriorClass:bulk,surfaceTemperatureMilliK:Math.round(temperatureK*1000),stellarForcingPpm:Math.round(axes.forcingRel*1000000),tectonicActivityPpm:Math.round(tectonic*1000000),erosionPotentialPpm:Math.round(erosion*1000000),impactRetentionPpm:Math.round(impact*1000000),waterAreaPpm:Math.round(water*1000000),iceFractionPpm:Math.round(ice*1000000),atmosphereInventoryUnits:Math.max(0,Math.round(finite(pickFinite(environment.atmosphereInventoryUnits,environment?.atmosphere?.inventoryUnits))))}),
    driverAvailability:axes.availability,driverAuthority:axes.driverAuthority,structuralWeights,
    authority:AUTHORITY.PRESENTATION_ONLY,inputAuthority:AUTHORITY.MODEL_DERIVED,scientificLandformClaim:false
  });
}
