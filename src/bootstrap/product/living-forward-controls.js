(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-forward-controls-1',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,decorations:0,forwardClicks:0,keyboardBack:0,keyboardForward:0,focusRestores:0};
let runtime=null,panel=null,observer=null,scheduled=false,restoreForwardFocus=false;
function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(()=>{scheduled=false;decorate()})}
function forwardButton(back){let b=panel?.querySelector('[data-living-action="forward"]');if(b)return b;b=document.createElement('button');b.type='button';b.className=back.className||'living-button';b.textContent='Forward';b.dataset.livingAction='forward';b.setAttribute('aria-keyshortcuts',']');b.addEventListener('click',()=>{if(!runtime?.snapshot?.().forwardDepth)return;state.forwardClicks++;restoreForwardFocus=true;try{runtime.forward();O.productUI?.announce?.('Forward to next exploration context')}catch(error){restoreForwardFocus=false;console.error('Living Forward:',error);O.productUI?.announce?.('Forward navigation could not be restored')}});back.after(b);state.decorations++;return b}
function decorate(){
 const product=O.v1LivingProduct;if(!product?.runtime)return false;runtime=product.runtime;panel=document.getElementById('living-panel');if(!panel)return false;
 const back=panel.querySelector('[data-living-action="back"]');if(!back)return false;back.setAttribute('aria-keyshortcuts','Escape Backspace [');
 const forward=forwardButton(back),snapshot=runtime.snapshot();forward.disabled=!(snapshot.forwardDepth>0);forward.setAttribute('aria-label',forward.disabled?'No forward exploration context':'Forward to next exploration context');
 if(restoreForwardFocus){restoreForwardFocus=false;if(!forward.disabled){forward.focus({preventScroll:true});state.focusRestores++}}
 state.ready=true;return true;
}
function bindRuntime(){if(!runtime||runtime.__ofuForwardControlsBound)return;try{Object.defineProperty(runtime,'__ofuForwardControlsBound',{value:true})}catch{}runtime.onChange?.(schedule)}
function bindKeyboard(){root.addEventListener('keydown',event=>{const canvas=document.getElementById('living-view');if(!runtime||document.activeElement!==canvas||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;if(event.key==='['){if(runtime.snapshot().historyDepth<=0)return;event.preventDefault();event.stopImmediatePropagation();state.keyboardBack++;runtime.back();O.productUI?.announce?.('Back to previous exploration context')}else if(event.key===']'){if(runtime.snapshot().forwardDepth<=0)return;event.preventDefault();event.stopImmediatePropagation();state.keyboardForward++;runtime.forward();O.productUI?.announce?.('Forward to next exploration context')}},false)}
function attach(){
 state.attachAttempts++;const product=O.v1LivingProduct,next=document.getElementById('living-panel');
 if(!product?.runtime||!next){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}
 runtime=product.runtime;panel=next;state.attachStatus='attached';bindRuntime();observer=new MutationObserver(schedule);observer.observe(panel,{childList:true,subtree:true});decorate();
}
const api=Object.freeze({VERSION,MAX_ATTACH_ATTEMPTS,state,decorate,snapshot:()=>Object.freeze({...state,forwardDepth:runtime?.snapshot?.().forwardDepth??0,historyDepth:runtime?.snapshot?.().historyDepth??0})});
O.v11LivingForwardControls=api;root.__OFU_LIVING_FORWARD_CONTROLS__=api;bindKeyboard();attach();
})(typeof globalThis!=='undefined'?globalThis:this);
