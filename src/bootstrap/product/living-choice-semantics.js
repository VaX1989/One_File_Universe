(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-choice-semantics-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,syncs:0,navigationPressedRemoved:0,selectionPressedApplied:0,lastStage:null,localChoiceCount:0,navigationChoiceCount:0};
let panel=null,runtime=null,observer=null,pending=false;
function entityId(button){return String(button?.dataset?.livingEntity||'')}
function schedule(){if(pending)return;pending=true;root.queueMicrotask?root.queueMicrotask(sync):Promise.resolve().then(sync)}
function sync(snapshot=runtime?.snapshot?.()){
 pending=false;if(!panel||!snapshot)return false;
 const localIds=new Set((snapshot.local?.objects||[]).map(item=>String(item.entityId)));
 let local=0,navigation=0;
 for(const button of panel.querySelectorAll('.living-choice[data-living-entity]')){
  const id=entityId(button),isLocal=localIds.has(id);
  if(isLocal){
   local++;const value=String(id===String(snapshot.selectedObjectId||''));
   if(button.getAttribute('aria-pressed')!==value){button.setAttribute('aria-pressed',value);state.selectionPressedApplied++}
  }else{
   navigation++;if(button.hasAttribute('aria-pressed')){button.removeAttribute('aria-pressed');state.navigationPressedRemoved++}
  }
 }
 state.syncs++;state.lastStage=snapshot.stage||null;state.localChoiceCount=local;state.navigationChoiceCount=navigation;return true;
}
function attach(){
 state.attachAttempts++;panel=document.getElementById('living-panel');runtime=O.v1LivingProduct?.runtime;if(!panel||!runtime){if(state.attachAttempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(attach,50);return false}
 observer=new MutationObserver(records=>{if(records.some(record=>record.type==='childList'))schedule()});observer.observe(panel,{childList:true,subtree:true});runtime.onChange?.(snapshot=>sync(snapshot));sync(runtime.snapshot());state.ready=true;root.__OFU_LIVING_CHOICE_SEMANTICS__=api;return true;
}
function snapshot(){return Object.freeze({...state})}
const api=Object.freeze({VERSION,AUTHORITY,state,snapshot,sync});O.v11LivingChoiceSemantics=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else root.setTimeout(attach,0);
})(typeof globalThis!=='undefined'?globalThis:this);
