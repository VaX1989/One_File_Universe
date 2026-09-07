import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ROOT=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
for(const file of ['src/rendering/local/spatial-embodiment.js','src/rendering/local/ground-presence.js','src/rendering/local/local-renderer.js','src/rendering/local/local-experience-provider.js'])vm.runInThisContext(fs.readFileSync(ROOT+'/'+file,'utf8'),{filename:file});
const O=globalThis.OFU,P=O.v2x07LocalExperienceProvider;
const camera={planetId:'planet:matrix',anchorToken:'planet:matrix/nav-anchor/0,0,1000000000',currentBand:'HUMAN',absolutePresentationPositionM:[0,0,1.7],headingRad:0,pitchRad:-.16,selectionToken:'planet:matrix'};
const fixtures=[
 {name:'ARID',sample({xM,yM}){return{supported:true,heightM:Math.sin(xM*.03)*.3+Math.cos(yM*.02)*.2,surfaceClass:'DRY_SOLID',materialFamily:'REGOLITH',authority:'MODEL_DERIVED_SIMULATION'}},objects:[]},
 {name:'OCEAN_COAST',sample({xM}){return{supported:true,heightM:xM<0?-0.2:Math.min(2,xM*.02),surfaceClass:xM<0?'WATER_MODELLED':'COAST_SOLID',materialFamily:xM<0?'WATER':'SEDIMENT',authority:'MODEL_DERIVED_SIMULATION'}},objects:[]},
 {name:'ICY',sample({xM,yM}){return{supported:true,heightM:.4*Math.sin((xM+yM)*.02),surfaceClass:'ICE_MODELLED',materialFamily:'ICE',authority:'MODEL_DERIVED_SIMULATION'}},objects:[]},
 {name:'TEMPERATE_LIKE',sample(){return{supported:true,heightM:0,surfaceClass:'SOLID_MODELLED',materialFamily:'SOIL_ANALOG',authority:'MODEL_DERIVED_SIMULATION'}},objects:[{entityId:'organism:matrix',kind:'ORGANISM',positionM:[2,12,0],radiusM:.5,heightM:1.4}],decorations:[{kind:'VEGETATION_ANALOG',presentationSeed:'grove',positionM:[-2,8,0],radiusM:.3,heightM:2}]},
 {name:'BARREN',sample(){return{supported:true,heightM:0,surfaceClass:'BARREN_SOLID',materialFamily:'ROCK_DARK',authority:'MODEL_DERIVED_SIMULATION'}},objects:[],decorations:[{kind:'ROCK_LIKE_PRESENTATION_FORM',presentationSeed:'rock',positionM:[2,9,0],radiusM:.5,heightM:.8}]},
 {name:'SETTLEMENT_RUIN',sample(){return{supported:true,heightM:0,surfaceClass:'SOLID_MODELLED',materialFamily:'REGOLITH',authority:'MODEL_DERIVED_SIMULATION'}},objects:[{entityId:'building:matrix',kind:'BUILDING',positionM:[-4,16,0],radiusM:2,heightM:6},{entityId:'ruin:matrix',kind:'RUIN',positionM:[5,22,0],radiusM:1.5,heightM:3}]}
];
const results=[];
for(const fx of fixtures){const ground={id:'ground.'+fx.name,authority:'MODEL_DERIVED_SIMULATION',sampleGround:fx.sample};const overlay={id:'embodiment.'+fx.name,authority:'MODEL_DERIVED_SIMULATION',materializeLocal(){return{objects:fx.objects||[],decorations:fx.decorations||[]}}};const provider=P.createProvider({groundProvider:ground,embodimentProviders:[overlay],profileName:'compact',width:720,height:480});const frame=provider.materialize(camera,{context:{environmentFixture:fx.name}});assert.equal(frame.authority,'PRESENTATION_ONLY');assert.equal(frame.claims.terrainTruthOwned,false);assert.equal(frame.claims.lifeStateOwned,false);assert.equal(frame.claims.civilizationStateOwned,false);assert.ok(frame.renderFrame.primitives.length>0);assert.ok(frame.renderFrame.resources.depthCells<=frame.renderFrame.resources.maxDepthCells);assert.equal(provider.snapshot().claims.networkResources,0);results.push({name:fx.name,primitives:frame.renderFrame.primitives.length,objects:frame.embodiment.objects.length,pickTargets:frame.renderFrame.pickTargets.length,waterEdges:frame.terrain.waterEdges.length,unsupported:frame.terrain.resources.unsupportedSamples})}
const noInterior={id:'structure.no-interior',authority:'MODEL_DERIVED_SIMULATION',materializeLocal(){return{objects:[]}}};
const p=P.createProvider({groundProvider:{sampleGround(){return{supported:true,heightM:0,authority:'MODEL_DERIVED_SIMULATION'}}},embodimentProviders:[noInterior]});
const interior=p.interior(noInterior,{entityId:'structure:matrix'});assert.equal(interior.supported,false);assert.equal(interior.reason,'INTERIOR_UNSUPPORTED_BY_PROVIDER');
console.log(JSON.stringify({schema:'ofu-v2x-07-environment-matrix-test-1',status:'PASS',results,interior}));
