import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ROOT=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
for(const file of [
 'src/rendering/local/spatial-embodiment.js',
 'src/rendering/local/ground-presence.js',
 'src/rendering/local/local-renderer.js',
 'src/rendering/local/local-experience-provider.js',
 'src/product/exploration/local/local-traversal.js'
])vm.runInThisContext(fs.readFileSync(ROOT+'/'+file,'utf8'),{filename:file});
const O=globalThis.OFU,E=O.v2x07LocalSpatialEmbodiment,G=O.v2x07GroundPresence,R=O.v2x07LocalRenderer,P=O.v2x07LocalExperienceProvider,T=O.v2x07LocalTraversal;
const camera={planetId:'planet:test',anchorToken:'planet:test/nav-anchor/0,0,1000000000',currentBand:'HUMAN',absolutePresentationPositionM:[0,0,1.7],headingRad:0,pitchRad:-.12,selectionToken:'planet:test',surfaceTarget:{face:'PZ',u:0,v:0},referenceFrameRef:{id:'surface-local'}};
const flatGround={id:'ground.test',authority:'MODEL_DERIVED_SIMULATION',sampleGround({xM,yM}){if(xM>26&&xM<28)return{supported:false,reason:'UNSUPPORTED_CELL'};const ridge=yM>10&&yM<14?5:0;const water=xM<-20;return{supported:true,heightM:ridge,surfaceClass:water?'WATER_MODELLED':'SOLID_MODELLED',materialFamily:water?'WATER':'REGOLITH',sourceAuthority:'MODEL_DERIVED_SIMULATION',physicalElevationCanonical:false,waterEdgeCanonical:false}}};
const life={id:'life.local',authority:'MODEL_DERIVED_SIMULATION',materializeLocal(){return{objects:[{entityId:'organism:1',kind:'ORGANISM',positionM:[3,8,0],radiusM:.45,heightM:1.2,sourceAuthority:'MODEL_DERIVED_SIMULATION'}],decorations:[{kind:'VEGETATION_ANALOG',presentationSeed:'cluster-a',positionM:[-4,6,0],radiusM:.35,heightM:1.7}]}}};
const civ={id:'civ.local',authority:'MODEL_DERIVED_SIMULATION',materializeLocal(){return{objects:[{entityId:'structure:1',kind:'STRUCTURE',positionM:[-6,18,0],radiusM:2,heightM:5,sourceAuthority:'MODEL_DERIVED_SIMULATION'},{entityId:'ruin:1',kind:'RUIN',positionM:[8,24,0],radiusM:1.5,heightM:3,sourceAuthority:'MODEL_DERIVED_SIMULATION'}]}}};
const far={id:'far.decor',authority:'PRESENTATION_ONLY',materializeLocal(){const decorations=[];for(let i=0;i<600;i++)decorations.push({kind:'ROCK_LIKE_PRESENTATION_FORM',presentationSeed:'rock-'+i,positionM:[(i%30)-15,35+Math.floor(i/30),0],radiusM:.2,heightM:.4});return{decorations}}};
const a=E.materialize({camera,providers:[life,civ,far],profileName:'compact'}),b=E.materialize({camera,providers:[life,civ,far],profileName:'compact'});
assert.deepEqual(a.objects.map(x=>x.id),b.objects.map(x=>x.id));
assert.equal(a.objects.filter(x=>x.persistentEntity).length,3);
assert.ok(a.objects.filter(x=>!x.persistentEntity).every(x=>x.pickKey.startsWith('presentation:')));
assert.ok(a.resources.decorativeInstances<=E.PROFILES.compact.maxDecorativeInstances);
assert.ok(a.resources.pickTargets<=E.PROFILES.compact.maxPickTargets);
assert.equal(a.claims.decorativeInstancesArePersistentEntities,false);
assert.throws(()=>E.materialize({camera,providers:[{id:'bad',materializeLocal(){return{objects:[{kind:'ORGANISM',positionM:[0,1,0]}]}}}]}),/entityId/);
assert.equal(E.resolveInterior(civ,{entityId:'structure:1'}).supported,false);
const terrain=G.sampleGrid({camera,groundProvider:flatGround,profileName:'compact'});
assert.ok(terrain.supported);
assert.ok(terrain.resources.samples<=G.PROFILE.compact.maxSamples);
assert.ok(terrain.resources.unsupportedSamples>0);
assert.ok(terrain.unsupportedHoles.length>0);
assert.equal(terrain.claims.unknownGroundFilled,false);
assert.equal(terrain.vertexSamples.length,terrain.vertices.length);
const cues=G.scaleCues(camera);assert.deepEqual(cues.markers.map(x=>x.distanceM),[1,5,10,25,50]);
const grounded=G.proposeGroundedPose({camera,groundProvider:flatGround});assert.equal(grounded.supported,true);assert.equal(grounded.claims.cameraMutated,false);
const frame=R.buildFrame({camera,terrain,embodiment:a,scaleCues:cues,width:960,height:600,profileName:'compact'});
assert.ok(frame.resources.depthCells<=frame.resources.maxDepthCells);
assert.ok(frame.primitives.some(x=>x.kind==='GROUND_TRIANGLE'));
assert.ok(frame.primitives.filter(x=>x.kind==='GROUND_TRIANGLE').every(x=>x.points.flat().every(Number.isFinite)));
assert.ok(frame.pickTargets.every(x=>x.pickKey.startsWith('entity:')));
const clipView=R.view({positionM:[0,0,0],headingRad:0,pitchRad:0},{width:960,height:600,nearM:.05});
const clipped=R.clipTriangleNear(clipView,[-1,.01,0],[1,1,0],[0,1,1]);
assert.ok(clipped.length>=1);
assert.ok(clipped.flat().every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.depthM)));
const ridgeEmbodiment={objects:[{id:'behind-ridge',pickKey:'entity:behind-ridge',persistentEntity:true,kind:'ORGANISM',positionM:[0,25,0],radiusM:.3,heightM:1,sourceAuthority:'MODEL_DERIVED_SIMULATION',claims:{}}]};
const ridgeTerrain=G.sampleGrid({camera,groundProvider:flatGround,profileName:'minimal'});
const ridgeFrame=R.buildFrame({camera,terrain:ridgeTerrain,occlusionTerrain:ridgeTerrain,embodiment:ridgeEmbodiment,width:960,height:600,profileName:'minimal'});
assert.deepEqual(ridgeFrame.occludedObjects,['entity:behind-ridge']);
assert.equal(ridgeFrame.pickTargets.length,0);
const provider=P.createProvider({groundProvider:flatGround,embodimentProviders:[life,civ,far],profileName:'compact',width:960,height:600});
const local=provider.materialize(camera);assert.equal(local.claims.centralRendererMutated,false);assert.equal(local.claims.terrainTruthOwned,false);assert.ok(local.resources.objects<=E.PROFILES.compact.maxModeledObjects+E.PROFILES.compact.maxDecorativeInstances);
const centerTarget=local.renderFrame.pickTargets[0];if(centerTarget){const hit=provider.pick(centerTarget.screenCenter[0],centerTarget.screenCenter[1]);assert.equal(hit.hit,true);assert.equal(hit.pickKey,centerTarget.pickKey)}
provider.setProfile('minimal');const smaller=provider.materialize(camera);assert.ok(smaller.resources.objects<=E.PROFILES.minimal.maxModeledObjects+E.PROFILES.minimal.maxDecorativeInstances);const stableLarge=new Set(local.embodiment.objects.filter(x=>x.persistentEntity).map(x=>x.pickKey)),stableSmall=new Set(smaller.embodiment.objects.filter(x=>x.persistentEntity).map(x=>x.pickKey));assert.deepEqual(stableSmall,stableLarge);assert.deepEqual(new Set(smaller.renderFrame.pickTargets.map(x=>x.pickKey)),new Set(local.renderFrame.pickTargets.map(x=>x.pickKey)));
const walk=T.movementRequest(camera,{forwardM:3,rightM:1,mode:'WALK',groundProvider:flatGround});assert.equal(walk.accepted,true);assert.equal(walk.intent.kind,'translate-local');assert.ok(Math.abs(walk.targetPositionM[2]-1.7)<1e-9);
const stepGround={sampleGround({yM}){return{supported:true,heightM:yM>.5?1:0,authority:'MODEL_DERIVED_SIMULATION'}}};
const blockedStep=T.movementRequest(camera,{forwardM:1,mode:'WALK',groundProvider:stepGround});assert.equal(blockedStep.accepted,false);assert.equal(blockedStep.reason,'WALK_STEP_EXCEEDS_BOUND');assert.ok(Math.abs(blockedStep.stepDeltaM)>T.LIMITS.maxStepHeightM);
const unsupportedWalk=T.movementRequest({...camera,absolutePresentationPositionM:[26.5,0,1.7]},{rightM:1,mode:'WALK',groundProvider:flatGround});assert.equal(unsupportedWalk.accepted,false);assert.equal(unsupportedWalk.claims.unknownGroundFilled,false);
const moved={...camera,absolutePresentationPositionM:walk.targetPositionM};const continuity=T.continuityWitness(camera,moved);assert.equal(continuity.preserved,true);assert.equal(continuity.claims.canonicalGeodeticEqualityProven,false);
const reverse=T.reverseTraversalRequest(moved,{targetBand:'REGIONAL_SURFACE'});assert.equal(reverse.targetBand,'REGIONAL_SURFACE');assert.equal(reverse.claims.requiresExistingAuthorityAdmission,true);
const reduced=T.touchGesture({dx:80,dy:40,kind:'LOOK',reducedMotion:true});assert.ok(Math.abs(reduced.intent.yawRadians)<LIMIT_SAFE());
function LIMIT_SAFE(){return .18+.000001}
const ops=[],gradient={addColorStop(...x){ops.push(['stop',...x])}},ctx={fillStyle:null,font:'',createLinearGradient(){return gradient},fillRect(...x){ops.push(['fillRect',...x])},beginPath(){ops.push(['begin'])},moveTo(...x){ops.push(['move',...x])},lineTo(...x){ops.push(['line',...x])},closePath(){ops.push(['close'])},fill(){ops.push(['fill'])},fillText(...x){ops.push(['text',...x])}};
const renderWitness=provider.render(ctx);assert.equal(renderWitness.authority,'MEASURED_RUNTIME_EVIDENCE');assert.ok(ops.length>10);assert.equal(renderWitness.claims.pixelOutputVisuallyInspected,false);assert.equal(renderWitness.claims.nearPlaneClippingApplied,true);
console.log(JSON.stringify({schema:'ofu-v2x-07-local-experience-test-2',status:'PASS',objectsCompact:a.resources,terrain:terrain.resources,frame:frame.resources,provider:provider.snapshot(),continuity,renderWitness,clippedTriangles:clipped.length,blockedStep:blocking(blockedStep)}));
function blocking(x){return{reason:x.reason,stepDeltaM:x.stepDeltaM,maxStepHeightM:x.maxStepHeightM}}
