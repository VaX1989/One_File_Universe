import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const calls={deep:0,base:0,orbit:0,stellar:0,illumination:0,geography:0,terrain:0,surface:0,local:0,matter:0,micro:0,camera:0,activated:[],points:[],objects:[]};
function gradient(){return {addColorStop(){}}}
function context(){return {clearRect(){},createRadialGradient:gradient,createLinearGradient:gradient,fillRect(){},beginPath(){},closePath(){},arc(){},ellipse(){},moveTo(){},lineTo(){},stroke(){},fill(){},strokeRect(){},setLineDash(){},fillText(){},save(){},restore(){},set font(v){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set textAlign(v){}}}
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
const point=Object.freeze({planetIdentity:'planet-a',locationIdentity:'loc-a',latMicroDeg:12000000,lonMicroDeg:24000000});
const planetology=Object.freeze({planetIdentity:'planet-a',bulkPriorClass:'TERRESTRIAL',hydrosphere:{waterAreaPpm:420000,iceFractionPpm:120000},surfaceProcesses:{tectonicActivityPpm:510000,erosionPotentialPpm:330000,impactActivityPpm:90000},interior:{volcanismPpm:280000},climate:{aridityPpm:260000},authority:'MODEL_DERIVED_SIMULATION'});
const exactSource=Object.freeze({contract:'ofu-v1-micro-source-1',sourceEntityId:'material-source-a'});
const surfaceFrame=Object.freeze({status:'READY',authority:'PRESENTATION_ONLY',projection:{bounds:[-.2,.2,-.18,.18]},summary:{patches:9,polygons:256,coastlines:4,rivers:3},truncated:{patches:0,polygons:0,coastlines:0,rivers:0}});
const O={
 v2x05DeepPlanetProvider:Object.freeze({query(p,context){calls.deep++;assert.equal(context,'SURFACE_PROMPT08_CONTEXT');return {supported:true,status:'PRESENT',modelDigest:'deep-test-digest',authority:'MODEL_DERIVED_SIMULATION',provenance:{modelId:'v2x05.model.deep-planet'},fidelity:{uncertainty:'Heuristic scenario depth only'},payload:{v2x06GeographyAdapter:{safeInputs:{tectonicActivityPpm:123000,volcanicActivityPpm:456000},withheldInputs:[{field:'waterAreaPpm'}]}}}}}),
 v1LivingRenderer:Object.freeze({VERSION:'base',create(){return baseRenderer}}),
 v2x02LivingCameraComposition:Object.freeze({orientationAngles(){return {yaw:.2,pitch:-.1}}}),
 v2x04Orbit3D:Object.freeze({VERSION:'v2x04-orbit',resolveHierarchy(bodies){calls.orbit++;assert.equal(bodies[0].id,'planet-a');assert.equal(bodies[0].parentId,null);return {currentOrbitalPhaseAuthority:'UNKNOWN_NOT_CANONICAL',resourceUsage:{vertices:4},nodes:[{id:'planet-a',anchor3d:[20,2,4],orbit:{vertices:[[12,0,0],[0,10,3],[-12,0,0],[12,0,0]]}}]};}}),
 v2x04StellarAppearance:Object.freeze({describeSystem(stars){calls.stellar++;assert.equal(stars[0].facts.effectiveTemperatureK,'5772');return {stars:[{canonicalEntityId:'star-a',renderCue:{discRadiusPx:8,glowRadiusPx:20,glowIntensity:.8,srgb:[255,230,190]}}]};}}),
 v2x04MultiStarIllumination:Object.freeze({buildIllumination(){calls.illumination++;return {dominantStarCanonicalEntityId:'star-a'}}}),
 v2x06SurfaceAddress:Object.freeze({locate(planetId,lat,lon,level){return {planetIdentity:planetId,locationIdentity:'loc:'+lat+':'+lon,latMicroDeg:lat,lonMicroDeg:lon,level,unit:[0,1,0]}}}),
 v2x06Geography:Object.freeze({createModel(input){calls.geography++;assert.equal(input.planetIdentity,'planet-a');assert.equal(input.waterAreaPpm,420000);assert.equal(input.tectonicActivityPpm,510000);return {planetIdentity:'planet-a',noSolidSurface:false,sample(){return {reliefCuePpm:250000,surfaceClass:'SOLID',materialFamily:'ROCK_REGOLITH_PRESENTATION',authority:'MODEL_DERIVED_SIMULATION'}}};}}),
 v2x06Hydrology:Object.freeze({createHydrology(){return {sample(){return {}}}}}),
 v2x06HierarchicalTerrain:Object.freeze({createProvider(){return {materializeAdaptive(args){calls.terrain++;assert.equal(args.anchorAddress.planetIdentity,'planet-a');assert.ok([2,5,7].includes(args.level));return {status:'READY',planetIdentity:'planet-a',anchorAddress:args.anchorAddress,patches:[],resources:{vertices:256}}},snapshotCache(){return {entries:2,estimatedBytes:8192}},pickSurfaceUnit(){return {planetIdentity:'planet-a',latMicroDeg:13000000,lonMicroDeg:25000000}}}}}),
 v2x06LivingSurfaceRenderer:Object.freeze({VERSION:'v2x06-surface',buildFrame(){return surfaceFrame},renderCanvas2D(){calls.surface++;return {drawCalls:264}}}),
 v2x07LocalExperienceProvider:Object.freeze({VERSION:'v2x07-local',createProvider({groundProvider,embodimentProviders}){calls.local++;const ground=groundProvider.sampleGround({xM:2,yM:4});assert.equal(ground.physicalElevationCanonical,false);const pack=embodimentProviders[0].materializeLocal({camera:{headingRad:.2}});assert.equal(pack.objects.length,1,'settlement must remain a modeled/pickable local object');assert.equal(pack.objects[0].entityId,'settlement-a');assert.equal(pack.objects[0].canonicalPositionClaim,false);assert.equal(pack.decorations.length,1,'aggregate organism must remain non-persistent presentation');return {materialize(){return {resources:{objects:2,terrainSamples:221,pickTargets:1,groundSampleCalls:347},terrain:{supported:true},renderFrame:{resources:{primitives:240}}}},render(){return {primitives:240}},pick(){return {hit:true,pickKey:'entity:settlement-a'}}}}}),
 v2x12MatterContinuity:Object.freeze({journey(source){calls.matter++;assert.equal(source,exactSource);return {contract:'ofu-v2x12-matter-continuity-journey-1'}}}),
 v2x12MicroscopicPresentation:Object.freeze({PROVIDER_ID:'v2x12.presentation',present(journey,{regime}){calls.micro++;assert.equal(journey.contract,'ofu-v2x12-matter-continuity-journey-1');return {providerId:'v2x12.presentation',authority:'PRESENTATION_ONLY',sourceEntityId:'material-source-a',nodes:[{id:'c1',kind:'MATERIAL_COMPONENT',componentId:'rock',position:{x:.3,y:.4}},{id:'c2',kind:'UNRESOLVED_MATERIAL_REMAINDER',position:{x:.7,y:.6}}],nodeCount:2,nodeAvailableCount:2,relations:[],relationCount:0,relationAvailableCount:0,fidelity:{classification:'MODEL_DERIVED'},regime};}}),
 waveIVScaleRuntime:Object.freeze({snapshot(){return {anchors:{system:100}}}}),
 v1WorldContext:Object.freeze({location(planetIdentity,latMicroDeg,lonMicroDeg){return {planetIdentity,locationIdentity:'picked',latMicroDeg,lonMicroDeg}}}),
 v1LivingProduct:Object.freeze({runtime:Object.freeze({query(id,args){assert.equal(id,'v1.query.material-source');assert.equal(args.objectId,'material-source-a');return exactSource}})})
};
const sandbox={OFU:O,Object,Array,String,Number,Math,Set,Map,Error,TypeError,console};sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../../src/rendering/v2x-convergence/living-domain-composition.js',import.meta.url),'utf8'),sandbox,{filename:'living-domain-composition.js'});
assert.equal(sandbox.OFU.v1LivingRenderer.__v2xDomainComposed,true);
const renderer=sandbox.OFU.v1LivingRenderer.create(canvas,glCanvas,{onActivate:n=>calls.activated.push(n),onPoint:p=>calls.points.push(p),onObject:id=>calls.objects.push(id)});
await renderer.render({stage:'SYSTEM',semanticScale:'system',continuousDistanceRadii:100,rows:[star,planet],system:{canonicalId:'system-a'}});
let state=renderer.state();
assert.equal(state.v2xDomainComposed,true);assert.equal(state.domainComposition.owner,'V2X-04');assert.equal(state.domainComposition.provider,'v2x04-orbit');assert.equal(state.domainComposition.phaseAuthority,'UNKNOWN_NOT_CANONICAL');
assert.equal(calls.base,1);assert.equal(calls.orbit,1);assert.equal(calls.stellar,1);assert.equal(calls.illumination,1);assert.ok(calls.camera>0);
const projected=sandbox.OFU.v2xLivingDomainComposition.project([20,2,4],900,620,{yaw:.2,pitch:-.1,zoom:1});assert.equal(renderer.activateAt(projected.x,projected.y),true);assert.equal(calls.activated[0],planet,'V2X system pick must preserve actual Living node identity');
const world={planetIdentity:'planet-a',planetology,civilization:{epoch:0}};
await renderer.render({stage:'REGIONAL_SURFACE',semanticScale:'regional_surface',continuousDistanceRadii:.2,point,world,rows:[]});state=renderer.state();assert.equal(state.domainComposition.owner,'V2X-06');assert.equal(state.domainComposition.provider,'v2x06-surface');assert.equal(state.domainComposition.canonicalElevationClaim,false);assert.equal(state.domainComposition.rivers,3);assert.equal(calls.geography,1);assert.equal(calls.terrain,1);assert.equal(calls.surface,1);assert.equal(calls.deep,1);assert.equal(state.domainComposition.deepPlanetModelDigest,'deep-test-digest');assert.equal(state.domainComposition.deepPlanetUncertainty,'Heuristic scenario depth only');assert.equal(renderer.activateAt(450,310),true);assert.equal(calls.points[0].planetIdentity,'planet-a');
const local={objects:[{kind:'SETTLEMENT',entityId:'settlement-a',authority:'MODEL_DERIVED_SIMULATION'},{kind:'ORGANISM',entityId:'population-a',authority:'MODEL_DERIVED_SIMULATION'}]};
await renderer.render({stage:'HUMAN',semanticScale:'human',continuousDistanceRadii:.00001,point,world,local,rows:[]});state=renderer.state();assert.equal(state.domainComposition.owner,'V2X-07');assert.equal(state.domainComposition.metricGeodesyClaim,false);assert.equal(state.domainComposition.aggregateOrganismsPersistentPersons,false);assert.equal(calls.local,1);assert.equal(renderer.activateAt(100,100),true);assert.equal(calls.objects[0],'settlement-a');
await renderer.render({stage:'MATERIAL',semanticScale:'human',continuousDistanceRadii:1,point,selectedObjectId:'material-source-a',world,rows:[]});state=renderer.state();assert.equal(state.domainComposition.owner,'V2X-12');assert.equal(state.domainComposition.provider,'v2x12.presentation');assert.equal(state.domainComposition.sourceEntityId,'material-source-a');assert.equal(state.domainComposition.semanticMagnification,true);assert.equal(state.domainComposition.geometricZoomClaim,false);assert.equal(calls.matter,1);assert.equal(calls.micro,1);assert.equal(calls.base,4);
const unknownSurface=O.v2xLivingDomainComposition.surfaceModelInput({world:{planetIdentity:'planet-a',planetology:{planetIdentity:'planet-a',hydrosphere:{waterAreaPpm:null,iceFractionPpm:null},climate:{aridityPpm:null}}}});
for(const field of ['waterAreaPpm','iceAreaPpm','erosionActivityPpm','aridityPpm','impactActivityPpm'])assert.equal(unknownSurface[field],null);
assert.equal(unknownSurface.tectonicActivityPpm,123000,'explicit deep-planet model supplies the tectonic cue');
assert.equal(unknownSurface.volcanicActivityPpm,456000,'explicit deep-planet model supplies the volcanic cue');
assert.equal(unknownSurface.deepPlanetContext.provenance.modelId,'v2x05.model.deep-planet');
console.log(JSON.stringify({schema:'ofu-v2x-living-domain-composition-witness-2',status:'PASS',systemOwner:'V2X-04',surfaceOwner:'V2X-06',humanOwner:'V2X-07',microOwner:'V2X-12',baseCompatibilityRenders:calls.base,exactMicroSource:true,aggregateOrganismsRemainNonPersistent:true,canonicalMutation:false}));
