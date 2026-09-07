(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-context-dock-2',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,converged:false,attachStatus:'waiting',attachAttempts:0,decorations:0,legacyCorrections:0,runtimeUpdates:0,lastStage:null,lastIdentity:null,lastContextAuthority:null,lastDesiredSignature:null,inspectAvailable:false};
let runtime=null,dock=null,observer=null,scheduled=false;
const human=value=>String(value||'unknown').toLowerCase().replaceAll('_',' ');
const short=value=>String(value||'').slice(0,8);
function schedule(){if(scheduled)return;scheduled=true;const run=()=>{scheduled=false;decorate()};if(typeof root.queueMicrotask==='function')root.queueMicrotask(run);else Promise.resolve().then(run)}
function invalidate(){state.converged=false;schedule()}
function model(){
 const s=runtime?.snapshot?.();if(!s)return null;
 const worldIdentity=String(s.world?.planetIdentity||''),bodyIdentity=String(s.body?.canonicalId||''),nodeIdentity=String(s.node?.canonicalId||s.node?.entityId||''),identity=worldIdentity||bodyIdentity||nodeIdentity;
 const world=!!s.world,inspectAvailable=world&&!!(bodyIdentity||worldIdentity),contextAuthority=world?'MODEL_DERIVED_SIMULATION':'PRESENTATION_ONLY';
 const kind=world?'world':s.body?.kind==='star'?'star':'context',identityLabel=identity?short(identity):'current';
 return Object.freeze({snapshot:s,stage:String(s.stage||'UNKNOWN'),identity,world,inspectAvailable,contextAuthority,copy:`Living ${human(s.stage)} · ${kind} ${identityLabel}`});
}
function setText(node,value){if(node&&node.textContent!==value){node.textContent=value;return true}return false}
function setAttr(node,name,value){if(node&&node.getAttribute(name)!==String(value)){node.setAttribute(name,String(value));return true}return false}
function desiredSignature(m){return [m.copy,m.world?'MODEL_DERIVED_SIMULATION world context · canonical body identity retained · viewport PRESENTATION_ONLY':'Living navigation context · canonical identities retained · viewport PRESENTATION_ONLY',String(!m.inspectAvailable),'Inspect current world','Living universe contextual actions',m.stage,m.identity,m.contextAuthority].join('|')}
function actualSignature(copy,authority,inspect){return [copy?.textContent||'',authority?.textContent||'',String(!!inspect?.disabled),inspect?.textContent||'',dock?.getAttribute('aria-label')||'',dock?.dataset?.livingStage||'',dock?.dataset?.livingIdentity||'',dock?.dataset?.livingContextAuthority||''].join('|')}
function decorate(){
 if(!dock||!runtime){state.converged=false;return false}const m=model();if(!m){state.converged=false;return false}
 const copy=document.getElementById('v1x10-context-copy'),authority=dock.querySelector('.v1x10-context-authority'),inspect=[...dock.querySelectorAll('button')].find(button=>/inspect/i.test(button.textContent||''));if(!copy||!authority||!inspect){state.converged=false;return false}
 const authorityText=m.world?'MODEL_DERIVED_SIMULATION world context · canonical body identity retained · viewport PRESENTATION_ONLY':'Living navigation context · canonical identities retained · viewport PRESENTATION_ONLY';
 const before=actualSignature(copy,authority,inspect),desired=desiredSignature(m);state.lastDesiredSignature=desired;if(state.ready&&before!==desired)state.legacyCorrections++;
 let changed=false;changed=setText(copy,m.copy)||changed;changed=setText(authority,authorityText)||changed;
 if(inspect.disabled===m.inspectAvailable){inspect.disabled=!m.inspectAvailable;changed=true}
 changed=setText(inspect,'Inspect current world')||changed;changed=setAttr(inspect,'aria-label',m.inspectAvailable?'Inspect the current Living world':'Inspect becomes available after entering a Living world')||changed;
 changed=setAttr(dock,'aria-label','Living universe contextual actions')||changed;changed=setAttr(dock,'aria-live','off')||changed;changed=setAttr(dock,'data-ofu-living-context-dock','true')||changed;changed=setAttr(dock,'data-living-stage',m.stage)||changed;changed=setAttr(dock,'data-living-identity',m.identity)||changed;changed=setAttr(dock,'data-living-context-authority',m.contextAuthority)||changed;
 if(changed)state.decorations++;state.lastStage=m.stage;state.lastIdentity=m.identity||null;state.lastContextAuthority=m.contextAuthority;state.inspectAvailable=m.inspectAvailable;state.ready=true;state.attachStatus='attached';state.converged=actualSignature(copy,authority,inspect)===desired;return state.converged;
}
function attach(){
 state.attachAttempts++;runtime=O.v1LivingProduct?.runtime;dock=document.getElementById('v1x10-context-dock');if(!runtime||!dock||!O.v1x10ViewportUX?.snapshot?.().initialized)return false;
 runtime.onChange?.(()=>{state.runtimeUpdates++;invalidate()});observer=new MutationObserver(invalidate);observer.observe(dock,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-label','aria-live','data-living-stage','data-living-identity','data-living-context-authority']});decorate();root.__OFU_LIVING_CONTEXT_DOCK__=api;return true;
}
function snapshot(){return Object.freeze({...state,dockLabel:dock?.getAttribute('aria-label')||null,copy:document.getElementById('v1x10-context-copy')?.textContent||null,contextReachable:O.v1x10ViewportUX?.measureOcclusion?.()?.contextReachable??null})}
const api=Object.freeze({VERSION,AUTHORITY,MAX_ATTACH_ATTEMPTS,state,snapshot,decorate});O.v11LivingContextDock=api;
function boot(){if(state.attachStatus==='attached'||state.attachStatus==='timeout')return;if(attach())return;if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
