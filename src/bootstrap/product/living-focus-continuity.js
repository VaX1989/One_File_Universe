(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-focus-continuity-2',MAX_ATTACH_ATTEMPTS=120;
const defer=typeof root.queueMicrotask==='function'?root.queueMicrotask.bind(root):fn=>Promise.resolve().then(fn);
const state={version:VERSION,ready:false,authority:'PRESENTATION_ONLY',attachAttempts:0,focusEvents:0,chromeFocusEvents:0,panelMutations:0,chromeMutations:0,restores:0,chromeRestores:0,fallbackRestores:0,misses:0,intentClears:0,lastRestore:null};
let panel=null,rail=null,breadcrumbs=null,observers=[],remembered=null,mutationGeneration=0,restoreScheduled=false;
const focusableSelector='button,input,select,textarea,summary,[tabindex]';
function normalizeText(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,160)}
function scopeFor(node){
 const scope=node?.closest?.('#living-search-results,[id]');
 return scope&&scope!==panel&&scope.id?scope.id:'living-panel';
}
function breadcrumbScale(node){
 if(!node||node.tagName!=='BUTTON')return null;
 const text=normalizeText(node.textContent);
 if(text==='Universe')return'UNIVERSE';
 if(text.startsWith('Galaxy '))return'GALAXY';
 if(text==='Region')return'REGION';
 if(text.startsWith('System '))return'SYSTEM';
 if(text.startsWith('World '))return'ORBIT';
 return null;
}
function semanticKey(node){
 if(!node)return null;
 if(rail?.contains(node)&&node.dataset?.livingScale)return Object.freeze({surface:'rail',kind:'scale',value:String(node.dataset.livingScale),scope:'living-rail'});
 if(breadcrumbs?.contains(node)){
  const scale=breadcrumbScale(node);if(scale)return Object.freeze({surface:'breadcrumb',kind:'scale',value:scale,scope:'living-breadcrumbs'});
 }
 if(!panel||!panel.contains(node))return null;
 const action=node.dataset?.livingAction,entity=node.dataset?.livingEntity;
 if(entity)return Object.freeze({surface:'panel',kind:'entity',value:String(entity),scope:scopeFor(node)});
 if(action)return Object.freeze({surface:'panel',kind:'action',value:String(action),scope:scopeFor(node)});
 if(node.id)return Object.freeze({surface:'panel',kind:'id',value:String(node.id),scope:'living-panel'});
 if(node.tagName==='SUMMARY'){const value=normalizeText(node.textContent);if(value)return Object.freeze({surface:'panel',kind:'summary',value,scope:scopeFor(node)})}
 return null;
}
function sameKey(a,b){return !!a&&!!b&&a.surface===b.surface&&a.kind===b.kind&&a.value===b.value&&a.scope===b.scope}
function candidatesFor(key){
 if(!key)return[];
 if(key.surface==='rail')return rail?[...rail.querySelectorAll('button[data-living-scale]')].filter(node=>sameKey(semanticKey(node),key)):[];
 if(key.surface==='breadcrumb')return breadcrumbs?[...breadcrumbs.querySelectorAll('button')].filter(node=>sameKey(semanticKey(node),key)):[];
 return panel?[...panel.querySelectorAll(focusableSelector)].filter(node=>sameKey(semanticKey(node),key)):[];
}
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
function chromeFallback(key){
 if(key?.surface==='rail'&&rail){
  const buttons=[...rail.querySelectorAll('button[data-living-scale]')];
  return buttons.find(node=>node.getAttribute('aria-pressed')==='true'&&available(node))||buttons.find(available)||null;
 }
 if(key?.surface==='breadcrumb'&&breadcrumbs){const buttons=[...breadcrumbs.querySelectorAll('button')].filter(available);return buttons.at(-1)||null}
 return null;
}
function findRemembered(){
 if(!remembered)return{target:null,fallback:false};
 const candidates=candidatesFor(remembered.key),exact=candidates[remembered.ordinal]||candidates[0]||null;
 if(available(exact))return{target:exact,fallback:false};
 const fallback=chromeFallback(remembered.key);return{target:fallback,fallback:!!fallback};
}
function clearRemembered(reason){remembered=null;state.lastRestore=reason||null}
function owned(node){return !!node&&((panel&&panel.contains(node))||(rail&&rail.contains(node))||(breadcrumbs&&breadcrumbs.contains(node)))}
function restore(){
 restoreScheduled=false;if(!remembered)return false;
 const active=document.activeElement;
 if(owned(active)){const current=descriptor(active);if(current)remembered=current;return false}
 const {target,fallback}=findRemembered();if(!available(target)){state.misses++;clearRemembered('target-unavailable');return false}
 try{target.focus({preventScroll:true})}catch{return false}
 if(document.activeElement===target){state.restores++;if(remembered.key.surface!=='panel')state.chromeRestores++;if(fallback)state.fallbackRestores++;state.lastRestore=remembered.key.surface+':'+remembered.key.value;remembered=descriptor(target)||remembered;return true}
 state.misses++;clearRemembered('focus-rejected');return false;
}
function scheduleRestore(){if(restoreScheduled||!remembered)return;restoreScheduled=true;defer(restore)}
function onFocusIn(event){
 if(owned(event.target)){
  const next=descriptor(event.target);if(next){remembered=next;state.focusEvents++;if(next.key.surface!=='panel')state.chromeFocusEvents++}
  return;
 }
 const observedGeneration=mutationGeneration;
 defer(()=>{if(observedGeneration===mutationGeneration&&!owned(document.activeElement)){clearRemembered('intentional-focus-exit');state.intentClears++}});
}
function onPointerDown(event){if(!owned(event.target)){clearRemembered('pointer-exit');state.intentClears++}}
function observe(target,kind){const observer=new MutationObserver(()=>{mutationGeneration++;if(kind==='panel')state.panelMutations++;else state.chromeMutations++;scheduleRestore()});observer.observe(target,{childList:true,subtree:true});observers.push(observer)}
function attach(){
 state.attachAttempts++;panel=document.getElementById('living-panel');rail=document.getElementById('living-rail');breadcrumbs=document.getElementById('living-breadcrumbs');if(!panel||!rail||!breadcrumbs)return false;
 document.addEventListener('focusin',onFocusIn,true);document.addEventListener('pointerdown',onPointerDown,true);
 observe(panel,'panel');observe(rail,'chrome');observe(breadcrumbs,'chrome');
 state.ready=true;root.__OFU_LIVING_FOCUS_CONTINUITY__=api;return true;
}
function snapshot(){return Object.freeze({...state,remembered:remembered?Object.freeze({surface:remembered.key.surface,kind:remembered.key.kind,scope:remembered.key.scope,value:remembered.key.value,ordinal:remembered.ordinal}):null,mutationGeneration})}
const api=Object.freeze({VERSION,state,snapshot,semanticKey,breadcrumbScale,restore});O.v11LivingFocusContinuity=api;
let attempts=0;function boot(){if(state.ready)return;if(attach())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
