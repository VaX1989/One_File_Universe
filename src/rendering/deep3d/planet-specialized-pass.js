(function(root){
'use strict';
const O=root.OFU=root.OFU||{},W=O.v1WorldWebGL2,A=O.deep3dPlanetAdapter;
if(!W||!A)throw new Error('Deep3D planet specialized pass dependencies missing');
const VERSION='ofu-deep3d-planet-specialized-pass-1';
function install(){
 if(O.v1WorldWebGL2?.DEEP3D_PLANET_PASS===VERSION)return O.v1WorldWebGL2;
 const original=O.v1WorldWebGL2;
 function create(canvas,options={}){
  const base=original.create(canvas,options);let lastSemantic=null,lastWitness=null,lastError=null;
  function render(worldScene){
   const scale=String(worldScene?.scale||'').toUpperCase();if(['PLANET','APPROACH'].includes(scale)){lastSemantic=A.createRenderScene(worldScene,{viewportClass:original.resourceProfile?.({maxDpr:options.maxDpr,mobile:options.mobile})?.mobile?'mobile':'desktop'});try{const result=base.render(worldScene);lastWitness=Object.freeze({contract:'ofu-deep3d-specialized-pass-witness-1',version:VERSION,status:result?.status||'UNKNOWN',backend:'V1_WORLD_WEBGL2_SPECIALIZED',sceneFingerprint:lastSemantic.fingerprint,semanticEntityId:lastSemantic.semanticSelection?.entityId||null,resourceSnapshot:base.snapshot?.()||null,delegateResult:result});lastError=null;return lastWitness}catch(error){lastError=String(error?.message||error);throw error}}
   return base.render(worldScene);
  }
  function snapshot(){const state=base.snapshot?.()||{};return Object.freeze({...state,deep3d:Object.freeze({version:VERSION,primary:Boolean(lastSemantic&&!lastError),backend:'V1_WORLD_WEBGL2_SPECIALIZED',sceneFingerprint:lastSemantic?.fingerprint||null,semanticEntityId:lastSemantic?.semanticSelection?.entityId||null,lastError,lastWitness,cameraAuthority:'EXTERNAL_READ_ONLY',scientificAuthority:false})})}
  return Object.freeze({...base,render,snapshot});
 }
 O.v1WorldWebGL2=Object.freeze({...original,create,DEEP3D_PLANET_PASS:VERSION});return O.v1WorldWebGL2;
}
O.deep3dPlanetSpecializedPass=Object.freeze({VERSION,install});install();
})(typeof globalThis!=='undefined'?globalThis:this);
