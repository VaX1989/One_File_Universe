(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-focus-continuity-1',MAX_ATTACH_ATTEMPTS=120;
const defer=typeof root.queueMicrotask==='function'?root.queueMicrotask.bind(root):fn=>Promise.resolve().then(fn);
const state={version:VERSION,ready:false,authority:'PRESENTATION_ONLY',attachAttempts:0,focusEvents:0,panelMutations:0,restores:0,misses:0,intentClears:0,lastRestore:null};
let panel=null,observer=null,remembered=null,mutationGeneration=0,restoreScheduled=false;
const focusableSelector='button,input,select,textarea,summary,[tabindex]';
function normalizeText(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,160)}
function scopeFor(node){
 const scope=node?.closest?.('#living-search-results,[id]');
 return scope&&scope!==panel&&scope.id?scope.id:'living-panel';
}
function semanticKey(node){
 if(!panel||!node||!panel.contains(node))return null;
 const action=node.dataset?.livingAction,entity=node.dataset?.livingEntity;
 if(entity)return Object.freeze({kind:'entity',value:String(entity),scope:scopeFor(node)});
 if(action)return Object.freeze({kind:'action',value:String(action),scope:scopeFor(node)});
 if(node.id)return Object.freeze({kind:'id',value:String(node.id),scope:'living-panel'});
 if(node.tagName==='SUMMARY'){const value=normalizeText(node.textContent);if(value)return Object.freeze({kind:'summary',value,scope:scopeFor(node)})}
 return null;
}
function sameKey(a,b){return !!a&&!!b&&a.kind===b.kind&&a.value===b.value&&a.scope===b.scope}
function candidatesFor(key){return panel?[...panel.querySelectorAll(focusableSelector)].filter(node=>sameKey(semanticKey(node),key)):[]}
function descriptor(node){
 const key=semanticKey(node);if(!key)return null;
 const candidates=candidatesFor(key),ordinal=Math.max(0,candidates.indexOf(node));
 return Object.freeze({key,ordinal});
}
function available(node){
 if(!node||!node.isConnected||node.disabled)return false;
 for(let current=node;current&&current!==document.body;current=current.parentElement){if(current.hidden||current.inert||current.getAttribute?.('aria-hidden')==='true')return false}
 return true;
}
function findRemembered(){
 if(!remembered||!panel)return null;const candidates=candidatesFor(remembered.key);return candidates[remembered.ordinal]||candidates[0]||null;
}
function clearRemembered(reason){remembered=null;state.lastRestore=reason||null}
function restore(){
 restoreScheduled=false;if(!panel||!remembered)return false;
 const active=document.activeElement;if(panel.contains(active)){const current=descriptor(active);if(current)remembered=current;return false}
 const target=findRemembered();if(!available(target)){state.misses++;clearRemembered('target-unavailable');return false}
 try{target.focus({preventScroll:true})}catch{return false}
 if(document.activeElement===target){state.restores++;state.lastRestore=remembered.key.kind+':'+remembered.key.scope;return true}
 state.misses++;clearRemembered('focus-rejected');return false;
}
function scheduleRestore(){if(restoreScheduled||!remembered)return;restoreScheduled=true;defer(restore)}
function onFocusIn(event){
 if(!panel)return;
 if(panel.contains(event.target)){
  const next=descriptor(event.target);if(next){remembered=next;state.focusEvents++}
  return;
 }
 const observedGeneration=mutationGeneration;
 defer(()=>{if(observedGeneration===mutationGeneration&&panel&&!panel.contains(document.activeElement)){clearRemembered('intentional-focus-exit');state.intentClears++}});
}
function onPointerDown(event){if(panel&&!panel.contains(event.target)){clearRemembered('pointer-exit');state.intentClears++}}
function attach(){
 state.attachAttempts++;panel=document.getElementById('living-panel');if(!panel)return false;
 document.addEventListener('focusin',onFocusIn,true);document.addEventListener('pointerdown',onPointerDown,true);
 observer=new MutationObserver(()=>{mutationGeneration++;state.panelMutations++;scheduleRestore()});observer.observe(panel,{childList:true,subtree:true});
 state.ready=true;root.__OFU_LIVING_FOCUS_CONTINUITY__=api;return true;
}
function snapshot(){return Object.freeze({...state,remembered:remembered?Object.freeze({kind:remembered.key.kind,scope:remembered.key.scope,ordinal:remembered.ordinal}):null,mutationGeneration})}
const api=Object.freeze({VERSION,state,snapshot,semanticKey,restore});O.v11LivingFocusContinuity=api;
let attempts=0;function boot(){if(state.ready)return;if(attach())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
