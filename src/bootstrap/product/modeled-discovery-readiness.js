(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const MAX_ATTEMPTS=600;
const state={version:'ofu-modeled-discovery-readiness-1',status:'waiting',attempts:0,maxAttempts:MAX_ATTEMPTS};
let scheduled=false;
function providerReady(){
 try{return !!O.pxProduct?.inspect&&O.pxProduct?.snapshot?.().registry?.bindingsSealed===true}catch{return false}
}
function schedule(){
 if(scheduled||state.status!=='waiting')return;
 scheduled=true;
 (root.requestAnimationFrame||((fn)=>root.setTimeout(fn,16)))(tick);
}
function tick(){
 scheduled=false;
 if(state.status!=='waiting')return;
 state.attempts++;
 if(providerReady()&&O.v09ExplorerBeta?.resetModeledDiscovery){
  O.v09ExplorerBeta.resetModeledDiscovery();
  state.status='ready';
  return;
 }
 if(state.attempts>=MAX_ATTEMPTS){state.status='timeout';return}
 schedule();
}
const api=Object.freeze({version:state.version,state,providerReady,refresh(){if(state.status==='timeout')state.status='waiting';schedule();return state.status}});
O.v11ModeledDiscoveryReadiness=api;
root.__OFU_MODELED_DISCOVERY_READINESS__=api;
schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
