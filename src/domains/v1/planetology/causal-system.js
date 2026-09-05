(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common;if(!V)throw new Error('v1 common required');
const VERSION='ofu-v1-planetology-causal-2';
const SOURCE_BRANCH='parallel/v1-wave-a-planetology-environment-2026-09-05';
const AUTH=V.authority('v1.planetology.causal-system','2.0.0',[SOURCE_BRANCH],
 'Bounded deterministic formation/interior/volatile/atmosphere scenario model for product exploration. Canonical P3/P5/P6 facts remain authoritative and unchanged.',[
 'Formation, differentiation, geodynamics, atmospheric evolution and composition families are reduced-order scenario models, not reconstructions or measurements.',
 'Pressure, heat-flow, escape and volatile quantities are normalized model proxies unless an explicit unit is named.',
 'The model is intended for internally coherent world differentiation, not precision planetary forecasting.'
]);
const BULK=Object.freeze(['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT','UNKNOWN']);
const PRIOR=Object.freeze({
 TERRESTRIAL:[315000,625000,35000,25000],
 VOLATILE_RICH:[185000,485000,220000,110000],
 ICE_GIANT:[65000,180000,510000,245000],
 GAS_GIANT:[30000,70000,120000,780000],
 UNKNOWN:[220000,520000,170000,90000]
});
function ratioPpm(n,d){if(!(d>0))return 0;return V.clamp(Math.round(n*1000000/d),0,20000000)}
function normalizeParts(parts){const clean=parts.map(v=>Math.max(0,Math.round(v))),sum=clean.reduce((a,b)=>a+b,0)||1,base=clean.map(v=>Math.floor(v*1000000/sum));let left=1000000-base.reduce((a,b)=>a+b,0);for(let i=0;left>0;i=(i+1)%base.length,left--)base[i]++;return base;}
function normalizeInput(input){
 V.assert(input&&typeof input==='object','planetology input');V.text(input.planetIdentity,'planetIdentity',128);
 const bulk=BULK.includes(input.bulkPriorClass)?input.bulkPriorClass:'UNKNOWN';
 const out={planetIdentity:input.planetIdentity,bulkPriorClass:bulk,stellarLuminosityMilliSolar:input.stellarLuminosityMilliSolar??1000,stellarTemperatureK:input.stellarTemperatureK??5772,orbitMilliAu:input.orbitMilliAu??1000,massMilliEarth:input.massMilliEarth??1000,radiusKm:input.radiusKm??6371,ageMyr:input.ageMyr??4500,eccentricityPpm:input.eccentricityPpm??16700,obliquityMilliDeg:input.obliquityMilliDeg??23440,rotationPeriodMilliHours:input.rotationPeriodMilliHours??23934,tidalHeatingPpm:input.tidalHeatingPpm??0,xuvMilliWm2:input.xuvMilliWm2??0};
 for(const k of ['stellarLuminosityMilliSolar','stellarTemperatureK','orbitMilliAu','massMilliEarth','radiusKm','ageMyr','rotationPeriodMilliHours'])V.int(out[k],k,1,Number.MAX_SAFE_INTEGER);
 for(const k of ['eccentricityPpm','tidalHeatingPpm'])V.ppm(out[k],k);V.int(out.obliquityMilliDeg,'obliquityMilliDeg',0,180000);V.int(out.xuvMilliWm2,'xuvMilliWm2',0,Number.MAX_SAFE_INTEGER);
 return Object.freeze(out);
}
function formationContext(i){
 const lum=Math.max(.000001,i.stellarLuminosityMilliSolar/1000),au=Math.max(.000001,i.orbitMilliAu/1000),flux=lum/(au*au),equilibriumTemperatureMilliK=V.clamp(Math.round(278500*Math.pow(flux,.25)),20000,3000000),frostLineMilliAu=V.clamp(Math.round(2700*Math.sqrt(lum)),80,250000);
 const r=i.orbitMilliAu/frostLineMilliAu;let formationZone=r<.42?'INNER_REFRACTORY':r<.85?'ROCKY_INNER':r<1.25?'FROST_TRANSITION':'OUTER_VOLATILE';
 if(i.bulkPriorClass==='GAS_GIANT'||i.bulkPriorClass==='ICE_GIANT')formationZone=r<.6?'MIGRATED_GIANT_CANDIDATE':formationZone;
 const irradiationPpm=V.clamp(Math.round(flux*1000000),100,20000000),condensationVolatilePpm=V.clamp(Math.round((r-.3)*600000),20000,950000);
 return Object.freeze({formationZone,equilibriumTemperatureMilliK,frostLineMilliAu,irradiationPpm,condensationVolatilePpm,migrationRequiredByPrior:i.bulkPriorClass==='GAS_GIANT'&&r<.42,authority:'MODEL_DERIVED_SIMULATION'});
}
function bulkComposition(i,formation){
 const p=PRIOR[i.bulkPriorClass].slice(),zone=formation.formationZone;
 if(zone==='INNER_REFRACTORY'){p[0]+=45000;p[1]+=45000;p[2]-=70000;p[3]-=20000;}
 else if(zone==='FROST_TRANSITION'){p[2]+=65000;p[3]+=25000;p[1]-=70000;p[0]-=20000;}
 else if(zone==='OUTER_VOLATILE'){p[2]+=90000;p[3]+=50000;p[1]-=105000;p[0]-=35000;}
 const salts=['metal','rock','ice','volatile'];for(let n=0;n<4;n++)p[n]+=Math.floor(V.signedPpm(VERSION,i.planetIdentity,salts[n])/35);
 const [metalPpm,silicatePpm,icePpm,lightVolatilePpm]=normalizeParts(p);
 const componentDensity=[7800,3500,1500,420],fractions=[metalPpm,silicatePpm,icePpm,lightVolatilePpm];let inv=0;for(let n=0;n<4;n++)inv+=(fractions[n]/1000000)/componentDensity[n];const mixtureDensityKgM3=Math.round(1/Math.max(inv,1e-9));
 const radiusEarth=i.radiusKm/6371,massEarth=i.massMilliEarth/1000,bulkDensityKgM3=V.clamp(Math.round(5514*massEarth/Math.max(.000001,Math.pow(radiusEarth,3))),40,50000),densityMismatchPpm=V.clamp(Math.round(Math.abs(bulkDensityKgM3-mixtureDensityKgM3)*1000000/Math.max(1,bulkDensityKgM3)),0,2000000),densityConsistency=densityMismatchPpm<180000?'CONSISTENT_WITH_REDUCED_MIXTURE':densityMismatchPpm<500000?'TENSION_WITH_REDUCED_MIXTURE':'OUTSIDE_REDUCED_MIXTURE_REGIME';
 return Object.freeze({metalPpm,silicatePpm,icePpm,lightVolatilePpm,sumPpm:1000000,bulkDensityKgM3,mixtureDensityKgM3,densityMismatchPpm,densityConsistency,canonicalCompositionClaim:false});
}
function gravityContext(i,composition){
 const radiusRatio=i.radiusKm/6371,massRatio=i.massMilliEarth/1000,surfaceGravityMilliMs2=V.clamp(Math.round(9810*massRatio/Math.max(.000001,radiusRatio*radiusRatio)),1,1000000),escapeVelocityMilliKms=V.clamp(Math.round(11186*Math.sqrt(massRatio/Math.max(.000001,radiusRatio))),1,500000),centralPressureProxyPpm=V.clamp(Math.round((massRatio*massRatio/Math.max(.000001,Math.pow(radiusRatio,4)))*1000000),100,20000000);
 return Object.freeze({surfaceGravityMilliMs2,escapeVelocityMilliKms,centralPressureProxyPpm,bulkDensityKgM3:composition.bulkDensityKgM3});
}
function interiorState(i,formation,composition,gravity){
 const age=i.ageMyr,earlyThermalPpm=V.clamp(780000+Math.floor(V.signedPpm(VERSION,i.planetIdentity,'early-heat')/8),250000,1000000),radiogenicPpm=V.clamp(Math.round(620000*Math.exp(-0.69314718056*age/3600)),20000,650000),primordialPpm=V.clamp(Math.round(earlyThermalPpm/Math.sqrt(1+age/380)),15000,900000),tidalPpm=i.tidalHeatingPpm,insulationPpm=V.clamp(Math.round(composition.lightVolatilePpm*.35+composition.icePpm*.18+composition.silicatePpm*.12),20000,500000),heatIndexPpm=V.clamp(Math.round(primordialPpm*.46+radiogenicPpm*.34+tidalPpm*.32+insulationPpm*.08),0,1000000);
 const meltPotentialPpm=V.clamp(Math.round(heatIndexPpm*.82+gravity.centralPressureProxyPpm*.015+formation.equilibriumTemperatureMilliK/8),0,1000000),differentiationPpm=V.clamp(Math.round((composition.metalPpm+composition.silicatePpm)*.46+meltPotentialPpm*.58-(i.bulkPriorClass==='GAS_GIANT'?180000:0)),0,1000000),differentiationState=differentiationPpm>700000?'STRONGLY_DIFFERENTIATED':differentiationPpm>350000?'PARTIALLY_DIFFERENTIATED':'WEAKLY_DIFFERENTIATED';
 const coreFractionPpm=V.clamp(Math.round(composition.metalPpm*(.55+.45*differentiationPpm/1000000)),0,800000),crustFractionPpm=V.clamp(Math.round(22000+Math.max(0,650000-heatIndexPpm)*.08+composition.icePpm*.04),5000,220000),mantleFractionPpm=V.clamp(1000000-coreFractionPpm-crustFractionPpm,0,1000000),convectiveVigorPpm=V.clamp(Math.round(heatIndexPpm*.72+gravity.surfaceGravityMilliMs2/40-composition.icePpm*.08),0,1000000);
 let tectonicRegime;if(i.bulkPriorClass==='GAS_GIANT'||i.bulkPriorClass==='ICE_GIANT')tectonicRegime='NO_ROCKY_SURFACE_TECTONIC_REGIME';else if(convectiveVigorPpm>670000&&composition.lightVolatilePpm+composition.icePpm>70000)tectonicRegime='MOBILE_LID_PLAUSIBLE';else if(convectiveVigorPpm>360000)tectonicRegime='EPISODIC_OR_STAGNANT_LID';else tectonicRegime='STAGNANT_LID_LOW_ACTIVITY';
 const volcanismPpm=V.clamp(Math.round(heatIndexPpm*.63+tidalPpm*.42+(V.signedPpm(VERSION,i.planetIdentity,'volcanism')/12)),0,1000000),dynamoPpm=V.clamp(Math.round(coreFractionPpm*.72+convectiveVigorPpm*.38-age*22),0,1000000);
 return Object.freeze({differentiationState,differentiationPpm,coreFractionPpm,mantleFractionPpm,crustFractionPpm,heat:Object.freeze({earlyThermalPpm,radiogenicPpm,primordialPpm,tidalPpm,heatIndexPpm}),convectiveVigorPpm,tectonicRegime,volcanismPpm,dynamoPpm});
}
function volatileAtmosphere(i,formation,composition,gravity,interior){
 const volatileFractionPpm=V.clamp(composition.icePpm+composition.lightVolatilePpm,0,1000000),initialInventoryUnits=Math.max(1,Math.round(i.massMilliEarth*volatileFractionPpm/1000)),xuv=i.xuvMilliWm2||V.clamp(Math.round(formation.irradiationPpm*(i.ageMyr<800?4:1)/400),1,50000000),gravityRetentionPpm=V.clamp(Math.round(gravity.escapeVelocityMilliKms*48),30000,1000000),thermalStressPpm=V.clamp(Math.round(formation.equilibriumTemperatureMilliK*1.4),0,1000000),ageExposurePpm=V.clamp(Math.round(i.ageMyr*1000000/14000),0,1000000),escapePpm=V.clamp(Math.round((xuv/(xuv+1500+gravity.escapeVelocityMilliKms*.7))*650000+thermalStressPpm*.24+ageExposurePpm*.12-gravityRetentionPpm*.48),0,970000),retainedUnits=Math.max(0,Math.floor(initialInventoryUnits*(1000000-escapePpm)/1000000)),escapedUnits=initialInventoryUnits-retainedUnits;
 const outgassingPpm=V.clamp(Math.round(interior.volcanismPpm*.58+interior.heat.heatIndexPpm*.12),0,850000),outgassedUnits=Math.floor(retainedUnits*outgassingPpm/1000000),surfaceCondensedUnits=Math.max(0,Math.floor(retainedUnits*(V.clamp(780000-Math.abs(formation.equilibriumTemperatureMilliK-270000)*2,0,850000))/1000000)),interiorUnits=Math.max(0,retainedUnits-outgassedUnits-surfaceCondensedUnits),atmosphereUnits=retainedUnits-interiorUnits-surfaceCondensedUnits;
 const pressureProxyPpm=V.clamp(Math.round((atmosphereUnits/Math.max(1,initialInventoryUnits))*gravity.surfaceGravityMilliMs2/9.81*1100),0,12000000),hot=formation.equilibriumTemperatureMilliK>450000,cold=formation.equilibriumTemperatureMilliK<140000;
 let compositionFamily;if(pressureProxyPpm<12000)compositionFamily='AIRLESS_OR_TRACE_EXOSPHERE';else if(i.bulkPriorClass==='GAS_GIANT'||composition.lightVolatilePpm>550000)compositionFamily='H2_HE_DOMINATED';else if(hot&&volatileFractionPpm>120000)compositionFamily='STEAM_CO2_VOLATILE';else if(composition.silicatePpm>430000&&interior.volcanismPpm>260000)compositionFamily='N2_CO2_H2O_OUTGASSED';else if(cold)compositionFamily='CONDENSABLE_VOLATILE_ATMOSPHERE';else compositionFamily='MIXED_SECONDARY_ATMOSPHERE';
 const meanMolecularMassMilliAmu=compositionFamily==='H2_HE_DOMINATED'?3500:compositionFamily==='STEAM_CO2_VOLATILE'?27000:compositionFamily==='N2_CO2_H2O_OUTGASSED'?31500:compositionFamily==='AIRLESS_OR_TRACE_EXOSPHERE'?18000:38000,collapsePotentialPpm=V.clamp(Math.round((160000-formation.equilibriumTemperatureMilliK)*4+Math.max(0,160000-pressureProxyPpm/4)),0,1000000),cloudCondensatePotentialPpm=V.clamp(Math.round(volatileFractionPpm*.55+pressureProxyPpm*.045-Math.abs(formation.equilibriumTemperatureMilliK-270000)*1.5),0,1000000),greenhouseDeltaMilliK=V.clamp(Math.round(Math.log1p(pressureProxyPpm/45000)*52000+(compositionFamily==='H2_HE_DOMINATED'?70000:0)+(compositionFamily==='STEAM_CO2_VOLATILE'?90000:0)),0,900000);
 return Object.freeze({initialInventoryUnits,retainedUnits,escapedUnits,interiorUnits,surfaceCondensedUnits,atmosphereUnits,conserved:escapedUnits+interiorUnits+surfaceCondensedUnits+atmosphereUnits===initialInventoryUnits,escape:Object.freeze({xuvMilliWm2:xuv,escapePpm,kind:'BOUNDED_THERMAL_XUV_ESCAPE_SCENARIO',isMeasurement:false}),outgassingPpm,pressureProxyPpm,compositionFamily,meanMolecularMassMilliAmu,collapsePotentialPpm,cloudCondensatePotentialPpm,greenhouseDeltaMilliK,canonicalAtmosphereClaim:false});
}
function build(input){
 const i=normalizeInput(input),formation=formationContext(i),composition=bulkComposition(i,formation),gravity=gravityContext(i,composition),interior=interiorState(i,formation,composition,gravity),atmosphere=volatileAtmosphere(i,formation,composition,gravity,interior),uncertaintyPpm=V.clamp(310000+(composition.densityConsistency==='OUTSIDE_REDUCED_MIXTURE_REGIME'?230000:0)+(i.bulkPriorClass==='UNKNOWN'?120000:0),180000,780000);
 return V.freezeDeep({version:VERSION,planetIdentity:i.planetIdentity,inputs:i,formation,composition,gravity,interior,atmosphere,regime:Object.freeze({bulk:i.bulkPriorClass,formation:formation.formationZone,interior:interior.tectonicRegime,atmosphere:atmosphere.compositionFamily}),fidelity:Object.freeze({class:'REDUCED_ORDER_CAUSAL_MODEL',uncertaintyPpm,canonicalMeasurementsPromoted:false}),authority:AUTH,provenance:V.provenance('v1.planetology.causal-system','2.0.0',[SOURCE_BRANCH])});
}
function atAge(modelOrInput,ageMyr){V.int(ageMyr,'ageMyr',1,20000);const i=modelOrInput.inputs?modelOrInput.inputs:modelOrInput;return build({...i,ageMyr});}
O.v1PlanetologyCausal=Object.freeze({VERSION,AUTHORITY:AUTH,BULK,normalizeInput,formationContext,bulkComposition,gravityContext,interiorState,volatileAtmosphere,build,atAge});
})(globalThis);
