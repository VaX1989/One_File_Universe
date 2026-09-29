import assert from 'node:assert/strict';
import { createHumanPlaceGrammar, classifyHumanDepth } from '../../src/experiments/spatial-continuum/human-place-grammar.js';
import { createLocalEnvironmentGenerator } from '../../src/experiments/spatial-continuum/local-environment.js';
import { deriveProductDepthProfile } from '../../src/experiments/spatial-continuum/product-depth-profile.js';

const terrain=(east,north)=>Math.sin(east/17)*2+Math.cos(north/23)*3+Math.sin((east+north)/7)*.35;
const families=['ANGULAR_ICE_FRACTURE_FIELD','UPLIFTED_LITHIC_FIELD','ROUNDED_SEDIMENT_FIELD','ANGULAR_EJECTA_FIELD','MIXED_LITHIC_FIELD'];
const make=(family,seed='r6-c-human-review')=>createLocalEnvironmentGenerator({seed,terrainSampler:terrain,regime:{localGrammar:family,localDensity:1,atmosphereStrength:.55,cloudStrength:.2},cellSizeM:32,activeRadius:2,maxInstances:120});
const review=Object.fromEntries(families.map(family=>{const generator=make(family),origin=generator.windowFor(0,0),repeat=make(family).windowFor(0,0),moved=generator.windowFor(40,0),state=generator.snapshot();assert.deepEqual(repeat,origin,`${family} must be deterministic at the same address`);assert.ok(origin.bounded&&state.bounded,`${family} must keep bounded residency`);assert.equal(origin.activeCellCount,25);assert.ok(origin.instanceCount<=120);assert.ok(origin.landmarkCount<=origin.placeGrammar.budgets.maxLandmarksPerWindow);assert.ok(origin.depthCounts.NEAR>0&&origin.depthCounts.MID>0,`${family} must establish near/mid composition`);assert.ok(origin.placeGrammar.horizon.samples.length===24&&origin.placeGrammar.horizon.reliefM>=0);const shared=new Map(origin.instances.map(item=>[item.id,item])),retained=moved.instances.find(item=>shared.has(item.id));assert.ok(retained,`${family} must retain overlap across adjacent windows`);assert.deepEqual(retained.baseScale,shared.get(retained.id).baseScale);assert.deepEqual(retained.scale,shared.get(retained.id).scale,'persistent objects must keep stable world-space scale');return[family,{process:origin.process,skyline:origin.placeGrammar.skyline,landmarks:origin.landmarkCount,depthCounts:origin.depthCounts,horizonReliefM:Number(origin.placeGrammar.horizon.reliefM.toFixed(4)),voidRadiusM:Number(origin.placeGrammar.voidRadiusM.toFixed(3)),corridorWidthM:Number(origin.placeGrammar.corridorWidthM.toFixed(3)),meanHeight:Number((origin.instances.reduce((sum,item)=>sum+item.scale[1],0)/origin.instances.length).toFixed(5)),samplePositions:origin.instances.slice(0,8).map(item=>[Number(item.eastM.toFixed(2)),Number(item.northM.toFixed(2)),item.depthBand,item.landmark])}]}));
assert.equal(new Set(Object.values(review).map(item=>item.process)).size,families.length);assert.equal(new Set(Object.values(review).map(item=>item.skyline)).size,families.length);assert.ok(new Set(Object.values(review).map(item=>JSON.stringify(item.samplePositions))).size>=4);assert.ok(review.ANGULAR_ICE_FRACTURE_FIELD.meanHeight>review.ROUNDED_SEDIMENT_FIELD.meanHeight*2.2);

const farGenerator=make('MIXED_LITHIC_FIELD','r6-c-far-window'),far=farGenerator.windowFor(10000,10000),farRepeat=make('MIXED_LITHIC_FIELD','r6-c-far-window').windowFor(10000,10000),centerEast=(far.centerCell[0]+.5)*far.cellSizeM,centerNorth=(far.centerCell[1]+.5)*far.cellSizeM;assert.deepEqual(farRepeat,far);for(const item of far.instances){const expected=classifyHumanDepth({eastM:item.eastM,northM:item.northM,centerEastM:centerEast,centerNorthM:centerNorth,cellSizeM:far.cellSizeM}),scaleCue=expected==='NEAR'?far.placeGrammar.scaleBands.near:expected==='MID'?far.placeGrammar.scaleBands.mid:far.placeGrammar.scaleBands.far;assert.equal(item.depthBand,expected);assert.deepEqual(item.scale,item.baseScale,'depth classification must not mutate world-space object size');assert.equal(item.depthPresentation.scaleCue,scaleCue);assert.ok(item.depthPresentation.detailWeight>0);assert.equal(item.depthPresentation.authority,'PRESENTATION_ONLY')}assert.ok((far.depthCounts.NEAR||0)>0);assert.ok((far.depthCounts.MID||0)>0);assert.ok((far.depthCounts.FAR||0)<far.instanceCount);assert.equal(far.stableWorldScale,true);

const stableGenerator=make('UPLIFTED_LITHIC_FIELD','r6-c-stable-world-scale'),stableA=stableGenerator.windowFor(0,0),stableB=stableGenerator.windowFor(64,0),stableMap=new Map(stableA.instances.map(item=>[item.id,item])),stableShared=stableB.instances.filter(item=>stableMap.has(item.id));assert.ok(stableShared.length>0);for(const item of stableShared){const prior=stableMap.get(item.id);assert.deepEqual(item.baseScale,prior.baseScale);assert.deepEqual(item.scale,prior.scale)}
const place=createHumanPlaceGrammar({seed:'camera-calibration',terrainSampler:terrain,regime:{localGrammar:'MIXED_LITHIC_FIELD'},cellSizeM:32});assert.ok(place.camera.eyeHeightM>=1.55&&place.camera.eyeHeightM<=1.8);assert.equal(classifyHumanDepth({eastM:4,northM:3,cellSizeM:32}),'NEAR');assert.equal(classifyHumanDepth({eastM:70,northM:0,cellSizeM:32}),'MID');assert.equal(classifyHumanDepth({eastM:160,northM:0,cellSizeM:32}),'FAR');

const depthWorld=(name,{gravity,atmosphere,temperature,water,ice,tectonic,erosion,impact,metal,silicate,volatile,family,localGrammar,palette,localDensity=1,ageMyr=4500})=>Object.freeze({
  bodyId:name,
  generative:Object.freeze({
    scientificState:Object.freeze({
      contract:'ofu-r6-world-scientific-state-1',
      planet:Object.freeze({bulkPriorClass:'TERRESTRIAL',surfaceGravityMicroMs2:gravity,insolationPpm:1000000}),
      stellar:Object.freeze({ageMyr}),
      environment:Object.freeze({
        formation:Object.freeze({ageMyr}),
        composition:Object.freeze({metalPpm:metal,silicatePpm:silicate,volatilePpm:volatile}),
        atmosphere:Object.freeze({inventoryUnits:atmosphere}),
        climate:Object.freeze({stellarFluxPpm:1000000,surfaceTemperatureMilliK:temperature}),
        hydrosphere:Object.freeze({waterAreaPpm:water,iceFractionPpm:ice,canonicalOceanClaim:false}),
        surfaceProcesses:Object.freeze({tectonicActivityPpm:tectonic,erosionPotentialPpm:erosion,impactRetentionPpm:impact})
      })
    }),
    presentation:Object.freeze({
      contract:'ofu-r6-world-representation-profile-1',localDensity,
      regime:Object.freeze({family,localGrammar,structuralWeights:Object.freeze({ridge:tectonic/1e6,basin:erosion/1e6,crater:impact/1e6,fracture:ice/1e6,smooth:Math.min(1,(erosion+water*.35)/1e6)})}),
      terrainPalette:Object.freeze({low:Object.freeze(palette[0]),mid:Object.freeze(palette[1]),high:Object.freeze(palette[2])}),
      terrain:Object.freeze({macroAmplitudeM:800,localGrammar})
    })
  }),
  terrainTarget:Object.freeze({profile:Object.freeze({macroAmplitudeM:800})})
});
const airlessDepthWorld=depthWorld('airless-depth',{gravity:3700000,atmosphere:0,temperature:315000,water:0,ice:0,tectonic:90000,erosion:50000,impact:930000,metal:330000,silicate:620000,volatile:50000,family:'CRATERED_HIGHLAND_PRESENTATION',localGrammar:'ANGULAR_EJECTA_FIELD',palette:[[.13,.12,.12],[.36,.31,.27],[.68,.62,.55]],localDensity:.72,ageMyr:5200});
const wetDepthWorld=depthWorld('wet-depth',{gravity:9810000,atmosphere:850000,temperature:284000,water:610000,ice:20000,tectonic:220000,erosion:820000,impact:180000,metal:180000,silicate:520000,volatile:300000,family:'ERODED_BASIN_PRESENTATION',localGrammar:'ROUNDED_SEDIMENT_FIELD',palette:[[.12,.24,.2],[.3,.46,.27],[.65,.58,.42]],localDensity:1.24,ageMyr:4500});
const depthProfileFor=world=>{const regime=world.generative.presentation.regime,placeGrammar=createHumanPlaceGrammar({seed:world.bodyId,terrainSampler:terrain,regime:{...regime,localDensity:world.generative.presentation.localDensity,atmosphereStrength:world.bodyId.startsWith('wet')?.82:.04,cloudStrength:world.bodyId.startsWith('wet')?.28:.01},cellSizeM:32});return deriveProductDepthProfile({world,place:placeGrammar})};
const airlessDepth=depthProfileFor(airlessDepthWorld),wetDepth=depthProfileFor(wetDepthWorld),airlessRepeat=depthProfileFor(airlessDepthWorld);
assert.deepEqual(airlessRepeat,airlessDepth,'product-depth profile must be deterministic for identical governed inputs');
for(const profile of [airlessDepth,wetDepth]){assert.equal(profile.authority,'PRESENTATION_ONLY');assert.equal(profile.scientificClaimsAdded,false);assert.equal(profile.unsupported.actualWeatherInvented,false);assert.equal(profile.unsupported.calibratedAtmosphereSpectrumInvented,false);assert.equal(profile.unsupported.landformPlacementInvented,false);assert.equal(profile.unsupported.physicalObjectScaleMutated,false);assert.ok(profile.visual.fogDensityPerM>=.00008&&profile.visual.fogDensityPerM<=.00052)}
assert.ok(wetDepth.visual.fogDensityPerM>airlessDepth.visual.fogDensityPerM,'thicker governed atmosphere should produce stronger bounded aerial perspective');
assert.notEqual(wetDepth.causalFingerprint,airlessDepth.causalFingerprint);
const descriptorDistance=(left,right)=>{let changed=0;for(const key of Object.keys(left)){if(key==='palette')continue;const a=left[key],b=right[key];if(Array.isArray(a)&&Array.isArray(b)){const distance=a.reduce((sum,value,index)=>sum+Math.abs(Number(value)-Number(b[index]||0)),0)/Math.max(1,a.length);if(distance>.025)changed++}else if(String(a)!==String(b))changed++}return changed};
const depthChangedDimensions=descriptorDistance(airlessDepth.qobs,wetDepth.qobs);assert.ok(depthChangedDimensions>=6,'materially different worlds must separate across multiple non-palette QOBS dimensions, got '+depthChangedDimensions);

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r6-w0-human-sense-of-place',review,farTraversal:{centerCell:far.centerCell,depthCounts:far.depthCounts,instanceCount:far.instanceCount,windowRelativeProjection:true,stableWorldScale:true},camera:place.camera,aerialPerspective:place.aerialPerspective,budgets:place.budgets,productDepth:{airless:{fingerprint:airlessDepth.causalFingerprint,fogDensityPerM:airlessDepth.visual.fogDensityPerM},wet:{fingerprint:wetDepth.causalFingerprint,fogDensityPerM:wetDepth.visual.fogDensityPerM},changedNonPaletteDimensions:depthChangedDimensions},authority:place.authority},null,2));
