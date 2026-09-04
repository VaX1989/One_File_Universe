(function(root){
'use strict';
const O=root.OFU=root.OFU||{},R=O.waveIVScaleRuntime;if(!R)return;
const SURFACE=new Set(['global_surface','regional_surface','local_surface','human']);
const CAMERA_POLICY=Object.freeze({
 global_surface:Object.freeze({pitchRad:-1.2566370614359172,label:'GLOBAL_SURFACE'}),
 regional_surface:Object.freeze({pitchRad:-.9075712110370514,label:'REGIONAL_SURFACE'}),
 local_surface:Object.freeze({pitchRad:-.7330382858376184,label:'LOCAL_SURFACE'}),
 human:Object.freeze({pitchRad:-.41887902047863906,label:'HUMAN'})
});
const state={version:'ofu-wave-iv-surface-scale-sync-2',updates:0,unsupportedRedirects:0,cameraPolicyApplications:0};
function applyCameraPolicy(P,scale){const policy=CAMERA_POLICY[scale],snap=P?.surfaceProvider?.snapshot?.()?.camera;if(!policy||!snap)return false;const delta=policy.pitchRad-Number(snap.pitchRad||0);if(Math.abs(delta)>1e-5){P.surfaceIntent?.({type:'LOOK_PITCH',amount:delta/.035});state.cameraPolicyApplications++}return true}
function sync(s=R.snapshot()){
 const P=root.__OFU_PLANET_PREVIEW__,scale=s.semanticScale;if(!SURFACE.has(scale))return;
 if(!P||P.targetStatus!=='SUPPORTED'||!P.surfaceProvider?.capability?.available){state.unsupportedRedirects++;O.productUI?.announce?.('Local solid-surface traversal is not available for this world.');root.queueMicrotask?.(()=>{if(SURFACE.has(R.snapshot().semanticScale))R.requestStage('approach',{source:'unsupported-surface-gate'})});return}
 if(P.surfaceMode!=='LOCAL'){const entered=P.enterSurface?.(String(scale).toUpperCase());if(entered?.ready===false){state.unsupportedRedirects++;root.queueMicrotask?.(()=>R.requestStage('approach',{source:'unsupported-surface-gate'}));return}}
 P.setSurfaceBand?.(String(scale).toUpperCase());applyCameraPolicy(P,scale);state.updates++;
}
R.on('scaleChanged',e=>sync(e.snapshot));R.on('selectionChanged',()=>sync());
O.waveIVSurfaceScaleSync=Object.freeze({VERSION:state.version,CAMERA_POLICY,state,sync,snapshot:()=>Object.freeze({...state})});
})(typeof globalThis!=='undefined'?globalThis:this);
