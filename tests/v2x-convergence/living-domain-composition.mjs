import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const calls={base:0,orbit:0,stellar:0,illumination:0,matter:0,micro:0,camera:0,activated:[]};
function gradient(){return {addColorStop(){}}}
function context(){return {clearRect(){},createRadialGradient:gradient,fillRect(){},beginPath(){},arc(){},ellipse(){},moveTo(){},lineTo(){},stroke(){},fill(){},strokeRect(){},setLineDash(){},fillText(){},set font(v){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set textAlign(v){}}}
const ctx=context();
const canvas={width:900,height:620,clientWidth:900,clientHeight:620,getContext(){return ctx},getBoundingClientRect(){return {width:900,height:620}}};
const glCanvas={};
const camera={snapshot(){calls.camera++;return {pose:{orientation:[0,0,0,1]}}}};
const baseRenderer={
 cameraAuthority:camera,
 async render(){calls.base++},
 activateAt(){return false},keyboard(){return false},rotate(){},setTravelDistance(){},resize(){},sampleColor(){},dispose(){},
 state(){return {version:'base-renderer',cameraAuthority:'v1x-camera',metrics:{drawnObjects:2}}}
};
const planet={kind:'planet',canonicalId:'planet-a',metadata:{facts:{baselineSemiMajorAxisMicroAu:'1000000',baselineEccentricityPpm:'10000',baselineInclinationMilliDeg:'1200'}}};
const star={kind:'star',canonicalId:'star-a',metadata:{facts:{baselineTemperatureK:'5772',baselineRadiusMilliSolar:'1000',baselineLuminosityMilliSolar:'1000'}}};
const exactSource=Object.freeze({contract:'ofu-v1-micro-source-1',sourceEntityId:'material-source-a'});
const O={
 v1LivingRenderer:Object.freeze({VERSION:'base',create(){return baseRenderer}}),
 v2x02LivingCameraComposition:Object.freeze({orientationAngles(){return {yaw:.2,pitch:-.1}}}),
 v2x04Orbit3D:Object.freeze({
  VERSION:'v2x04-orbit',
  resolveHierarchy(bodies){
   calls.orbit++;assert.equal(bodies[0].id,'planet-a');assert.equal(bodies[0].parentId,null);
   return {currentOrbitalPhaseAuthority:'UNKNOWN_NOT_CANONICAL',resourceUsage:{vertices:4},nodes:[{id:'planet-a',anchor3d:[20,2,4],orbit:{vertices:[[12,0,0],[0,10,3],[-12,0,0],[12,0,0]]}}]};
  }
 }),
 v2x04StellarAppearance:Object.freeze({
  describeSystem(stars){calls.stellar++;assert.equal(stars[0].facts.effectiveTemperatureK,'5772');return {stars:[{canonicalEntityId:'star-a',renderCue:{discRadiusPx:8,glowRadiusPx:20,glowIntensity:.8,srgb:[255,230,190]}}]};}
 }),
 v2x04MultiStarIllumination:Object.freeze({buildIllumination(){calls.illumination++;return {dominantStarCanonicalEntityId:'star-a'}}}),
 v2x12MatterContinuity:Object.freeze({journey(source){calls.matter++;assert.equal(source,exactSource);return {contract:'ofu-v2x12-matter-continuity-journey-1'}}}),
 v2x12MicroscopicPresentation:Object.freeze({
  PROVIDER_ID:'v2x12.presentation',
  present(journey,{regime}){
   calls.micro++;assert.equal(journey.contract,'ofu-v2x12-matter-continuity-journey-1');
   return {providerId:'v2x12.presentation',authority:'PRESENTATION_ONLY',sourceEntityId:'material-source-a',nodes:[{id:'c1',kind:'MATERIAL_COMPONENT',componentId:'rock',position:{x:.3,y:.4}},{id:'c2',kind:'UNRESOLVED_MATERIAL_REMAINDER',position:{x:.7,y:.6}}],nodeCount:2,nodeAvailableCount:2,relations:[],relationCount:0,relationAvailableCount:0,fidelity:{classification:'MODEL_DERIVED'},regime};
  }
 }),
 waveIVScaleRuntime:Object.freeze({snapshot(){return {anchors:{system:100}}}}),
 v1LivingProduct:Object.freeze({runtime:Object.freeze({query(id,args){assert.equal(id,'v1.query.material-source');assert.equal(args.objectId,'material-source-a');return exactSource}})})
};
const sandbox={OFU:O,Object,Array,String,Number,Math,Set,Error,TypeError,console};sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../../src/rendering/v2x-convergence/living-domain-composition.js',import.meta.url),'utf8'),sandbox,{filename:'living-domain-composition.js'});
assert.equal(sandbox.OFU.v1LivingRenderer.__v2xDomainComposed,true);
const renderer=sandbox.OFU.v1LivingRenderer.create(canvas,glCanvas,{onActivate:n=>calls.activated.push(n)});
await renderer.render({stage:'SYSTEM',semanticScale:'system',continuousDistanceRadii:100,rows:[star,planet],system:{canonicalId:'system-a'}});
let state=renderer.state();
assert.equal(state.v2xDomainComposed,true);assert.equal(state.domainComposition.owner,'V2X-04');assert.equal(state.domainComposition.provider,'v2x04-orbit');assert.equal(state.domainComposition.phaseAuthority,'UNKNOWN_NOT_CANONICAL');
assert.equal(calls.base,1);assert.equal(calls.orbit,1);assert.equal(calls.stellar,1);assert.equal(calls.illumination,1);assert.ok(calls.camera>0);
const p=sandbox.OFU.v2xLivingDomainComposition.project([20,2,4],900,620,{yaw:.2,pitch:-.1,zoom:1});
assert.equal(renderer.activateAt(p.x,p.y),true);assert.equal(calls.activated[0],planet,'V2X system pick must preserve actual Living node identity');
await renderer.render({stage:'MATERIAL',semanticScale:'human',continuousDistanceRadii:1,point:{latMicroDeg:0,lonMicroDeg:0},selectedObjectId:'material-source-a',world:{civilization:{epoch:0}},rows:[]});
state=renderer.state();assert.equal(state.domainComposition.owner,'V2X-12');assert.equal(state.domainComposition.provider,'v2x12.presentation');assert.equal(state.domainComposition.sourceEntityId,'material-source-a');assert.equal(state.domainComposition.semanticMagnification,true);assert.equal(state.domainComposition.geometricZoomClaim,false);assert.equal(calls.matter,1);assert.equal(calls.micro,1);assert.equal(calls.base,2);
console.log(JSON.stringify({schema:'ofu-v2x-living-domain-composition-witness-1',status:'PASS',systemOwner:'V2X-04',microOwner:'V2X-12',baseCompatibilityRenders:calls.base,exactMicroSource:true,canonicalMutation:false}));
