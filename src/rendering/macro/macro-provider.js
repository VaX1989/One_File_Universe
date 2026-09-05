(function(root){
'use strict';
const O=root.OFU=root.OFU||{},M=O.waveIVMacroScene,I=O.waveIVMacroInteraction;
if(!M||!I)throw new Error('Wave IV macro provider requires scene and interaction contracts');
const VERSION='ofu-wave-iv-macro-provider-1',CONTRACT='ofu-macro-scene-provider-runtime-1';
const state={cache:new Map(),last:null,builds:0,hits:0};
function token(scale,key,slot){return [String(scale).toUpperCase(),...M.SYSTEM_FIELDS.map(k=>String(BigInt(key[k]))),String(slot??key.orbitSlot??0)].join('|')}
function remember(key,value){if(state.cache.has(key))state.cache.delete(key);state.cache.set(key,value);while(state.cache.size>M.CAPS.cachedScenes)state.cache.delete(state.cache.keys().next().value)}
function getScene({scale,ctx,canonicalKey,selectedOrbitSlot=canonicalKey?.orbitSlot??0n,options={}}){
  if(!ctx||!canonicalKey)throw new Error('macro provider requires canonical context and selection key');const s=String(scale||'').toUpperCase(),cacheKey=token(s,canonicalKey,selectedOrbitSlot);let scene=state.cache.get(cacheKey);
  if(scene){state.hits++;state.cache.delete(cacheKey);state.cache.set(cacheKey,scene)}else{scene=M.buildScene(s,ctx,canonicalKey,{...options,selectedOrbitSlot});M.validateScene(scene);remember(cacheKey,scene);state.builds++}
  state.last=Object.freeze({scale:s,cacheKey,scene});return scene;
}
function sceneFromNormalizedSnapshot({scale,ctx,snapshot,options={}}){
  if(!snapshot?.ready||!snapshot.system?.canonicalKey)throw new Error('ready normalized explorer scene snapshot required');const selected=snapshot.selection?.canonicalKey||snapshot.system.canonicalKey,slot=snapshot.selection?.orbitIndex??selected.orbitSlot??0;return getScene({scale,ctx,canonicalKey:selected,selectedOrbitSlot:slot,options});
}
function layoutScene(scene,viewport){return I.layout(scene,viewport)}
function pointerActivate(scene,viewport,x,y,handlers){return I.pointerActivation(layoutScene(scene,viewport),x,y,handlers)}
function keyboardMove(scene,viewport,currentObjectId,key){return I.keyboardTarget(layoutScene(scene,viewport),currentObjectId,key)}
function keyboardActivate(scene,viewport,currentObjectId,key,handlers){return I.keyActivation(layoutScene(scene,viewport),currentObjectId,key,handlers)}
function transition(from,to,{reducedMotion=false}={}){return M.transitionDescriptor(from,to,{reducedMotion})}
function snapshot(){return Object.freeze({version:VERSION,contract:CONTRACT,cacheSize:state.cache.size,cacheCap:M.CAPS.cachedScenes,builds:state.builds,cacheHits:state.hits,lastScale:state.last?.scale||null,selectionAuthority:'EXTERNAL',scaleAuthority:'EXTERNAL',shadowSelection:false,shadowScaleRuntime:false})}
function clearCache(){state.cache.clear();state.last=null}
O.waveIVMacroProvider=Object.freeze({VERSION,CONTRACT,getScene,sceneFromNormalizedSnapshot,layoutScene,pointerActivate,keyboardMove,keyboardActivate,transition,snapshot,clearCache});
})(typeof globalThis!=='undefined'?globalThis:this);
