(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-survey-ux-1',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,maxAttachAttempts:MAX_ATTACH_ATTEMPTS,decorations:0,resultActivations:0,verifiedActivations:0,identityMismatches:0,lastExpectedIdentity:null,lastVerifiedIdentity:null};
let panel=null,observer=null,scheduled=false;
function authorityCopy(){return 'Survey results are bounded MODEL_DERIVED_SIMULATION outcomes anchored to canonical world identities. Opening a result changes the selected canonical identity only after explicit activation; modeled life or civilization never becomes canonical P6 evidence.'}
function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(()=>{scheduled=false;decorate()})}
function ensureAuthority(select){
 let note=document.getElementById('living-search-authority');
 if(!note){note=document.createElement('p');note.id='living-search-authority';note.className='living-note';note.setAttribute('data-living-survey-authority','MODEL_DERIVED_SIMULATION');note.textContent=authorityCopy();select.before(note);state.decorations++}
 else if(note.textContent!==authorityCopy())note.textContent=authorityCopy();
 select.setAttribute('aria-describedby','living-search-authority living-search-progress');
 return note;
}
function decorateResults(results){
 results.setAttribute('aria-label','Bounded model-derived world survey results');
 results.setAttribute('data-living-survey-authority','MODEL_DERIVED_SIMULATION');
 for(const button of results.querySelectorAll('[data-living-entity]')){
  button.dataset.livingModelAuthority='MODEL_DERIVED_SIMULATION';
  if(!button.querySelector('[data-living-model-authority]')){
   const badge=document.createElement('small');badge.setAttribute('data-living-model-authority','MODEL_DERIVED_SIMULATION');badge.textContent='MODEL_DERIVED_SIMULATION · canonical identity retained';button.append(badge);state.decorations++;
  }
  const identity=String(button.dataset.livingEntity||'');
  if(identity&&!button.getAttribute('aria-label'))button.setAttribute('aria-label','Open modeled survey candidate '+identity.slice(0,8)+'. Model-derived simulation result anchored to a canonical identity.');
 }
}
function decorate(){
 panel=document.getElementById('living-panel');if(!panel)return false;
 const select=document.getElementById('living-search-goal'),progress=document.getElementById('living-search-progress'),results=document.getElementById('living-search-results');
 if(!select||!progress||!results)return false;
 ensureAuthority(select);progress.setAttribute('aria-live','polite');progress.setAttribute('aria-atomic','true');progress.dataset.livingSurveyAuthority='MODEL_DERIVED_SIMULATION';decorateResults(results);state.ready=true;return true;
}
function verifyActivation(expected){
 const living=O.v1LivingProduct?.runtime?.snapshot?.(),actual=String(living?.body?.canonicalId||living?.world?.planetIdentity||'');
 state.lastExpectedIdentity=expected;state.lastVerifiedIdentity=actual||null;
 if(actual===expected){state.verifiedActivations++;O.productUI?.announce?.('Opened model-derived survey result with verified canonical identity');return true}
 state.identityMismatches++;console.error('Living survey candidate identity mismatch',{expected,actual:actual||null});O.productUI?.announce?.('Survey result identity could not be verified');return false;
}
function bind(){
 document.addEventListener('click',event=>{const button=event.target.closest?.('#living-search-results [data-living-entity]');if(!button)return;const expected=String(button.dataset.livingEntity||'');if(!expected)return;state.resultActivations++;state.lastExpectedIdentity=expected;root.setTimeout(()=>verifyActivation(expected),0)},true);
 const attach=()=>{state.attachAttempts++;const next=document.getElementById('living-panel');if(!next){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}panel=next;state.attachStatus='attached';observer=new MutationObserver(schedule);observer.observe(panel,{childList:true,subtree:true});decorate()};attach();
}
const api=Object.freeze({VERSION,MAX_ATTACH_ATTEMPTS,state,decorate,verifyActivation,snapshot:()=>Object.freeze({...state})});
O.v11LivingSurveyUX=api;root.__OFU_LIVING_SURVEY_UX__=api;bind();
})(typeof globalThis!=='undefined'?globalThis:this);
