(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const state={version:'ofu-v09-visual-universe-bridge-1',ready:false,lastSystemToken:null,lastSelectionToken:null,lastStage:null,lastError:null,updates:0};
function apply(snapshot){
 const V=O.v09VisualUniverse,P=root.__OFU_PLANET_PREVIEW__;
 if(!V||!snapshot?.ready||!snapshot.system?.canonicalKey||!P?.ctx)return false;
 try{
  if(snapshot.system.token!==state.lastSystemToken){V.setSystemScene(V.systemSceneFromCanonical(P.ctx,snapshot.system.canonicalKey,{selectedOrbitSlot:snapshot.selection?.orbitIndex||0}));state.lastSystemToken=snapshot.system.token;state.lastSelectionToken=null}
  if(snapshot.selection&&snapshot.selection.token!==state.lastSelectionToken){V.setSelectedBody(snapshot.selection.orbitIndex);state.lastSelectionToken=snapshot.selection.token}
  if(snapshot.stage&&snapshot.stage!==state.lastStage){V.setStage(snapshot.stage,{durationMs:700});state.lastStage=snapshot.stage}
  state.ready=true;state.lastError=null;state.updates++;return true;
 }catch(error){state.lastError=String(error?.message||error);return false}
}
function init(){
 const seam=O.v09ExplorerScene,V=O.v09VisualUniverse;if(!seam||!V)return false;
 if(V.state?.syncTimer){root.clearInterval?.(V.state.syncTimer);V.state.syncTimer=null}
 seam.register({update:apply});seam.publish();return state.ready;
}
O.v09VisualUniverseBridge=Object.freeze({VERSION:state.version,state,apply,init,snapshot:()=>Object.freeze({...state})});
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof globalThis!=='undefined'?globalThis:this);
