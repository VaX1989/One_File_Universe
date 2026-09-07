(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-keyboard-workspace-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,inspectShortcuts:0,escapeReturns:0,lastAction:null};
let canvas=null;
function workspace(){return O.productUI?.state?.workspace||document.documentElement.dataset.workspace||'explore'}
function inDetails(){const panel=document.querySelector('.experience > .panel');return !!panel&&panel.contains(document.activeElement)}
function focusLiving(){const target=document.getElementById('living-view');if(!target)return false;target.focus({preventScroll:true});return document.activeElement===target}
function openInspect(){
 if(O.v1x10ViewportUX?.openInspect){O.v1x10ViewportUX.openInspect();return true}
 if(O.productUI?.workspace){O.productUI.workspace('inspect',{focus:true,announceChange:true});return true}
 return false;
}
function returnExplore(){
 if(!O.productUI?.workspace)return false;O.productUI.workspace('explore',{focus:false,announceChange:true});root.queueMicrotask?.(()=>focusLiving());return true;
}
function onKeydown(event){
 if(event.altKey||event.ctrlKey||event.metaKey)return;
 const living=document.getElementById('living-view');
 if(event.target===living&&String(event.key).toLowerCase()==='i'){
  event.preventDefault();event.stopImmediatePropagation();if(openInspect()){state.inspectShortcuts++;state.lastAction='inspect'}return;
 }
 if(event.key==='Escape'&&workspace()!=='explore'&&inDetails()){
  event.preventDefault();event.stopImmediatePropagation();if(returnExplore()){state.escapeReturns++;state.lastAction='escape-to-living'}
 }
}
function attach(){
 state.attachAttempts++;canvas=document.getElementById('living-view');if(!canvas||!O.v1LivingProduct?.snapshot?.().initialized||!O.v1x10ViewportUX?.snapshot?.().initialized)return false;
 canvas.setAttribute('aria-keyshortcuts','I Escape');root.addEventListener('keydown',onKeydown,true);state.ready=true;root.__OFU_LIVING_KEYBOARD_WORKSPACE__=api;return true;
}
function snapshot(){return Object.freeze({...state,workspace:workspace(),canvasFocused:document.activeElement===document.getElementById('living-view')})}
const api=Object.freeze({VERSION,AUTHORITY,state,snapshot,focusLiving});O.v11LivingKeyboardWorkspace=api;
let attempts=0;function boot(){if(state.ready)return;if(attach())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
