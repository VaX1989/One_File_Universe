import assert from 'node:assert/strict';
import { createHumanPlaceGrammar, classifyHumanDepth } from '../../src/experiments/spatial-continuum/human-place-grammar.js';
import { createLocalEnvironmentGenerator } from '../../src/experiments/spatial-continuum/local-environment.js';

const terrain=(east,north)=>Math.sin(east/17)*2+Math.cos(north/23)*3+Math.sin((east+north)/7)*.35;
const families=['ANGULAR_ICE_FRACTURE_FIELD','UPLIFTED_LITHIC_FIELD','ROUNDED_SEDIMENT_FIELD','ANGULAR_EJECTA_FIELD','MIXED_LITHIC_FIELD'];
const make=(family,seed='r6-c-human-review')=>createLocalEnvironmentGenerator({seed,terrainSampler:terrain,regime:{localGrammar:family,localDensity:1,atmosphereStrength:.55,cloudStrength:.2},cellSizeM:32,activeRadius:2,maxInstances:120});

const review=Object.fromEntries(families.map(family=>{
  const generator=make(family),origin=generator.windowFor(0,0),repeat=make(family).windowFor(0,0),moved=generator.windowFor(40,0),state=generator.snapshot();
  assert.deepEqual(repeat,origin,`${family} must be deterministic at the same address`);
  assert.ok(origin.bounded&&state.bounded,`${family} must keep bounded residency`);
  assert.equal(origin.activeCellCount,25);
  assert.ok(origin.instanceCount<=120);
  assert.ok(origin.landmarkCount<=origin.placeGrammar.budgets.maxLandmarksPerWindow);
  assert.ok(origin.depthCounts.NEAR>0&&origin.depthCounts.MID>0,`${family} must establish near/mid composition`);
  assert.ok(origin.placeGrammar.horizon.samples.length===24&&origin.placeGrammar.horizon.reliefM>=0);
  const shared=new Map(origin.instances.map(item=>[item.id,item]));const retained=moved.instances.find(item=>shared.has(item.id));assert.ok(retained,`${family} must retain overlap across adjacent windows`);assert.equal(retained.id,shared.get(retained.id).id);
  return[family,{process:origin.process,skyline:origin.placeGrammar.skyline,landmarks:origin.landmarkCount,depthCounts:origin.depthCounts,horizonReliefM:Number(origin.placeGrammar.horizon.reliefM.toFixed(4)),voidRadiusM:Number(origin.placeGrammar.voidRadiusM.toFixed(3)),corridorWidthM:Number(origin.placeGrammar.corridorWidthM.toFixed(3)),meanHeight:Number((origin.instances.reduce((sum,item)=>sum+item.scale[1],0)/origin.instances.length).toFixed(5)),samplePositions:origin.instances.slice(0,8).map(item=>[Number(item.eastM.toFixed(2)),Number(item.northM.toFixed(2)),item.depthBand,item.landmark])}];
}));

assert.equal(new Set(Object.values(review).map(item=>item.process)).size,families.length,'anti-sameness requires distinct placement processes');
assert.equal(new Set(Object.values(review).map(item=>item.skyline)).size,families.length,'anti-sameness requires distinct silhouette hierarchy');
assert.ok(new Set(Object.values(review).map(item=>JSON.stringify(item.samplePositions))).size>=4,'world families must differ spatially, not by palette alone');
assert.ok(review.ANGULAR_ICE_FRACTURE_FIELD.meanHeight>review.ROUNDED_SEDIMENT_FIELD.meanHeight*2.2,'ice and sediment destinations must differ materially in scale distribution');

const place=createHumanPlaceGrammar({seed:'camera-calibration',terrainSampler:terrain,regime:{localGrammar:'MIXED_LITHIC_FIELD'},cellSizeM:32});assert.ok(place.camera.eyeHeightM>=1.55&&place.camera.eyeHeightM<=1.8);assert.equal(classifyHumanDepth({eastM:4,northM:3,cellSizeM:32}),'NEAR');assert.equal(classifyHumanDepth({eastM:70,northM:0,cellSizeM:32}),'MID');assert.equal(classifyHumanDepth({eastM:160,northM:0,cellSizeM:32}),'FAR');

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r6-w0-human-sense-of-place',contract:'OFU_R6_W0_LANE_PACKET::R6-C',review,camera:place.camera,aerialPerspective:place.aerialPerspective,budgets:place.budgets,authority:place.authority},null,2));
