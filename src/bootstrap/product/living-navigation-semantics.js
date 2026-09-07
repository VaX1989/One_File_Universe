(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-navigation-semantics-2',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const STAGE_LABELS=Object.freeze({NEIGHBORHOOD:'Stellar neighborhood',APPROACH:'Approach',GLOBAL_SURFACE:'Surface',REGIONAL_SURFACE:'Regional surface',LOCAL_SURFACE:'Local surface',HUMAN:'Human scale',MATERIAL:'Material',MICROSTRUCTURE:'Microstructure',MOLECULAR:'Molecular',ATOMIC:'Atomic'});
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,syncs:0,railPressedRemoved:0,railCurrentCount:0,breadcrumbCurrentCount:0,syntheticBreadcrumbs:0,lastStage:null,lastCurrentScale:null,lastBreadcrumb:null,lastBreadcrumbSynthetic:false};
let rail=null,breadcrumbs=null,runtime=null,observers=[],pending=false;
function schedule(){if(pending)return;pending=true;(root.queueMicrotask||((fn)=>Promise.resolve().then(fn)))(sync)}
function setCurrent(node,value){if(value)node.setAttribute('aria-current',value);else node.removeAttribute('aria-current')}
function breadcrumbScale(button){const text=String(button?.textContent||'').replace(/\s+/g,' ').trim();if(text==='Universe')return'UNIVERSE';if(text.startsWith('Galaxy '))return'GALAXY';if(text==='Region')return'REGION';if(text.startsWith('System '))return'SYSTEM';if(text.startsWith('World '))return'ORBIT';return null}
function exactBreadcrumb(crumbs,stage){return crumbs.find(button=>breadcrumbScale(button)===stage)||null}
function contextLabel(snapshot){return STAGE_LABELS[String(snapshot?.stage||'')]||String(snapshot?.stage||'').toLowerCase().replaceAll('_',' ').replace(/(^|\s)([a-z])/g,(_,space,c)=>space+c.toUpperCase())||'Current location'}
function ensureCurrentContext(snapshot,crumbs){
 const exact=exactBreadcrumb(crumbs,String(snapshot.stage||'')),existing=breadcrumbs.querySelector('[data-living-current-context]');
 for(const button of crumbs)setCurrent(button,button===exact?'location':null);
 if(exact){existing?.previousElementSibling?.matches?.('[data-living-current-separator]')&&existing.previousElementSibling.remove();existing?.remove();state.lastBreadcrumb=String(exact.textContent||'').replace(/\s+/g,' ').trim();state.lastBreadcrumbSynthetic=false;return 1}
 const label=contextLabel(snapshot);let current=existing;
 if(!current){const separator=document.createElement('span');separator.textContent=' / ';separator.setAttribute('aria-hidden','true');separator.dataset.livingCurrentSeparator='true';current=document.createElement('span');current.dataset.livingCurrentContext='true';breadcrumbs.append(separator,current);state.syntheticBreadcrumbs++}
 if(current.textContent!==label)current.textContent=label;setCurrent(current,'location');state.lastBreadcrumb=label;state.lastBreadcrumbSynthetic=true;return 1;
}
function sync(snapshot=runtime?.snapshot?.()){
 pending=false;if(!rail||!breadcrumbs||!snapshot)return false;
 const currentScale=snapshot.micro?'MICRO':String(snapshot.stage||'');let currentCount=0;
 for(const button of rail.querySelectorAll('button[data-living-scale]')){
  if(button.hasAttribute('aria-pressed')){button.removeAttribute('aria-pressed');state.railPressedRemoved++}
  const active=String(button.dataset.livingScale||'')===currentScale;setCurrent(button,active?'step':null);if(active)currentCount++;
 }
 const crumbs=[...breadcrumbs.querySelectorAll('button')],breadcrumbCount=ensureCurrentContext(snapshot,crumbs);
 state.syncs++;state.railCurrentCount=currentCount;state.breadcrumbCurrentCount=breadcrumbCount;state.lastStage=snapshot.stage||null;state.lastCurrentScale=currentScale||null;return true;
}
function observe(node){const observer=new MutationObserver(records=>{if(records.some(record=>record.type==='childList'))schedule()});observer.observe(node,{childList:true,subtree:true});observers.push(observer)}
function attach(){
 state.attachAttempts++;rail=document.getElementById('living-rail');breadcrumbs=document.getElementById('living-breadcrumbs');runtime=O.v1LivingProduct?.runtime;
 if(!rail||!breadcrumbs||!runtime){if(state.attachAttempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(attach,50);return false}
 observe(rail);observe(breadcrumbs);runtime.onChange?.(snapshot=>sync(snapshot));sync(runtime.snapshot());state.ready=true;root.__OFU_LIVING_NAVIGATION_SEMANTICS__=api;return true;
}
function snapshot(){return Object.freeze({...state})}
const api=Object.freeze({VERSION,AUTHORITY,state,snapshot,sync,breadcrumbScale,contextLabel});O.v11LivingNavigationSemantics=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else root.setTimeout(attach,0);
})(typeof globalThis!=='undefined'?globalThis:this);
