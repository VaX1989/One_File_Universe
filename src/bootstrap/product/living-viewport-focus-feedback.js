(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-viewport-focus-feedback-1',AUTHORITY='PRESENTATION_ONLY',MAX_ATTACH_ATTEMPTS=120;
const BASE_LABEL='Interactive living universe. Select objects, drag worlds, or use adjacent controls.';
const FOCUSED_PREFIX='Universe viewport. Focused ';
const KEY_SHORTCUTS=Object.freeze(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Home','I','Escape','[',']']);
const state={version:VERSION,authority:AUTHORITY,ready:false,attachAttempts:0,focusAnnouncements:0,staleFocusClears:0,silentContextResets:0,descriptionBindings:0,lastFocusedLabel:null,lastStage:null};
let runtime=null,canvas=null,status=null,observer=null,liveRestore=0;
function instruction(stage=null){const prefix=stage?'Viewport changed to '+String(stage).toLowerCase().replaceAll('_',' ')+'. ':'';return prefix+'Arrow keys move object focus; Enter opens the focused object.'}
function setStatus(text,{silent=false}={}){
 if(!status||status.textContent===text)return;
 if(liveRestore){root.clearTimeout(liveRestore);liveRestore=0}
 if(silent){status.setAttribute('aria-live','off');state.silentContextResets++}
 status.textContent=text;
 if(silent)liveRestore=root.setTimeout(()=>{liveRestore=0;if(status?.isConnected)status.setAttribute('aria-live','polite')},0);
}
function mergeTokens(current){const tokens=String(current||'').split(/\s+/).filter(Boolean);for(const token of KEY_SHORTCUTS)if(!tokens.includes(token))tokens.push(token);return tokens.join(' ')}
function bindDescription(){if(!canvas||!status)return;const tokens=String(canvas.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);if(!tokens.includes(status.id)){tokens.push(status.id);canvas.setAttribute('aria-describedby',tokens.join(' '));state.descriptionBindings++}canvas.setAttribute('aria-keyshortcuts',mergeTokens(canvas.getAttribute('aria-keyshortcuts')))}
function focusedName(label){const text=String(label||'');return text.startsWith(FOCUSED_PREFIX)?text.slice(FOCUSED_PREFIX.length).trim():null}
function reflectLabel(){if(!canvas)return;const name=focusedName(canvas.getAttribute('aria-label'));if(!name){state.lastFocusedLabel=null;return}state.lastFocusedLabel=name;state.focusAnnouncements++;setStatus('Focused '+name+'. Press Enter to open.')}
function clearStaleFocus(snapshot){
 if(!canvas)return;const name=focusedName(canvas.getAttribute('aria-label'));state.lastStage=snapshot?.stage||runtime?.snapshot?.().stage||null;if(!name)return;
 canvas.setAttribute('aria-label',BASE_LABEL);state.lastFocusedLabel=null;state.staleFocusClears++;
 // Living transition feedback already announces navigation. Keep this visible context truthful without creating a duplicate live announcement.
 setStatus(instruction(state.lastStage),{silent:true});
}
function ensureStatus(){
 const titlebar=document.getElementById('living-titlebar');if(!titlebar)return null;let node=document.getElementById('living-viewport-focus-status');if(node)return node;
 node=document.createElement('p');node.id='living-viewport-focus-status';node.className='living-note';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.setAttribute('aria-atomic','true');node.dataset.livingProductState='PRESENTATION_ONLY';node.textContent=instruction();titlebar.append(node);return node;
}
function attach(){
 state.attachAttempts++;const product=O.v1LivingProduct,next=document.getElementById('living-view');if(!product?.runtime||!next){if(state.attachAttempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(attach,50);return false}
 runtime=product.runtime;canvas=next;status=ensureStatus();if(!status){if(state.attachAttempts<MAX_ATTACH_ATTEMPTS)root.setTimeout(attach,50);return false}
 bindDescription();observer=new MutationObserver(records=>{if(records.some(record=>record.attributeName==='aria-label'))reflectLabel()});observer.observe(canvas,{attributes:true,attributeFilter:['aria-label']});runtime.onChange?.(clearStaleFocus);
 canvas.addEventListener('focus',()=>{if(!focusedName(canvas.getAttribute('aria-label')))setStatus(instruction(runtime.snapshot?.().stage))});
 reflectLabel();state.lastStage=runtime.snapshot?.().stage||null;state.ready=true;root.__OFU_LIVING_VIEWPORT_FOCUS_FEEDBACK__=api;return true;
}
function snapshot(){return Object.freeze({...state,statusText:status?.textContent||null,canvasLabel:canvas?.getAttribute('aria-label')||null,describedBy:canvas?.getAttribute('aria-describedby')||null,keyShortcuts:canvas?.getAttribute('aria-keyshortcuts')||null,liveMode:status?.getAttribute('aria-live')||null})}
const api=Object.freeze({VERSION,AUTHORITY,BASE_LABEL,FOCUSED_PREFIX,KEY_SHORTCUTS,state,snapshot});O.v11LivingViewportFocusFeedback=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else root.setTimeout(attach,0);
})(typeof globalThis!=='undefined'?globalThis:this);
