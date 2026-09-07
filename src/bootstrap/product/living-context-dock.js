(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-context-dock-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,decorations:0,legacyCorrections:0,lastStage:null,lastIdentity:null,inspectAvailable:false};
let runtime=null,dock=null,observer=null,scheduled=false,lastSignature='';
const human=value=>String(value||'unknown').toLowerCase().replaceAll('_',' ');
const short=value=>String(value||'').slice(0,8);
function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(()=>{scheduled=false;decorate()})}
function model(){
 const s=runtime?.snapshot?.();if(!s)return null;
 const identity=String(s.world?.planetIdentity||s.body?.canonicalId||s.node?.canonicalId||s.node?.entityId||'');
 const world=!!s.world,bodyIdentity=String(s.body?.canonicalId||'');
 return Object.freeze({snapshot:s,stage:String(s.stage||'UNKNOWN'),identity,world,inspectAvailable:world&&!!bodyIdentity});
}
function setText(node,value){if(node&&node.textContent!==value){node.textContent=value;return true}return false}
function setAttr(node,name,value){if(node&&node.getAttribute(name)!==String(value)){node.setAttribute(name,String(value));return true}return false}
function decorate(){
 if(!dock||!runtime)return false;const m=model();if(!m)return false;
 const copy=document.getElementById('v1x10-context-copy'),authority=dock.querySelector('.v1x10-context-authority'),inspect=[...dock.querySelectorAll('button')].find(button=>/inspect/i.test(button.textContent||''));
 if(!copy||!authority||!inspect)return false;
 const identityLabel=m.identity?short(m.identity):'current context',copyText='Living '+human(m.stage)+' · '+identityLabel;
 const authorityText=m.world?'MODEL_DERIVED_SIMULATION world context · canonical body identity retained · viewport PRESENTATION_ONLY':'Living navigation context · canonical identities retained · viewport PRESENTATION_ONLY';
 const signature=[copy.textContent,authority.textContent,inspect.disabled,inspect.textContent,dock.getAttribute('aria-label')].join('|'),desired=[copyText,authorityText,!m.inspectAvailable,'Inspect current world','Living universe contextual actions'].join('|');
 let changed=false;changed=setText(copy,copyText)||changed;changed=setText(authority,authorityText)||changed;
 if(inspect.disabled===m.inspectAvailable){inspect.disabled=!m.inspectAvailable;changed=true}
 changed=setText(inspect,'Inspect current world')||changed;changed=setAttr(inspect,'aria-label',m.inspectAvailable?'Inspect the current Living world':'Inspect becomes available after entering a Living world')||changed;
 changed=setAttr(dock,'aria-label','Living universe contextual actions')||changed;changed=setAttr(dock,'data-ofu-living-context-dock','true')||changed;
 if(changed){state.decorations++;if(lastSignature&&signature!==desired)state.legacyCorrections++}
 lastSignature=desired;state.lastStage=m.stage;state.lastIdentity=m.identity||null;state.inspectAvailable=m.inspectAvailable;state.ready=true;return true;
}
function attach(){
 state.attachAttempts++;runtime=O.v1LivingProduct?.runtime;dock=document.getElementById('v1x10-context-dock');if(!runtime||!dock||!O.v1x10ViewportUX?.snapshot?.().initialized)return false;
 runtime.onChange?.(schedule);observer=new MutationObserver(schedule);observer.observe(dock,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-label']});decorate();root.__OFU_LIVING_CONTEXT_DOCK__=api;return true;
}
function snapshot(){return Object.freeze({...state,dockLabel:dock?.getAttribute('aria-label')||null,copy:document.getElementById('v1x10-context-copy')?.textContent||null})}
const api=Object.freeze({VERSION,AUTHORITY,state,snapshot,decorate});O.v11LivingContextDock=api;
let attempts=0;function boot(){if(state.ready)return;if(attach())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
