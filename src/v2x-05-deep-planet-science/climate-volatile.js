(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere;
if(!C||!IA)throw new Error('V2X-05 regime and interior/atmosphere modules required');
const VERSION='ofu-v2x-05-climate-volatile-1',AUTHORITY=C.AUTHORITY,PPM=C.PPM;
const LATITUDES=Object.freeze([-75,-45,-15,15,45,75]);
const SEASONS=Object.freeze([0,250000,500000,750000]);
const freeze=C.freeze;
const clamp=C.clamp;
function rotationRegime(hours){
  if(!(Number.isFinite(hours)&&hours>0))return 'UNKNOWN';
  if(hours<10)return 'FAST_ROTATOR_CONTEXT';
  if(hours<36)return 'MODERATE_ROTATOR_CONTEXT';
  if(hours<240)return 'SLOW_ROTATOR_CONTEXT';
  return 'VERY_SLOW_ROTATOR_CONTEXT';
}
function climateEnvelope(planet,regime,radiative,atmosphere){
  const x=C.extract(planet);if(!x.supported)return x;
  const eq=Number(x.formation.equilibriumTemperatureMilliK),surface=radiative?.modeledSurfaceTemperature?.temperatureMilliK;
  const base=Number.isSafeInteger(surface)?surface:eq;
  const obliquity=C.clamp(Number(x.inputs.obliquityMilliDeg||0),0,180000),ecc=C.clamp(Number(x.inputs.eccentricityPpm||0),0,PPM),rotationHours=Number(x.inputs.rotationPeriodMilliHours||0)/1000;
  if(!Number.isSafeInteger(eq)||!Number.isSafeInteger(base)||!Number.isFinite(rotationHours)||rotationHours<=0)return C.unsupported(x.worldIdentity,'INVALID_CLIMATE_REFERENCE_INPUTS');
  const pressure=C.clamp(Number(x.atmosphere.pressureProxyPpm||0),0,12000000),cloud=C.clamp(Number(x.atmosphere.cloudCondensatePotentialPpm||0),0,PPM);
  const pressureCoupling=C.clamp(pressure*PPM/(pressure+240000),0,PPM),rotationMixing=C.clamp(740000-Math.abs(Math.log10(Math.max(0.05,rotationHours/24)))*170000,140000,900000);
  const transportProxyPpm=C.clamp(pressureCoupling*0.58+rotationMixing*0.27+cloud*0.15,0,PPM);
  const obliquityStrength=C.clamp(obliquity*PPM/90000,0,PPM),eccentricityStrength=C.clamp(ecc*1.8,0,PPM);
  const cells=[];
  for(let si=0;si<SEASONS.length;si++){
    const season=SEASONS[si],phase=2*Math.PI*season/PPM;
    for(const lat of LATITUDES){
      const latAbs=Math.abs(lat)/90;
      const hemisphere=lat>=0?1:-1;
      const seasonalWave=Math.sin(phase)*hemisphere;
      const poleCooling=Math.round(base*0.19*latAbs*(1-transportProxyPpm/PPM*0.55));
      const obliquityDelta=Math.round(base*0.15*latAbs*seasonalWave*obliquityStrength/PPM);
      const eccentricityDelta=Math.round(base*0.08*Math.cos(phase)*eccentricityStrength/PPM);
      const temperatureMilliK=clamp(base-poleCooling+obliquityDelta+eccentricityDelta,20000,3000000);
      let phaseState='NO_RESOLVED_SURFACE';
      let liquidWaterPotentialPpm=0,icePotentialPpm=0;
      if(regime.solidSurfaceModel){
        const nearLiquid=clamp(PPM-Math.abs(temperatureMilliK-288000)*5,0,PPM);
        liquidWaterPotentialPpm=clamp(nearLiquid*(1-cloud*0.15/PPM),0,PPM);
        icePotentialPpm=clamp((273150-temperatureMilliK)*9+cloud*0.12,0,PPM);
        phaseState=temperatureMilliK<245000?'COLD_CONDENSED_DOMINANT':temperatureMilliK<273150?'ICE_FAVORED':temperatureMilliK<=373150?'LIQUID_WINDOW_CANDIDATE':'VAPOR_THERMAL_STRESS';
      }
      cells.push(freeze({seasonPpm:season,latitudeDeg:lat,temperatureMilliK,liquidWaterPotentialPpm,icePotentialPpm,phaseState,authority:AUTHORITY}));
    }
  }
  if(cells.length>C.LIMITS.climateCells)throw new Error('V2X-05 climate cell bound exceeded');
  const temps=cells.map(v=>v.temperatureMilliK),min=Math.min(...temps),max=Math.max(...temps);
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',modelClass:'BOUNDED_LATITUDINAL_SEASONAL_TRANSPORT_PROXY',notGcm:true,weatherForecastClaim:false,empiricalClimateNormalClaim:false,
    referenceTemperatureMilliK:base,referenceSource:Number.isSafeInteger(surface)?'V2X05_MODELED_SURFACE_TEMPERATURE':'V1_IRRADIATION_EQUILIBRIUM_PROXY',rotationRegime:rotationRegime(rotationHours),transportProxyPpm,transportProxyConservedEnergyClaim:false,
    latitudeBands:LATITUDES,seasonMarksPpm:SEASONS,cellCount:cells.length,maxCells:C.LIMITS.climateCells,cells:freeze(cells),temperatureRangeMilliK:freeze({min,max,amplitude:max-min}),
    oceanHeatCapacityResolved:false,dynamicSeaIceResolved:false,circulationResolved:false,authority:AUTHORITY,canonicalPromotion:false});
}
function splitExact(total,weights){
  if(!C.safe(total,0,Number.MAX_SAFE_INTEGER))throw new RangeError('exact non-negative total required');
  const shares=C.normalizePpm(weights),base=shares.map(s=>Math.floor(total*s/PPM));let left=total-base.reduce((a,b)=>a+b,0);
  const raw=shares.map((s,i)=>({i,r:total*s/PPM-base[i]})).sort((a,b)=>b.r-a.r||a.i-b.i);
  for(let i=0;i<left;i++)base[raw[i%raw.length].i]++;
  return Object.freeze(base);
}
function volatilePartition(planet,regime,radiative,climate){
  const x=C.extract(planet);if(!x.supported)return x;
  const a=x.atmosphere,vals=[a.initialInventoryUnits,a.escapedUnits,a.interiorUnits,a.surfaceCondensedUnits,a.atmosphereUnits].map(Number);
  if(!vals.every(Number.isSafeInteger)||vals[0]<=0||vals.slice(1).some(v=>v<0))return C.unsupported(x.worldIdentity,'VOLATILE_LEDGER_OUTSIDE_SAFE_INTEGER_DOMAIN');
  const [initial,escaped,interior,surfaceCondensed,atmospheric]=vals;
  const sourceSum=escaped+interior+surfaceCondensed+atmospheric;
  if(sourceSum!==initial)return C.unsupported(x.worldIdentity,'SOURCE_VOLATILE_LEDGER_NOT_CLOSED',{initialInventoryUnits:initial,sourceSumUnits:sourceSum,residualUnits:sourceSum-initial});
  let surfaceLiquid=0,surfaceIce=0,subsurfaceCondensed=0,deepCondensedOrCloudReservoir=0;
  if(regime.solidSurfaceModel){
    const rawModeledSurface=radiative?.modeledSurfaceTemperature?.temperatureMilliK,hasModeledSurface=Number.isSafeInteger(rawModeledSurface),modeledSurface=hasModeledSurface?rawModeledSurface:null,eq=Number(x.formation.equilibriumTemperatureMilliK),t=hasModeledSurface?modeledSurface:eq;
    if(!Number.isSafeInteger(t))return C.unsupported(x.worldIdentity,'NO_BOUNDED_THERMAL_REFERENCE_FOR_CONDENSED_PARTITION');
    const liquidWeight=clamp(PPM-Math.abs(t-288000)*5,0,PPM),iceWeight=clamp((273150-t)*8+180000,0,PPM),subsurfaceWeight=clamp(260000+Math.abs(t-273150)*0.7,80000,850000);
    [surfaceLiquid,surfaceIce,subsurfaceCondensed]=splitExact(surfaceCondensed,[liquidWeight,iceWeight,subsurfaceWeight]);
  }else deepCondensedOrCloudReservoir=surfaceCondensed;
  const partitionSum=escaped+interior+atmospheric+surfaceLiquid+surfaceIce+subsurfaceCondensed+deepCondensedOrCloudReservoir;
  const cryosphereUnits=surfaceIce+subsurfaceCondensed;
  const oceanCandidate=regime.solidSurfaceModel&&surfaceLiquid>0&&climate?.temperatureRangeMilliK?.max>=260000&&climate?.temperatureRangeMilliK?.min<=360000;
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',modelUnit:'NORMALIZED_VOLATILE_INVENTORY_UNIT',initialInventoryUnits:initial,
    reservoirs:freeze({escapedUnits:escaped,interiorUnits:interior,atmosphereUnits:atmospheric,surfaceLiquidUnits:surfaceLiquid,surfaceIceUnits:surfaceIce,subsurfaceCondensedUnits:subsurfaceCondensed,deepCondensedOrCloudReservoirUnits:deepCondensedOrCloudReservoir}),
    closure:freeze({sumUnits:partitionSum,residualUnits:initial-partitionSum,exactInternalClosure:partitionSum===initial,sourceLedgerClosureVerified:true}),
    surface:freeze({resolved:regime.solidSurfaceModel,oceanCandidate,oceanUnits:surfaceLiquid,cryosphereUnits,subsurfaceCondensedUnits:subsurfaceCondensed,partitionTemperatureSource:regime.solidSurfaceModel?(Number.isSafeInteger(radiative?.modeledSurfaceTemperature?.temperatureMilliK)?'V2X05_MODELED_SURFACE_TEMPERATURE':'V1_IRRADIATION_EQUILIBRIUM_PROXY'):null,globalOceanDepthClaim:false,oceanChemistryClaim:false,iceSheetDynamicsClaim:false}),
    giantSemantics:regime.solidSurfaceModel?null:'CONDENSED_SOURCE_RESERVOIR_RETAINED_WITHOUT_SOLID_SURFACE_OCEAN_INTERPRETATION',physicalMassUnitClaim:false,canonicalOceanClaim:false,authority:AUTHORITY,canonicalPromotion:false});
}
function causalAttribution(planet,regime,interior,atmosphere,volatile){
  const x=C.extract(planet);if(!x.supported)return x;
  const raw=[
    Number(x.formation.irradiationPpm||0),
    C.clamp(Number(x.gravity.surfaceGravityMilliMs2||0)*35,0,PPM),
    C.clamp(Number(x.atmosphere.pressureProxyPpm||0)*PPM/(Number(x.atmosphere.pressureProxyPpm||0)+250000),0,PPM),
    Number(x.interior.heat?.heatIndexPpm||0),
    C.clamp((Number(x.composition.icePpm||0)+Number(x.composition.lightVolatilePpm||0)),0,PPM),
    C.clamp(Number(x.inputs.obliquityMilliDeg||0)*PPM/90000,0,PPM)
  ];
  const shares=C.normalizePpm(raw),names=['IRRADIATION_CONTEXT','GRAVITY_RETENTION_CONTEXT','ATMOSPHERE_COLUMN_CONTEXT','INTERIOR_HEAT_CONTEXT','VOLATILE_INVENTORY_CONTEXT','SEASONAL_GEOMETRY_CONTEXT'];
  const drivers=freeze(names.map((name,i)=>({driver:name,sharePpm:shares[i]})));
  const downstream=freeze({
    rendering:freeze({regime:regime.regime,solidSurfaceModel:regime.solidSurfaceModel,atmosphereFamily:atmosphere.composition.family||'UNKNOWN',cryospherePotential:volatile.surface.cryosphereUnits>0}),
    ecology:freeze({solidSurfaceModel:regime.solidSurfaceModel,liquidReservoirCandidate:volatile.surface.oceanCandidate,collisionalAtmosphere:atmosphere.composition.supported,canonicalHabitabilityClaim:false}),
    gameplay:freeze({volcanicPotentialPpm:interior.geodynamics.supported?interior.geodynamics.volcanicPotentialPpm:null,tectonicPotentialPpm:interior.geodynamics.supported?interior.geodynamics.tectonicPotentialPpm:null,escapeContextPpm:atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,canonicalEventAdmission:false})
  });
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',drivers,shareClosurePpm:drivers.reduce((n,d)=>n+d.sharePpm,0),normalizationMeaning:'RELATIVE_MODELED_DRIVER_ATTRIBUTION_ONLY',conservedEnergyClaim:false,conservedMassClaim:false,causalIdentificationClaim:false,downstream,authority:AUTHORITY,canonicalPromotion:false});
}
O.v2x05ClimateVolatile=Object.freeze({VERSION,AUTHORITY,LATITUDES,SEASONS,rotationRegime,climateEnvelope,splitExact,volatilePartition,causalAttribution});
})(typeof globalThis!=='undefined'?globalThis:this);
