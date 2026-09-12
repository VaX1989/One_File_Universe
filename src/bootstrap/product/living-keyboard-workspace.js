(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-keyboard-workspace-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const HELP_ID='living-keyboard-shortcuts-help';
const SHORTCUTS='I Escape Backspace [ ] = - Home ArrowLeft ArrowRight ArrowUp ArrowDown Enter ?';
const HELP_TEXT='Keyboard controls for the Living universe: I opens Inspect. Escape or Backspace goes back; left bracket goes back and right bracket goes forward. Plus or equals moves deeper through scale and minus moves outward. Home returns to Universe. Arrow keys move the viewport selection, Enter activates it, and question mark opens the controls guide.';
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,inspectShortcuts:0,escapeReturns:0,shortcutMetadataUpdates:0,descriptionCreates:0,lastAction:null};
let canvas=null,help=null;
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
function describedByWith(id){
 const tokens=String(canvas?.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean);if(!tokens.includes(id))tokens.push(id);return tokens.join(' ');
}
function exposeKeyboardHelp(){
 const stage=document.getElementById('living-stage');if(!canvas||!stage)return false;
 help=document.getElementById(HELP_ID);
 if(!help){help=document.createElement('p');help.id=HELP_ID;help.className='visually-hidden';help.dataset.livingProductState=AUTHORITY;stage.append(help);state.descriptionCreates++}
 if(help.textContent!==HELP_TEXT)help.textContent=HELP_TEXT;
 if(canvas.getAttribute('aria-keyshortcuts')!==SHORTCUTS){canvas.setAttribute('aria-keyshortcuts',SHORTCUTS);state.shortcutMetadataUpdates++}
 const describedBy=describedByWith(HELP_ID);if(canvas.getAttribute('aria-describedby')!==describedBy)canvas.setAttribute('aria-describedby',describedBy);
 return true;
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
 if(!exposeKeyboardHelp())return false;root.addEventListener('keydown',onKeydown,true);state.ready=true;root.__OFU_LIVING_KEYBOARD_WORKSPACE__=api;return true;
}
function snapshot(){return Object.freeze({...state,workspace:workspace(),canvasFocused:document.activeElement===document.getElementById('living-view'),shortcuts:canvas?.getAttribute('aria-keyshortcuts')||null,describedBy:canvas?.getAttribute('aria-describedby')||null,helpConnected:!!help?.isConnected,helpText:help?.textContent||''})}
const api=Object.freeze({VERSION,AUTHORITY,HELP_ID,SHORTCUTS,HELP_TEXT,state,snapshot,focusLiving,exposeKeyboardHelp});O.v11LivingKeyboardWorkspace=api;
let attempts=0;function boot(){if(state.ready)return;if(attach())return;if(++attempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else root.setTimeout(boot,0);
})(typeof globalThis!=='undefined'?globalThis:this);
