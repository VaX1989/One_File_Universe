(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.deep3dRenderPackets,R=O.renderWebGL2Resources;
if(!P)throw new Error('OFU.deep3dRenderPackets required before Deep3D WebGL2 backend');
const VERSION='ofu-deep3d-webgl2-backend-2',AUTHORITY='PRESENTATION_ONLY',BACKEND='DEEP3D_WEBGL2_V2X13';
const FAMILY_PRIMITIVE=Object.freeze({MESH:'TRIANGLES',POINT_BATCH:'POINTS',CURVE:'LINES'});
const DOMAINS=Object.freeze(['MACRO','SYSTEM','PLANET','TERRAIN','WATER','VEGETATION','ORGANISM','STRUCTURE','MATTER']);
const finite=(v,l)=>{const n=Number(v);if(!Number.isFinite(n))throw new TypeError(l+' must be finite');return n};
const integer=(v,l,min,max)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)throw new TypeError(l+' out of bounds');return n};
const vec=(v,n,l)=>{if((!Array.isArray(v)&&!ArrayBuffer.isView(v))||v.length!==n)throw new TypeError(l+' must contain '+n+' values');return Array.from(v,(x,i)=>finite(x,l+'['+i+']'))};
const text=(v,l)=>{const s=String(v??'').trim();if(!s)throw new TypeError(l+' required');return s};
function selectionId(value){if(value==null)return null;if(typeof value==='string')return value;if(typeof value==='object'){for(const key of ['selectionToken','entityId','id','token'])if(value[key]!=null)return String(value[key])}throw new TypeError('semanticSelection must expose a stable identity token')}
function expandLineStripPositions(positions){if(positions.length<6)return positions.slice();const out=[];for(let i=0;i<=positions.length-6;i+=3)out.push(positions[i],positions[i+1],positions[i+2],positions[i+3],positions[i+4],positions[i+5]);return out}
function compileDraw(packet){
 const primitive=FAMILY_PRIMITIVE[packet.family];if(!primitive)throw new Error('Deep3D WebGL2 family not implemented: '+packet.family);
 if(packet.spatialAddress.frameId==null)throw new Error('packet spatial frame required');
 const g=packet.geometry||{},domain=String(g.domain||'').toUpperCase();if(!DOMAINS.includes(domain))throw new Error('unsupported or missing Deep3D render domain '+domain);
 if(g.coordinateSpace!=='CAMERA_RELATIVE_FLOAT32')throw new Error('Deep3D WebGL2 requires CAMERA_RELATIVE_FLOAT32 geometry');
 if(!Array.isArray(g.positions)||g.positions.length<3||g.positions.length%3)throw new Error('Deep3D geometry positions required');
 const sourcePositions=g.positions.map((v,i)=>Math.fround(finite(v,'positions['+i+']'))),curveTopology=packet.family==='CURVE'?String(g.curveTopology||'LINE_STRIP'):null;
 if(packet.family==='CURVE'&&!['LINE_STRIP','SEGMENTS'].includes(curveTopology))throw new Error('unsupported Deep3D curve topology '+curveTopology);
 const positions=packet.family==='CURVE'&&curveTopology==='LINE_STRIP'?expandLineStripPositions(sourcePositions):sourcePositions,lit=g.lit===true;
 if(packet.family==='CURVE'&&lit)throw new Error('lit Deep3D curves are not supported by the strict WebGL2 adapter');
 let normals=null;if(lit){if(!Array.isArray(g.normals)||g.normals.length!==sourcePositions.length)throw new Error('lit Deep3D mesh normals required');normals=g.normals.map((v,i)=>Math.fround(finite(v,'normals['+i+']')))}
 let indices=null;if(g.indices!=null){if(packet.family==='CURVE')throw new Error('indexed Deep3D curves are not supported by the strict WebGL2 adapter');if(!Array.isArray(g.indices))throw new Error('Deep3D indices must be an array');indices=g.indices.map((v,i)=>integer(v,'indices['+i+']',0,positions.length/3-1))}
 const m=packet.material||{};
 return Object.freeze({id:packet.packetId,domain,primitive,positions:Object.freeze(positions),normals:normals&&Object.freeze(normals),indices:indices&&Object.freeze(indices),lit,sourceVertexCount:sourcePositions.length/3,drawVertexCount:positions.length/3,curveTopology,material:Object.freeze({baseColor:vec(m.baseColor||[0.5,0.5,0.5],3,'material.baseColor'),emissive:vec(m.emissive||[0,0,0],3,'material.emissive'),roughness:finite(m.roughness??0.65,'material.roughness'),metallic:finite(m.metallic??0,'material.metallic'),opacity:finite(m.opacity??1,'material.opacity'),pointSize:finite(m.pointSize??2,'material.pointSize')}),lod:Object.freeze({level:integer(g.lodLevel??0,'geometry.lodLevel',0,32),transition:finite(g.lodTransition??0,'geometry.lodTransition')})});
}
function compileScene(sceneInput,frameInput){
 const scene=P.createScene(sceneInput);if(!frameInput||typeof frameInput!=='object')throw new TypeError('external frame input required');
 const camera=frameInput.camera;if(!camera||typeof camera!=='object')throw new TypeError('external camera required');if(text(camera.frameId||scene.frameId,'camera.frameId')!==scene.frameId)throw new Error('Deep3D scene/camera frame mismatch');
 const width=integer(frameInput.viewport?.width,'viewport.width',1,32768),height=integer(frameInput.viewport?.height,'viewport.height',1,32768);
 for(const packet of scene.packets)if(packet.spatialAddress.frameId!==scene.frameId)throw new Error('Deep3D packet/scene frame mismatch: '+packet.packetId);
 const draws=scene.packets.map(compileDraw);
 return Object.freeze({frameId:text(frameInput.frameId||('deep3d:'+scene.frameId),'frameId'),sceneId:text(frameInput.sceneId||scene.fingerprint,'sceneId'),selectionId:selectionId(scene.semanticSelection),semanticSignature:scene.fingerprint,viewport:Object.freeze({width,height}),camera:Object.freeze({viewProjection:vec(camera.viewProjection,16,'camera.viewProjection'),position:vec(camera.position,3,'camera.position')}),clearColor:vec(frameInput.clearColor||[0,0,0,1],4,'clearColor'),aaMode:String(frameInput.aaMode||'FXAA'),fog:frameInput.fog===true,lighting:frameInput.lighting||{},shadow:frameInput.shadow||null,volumetric:frameInput.volumetric||null,draws:Object.freeze(draws),deep3d:Object.freeze({sceneFingerprint:scene.fingerprint,sceneContract:scene.contract,packetCount:scene.packets.length,cameraPolicyId:scene.cameraPolicyId,authority:AUTHORITY,semanticDeterminism:true,pixelIdentityClaim:false,curveCompilation:'LINE_STRIP_TO_SEGMENT_PAIRS'})});
}
function createBackend(gl,{canvas=null,frameConsumer=null,consumerOptions={}}={}){
 const consumer=frameConsumer||(R&&typeof R.createFrameConsumer==='function'?R.createFrameConsumer(gl,{canvas,...consumerOptions}):null);if(!consumer||typeof consumer.render!=='function')throw new Error('V2X-13 WebGL2 frame consumer required');
 let renderCount=0,lastWitness=null;
 function render(scene,frame){const compiled=compileScene(scene,frame),underlying=consumer.render(compiled);renderCount++;lastWitness=Object.freeze({version:VERSION,authority:AUTHORITY,backend:BACKEND,sceneFingerprint:compiled.deep3d.sceneFingerprint,packetCount:compiled.deep3d.packetCount,semanticSignature:compiled.semanticSignature,pixelIdentityClaim:false,primaryRendererAuthority:false,cameraAuthority:'EXTERNAL_READ_ONLY',sceneCompositionAuthority:'EXTERNAL_READ_ONLY',v2x13:underlying});return lastWitness}
 function replayLastFrame(){if(typeof consumer.replayLastFrame!=='function')throw new Error('V2X-13 replay unavailable');const underlying=consumer.replayLastFrame();return Object.freeze({version:VERSION,authority:AUTHORITY,backend:BACKEND,replay:true,v2x13:underlying,lastSemanticWitness:lastWitness})}
 function snapshot(){return Object.freeze({version:VERSION,authority:AUTHORITY,backend:BACKEND,renderCount,lastWitness,primaryRendererAuthority:false,cameraAuthority:'EXTERNAL_READ_ONLY',resourceLifecycle:'V2X13_DELEGATED',v2x13:typeof consumer.snapshot==='function'?consumer.snapshot():null})}
 const delegate=name=>(...args)=>{if(typeof consumer[name]!=='function')throw new Error('V2X-13 '+name+' unavailable');return consumer[name](...args)};
 return Object.freeze({VERSION,AUTHORITY,BACKEND,render,replayLastFrame,snapshot,contextLost:delegate('contextLost'),contextRestored:delegate('contextRestored'),dispose:delegate('dispose')});
}
O.deep3dWebGL2Backend=Object.freeze({VERSION,AUTHORITY,BACKEND,DOMAINS,FAMILY_PRIMITIVE,expandLineStripPositions,compileDraw,compileScene,createBackend});
})(typeof globalThis!=='undefined'?globalThis:this);
