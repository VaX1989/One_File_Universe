(function(root){
'use strict';
const O=root.OFU=root.OFU||{},DOC=typeof document!=='undefined'?document:null;
const VERSION='ofu-v1x10-accessibility-1',AUTHORITY='PRESENTATION_ONLY';
const state={version:VERSION,initialized:false,reducedMotion:false,forcedColors:false,prefersContrast:false,textScale:1,focusEvents:0,lastFocusRole:null,skipActivations:0,workspaceSyncs:0};
let reducedQuery=null,contrastQuery=null,forcedQuery=null,observer=null;
const q=s=>DOC?.querySelector(s)||null;
function media(query){try{return typeof root.matchMedia==='function'?root.matchMedia(query):null}catch{return null}}
function setRootFlags(){
 state.reducedMotion=!!reducedQuery?.matches;state.forcedColors=!!forcedQuery?.matches;state.prefersContrast=!!contrastQuery?.matches;
 if(!DOC)return;DOC.documentElement.dataset.ofuV1x10ReducedMotion=state.reducedMotion?'true':'false';DOC.documentElement.dataset.ofuV1x10ForcedColors=state.forcedColors?'true':'false';DOC.documentElement.dataset.ofuV1x10Contrast=state.prefersContrast?'more':'normal'
}
function addSkipLink(container,label,target){const a=DOC.createElement('a');a.className='v1x10-skip-link';a.href='#'+target;a.textContent=label;a.addEventListener('click',()=>{state.skipActivations++;root.queueMicrotask?.(()=>DOC.getElementById(target)?.focus?.({preventScroll:false}))});container.append(a)}
function mountSkipLinks(){if(DOC.getElementById('v1x10-skip-links'))return;const host=DOC.createElement('nav');host.id='v1x10-skip-links';host.className='v1x10-skip-links';host.setAttribute('aria-label','Skip links');addSkipLink(host,'Skip to universe viewport','planet-view');addSkipLink(host,'Skip to contextual actions','v1x10-context-dock');const panel=q('.experience > .panel');if(panel){panel.id=panel.id||'v1x10-details-panel';panel.tabIndex=panel.tabIndex<0?panel.tabIndex:-1;addSkipLink(host,'Skip to details','v1x10-details-panel')}DOC.body.prepend(host)}
function syncTabs(){
 const current=O.productUI?.state?.workspace||DOC.documentElement.dataset.workspace||'explore',tabs=[...DOC.querySelectorAll('.workspace-nav [role="tab"][data-workspace]')];for(const tab of tabs){const active=tab.dataset.workspace===current;tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1;tab.setAttribute('aria-controls','v1x10-details-panel')}state.workspaceSyncs++
}
function accessiblePanels(){
 for(const panel of DOC.querySelectorAll('[data-workspace-panel]')){const active=panel.dataset.workspacePanel===(O.productUI?.state?.workspace||DOC.documentElement.dataset.workspace||'explore');panel.setAttribute('aria-hidden',active?'false':'true');if(active)panel.removeAttribute('inert');else if('inert' in panel)panel.inert=true}
}
function focusRole(el){if(!el)return'none';if(el.id==='planet-view')return'viewport';if(el.closest?.('.workspace-nav'))return'workspace-tab';if(el.closest?.('.v1x10-context-dock'))return'context-action';if(el.closest?.('.experience > .panel'))return'details';return el.tagName?.toLowerCase?.()||'other'}
function onFocus(e){state.focusEvents++;state.lastFocusRole=focusRole(e.target);DOC.documentElement.dataset.ofuV1x10Focus=state.lastFocusRole}
function bindTabKeys(){
 DOC.addEventListener('keydown',e=>{const tab=e.target.closest?.('.workspace-nav [role="tab"][data-workspace]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...DOC.querySelectorAll('.workspace-nav [role="tab"][data-workspace]')];let i=tabs.indexOf(tab);if(i<0)return;e.preventDefault();if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else i=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[i].focus();tabs[i].click()},true)
}
function ensureLabels(){const viewport=DOC.getElementById('planet-view');if(viewport){viewport.setAttribute('role',viewport.getAttribute('role')||'application');viewport.setAttribute('aria-roledescription','interactive multiscale universe viewport')}const context=DOC.getElementById('v1x10-context-dock');if(context){context.tabIndex=-1}const panel=q('.experience > .panel');if(panel){panel.setAttribute('role','complementary');panel.setAttribute('aria-label','Contextual details and evidence')}}
function measureTextScale(){const px=parseFloat(root.getComputedStyle?.(DOC.documentElement)?.fontSize||'16');state.textScale=Number.isFinite(px)?Math.round(px/16*100)/100:1;DOC.documentElement.dataset.ofuV1x10TextScale=String(state.textScale)}
function sync(){setRootFlags();syncTabs();accessiblePanels();ensureLabels();measureTextScale()}
function init(){
 if(state.initialized||!DOC)return;state.initialized=true;reducedQuery=media('(prefers-reduced-motion: reduce)');contrastQuery=media('(prefers-contrast: more)');forcedQuery=media('(forced-colors: active)');mountSkipLinks();bindTabKeys();DOC.addEventListener('focusin',onFocus,true);
 for(const m of [reducedQuery,contrastQuery,forcedQuery])m?.addEventListener?.('change',sync);if(typeof MutationObserver==='function'){observer=new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-workspace'||r.attributeName==='style'||r.attributeName==='class'))sync()});observer.observe(DOC.documentElement,{attributes:true,attributeFilter:['data-workspace','style','class']})}root.addEventListener?.('resize',measureTextScale,{passive:true});sync();DOC.documentElement.dataset.ofuV1x10Accessibility='true'
}
function snapshot(){return Object.freeze({...state,authority:AUTHORITY,keyboardPrimaryJourney:true,screenReaderPrimaryJourney:true,aiRequired:false,hiddenDeveloperPanelRequired:false})}
const api=Object.freeze({VERSION,AUTHORITY,state,init,sync,snapshot});O.v1x10Accessibility=api;root.__OFU_V1X10_ACCESSIBILITY__=api;if(DOC){if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof globalThis!=='undefined'?globalThis:this);
