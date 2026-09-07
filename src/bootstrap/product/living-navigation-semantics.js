(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-navigation-semantics-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,syncs:0,railPressedRemoved:0,railCurrentCount:0,breadcrumbCurrentCount:0,lastStage:null,lastCurrentScale:null,lastBreadcrumb:null};
let rail=null,breadcrumbs=null,runtime=null,observers=[],pending=false;
function schedule(){if(pending)return;pending=true;(root.queueMicrotask||((fn)=>Promise.resolve().then(fn)))(sync)}
function setCurrent(node,value){if(value)node.setAttribute('aria-current',value);else node.removeAttribute('aria-current')}
function sync(snapshot=runtime?.snapshot?.()){
 pending=false;if(!rail||!breadcrumbs||!snapshot)return false;
 const currentScale=snapshot.micro?'MICRO':String(snapshot.stage||'');let currentCount=0;
 for(const button of rail.querySelectorAll('button[data-living-scale]')){
  if(button.hasAttribute('aria-pressed')){button.removeAttribute('aria-pressed');state.railPressedRemoved++}
  const active=String(button.dataset.livingScale||'')===currentScale;setCurrent(button,active?'step':null);if(active)currentCount++;
 }
 const crumbs=[...breadcrumbs.querySelectorAll('button')],currentCrumb=crumbs.at(-1)||null;for(const button of crumbs)setCurrent(button,button===currentCrumb?'location':null);
 state.syncs++;state.railCurrentCount=currentCount;state.breadcrumbCurrentCount=currentCrumb?1:0;state.lastStage=snapshot.stage||null;state.lastCurrentScale=currentScale||null;state.lastBreadcrumb=currentCrumb?String(currentCrumb.textContent||'').replace(/\s+/g,' ').trim():null;return true;
}
function observe(node){const observer=new MutationObserver(records=>{if(records.some(record=>record.type==='childList'))schedule()});observer.observe(node,{childList:true,subtree:true});observers.push(observer)}
function attach(){
 state.attachAttempts++;rail=document.getElementById('living-rail');breadcrumbs=document.getElementById('living-breadcrumbs');runtime=O.v1LivingProduct?.runtime;
 if(!rail||!breadcrumbs||!runtime){if(state.attachAttempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(attach,50);return false}
 observe(rail);observe(breadcrumbs);runtime.onChange?.(snapshot=>sync(snapshot));sync(runtime.snapshot());state.ready=true;root.__OFU_LIVING_NAVIGATION_SEMANTICS__=api;return true;
}
function snapshot(){return Object.freeze({...state})}
const api=Object.freeze({VERSION,AUTHORITY,state,snapshot,sync});O.v11LivingNavigationSemantics=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else root.setTimeout(attach,0);
})(typeof globalThis!=='undefined'?globalThis:this);
