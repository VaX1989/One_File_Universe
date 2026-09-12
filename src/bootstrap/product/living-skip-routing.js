(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-skip-routing-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,routes:0,activations:0,lastTarget:null};
let routedLink=null;
function focusLiving(event){
 const target=document.getElementById('living-view');if(!target)return;
 event.preventDefault();event.stopImmediatePropagation();target.focus({preventScroll:false});state.activations++;state.lastTarget='living-view';
}
function route(){
 const living=document.getElementById('living-view'),links=document.getElementById('v1x10-skip-links');
 if(!living||!links||!O.v1LivingProduct?.snapshot?.().initialized)return false;
 const link=links.querySelector('a[href="#living-view"],a[href="#planet-view"]');if(!link)return false;
 if(routedLink&&routedLink!==link)routedLink.removeEventListener('click',focusLiving,true);
 routedLink=link;
 if(link.dataset.ofuLivingSkipRouted!=='true'){
  link.addEventListener('click',focusLiving,true);link.dataset.ofuLivingSkipRouted='true';state.routes++;
 }
 link.href='#living-view';link.textContent='Skip to living universe viewport';link.setAttribute('aria-controls','living-view');
 state.ready=true;state.lastTarget='living-view';root.__OFU_LIVING_SKIP_ROUTING__=api;return true;
}
function snapshot(){return Object.freeze({...state,href:routedLink?.getAttribute('href')||null,label:routedLink?.textContent||null})}
const api=Object.freeze({VERSION,AUTHORITY,state,route,snapshot});O.v11LivingSkipRouting=api;
let attempts=0;function boot(){state.attachAttempts++;if(route())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
