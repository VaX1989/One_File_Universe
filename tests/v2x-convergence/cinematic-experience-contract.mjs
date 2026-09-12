import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('config/components/v2-cinematic-experience.json','utf8'));
assert.equal(manifest.schema,'ofu-components-1');
assert.equal(manifest.components.length,5);
for(const component of manifest.components)assert.equal(component.authority,'PRESENTATION_ONLY',component.id+' must remain presentation-only');
const macroComponent=manifest.components.find(component=>component.id==='v2.cinematic.macro-director');
assert(macroComponent,'macro director must ship');
assert(macroComponent.dependencies.includes('v2x02.camera.living-binding'),'macro director must compose over authoritative Living camera');
assert(macroComponent.dependencies.includes('v1.product.living-universe'),'post-boot macro director must depend on the actual Living product');
assert(macroComponent.dependencies.includes('v1x02.spatial-universe.runtime'));
assert(macroComponent.dependencies.includes('v1x04.system.provider'));

const experience=fs.readFileSync('src/cinematic/v2/experience.js','utf8');
const depth=fs.readFileSync('src/cinematic/v2/depth-compositor.js','utf8');
const macro=fs.readFileSync('src/cinematic/v2/macro-director.js','utf8');
const css=fs.readFileSync('src/cinematic/v2/experience.css','utf8')+fs.readFileSync('src/cinematic/v2/depth-compositor.css','utf8');
new vm.Script(experience,{filename:'experience.js'});
new vm.Script(depth,{filename:'depth-compositor.js'});
new vm.Script(macro,{filename:'macro-director.js'});
for(const forbidden of ['runtime.scale(','runtime.back(','runtime.deeper(','runtime.activate(','enterSystem(','enterBody(','selectObject(','history.push(','fetch(','XMLHttpRequest','WebSocket']){
 assert.equal(experience.includes(forbidden),false,'cinematic observer must not own semantic/network operation '+forbidden);
 assert.equal(depth.includes(forbidden),false,'depth compositor must not own semantic/network operation '+forbidden);
 assert.equal(macro.includes(forbidden),false,'macro director must not own semantic/network operation '+forbidden);
}
assert.match(experience,/prefers-reduced-motion: reduce/);
assert.match(experience,/semanticMutation:false/);
assert.match(experience,/cameraAuthority:false/);
assert.match(experience,/navigationAuthority:false/);
assert.match(experience,/MAX_BOOT_ATTEMPTS=240/);
assert.match(experience,/dispose/);
assert.match(experience,/MATERIAL:'MICRO'/);
assert.match(experience,/MICROSTRUCTURE:'MICRO'/);
assert.match(depth,/MAX_PIXELS=1500000/);
assert.match(depth,/maxStars:42/);
assert.match(depth,/maxSurfacePixels:MAX_PIXELS/);
assert.match(depth,/continuousAnimation:false/);
assert.match(depth,/networkResources:0/);
assert.match(depth,/MAX_BOOT_ATTEMPTS=240/);
assert.match(depth,/dispose/);
assert.match(macro,/renderer\.cameraAuthority\?\.snapshot/);
assert.match(macro,/v2x02LivingCameraComposition\.orientationAngles/);
assert.match(macro,/semanticMutation:false/);
assert.match(macro,/cameraAuthority:false/);
assert.match(macro,/navigationAuthority:false/);
assert.match(macro,/networkResources:0/);
assert.match(macro,/normalPrimaryPath:false/);
assert.match(macro,/PRESENTATION_UNDERLAY_SUPERSEDED_BY_DEEP3D_PRIMARY/);
assert.match(macro,/MAX_BOOT_ATTEMPTS=240/);
assert.match(macro,/unsubscribe\?\.\(\)/);
assert.match(macro,/cancelAnimationFrame/);
assert.match(macro,/labelSlots/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/forced-colors:active/);
assert.match(css,/safe-area-inset-bottom/);
assert.match(css,/#living-view:focus-visible/);
assert.match(css,/#v2-cinematic-macro/);
assert.match(css,/#v2-cinematic-macro[^}]*pointer-events:none/s);
assert.match(css,/#living-canvas-wrap[^}]*z-index:2/s);
assert.match(css,/#v2-cinematic-macro[^}]*z-index:1/s);
assert.match(macro,/setAttribute\('aria-hidden','true'\)/);

async function proveMacroCameraAuthority(){
 let currentCameraSnapshot=Object.freeze({revision:1,pose:Object.freeze({orientation:Object.freeze([0,0,0,1])})});
 let currentAngles={yaw:Math.PI/2,pitch:0};
 let currentSnapshot={stage:'UNIVERSE',semanticScale:'galaxy',continuousDistanceRadii:1,node:{entityId:'root'},rows:[{kind:'galaxy',canonicalId:'galaxy-1',entityId:'galaxy-1',metadata:{modelProfile:{morphology:'SPIRAL'}}}]};
 let cameraSnapshotReads=0,orientationCalls=0,adaptedCamera=null,rafCalls=0,runtimeChange=null,resizeListener=null;
 const runtimeTarget={
  snapshot(){return currentSnapshot;},
  onChange(callback){runtimeChange=callback;return ()=>{};}
 };
 const runtime=new Proxy(runtimeTarget,{get(target,property){if(property in target)return target[property];throw new Error('macro attempted non-observer Living runtime access: '+String(property));}});
 const authorityTarget={snapshot(){cameraSnapshotReads++;return currentCameraSnapshot;}};
 const cameraAuthority=new Proxy(authorityTarget,{get(target,property){if(property==='snapshot')return target.snapshot;throw new Error('macro attempted camera authority operation other than snapshot: '+String(property));}});
 const gradient=()=>({addColorStop(){}});
 const context2d={createRadialGradient:gradient,fillRect(){},beginPath(){},arc(){},fill(){},save(){},translate(){},rotate(){},scale(){},ellipse(){},stroke(){},restore(){},fillText(){},clearRect(){},setTransform(){},lineTo(){},moveTo(){}};
 const canvas={hidden:true,dataset:{},width:0,height:0,setAttribute(){},getContext(){return context2d;},remove(){},addEventListener(){throw new Error('macro canvas must not become an input authority');}};
 let stageWidth=1000,stageHeight=600;
 const stage={getBoundingClientRect(){return {width:stageWidth,height:stageHeight};},append(node){assert.equal(node,canvas);},addEventListener(){}};
 const document={readyState:'complete',getElementById(id){assert.equal(id,'living-stage');return stage;},createElement(tag){assert.equal(tag,'canvas');return canvas;},addEventListener(){}};
 const OFU={
  v1LivingProduct:{renderer:{cameraAuthority},runtime,ready(){return null;}},
  v1x02SpatialUniverse:{profile(){return {scaleUnits:10};},representation({cameraFrame}){assert.equal(cameraFrame.id,'spatial-frame');return {objects:[{canonicalId:'galaxy-1',view:{visible:true,x:0,y:0,depth:10}}]};}},
  v1x04SystemProvider:{render(){throw new Error('system renderer should not run for universe witness');}},
  v2x02LivingCameraComposition:{orientationAngles(authority){orientationCalls++;assert.equal(authority,currentCameraSnapshot);return currentAngles;}},
  waveIVScaleRuntime:{snapshot(){return {anchors:{galaxy:1}};}},
  v1LivingRenderer:{adaptPresentationCamera(camera){adaptedCamera=camera;return {spatialFrame:{id:'spatial-frame'},systemFrame:{id:'system-frame'}};}}
 };
 const sandbox={OFU,document,devicePixelRatio:3,Promise,setTimeout,clearTimeout,console,addEventListener(type,callback){if(type==='resize')resizeListener=callback;},requestAnimationFrame(callback){rafCalls++;setImmediate(callback);return rafCalls;}};
 sandbox.globalThis=sandbox;
 vm.createContext(sandbox);
 vm.runInContext(macro,sandbox,{filename:'macro-director.js'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cameraSnapshotReads,1,'macro must read the authoritative Living camera snapshot for its presentation camera');
 assert.equal(orientationCalls,1,'macro must transform that exact snapshot with the V2X-02 camera-composition API');
 assert(adaptedCamera,'macro must derive a presentation camera');
 assert(Math.abs(adaptedCamera.position[0]-20.5)<1e-9,'derived camera x must reflect authoritative yaw');
 assert(Math.abs(adaptedCamera.position[1])<1e-9,'derived camera y must reflect authoritative pitch');
 assert(Math.abs(adaptedCamera.position[2])<1e-9,'derived camera z must reflect authoritative yaw');
 assert(canvas.width*canvas.height<=1800000,'macro framebuffer must remain under its pixel ceiling');
 const state=sandbox.OFU.v2CinematicMacroDirector.snapshot();
 assert.equal(state.authority,'PRESENTATION_ONLY');
 assert.equal(state.cameraAuthority,false);
 assert.equal(state.navigationAuthority,false);
 assert.equal(state.semanticMutation,false);
 assert.equal(state.networkResources,0);
 assert.equal(state.normalPrimaryPath,false);
 assert.equal(state.layerRole,'PRESENTATION_UNDERLAY_SUPERSEDED_BY_DEEP3D_PRIMARY');
 assert.equal(state.active,true);
 assert.equal(canvas.hidden,false);
 assert.equal(rafCalls,1,'boot should schedule one coalesced presentation redraw');
 assert.equal(typeof runtimeChange,'function','macro must observe authoritative Living state changes');

 currentCameraSnapshot=Object.freeze({revision:2,pose:Object.freeze({orientation:Object.freeze([0,0,0,1])})});
 currentAngles={yaw:0,pitch:.2};
 runtimeChange();runtimeChange();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(rafCalls,2,'multiple same-turn Living changes should coalesce into one additional redraw');
 assert.equal(cameraSnapshotReads,2,'camera presentation must re-read live authority after a change');
 assert.equal(orientationCalls,2,'camera presentation must re-transform the new authoritative snapshot');
 assert(Math.abs(adaptedCamera.position[0])<1e-9,'updated camera x must follow the new authoritative yaw');
 assert(adaptedCamera.position[1]>4,'updated camera y must follow the new authoritative pitch');
 assert(adaptedCamera.position[2]>19,'updated camera z must follow the new authoritative yaw/pitch');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(rafCalls,2,'macro must not create a perpetual requestAnimationFrame loop');

 assert.equal(typeof resizeListener,'function','macro must observe resize without owning semantic state');
 stageWidth=2200;stageHeight=1400;resizeListener();
 await new Promise(resolve=>setImmediate(resolve));
 assert(canvas.width*canvas.height<=1800000,'resized macro framebuffer must remain under its pixel ceiling');

 currentSnapshot={...currentSnapshot,stage:'ORBIT',semanticScale:'orbit'};
 runtimeChange();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvas.hidden,true,'macro layer must deactivate when Living leaves macro stages');
 assert.equal(sandbox.OFU.v2CinematicMacroDirector.snapshot().active,false);
 const readsAtExit=cameraSnapshotReads;

 currentSnapshot={stage:'UNIVERSE',semanticScale:'galaxy',continuousDistanceRadii:1,node:{entityId:'root-2'},rows:[{kind:'galaxy',canonicalId:'galaxy-2',entityId:'galaxy-2',metadata:{modelProfile:{morphology:'SPIRAL'}}}]};
 currentCameraSnapshot=Object.freeze({revision:3,pose:Object.freeze({orientation:Object.freeze([0,0,0,1])})});
 currentAngles={yaw:-.35,pitch:-.1};
 runtimeChange();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvas.hidden,false,'macro layer must reactivate on reverse entry');
 assert.equal(sandbox.OFU.v2CinematicMacroDirector.snapshot().active,true);
 assert.equal(cameraSnapshotReads,readsAtExit+1,'reverse entry must derive from the current authoritative camera, not cached visual state');
}
await proveMacroCameraAuthority();

const shaderSource=fs.readFileSync('src/shaders/v1/world-shaders.js','utf8');
const sandbox={OFU:{}};vm.createContext(sandbox);vm.runInContext(shaderSource,sandbox,{filename:'world-shaders.js'});
assert.equal(sandbox.OFU.v1WorldShaders.authority,'PRESENTATION_ONLY');
assert.equal(sandbox.OFU.v1WorldShaders.claims.proceduralSurfaceIsCanonical,false);
assert.equal(sandbox.OFU.v1WorldShaders.claims.atmosphereIsMeasuredOpticalDepth,false);
assert.equal(sandbox.OFU.v1WorldShaders.claims.specularCueIsMeasuredBRDF,false);
assert.match(sandbox.OFU.v1WorldShaders.globeFragment,/fresnel/);
assert.match(sandbox.OFU.v1WorldShaders.globeFragment,/oceanLike/);

console.log('V2 cinematic experience contract: PASS');
