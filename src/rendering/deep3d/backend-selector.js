(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-deep3d-backend-selector-1',AUTHORITY='PRESENTATION_ONLY';
const BACKENDS=Object.freeze({WEBGPU:'WEBGPU',WEBGL2:'WEBGL2'});
function fail(code,message){const e=new Error(message);e.code=code;throw e}
function normalizeProtocol(value){const p=String(value||'').trim().toLowerCase();return p.endsWith(':')?p:p+':'}
function selectEnvironment({protocol='https:',secureContext=false,hasWebGPU=false,hasWebGL2=false}={}){
 const p=normalizeProtocol(protocol),file=p==='file:';
 if(file){if(!hasWebGL2)fail('DEEP3D_WEBGL2_REQUIRED','Direct-file Deep3D requires WebGL2');return Object.freeze({version:VERSION,backend:BACKENDS.WEBGL2,reason:'DIRECT_FILE_MANDATORY_WEBGL2',protocol:p,secureContext:false,fallbackBackend:null,canvasSpatialFallback:false});}
 if(secureContext===true&&hasWebGPU===true){return Object.freeze({version:VERSION,backend:BACKENDS.WEBGPU,reason:'SECURE_WEBGPU_PREFERRED',protocol:p,secureContext:true,fallbackBackend:hasWebGL2?BACKENDS.WEBGL2:null,canvasSpatialFallback:false});}
 if(hasWebGL2===true){return Object.freeze({version:VERSION,backend:BACKENDS.WEBGL2,reason:secureContext===true?'WEBGPU_UNAVAILABLE':'INSECURE_CONTEXT_WEBGPU_FORBIDDEN',protocol:p,secureContext:secureContext===true,fallbackBackend:null,canvasSpatialFallback:false});}
 fail('DEEP3D_BACKEND_UNAVAILABLE','Deep3D requires WebGL2 or secure-context WebGPU');
}
function createFallbackController(selection,{createWebGPU,createWebGL2}={}){
 if(!selection||!Object.values(BACKENDS).includes(selection.backend))throw new TypeError('valid Deep3D backend selection required');
 let active=null,backend=null,generation=0,lastReason=selection.reason;
 const buildWebGL2=reason=>{if(typeof createWebGL2!=='function')fail('DEEP3D_WEBGL2_UNAVAILABLE','WebGL2 backend factory required');active=createWebGL2();if(!active||typeof active.render!=='function')fail('DEEP3D_WEBGL2_INVALID','WebGL2 backend invalid');backend=BACKENDS.WEBGL2;generation++;lastReason=reason;return snapshot()};
 function start(){if(active)return snapshot();if(selection.backend===BACKENDS.WEBGPU){if(typeof createWebGPU!=='function'){if(selection.fallbackBackend===BACKENDS.WEBGL2)return buildWebGL2('WEBGPU_FACTORY_UNAVAILABLE');fail('DEEP3D_WEBGPU_UNAVAILABLE','WebGPU backend factory required')}try{active=createWebGPU();if(!active||typeof active.render!=='function')throw new Error('WebGPU backend invalid');backend=BACKENDS.WEBGPU;generation++;lastReason=selection.reason;return snapshot()}catch(error){active=null;if(selection.fallbackBackend===BACKENDS.WEBGL2)return buildWebGL2('WEBGPU_INITIALIZATION_FAILED');throw error}}return buildWebGL2(selection.reason)}
 function deviceLost(){if(backend!==BACKENDS.WEBGPU)return snapshot();if(active&&typeof active.deviceLost==='function')try{active.deviceLost()}catch{}if(active&&typeof active.dispose==='function')try{active.dispose()}catch{}active=null;if(selection.fallbackBackend!==BACKENDS.WEBGL2)fail('DEEP3D_DEVICE_LOST_NO_FALLBACK','WebGPU device lost without WebGL2 fallback');return buildWebGL2('WEBGPU_DEVICE_LOST')}
 function render(scene,frame){if(!active)start();return active.render(scene,frame)}
 function dispose(){if(active&&typeof active.dispose==='function')active.dispose();active=null;backend=null;return snapshot()}
 function snapshot(){return Object.freeze({version:VERSION,authority:AUTHORITY,backend,generation,reason:lastReason,selectedBackend:selection.backend,fallbackBackend:selection.fallbackBackend,canvasSpatialFallback:false,cameraAuthority:'EXTERNAL_READ_ONLY',sceneAuthority:'EXTERNAL_READ_ONLY'})}
 return Object.freeze({VERSION,AUTHORITY,start,render,deviceLost,dispose,snapshot});
}
O.deep3dBackendSelector=Object.freeze({VERSION,AUTHORITY,BACKENDS,selectEnvironment,createFallbackController});
})(typeof globalThis!=='undefined'?globalThis:this);
