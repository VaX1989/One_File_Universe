import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox={console};sandbox.globalThis=sandbox;sandbox.OFU={};
for(const file of [
  'src/v2x-05-deep-planet-science/regime-core.js',
  'src/v2x-05-deep-planet-science/interior-atmosphere.js',
  'src/v2x-05-deep-planet-science/climate-volatile.js',
  'src/v2x-05-deep-planet-science/deep-planet-provider.js'
]) vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const O=sandbox.OFU,C=O.v2x05RegimeCore,CV=O.v2x05ClimateVolatile,P=O.v2x05DeepPlanetProvider;
const plain=v=>JSON.parse(JSON.stringify(v));

function planet(id,overrides={}){
  const base={
    planetIdentity:id,
    causal:{
      inputs:{planetIdentity:id,bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:20000,xuvMilliWm2:1000},
      formation:{formationZone:'ROCKY_INNER',equilibriumTemperatureMilliK:255000,frostLineMilliAu:2700,irradiationPpm:1000000,condensationVolatilePpm:300000,migrationRequiredByPrior:false,authority:'MODEL_DERIVED_SIMULATION'},
      composition:{metalPpm:320000,silicatePpm:560000,icePpm:70000,lightVolatilePpm:50000,sumPpm:1000000,bulkDensityKgM3:5500,mixtureDensityKgM3:5200,densityMismatchPpm:55000,densityConsistency:'CONSISTENT_WITH_REDUCED_MIXTURE',canonicalCompositionClaim:false},
      gravity:{surfaceGravityMilliMs2:9810,escapeVelocityMilliKms:11186,centralPressureProxyPpm:1000000,bulkDensityKgM3:5500},
      interior:{differentiationState:'STRONGLY_DIFFERENTIATED',differentiationPpm:780000,coreFractionPpm:300000,mantleFractionPpm:650000,crustFractionPpm:50000,heat:{earlyThermalPpm:800000,radiogenicPpm:250000,primordialPpm:300000,tidalPpm:20000,heatIndexPpm:330000},convectiveVigorPpm:500000,tectonicRegime:'EPISODIC_OR_STAGNANT_LID',volcanismPpm:350000,dynamoPpm:480000},
      atmosphere:{initialInventoryUnits:1000000,retainedUnits:900000,escapedUnits:100000,interiorUnits:350000,surfaceCondensedUnits:150000,atmosphereUnits:400000,conserved:true,escape:{xuvMilliWm2:1000,escapePpm:200000,kind:'BOUNDED_THERMAL_XUV_ESCAPE_SCENARIO',isMeasurement:false},outgassingPpm:300000,pressureProxyPpm:500000,compositionFamily:'N2_CO2_H2O_OUTGASSED',meanMolecularMassMilliAmu:31500,collapsePotentialPpm:100000,cloudCondensatePotentialPpm:350000,greenhouseDeltaMilliK:33000,canonicalAtmosphereClaim:false}
    }
  };
  for(const [path,value] of Object.entries(overrides)){
    const parts=path.split('.');let target=base;for(let i=0;i<parts.length-1;i++)target=target[parts[i]];target[parts.at(-1)]=value;
  }
  return base;
}
function withLedger(p,{escaped,interior,condensed,atmosphere}){
  const a=p.causal.atmosphere;a.escapedUnits=escaped;a.interiorUnits=interior;a.surfaceCondensedUnits=condensed;a.atmosphereUnits=atmosphere;a.initialInventoryUnits=escaped+interior+condensed+atmosphere;a.retainedUnits=interior+condensed+atmosphere;a.conserved=true;return p;
}

const terrestrial=planet('terrestrial');
const ocean=withLedger(planet('ocean'),{escaped:50000,interior:150000,condensed:500000,atmosphere:300000});
const airless=withLedger(planet('airless',{'causal.atmosphere.pressureProxyPpm':5000,'causal.atmosphere.compositionFamily':'AIRLESS_OR_TRACE_EXOSPHERE','causal.atmosphere.greenhouseDeltaMilliK':0}),{escaped:300000,interior:400000,condensed:300000,atmosphere:0});
const subNeptune=planet('sub-neptune',{'causal.inputs.bulkPriorClass':'VOLATILE_RICH','causal.inputs.massMilliEarth':8000,'causal.inputs.radiusKm':18000,'causal.composition.lightVolatilePpm':400000,'causal.composition.icePpm':300000,'causal.composition.silicatePpm':220000,'causal.composition.metalPpm':80000,'causal.atmosphere.compositionFamily':'H2_HE_DOMINATED','causal.atmosphere.meanMolecularMassMilliAmu':3500,'causal.atmosphere.pressureProxyPpm':4000000});
const iceGiant=planet('ice-giant',{'causal.inputs.bulkPriorClass':'ICE_GIANT','causal.inputs.massMilliEarth':50000,'causal.inputs.radiusKm':25000,'causal.composition.lightVolatilePpm':245000,'causal.composition.icePpm':510000,'causal.composition.silicatePpm':180000,'causal.composition.metalPpm':65000,'causal.atmosphere.compositionFamily':'H2_HE_DOMINATED','causal.atmosphere.meanMolecularMassMilliAmu':3500,'causal.atmosphere.pressureProxyPpm':6000000});
const gasGiant=planet('gas-giant',{'causal.inputs.bulkPriorClass':'GAS_GIANT','causal.inputs.massMilliEarth':318000,'causal.inputs.radiusKm':70000,'causal.composition.lightVolatilePpm':780000,'causal.composition.icePpm':120000,'causal.composition.silicatePpm':70000,'causal.composition.metalPpm':30000,'causal.atmosphere.compositionFamily':'H2_HE_DOMINATED','causal.atmosphere.meanMolecularMassMilliAmu':3500,'causal.atmosphere.pressureProxyPpm':9000000});

assert.equal(P.AUTHORITY,'MODEL_DERIVED_SIMULATION');
assert.equal(P.CONTRACT,'ofu-v2x-05-deep-planet-consumer-1');
const regimes=[
  [terrestrial,'TERRESTRIAL_ATMOSPHERIC',true],[ocean,'OCEAN_WORLD_CANDIDATE',true],[airless,'AIRLESS_TERRESTRIAL',true],
  [subNeptune,'SUB_NEPTUNE',false],[iceGiant,'ICE_GIANT',false],[gasGiant,'GAS_GIANT',false]
];
for(const [world,expected,solid] of regimes){
  const r=C.classify(world);assert.equal(r.supported,true,expected);assert.equal(r.regime,expected);assert.equal(r.solidSurfaceModel,solid);assert.equal(r.observationalClassificationClaim,false);assert.equal(r.eosClaim,false);
  const a=P.evaluate(world);assert.equal(a.supported,true,expected);assert.equal(a.regime.regime,expected);assert.equal(a.claims.gcm,false);assert.equal(a.claims.photochemistry,false);assert.equal(a.claims.plateTectonicsResolved,false);assert.equal(a.volatile.closure.exactInternalClosure,true);assert.equal(a.climate.cellCount,24);assert.ok(a.bounds.constituentsObserved<=C.LIMITS.constituents);assert.equal(a.causality.shareClosurePpm,1000000);
  assert.deepEqual(plain(a),plain(P.evaluate(world)),expected+' evaluation must be deterministic');
}

const badBulk=planet('bad-bulk',{'causal.inputs.bulkPriorClass':'UNKNOWN'});assert.equal(P.evaluate(badBulk).supported,false);assert.match(P.evaluate(badBulk).reason,/UNSUPPORTED_BULK_PRIOR/);
const badMass=planet('bad-mass',{'causal.inputs.massMilliEarth':7000000});assert.equal(P.evaluate(badMass).supported,false);assert.match(P.evaluate(badMass).reason,/MASS_RADIUS_ENVELOPE/);
const incomplete={planetIdentity:'incomplete',causal:{inputs:{planetIdentity:'incomplete'}}};assert.equal(P.evaluate(incomplete).supported,false);assert.match(P.evaluate(incomplete).reason,/NO_COMPLETE/);
const badLedger=planet('bad-ledger');badLedger.causal.atmosphere.atmosphereUnits+=1;assert.equal(P.evaluate(badLedger).supported,false);assert.equal(P.evaluate(badLedger).volatile.reason,'SOURCE_VOLATILE_LEDGER_NOT_CLOSED');

const terEval=P.evaluate(terrestrial);assert.equal(terEval.atmosphere.composition.shareClosurePpm,1000000);assert.ok(terEval.atmosphere.composition.constituentCount<=6);assert.equal(terEval.radiative.irradiationEquilibriumTemperature.temperatureMilliK,255000);assert.equal(terEval.radiative.modeledSurfaceTemperature.temperatureMilliK,288000);assert.equal(terEval.radiative.effectiveEmissionTemperature.status,'UNSUPPORTED');assert.equal(terEval.radiative.gcmClaim,false);assert.equal(terEval.climate.deterministicArithmetic,'INTEGER_PPM_QUARTER_SEASON_KERNEL');
const airEval=P.evaluate(airless);assert.equal(airEval.atmosphere.composition.supported,false);assert.equal(airEval.radiative.modeledSurfaceTemperature.status,'UNSUPPORTED');assert.equal(airEval.volatile.surface.partitionTemperatureSource,'V1_IRRADIATION_EQUILIBRIUM_PROXY');
for(const giant of [subNeptune,iceGiant,gasGiant]){const e=P.evaluate(giant);assert.equal(e.regime.solidSurfaceModel,false);assert.equal(e.radiative.modeledSurfaceTemperature.temperatureMilliK,null);assert.equal(e.volatile.surface.oceanUnits,0);assert.equal(e.volatile.surface.resolved,false);assert.equal(e.interior.geodynamics.supported,false);assert.equal(e.volatile.giantSemantics,'CONDENSED_SOURCE_RESERVOIR_RETAINED_WITHOUT_SOLID_SURFACE_OCEAN_INTERPRETATION')}

const lowXuv=P.evaluate(terrestrial,{xuvHistory:[{ageMyr:100,xuvMilliWm2:1000},{ageMyr:4500,xuvMilliWm2:1000}]});
const highXuv=P.evaluate(terrestrial,{xuvHistory:[{ageMyr:100,xuvMilliWm2:6000},{ageMyr:4500,xuvMilliWm2:3000}]});
assert.ok(highXuv.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm>=lowXuv.atmosphere.retentionEscape.historyAdjustedEscapeContextPpm,'higher supplied XUV context must not reduce escape context');
assert.equal(highXuv.atmosphere.retentionEscape.integratedMassLossClaim,false);
const tooLong=Array.from({length:65},(_,i)=>({ageMyr:i,xuvMilliWm2:1000}));const tooLongEval=P.evaluate(terrestrial,{xuvHistory:tooLong});assert.equal(tooLongEval.supported,false);assert.equal(tooLongEval.atmosphere.retentionEscape.status,'UNSUPPORTED');
const unordered=[{ageMyr:1000,xuvMilliWm2:1000},{ageMyr:900,xuvMilliWm2:1000}];const unorderedEval=P.evaluate(terrestrial,{xuvHistory:unordered});assert.equal(unorderedEval.supported,false);assert.equal(unorderedEval.atmosphere.retentionEscape.status,'UNSUPPORTED');

const lowOb=P.evaluate(planet('low-ob',{'causal.inputs.obliquityMilliDeg':0}));
const highOb=P.evaluate(planet('high-ob',{'causal.inputs.obliquityMilliDeg':80000}));
assert.ok(highOb.climate.temperatureRangeMilliK.amplitude>=lowOb.climate.temperatureRangeMilliK.amplitude,'higher obliquity context must not reduce modeled seasonal envelope amplitude');
const cool=P.evaluate(planet('cool',{'causal.formation.equilibriumTemperatureMilliK':220000}));
const warm=P.evaluate(planet('warm',{'causal.formation.equilibriumTemperatureMilliK':300000}));
assert.ok(warm.radiative.modeledSurfaceTemperature.temperatureMilliK>cool.radiative.modeledSurfaceTemperature.temperatureMilliK,'higher irradiation thermal proxy must raise reduced surface temperature');
const thin=P.evaluate(planet('thin',{'causal.atmosphere.pressureProxyPpm':50000}));
const thick=P.evaluate(planet('thick',{'causal.atmosphere.pressureProxyPpm':2000000}));
assert.ok(thick.climate.transportProxyPpm>thin.climate.transportProxyPpm,'larger modeled column proxy must strengthen transport proxy inside this envelope');
const dry=withLedger(planet('dry'),{escaped:100000,interior:500000,condensed:50000,atmosphere:350000});
const wet=withLedger(planet('wet'),{escaped:100000,interior:200000,condensed:350000,atmosphere:350000});
assert.ok(P.evaluate(wet).volatile.surface.oceanUnits>=P.evaluate(dry).volatile.surface.oceanUnits,'more modeled condensed inventory must not reduce liquid partition at fixed thermal state');

for(const context of P.CONTEXTS){const q=P.query(terEval,context);assert.equal(q.supported,true);assert.equal(q.context,context);assert.equal(q.readOnly,true);assert.equal(q.hiddenGlobalRequired,false);assert.equal(q.canonicalPromotion,false);assert.equal(q.authority,'MODEL_DERIVED_SIMULATION');assert.ok(Object.isFrozen(q));assert.ok(Object.isFrozen(q.payload));}
assert.equal(P.query(terEval,'UNKNOWN_CONTEXT').supported,false);
const surfaceQ=P.query(terEval,'SURFACE_PROMPT08_CONTEXT');assert.equal(surfaceQ.payload.plateTectonicsResolved,false);assert.equal(surfaceQ.payload.surfaceGeometryClaim,false);assert.equal(surfaceQ.payload.geodynamics.supported,true);
const ecologyQ=P.query(gasGiant,'ECOLOGY_CONTEXT');assert.equal(ecologyQ.payload.solidSurfaceModel,false);assert.equal(ecologyQ.payload.oceanCandidate,false);assert.equal(ecologyQ.payload.canonicalHabitabilityClaim,false);
const gameplayQ=P.query(highXuv,'GAMEPLAY_CAUSAL_CONTEXT');assert.equal(gameplayQ.payload.canonicalEventAdmission,false);assert.equal(gameplayQ.payload.driverAttribution.reduce((n,d)=>n+d.sharePpm,0),1000000);

const split=CV.splitExact(7,[1,1,1]);assert.equal(split.reduce((a,b)=>a+b,0),7);assert.deepEqual([...C.normalizePpm([1,1,1])].reduce((a,b)=>a+b,0),1000000);
assert.equal(terEval.interior.heat.normalizedDriverShares.reduce((n,d)=>n+d.sharePpm,0),1000000);assert.equal(terEval.interior.heat.conservedEnergyClaim,false);
assert.equal(terEval.integrity.sourceInputMutation,false);assert.equal(terEval.integrity.identityConsistencyRequired,true);assert.equal(terEval.volatile.closure.arithmeticSafeInteger,true);

console.log(JSON.stringify({status:'PASS',oracle:'V2X05_DEEP_PLANET_ORACLES_V2',contract:P.CONTRACT,authority:P.AUTHORITY,regimes:Object.fromEntries(regimes.map(([w,r])=>[w.planetIdentity,r])),bounds:{climateCells:terEval.climate.cellCount,maxClimateCells:C.LIMITS.climateCells,constituents:terEval.atmosphere.composition.constituentCount,maxConstituents:C.LIMITS.constituents,maxXuvHistorySamples:C.LIMITS.historySamples,maxExactInventoryUnits:C.LIMITS.exactInventoryUnits},closures:{volatile:terEval.volatile.closure.exactInternalClosure,causalAttributionPpm:terEval.causality.shareClosurePpm,constituentPpm:terEval.atmosphere.composition.shareClosurePpm},metamorphic:{xuv:true,obliquity:true,irradiation:true,pressureTransport:true,volatileInventory:true},integrity:{sourceInputMutation:false,identityConsistency:true,exactIntegerVolatile:true,quarterSeasonIntegerKernel:true},claims:{notGcm:terEval.climate.notGcm,eos:false,photochemistry:false,plateTectonicsResolved:false,canonicalPromotion:false}}));
