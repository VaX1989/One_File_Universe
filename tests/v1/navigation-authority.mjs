import assert from 'node:assert/strict';
import {load} from './integration/runtime-helper.mjs';

const {O,runtime}=load(),R=O.waveIVScaleRuntime;
const expected={UNIVERSE:'galaxy',GALAXY:'galaxy',REGION:'galactic_region',NEIGHBORHOOD:'stellar_neighborhood',SYSTEM:'system',ORBIT:'orbit',APPROACH:'approach',GLOBAL_SURFACE:'global_surface',REGIONAL_SURFACE:'regional_surface',LOCAL_SURFACE:'local_surface',HUMAN:'human'};
let cases=0;

assert.equal(runtime.snapshot().stage,'UNIVERSE');
assert.equal(runtime.snapshot().semanticScale,'galaxy');
assert.equal(runtime.snapshot().navigationCoherent,true);
assert.equal(R.snapshot().navigationAuthorityBound,true);cases+=4;

for(const stage of runtime.NAVIGATION_STAGES){
  const availability=runtime.navigationAvailability(stage);assert.equal(availability.enabled,true,stage+': '+availability.reason);
  runtime.scale(stage);const living=runtime.snapshot(),scale=R.snapshot();
  assert.equal(living.stage,stage);assert.equal(living.semanticScale,expected[stage]);assert.equal(scale.semanticScale,expected[stage]);assert.equal(living.navigationCoherent,true);cases+=5;
}

const bodyId=runtime.snapshot().body.canonicalId;
runtime.scale('GALAXY');runtime.scale('ORBIT');
assert.equal(runtime.snapshot().body.canonicalId,bodyId,'outward/inward scale travel must retain the canonical descendant');cases++;

R.requestStage('galactic_region',{source:'external-selector'});
assert.equal(runtime.snapshot().stage,'REGION');assert.equal(R.snapshot().semanticScale,'galactic_region');cases+=2;
runtime.travelBy(1,{source:'wheel-in'});assert.equal(runtime.snapshot().stage,'NEIGHBORHOOD');
runtime.travelBy(-1,{source:'wheel-out'});assert.equal(runtime.snapshot().stage,'REGION');cases+=2;
const before=runtime.snapshot().navigationCoordinate;
runtime.setNavigationCoordinate(before+1.25,{source:'pinch-in'});assert(runtime.snapshot().navigationCoordinate>before);assert.notEqual(runtime.snapshot().stage,'REGION');cases+=2;

for(const scale of R.LADDER){R.requestStage(scale,{source:'external-programmatic'});const living=runtime.snapshot();assert.equal(living.semanticScale,scale);assert.equal(living.stage,runtime.STAGE_FOR_SCALE[scale]);cases+=2;}
runtime.scale('SYSTEM');const alternative=runtime.seedGraph.children.planets[1]||runtime.seedGraph.children.planets[0],alternativeId=O.pxProduct.captured(alternative.canonicalKey).selection.target.entityId;R.setSelection(alternative.canonicalKey,{planetId:alternativeId,presentationStatus:'SUPPORTED',source:'external-selection'});R.requestStage('orbit',{source:'external-selection-travel'});assert.equal(runtime.snapshot().body.canonicalId,alternativeId);assert.equal(R.snapshot().selectedCanonicalTarget.planetId,alternativeId);cases+=2;
runtime.enterKey(runtime.seed);runtime.scale('HUMAN');const objectId=runtime.snapshot().rows.find(row=>!['SETTLEMENT','RUIN'].includes(row.kind)).entityId;runtime.selectObject(objectId);runtime.scale('UNIVERSE');runtime.scale('HUMAN');assert.equal(runtime.snapshot().selectedObjectId,objectId,'local selection must survive an outward traversal and deterministic revisit');cases++;

console.log(JSON.stringify({status:'PASS',suite:'v1-navigation-authority',cases,boot:'UNIVERSE',selectorPath:runtime.NAVIGATION_STAGES,externalAuthorityBound:R.snapshot().navigationAuthorityBound}));
