import assert from 'node:assert/strict';
import { AUTHORITY } from '../../src/experiments/spatial-continuum/constants.js';
import { deriveCausalWorldRegime, PLANET_PRESENTATION_GRAMMARS } from '../../src/experiments/spatial-continuum/causal-regimes.js';
import { CAUSAL_PRESENTATION_CLASS, deriveCausalPresentationConsequences } from '../../src/experiments/spatial-continuum/visual-consequences.js';

const env=(overrides={})=>({
  formation:{ageMyr:4500},composition:{metalPpm:280000,silicatePpm:600000,volatilePpm:120000},atmosphere:{inventoryUnits:12000},climate:{stellarFluxPpm:1000000,surfaceTemperatureMilliK:288000},hydrosphere:{waterAreaPpm:0,iceFractionPpm:0,canonicalOceanClaim:false},surfaceProcesses:{tectonicActivityPpm:300000,erosionPotentialPpm:220000,impactRetentionPpm:520000},...overrides,
  formation:{ageMyr:4500,...overrides.formation},composition:{metalPpm:280000,silicatePpm:600000,volatilePpm:120000,...overrides.composition},atmosphere:{inventoryUnits:12000,...overrides.atmosphere},climate:{stellarFluxPpm:1000000,surfaceTemperatureMilliK:288000,...overrides.climate},hydrosphere:{waterAreaPpm:0,iceFractionPpm:0,canonicalOceanClaim:false,...overrides.hydrosphere},surfaceProcesses:{tectonicActivityPpm:300000,erosionPotentialPpm:220000,impactRetentionPpm:520000,...overrides.surfaceProcesses}
});
const planet=(overrides={})=>({bulkPriorClass:'TERRESTRIAL',surfaceGravityMicroMs2:9810000,insolationPpm:1000000,...overrides});
const world=(planetOverrides,environmentOverrides,stellar={ageMyr:4500})=>({planet:planet(planetOverrides),environment:env(environmentOverrides),stellar});

const worlds=[
  ['airless-crater',world({surfaceGravityMicroMs2:3700000},{atmosphere:{inventoryUnits:0},climate:{stellarFluxPpm:1180000,surfaceTemperatureMilliK:315000},surfaceProcesses:{tectonicActivityPpm:90000,erosionPotentialPpm:50000,impactRetentionPpm:930000},formation:{ageMyr:5200},composition:{metalPpm:330000,silicatePpm:620000,volatilePpm:50000}})],
  ['airless-crater-nearby',world({surfaceGravityMicroMs2:3900000},{atmosphere:{inventoryUnits:0},climate:{stellarFluxPpm:1160000,surfaceTemperatureMilliK:310000},surfaceProcesses:{tectonicActivityPpm:100000,erosionPotentialPpm:60000,impactRetentionPpm:910000},formation:{ageMyr:5000},composition:{metalPpm:320000,silicatePpm:620000,volatilePpm:60000}})],
  ['wet-eroded',world({}, {atmosphere:{inventoryUnits:850000},climate:{stellarFluxPpm:920000,surfaceTemperatureMilliK:284000},hydrosphere:{waterAreaPpm:610000,iceFractionPpm:20000},surfaceProcesses:{tectonicActivityPpm:220000,erosionPotentialPpm:820000,impactRetentionPpm:180000},composition:{metalPpm:180000,silicatePpm:520000,volatilePpm:300000}})],
  ['tectonic-dense',world({surfaceGravityMicroMs2:13200000},{atmosphere:{inventoryUnits:420000},climate:{stellarFluxPpm:1450000,surfaceTemperatureMilliK:338000},surfaceProcesses:{tectonicActivityPpm:870000,erosionPotentialPpm:260000,impactRetentionPpm:330000},composition:{metalPpm:360000,silicatePpm:560000,volatilePpm:80000}})],
  ['cryo-fractured',world({bulkPriorClass:'VOLATILE_RICH',surfaceGravityMicroMs2:1800000},{atmosphere:{inventoryUnits:45000},climate:{stellarFluxPpm:180000,surfaceTemperatureMilliK:155000},hydrosphere:{waterAreaPpm:40000,iceFractionPpm:850000},surfaceProcesses:{tectonicActivityPpm:280000,erosionPotentialPpm:120000,impactRetentionPpm:650000},composition:{metalPpm:80000,silicatePpm:220000,volatilePpm:700000}})],
  ['hot-dry',world({surfaceGravityMicroMs2:20800000},{atmosphere:{inventoryUnits:1800},climate:{stellarFluxPpm:2650000,surfaceTemperatureMilliK:720000},surfaceProcesses:{tectonicActivityPpm:410000,erosionPotentialPpm:80000,impactRetentionPpm:720000},composition:{metalPpm:430000,silicatePpm:540000,volatilePpm:30000}})],
  ['low-g-mixed',world({surfaceGravityMicroMs2:1200000},{atmosphere:{inventoryUnits:9000},climate:{stellarFluxPpm:780000,surfaceTemperatureMilliK:250000},surfaceProcesses:{tectonicActivityPpm:420000,erosionPotentialPpm:180000,impactRetentionPpm:420000}})],
  ['high-g-mixed',world({surfaceGravityMicroMs2:23800000},{atmosphere:{inventoryUnits:9000},climate:{stellarFluxPpm:780000,surfaceTemperatureMilliK:250000},surfaceProcesses:{tectonicActivityPpm:420000,erosionPotentialPpm:180000,impactRetentionPpm:420000}})],
  ['young-mixed',world({}, {formation:{ageMyr:220},surfaceProcesses:{tectonicActivityPpm:330000,erosionPotentialPpm:260000,impactRetentionPpm:480000}})],
  ['old-mixed',world({}, {formation:{ageMyr:9100},surfaceProcesses:{tectonicActivityPpm:330000,erosionPotentialPpm:260000,impactRetentionPpm:480000}})],
  ['fluid-giant',world({bulkPriorClass:'GAS_GIANT',surfaceGravityMicroMs2:24600000},{atmosphere:{inventoryUnits:4200000},climate:{stellarFluxPpm:520000,surfaceTemperatureMilliK:185000},hydrosphere:{waterAreaPpm:0,iceFractionPpm:0},surfaceProcesses:{tectonicActivityPpm:0,erosionPotentialPpm:0,impactRetentionPpm:0},composition:{metalPpm:50000,silicatePpm:50000,volatilePpm:900000}})],
  ['volatile-thick',world({bulkPriorClass:'VOLATILE_RICH',surfaceGravityMicroMs2:7600000},{atmosphere:{inventoryUnits:1500000},climate:{stellarFluxPpm:650000,surfaceTemperatureMilliK:238000},hydrosphere:{waterAreaPpm:180000,iceFractionPpm:310000},surfaceProcesses:{tectonicActivityPpm:350000,erosionPotentialPpm:470000,impactRetentionPpm:260000},composition:{metalPpm:90000,silicatePpm:300000,volatilePpm:610000}})]
];

const profiles=new Map(worlds.map(([name,input])=>[name,deriveCausalPresentationConsequences(input)]));
for(const [name,input] of worlds){
  const first=profiles.get(name),again=deriveCausalPresentationConsequences(input);
  assert.deepEqual(first,again,name+' must be deterministic');assert.equal(first.authority,AUTHORITY.PRESENTATION_ONLY);assert.equal(first.scientificClaimsAdded,false);
  for(const [channelName,value] of Object.entries(first.channels)){assert.equal(value.outputClass,CAUSAL_PRESENTATION_CLASS.PRESENTATION_ONLY,name+' '+channelName+' must remain presentation-only');assert.equal(value.outputAuthority,AUTHORITY.PRESENTATION_ONLY);assert.equal(value.scientificClaim,false)}
}

assert.equal(profiles.get('airless-crater').channels.illumination.unsupported.some(item=>item.field==='lightDirection'&&item.class===CAUSAL_PRESENTATION_CLASS.UNKNOWN),true);
assert.equal(profiles.get('airless-crater').channels.sky.unsupported.some(item=>item.field==='calibratedRayleighMieColor'),true);
assert.equal(profiles.get('wet-eroded').channels.hydrosphere.canonicalOceanClaim,false);
assert.equal(profiles.get('fluid-giant').channels.material.family,'NO_SOLID_SURFACE');

const regimeLow=deriveCausalWorldRegime(world({}, {surfaceProcesses:{tectonicActivityPpm:620000,erosionPotentialPpm:150000,impactRetentionPpm:250000}}));
const regimeHigh=deriveCausalWorldRegime(world({}, {surfaceProcesses:{tectonicActivityPpm:920000,erosionPotentialPpm:150000,impactRetentionPpm:250000}}));
assert.equal(regimeLow.family,PLANET_PRESENTATION_GRAMMARS.TECTONIC_RIDGE);assert.equal(regimeHigh.family,PLANET_PRESENTATION_GRAMMARS.TECTONIC_RIDGE);assert.ok(regimeHigh.structuralWeights.ridge>regimeLow.structuralWeights.ridge);

const distance=(left,right,fields=Object.keys(left))=>fields.reduce((sum,key)=>sum+Math.abs(Number(left[key]||0)-Number(right[key]||0)),0)/fields.length;
const inputVector=input=>({forcing:(input.environment.climate.stellarFluxPpm||0)/3000000,temperature:(input.environment.climate.surfaceTemperatureMilliK||0)/800000,atmosphere:Math.min(1,Math.log10(1+(input.environment.atmosphere.inventoryUnits||0))/7),water:(input.environment.hydrosphere.waterAreaPpm||0)/1000000,ice:(input.environment.hydrosphere.iceFractionPpm||0)/1000000,tectonic:(input.environment.surfaceProcesses.tectonicActivityPpm||0)/1000000,erosion:(input.environment.surfaceProcesses.erosionPotentialPpm||0)/1000000,impact:(input.environment.surfaceProcesses.impactRetentionPpm||0)/1000000,gravity:(input.planet.surfaceGravityMicroMs2||0)/30000000,age:Math.min(1,(input.environment.formation.ageMyr||0)/10000)});
const pair=(a,b)=>[worlds.find(([name])=>name===a)[1],worlds.find(([name])=>name===b)[1],profiles.get(a),profiles.get(b)];
const [nearA,nearB,nearPA,nearPB]=pair('airless-crater','airless-crater-nearby');
const nearModelDistance=distance(inputVector(nearA),inputVector(nearB)),nearPresentationDistance=distance(nearPA.descriptorVector,nearPB.descriptorVector);
assert.ok(nearModelDistance<.04);assert.ok(nearPresentationDistance<.08);

const channelDifferenceCount=(left,right)=>{const pairs={illumination:['illuminationKey','illuminationDiffuse','exposureCompensation'],sky:['skyHaze','horizonClarity'],hydrosphere:['surfaceSheen','iceEmphasis'],thermal:['thermalStress'],gravity:['gravityRelief'],geology:['geologyRoughness','ridgeEmphasis','basinEmphasis','craterEmphasis'],material:['materialMicrocontrast'],history:['historyMaturity']};return Object.entries(pairs).filter(([name,fields])=>left.semanticDescriptor[name]!==right.semanticDescriptor[name]||distance(left.descriptorVector,right.descriptorVector,fields)>.08).length};
const wet=profiles.get('wet-eroded'),crater=profiles.get('airless-crater'),cryo=profiles.get('cryo-fractured'),hot=profiles.get('hot-dry');
assert.ok(distance(wet.descriptorVector,crater.descriptorVector)>.18);assert.ok(channelDifferenceCount(wet,crater)>=5);assert.ok(distance(cryo.descriptorVector,hot.descriptorVector)>.2);assert.ok(channelDifferenceCount(cryo,hot)>=5);
assert.notEqual(profiles.get('low-g-mixed').perceptualFingerprint,profiles.get('high-g-mixed').perceptualFingerprint);assert.notEqual(profiles.get('young-mixed').perceptualFingerprint,profiles.get('old-mixed').perceptualFingerprint);
const uniqueFingerprints=new Set([...profiles.values()].map(profile=>profile.perceptualFingerprint));assert.ok(uniqueFingerprints.size>=11);
const blindSamples=[...profiles.entries()].map(([name,profile],index)=>({sample:String.fromCharCode(65+index),hiddenName:name,fingerprint:profile.perceptualFingerprint,semantic:profile.semanticDescriptor,vector:profile.descriptorVector}));

const unsupported=deriveCausalPresentationConsequences({planet:{bulkPriorClass:'TERRESTRIAL'}});assert.equal(unsupported.channels.sky.status,'UNKNOWN_UNSUPPORTED');assert.equal(unsupported.channels.history.status,'UNKNOWN_UNSUPPORTED');assert.equal(unsupported.channels.gravity.status,'UNKNOWN_UNSUPPORTED');assert.equal(unsupported.scientificClaimsAdded,false);

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r6-w0-causal-visual-consequences',worldCount:worlds.length,uniqueFingerprints:uniqueFingerprints.size,nearby:{modelDistance:Number(nearModelDistance.toFixed(4)),presentationDistance:Number(nearPresentationDistance.toFixed(4))},separated:{wetVsCrater:Number(distance(wet.descriptorVector,crater.descriptorVector).toFixed(4)),wetVsCraterChannels:channelDifferenceCount(wet,crater),cryoVsHot:Number(distance(cryo.descriptorVector,hot.descriptorVector).toFixed(4)),cryoVsHotChannels:channelDifferenceCount(cryo,hot)},blindedSamples:blindSamples.map(({sample,fingerprint,semantic,vector})=>({sample,fingerprint,semantic,vector}))},null,2));
