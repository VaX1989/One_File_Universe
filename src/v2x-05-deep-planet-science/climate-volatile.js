(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore,IA=O.v2x05InteriorAtmosphere;
if(!C||!IA)throw new Error('V2X-05 regime and interior/atmosphere modules required');
const VERSION='ofu-v2x-05-climate-volatile-2',AUTHORITY=C.AUTHORITY,PPM=C.PPM;
const LATITUDES=Object.freeze([-75,-45,-15,15,45,75]);
const SEASONS=Object.freeze([0,250000,500000,750000]);
const SEASON_SIN_PPM=Object.freeze([0,PPM,0,-PPM]);
const SEASON_COS_PPM=Object.freeze([PPM,0,-PPM,0]);
const freeze=C.freeze;
const clamp=C.clamp;
function scalePpm(value,sharePpm){
  if(!Number.isSafeInteger(value)||!Number.isSafeInteger(sharePpm)||Math.abs(sharePpm)>PPM)throw new RangeError('safe integer ppm scaling required');
  return Math.round(value*sharePpm/PPM);
}
function signedScalePpm(value,signedSharePpm){return scalePpm(value,signedSharePpm);}
function rotationRegime(hours){
  if(!(Number.isFinite(hours)&&hours>0))return 'UNKNOWN';
  if(hours<10)return 'FAST_ROTATOR_CONTEXT';
  if(hours<36)return 'MODERATE_ROTATOR_CONTEXT';
  if(hours<240)return 'SLOW_ROTATOR_CONTEXT';
  return 'VERY_SLOW_ROTATOR_CONTEXT';
}
function rotationMixingPpm(rotationMilliHours){
  if(!C.safe(rotationMilliHours,1,1000000000))throw new RangeError('bounded rotation period required');
  const diff=Math.abs(rotationMilliHours-24000),distancePpm=Math.round(diff*PPM/(diff+24000));
  return clamp(740000-scalePpm(distancePpm,320000),140000,900000);
}
function climateEnvelope(planet,regime,radiative,atmosphere){
  const x=C.extract(planet);if(!x.supported)return x;
  const eq=Number(x.formation.equilibriumTemperatureMilliK),surface=radiative?.modeledSurfaceTemperature?.temperatureMilliK;
  const base=Number.isSafeInteger(surface)?surface:eq;
  const obliquity=Number(x.inputs.obliquityMilliDeg),ecc=Number(x.inputs.eccentricityPpm),rotationMilliHours=Number(x.inputs.rotationPeriodMilliHours);
  if(!C.safe(eq,20000,3000000)||!C.safe(base,20000,3000000)||!C.safe(obliquity,0,180000)||!C.safe(ecc,0,PPM)||!C.safe(rotationMilliHours,1,1000000000))return C.unsupported(x.worldIdentity,'INVALID_CLIMATE_REFERENCE_INPUTS');
  const pressure=Number(x.atmosphere.pressureProxyPpm),cloud=Number(x.atmosphere.cloudCondensatePotentialPpm);
  if(!C.safe(pressure,0,12000000)||!C.safe(cloud,0,PPM))return C.unsupported(x.worldIdentity,'INVALID_CLIMATE_COLUMN_INPUTS');
  const pressureCoupling=Math.round(pressure*PPM/(pressure+240000)),rotationMixing=rotationMixingPpm(rotationMilliHours);
  const transportProxyPpm=clamp(scalePpm(pressureCoupling,580000)+scalePpm(rotationMixing,270000)+scalePpm(cloud,150000),0,PPM);
  const obliquityStrength=clamp(Math.round(obliquity*PPM/90000),0,PPM),eccentricityStrength=clamp(Math.round(ecc*1800000/PPM),0,PPM);
  const cells=[];
  for(let si=0;si<SEASONS.length;si++){
    const season=SEASONS[si],sinPpm=SEASON_SIN_PPM[si],cosPpm=SEASON_COS_PPM[si];
    for(const lat of LATITUDES){
      const latAbsPpm=Math.round(Math.abs(lat)*PPM/90),hemisphere=lat>=0?1:-1;
      const poleBase=scalePpm(base,190000),poleLat=scalePpm(poleBase,latAbsPpm),transportReductionPpm=PPM-scalePpm(transportProxyPpm,550000),poleCooling=scalePpm(poleLat,transportReductionPpm);
      const obliquityBase=scalePpm(scalePpm(base,150000),latAbsPpm),obliquityWave=hemisphere*sinPpm,obliquityDelta=signedScalePpm(scalePpm(obliquityBase,obliquityStrength),obliquityWave);
      const eccentricityBase=scalePpm(base,80000),eccentricityDelta=signedScalePpm(scalePpm(eccentricityBase,eccentricityStrength),cosPpm);
      const temperatureMilliK=clamp(base-poleCooling+obliquityDelta+eccentricityDelta,20000,3000000);
      let phaseState='NO_RESOLVED_SURFACE';
      let liquidWaterPotentialPpm=0,icePotentialPpm=0;
      if(regime.solidSurfaceModel){
        const nearLiquid=clamp(PPM-Math.abs(temperatureMilliK-288000)*5,0,PPM),cloudPenalty=scalePpm(cloud,150000);
        liquidWaterPotentialPpm=clamp(scalePpm(nearLiquid,PPM-cloudPenalty),0,PPM);
        icePotentialPpm=clamp((273150-temperatureMilliK)*9+scalePpm(cloud,120000),0,PPM);
        phaseState=temperatureMilliK<245000?'COLD_CONDENSED_DOMINANT':temperatureMilliK<273150?'ICE_FAVORED':temperatureMilliK<=373150?'LIQUID_WINDOW_CANDIDATE':'VAPOR_THERMAL_STRESS';
      }
      cells.push(freeze({seasonPpm:season,latitudeDeg:lat,temperatureMilliK,liquidWaterPotentialPpm,icePotentialPpm,phaseState,authority:AUTHORITY}));
    }
  }
  if(cells.length>C.LIMITS.climateCells)throw new Error('V2X-05 climate cell bound exceeded');
  const temps=cells.map(v=>v.temperatureMilliK),min=Math.min(...temps),max=Math.max(...temps);
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',modelClass:'BOUNDED_LATITUDINAL_SEASONAL_TRANSPORT_PROXY',notGcm:true,weatherForecastClaim:false,empiricalClimateNormalClaim:false,
    referenceTemperatureMilliK:base,referenceSource:Number.isSafeInteger(surface)?'V2X05_MODELED_SURFACE_TEMPERATURE':'V1_IRRADIATION_EQUILIBRIUM_PROXY',rotationRegime:rotationRegime(rotationMilliHours/1000),transportProxyPpm,transportProxyConservedEnergyClaim:false,
    deterministicArithmetic:'INTEGER_PPM_QUARTER_SEASON_KERNEL',latitudeBands:LATITUDES,seasonMarksPpm:SEASONS,cellCount:cells.length,maxCells:C.LIMITS.climateCells,cells:freeze(cells),temperatureRangeMilliK:freeze({min,max,amplitude:max-min}),
    oceanHeatCapacityResolved:false,dynamicSeaIceResolved:false,circulationResolved:false,authority:AUTHORITY,canonicalPromotion:false});
}
function splitExact(total,weights){
  if(!C.safe(total,0,C.LIMITS.exactInventoryUnits))throw new RangeError('exact bounded non-negative total required');
  const shares=C.normalizePpm(weights),numericFast=total===0||total<=Math.floor(Number.MAX_SAFE_INTEGER/PPM);
  const rows=numericFast?shares.map((s,i)=>{const numerator=total*s,q=Math.floor(numerator/PPM);return {i,q,r:numerator-q*PPM};}):shares.map((s,i)=>{const numerator=BigInt(total)*BigInt(s),den=BigInt(PPM);return {i,q:Number(numerator/den),r:numerator%den};});
  const base=rows.map(row=>row.q);let left=total-base.reduce((a,b)=>a+b,0);
  const rank=rows.slice().sort((a,b)=>a.r===b.r?a.i-b.i:(a.r>b.r?-1:1));
  for(let i=0;i<left;i++)base[rank[i%rank.length].i]++;
  return Object.freeze(base);
}
function volatilePartition(planet,regime,radiative,climate){
  const x=C.extract(planet);if(!x.supported)return x;
  const a=x.atmosphere,vals=[a.initialInventoryUnits,a.escapedUnits,a.interiorUnits,a.surfaceCondensedUnits,a.atmosphereUnits].map(Number);
  if(!vals.every(v=>C.safe(v,0,C.LIMITS.exactInventoryUnits))||vals[0]<=0)return C.unsupported(x.worldIdentity,'VOLATILE_LEDGER_OUTSIDE_EXACT_INTEGER_DOMAIN',{maxExactInventoryUnits:C.LIMITS.exactInventoryUnits});
  const [initial,escaped,interior,surfaceCondensed,atmospheric]=vals;
  const retainedBig=BigInt(interior)+BigInt(surfaceCondensed)+BigInt(atmospheric),declaredRetained=x.atmosphere.retainedUnits;
  const sourceSumBig=BigInt(escaped)+retainedBig,initialBig=BigInt(initial);
  if(sourceSumBig!==initialBig)return C.unsupported(x.worldIdentity,'SOURCE_VOLATILE_LEDGER_NOT_CLOSED',{initialInventoryUnits:initial,sourceSumUnits:sourceSumBig<=BigInt(Number.MAX_SAFE_INTEGER)?Number(sourceSumBig):null,residualUnits:sourceSumBig-initialBig>=BigInt(Number.MIN_SAFE_INTEGER)&&sourceSumBig-initialBig<=BigInt(Number.MAX_SAFE_INTEGER)?Number(sourceSumBig-initialBig):null});
  if(declaredRetained!==undefined&&(!C.safe(Number(declaredRetained),0,C.LIMITS.exactInventoryUnits)||BigInt(Number(declaredRetained))!==retainedBig))return C.unsupported(x.worldIdentity,'SOURCE_VOLATILE_RETAINED_LEDGER_NOT_CLOSED');
  if(Object.prototype.hasOwnProperty.call(x.atmosphere,'conserved')&&x.atmosphere.conserved!==true)return C.unsupported(x.worldIdentity,'SOURCE_VOLATILE_CONSERVED_FLAG_FALSE');
  let surfaceLiquid=0,surfaceIce=0,subsurfaceCondensed=0,deepCondensedOrCloudReservoir=0;
  if(regime.solidSurfaceModel){
    const rawModeledSurface=radiative?.modeledSurfaceTemperature?.temperatureMilliK,hasModeledSurface=Number.isSafeInteger(rawModeledSurface),modeledSurface=hasModeledSurface?rawModeledSurface:null,eq=Number(x.formation.equilibriumTemperatureMilliK),t=hasModeledSurface?modeledSurface:eq;
    if(!C.safe(t,20000,3000000))return C.unsupported(x.worldIdentity,'NO_BOUNDED_THERMAL_REFERENCE_FOR_CONDENSED_PARTITION');
    const liquidWeight=clamp(PPM-Math.abs(t-288000)*5,0,PPM),iceWeight=clamp((273150-t)*8+180000,0,PPM),subsurfaceWeight=clamp(260000+Math.round(Math.abs(t-273150)*7/10),80000,850000);
    [surfaceLiquid,surfaceIce,subsurfaceCondensed]=splitExact(surfaceCondensed,[liquidWeight,iceWeight,subsurfaceWeight]);
  }else deepCondensedOrCloudReservoir=surfaceCondensed;
  const partitionSumBig=BigInt(escaped)+BigInt(interior)+BigInt(atmospheric)+BigInt(surfaceLiquid)+BigInt(surfaceIce)+BigInt(subsurfaceCondensed)+BigInt(deepCondensedOrCloudReservoir),partitionSum=Number(partitionSumBig);
  const cryosphereUnits=surfaceIce+subsurfaceCondensed;
  const oceanCandidate=regime.solidSurfaceModel&&surfaceLiquid>0&&climate?.temperatureRangeMilliK?.max>=260000&&climate?.temperatureRangeMilliK?.min<=360000;
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',modelUnit:'NORMALIZED_VOLATILE_INVENTORY_UNIT',initialInventoryUnits:initial,
    reservoirs:freeze({escapedUnits:escaped,interiorUnits:interior,atmosphereUnits:atmospheric,surfaceLiquidUnits:surfaceLiquid,surfaceIceUnits:surfaceIce,subsurfaceCondensedUnits:subsurfaceCondensed,deepCondensedOrCloudReservoirUnits:deepCondensedOrCloudReservoir}),
    closure:freeze({sumUnits:partitionSum,residualUnits:Number(initialBig-partitionSumBig),exactInternalClosure:partitionSumBig===initialBig,sourceLedgerClosureVerified:true,arithmeticSafeInteger:Number.isSafeInteger(partitionSum)}),
    surface:freeze({resolved:regime.solidSurfaceModel,oceanCandidate,oceanUnits:surfaceLiquid,cryosphereUnits,subsurfaceCondensedUnits:subsurfaceCondensed,partitionTemperatureSource:regime.solidSurfaceModel?(Number.isSafeInteger(radiative?.modeledSurfaceTemperature?.temperatureMilliK)?'V2X05_MODELED_SURFACE_TEMPERATURE':'V1_IRRADIATION_EQUILIBRIUM_PROXY'):null,globalOceanDepthClaim:false,oceanChemistryClaim:false,iceSheetDynamicsClaim:false}),
    giantSemantics:regime.solidSurfaceModel?null:'CONDENSED_SOURCE_RESERVOIR_RETAINED_WITHOUT_SOLID_SURFACE_OCEAN_INTERPRETATION',physicalMassUnitClaim:false,canonicalOceanClaim:false,authority:AUTHORITY,canonicalPromotion:false});
}
function causalAttribution(planet,regime,interior,atmosphere,volatile){
  const x=C.extract(planet);if(!x.supported)return x;
  const irradiation=Number(x.formation.irradiationPpm),gravity=Number(x.gravity.surfaceGravityMilliMs2),pressure=Number(x.atmosphere.pressureProxyPpm),heat=Number(x.interior.heat?.heatIndexPpm),ice=Number(x.composition.icePpm),light=Number(x.composition.lightVolatilePpm),obliquity=Number(x.inputs.obliquityMilliDeg);
  if(!C.safe(irradiation,0,4000000)||!C.safe(gravity,0,1000000)||!C.safe(pressure,0,12000000)||!C.safe(heat,0,PPM)||!C.safe(ice,0,PPM)||!C.safe(light,0,PPM)||!C.safe(obliquity,0,180000))return C.unsupported(x.worldIdentity,'INVALID_CAUSAL_ATTRIBUTION_INPUTS');
  const raw=[
    irradiation,
    clamp(gravity*35,0,PPM),
    Math.round(pressure*PPM/(pressure+250000)),
    heat,
    clamp(ice+light,0,PPM),
    clamp(Math.round(obliquity*PPM/90000),0,PPM)
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
O.v2x05ClimateVolatile=Object.freeze({VERSION,AUTHORITY,LATITUDES,SEASONS,SEASON_SIN_PPM,SEASON_COS_PPM,rotationRegime,rotationMixingPpm,scalePpm,climateEnvelope,splitExact,volatilePartition,causalAttribution});
})(typeof globalThis!=='undefined'?globalThis:this);
