(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-pinch-handoff-4',MAX_ATTACH_ATTEMPTS=120,DRAG_THRESHOLD_PX=5;
const OWNER_KEY='__OFU_LIVING_PINCH_HANDOFF_OWNER__',SERIAL_KEY='__OFU_LIVING_PINCH_HANDOFF_SERIAL__';
const instanceSerial=(Number(root[SERIAL_KEY])||0)+1;root[SERIAL_KEY]=instanceSerial;
const state={version:VERSION,instanceSerial,ready:false,attachStatus:'waiting',attachAttempts:0,pinchStarts:0,handoffs:0,handoffMoves:0,coreOwnedMoves:0,cancellations:0,captureLosses:0,thresholdWaits:0,disposals:0,lastRemainingPointer:null,lastGesture:null,lastMove:null};
let product=null,renderer=null,canvas=null,boundCanvas=null,handoff=null,pinchSeen=false,disposed=false,retryTimer=0;
const pointers=new Map();
function position(event){const target=boundCanvas||canvas,rect=target.getBoundingClientRect();return{x:Number.isFinite(event.clientX)?event.clientX-rect.left:Number(event.offsetX)||0,y:Number.isFinite(event.clientY)?event.clientY-rect.top:Number(event.offsetY)||0}}
function down(event){
 const before=pointers.size,p=position(event);pointers.set(event.pointerId,p);
 if(pointers.size>=2){if(before<2)state.pinchStarts++;pinchSeen=true;handoff=null;state.lastGesture='pinch'}
}
function move(event){
 if(!pointers.has(event.pointerId))return;const p=position(event);pointers.set(event.pointerId,p);
 if(!handoff||handoff.pointerId!==event.pointerId||pointers.size!==1)return;
 const coreInput=product?.snapshot?.().input;
 if(coreInput?.lastGesture==='drag'){state.coreOwnedMoves++;handoff=null;state.lastGesture='core-drag';state.lastMove={branch:'core-drag',pointerId:event.pointerId,x:p.x,y:p.y};return}
 const fromReleaseX=p.x-handoff.startX,fromReleaseY=p.y-handoff.startY,distance=Math.hypot(fromReleaseX,fromReleaseY);
 if(!Number.isFinite(fromReleaseX)||!Number.isFinite(fromReleaseY)||!Number.isFinite(distance))return;
 if(distance<DRAG_THRESHOLD_PX){state.thresholdWaits++;state.lastGesture='handoff-threshold';state.lastMove={branch:'threshold',pointerId:event.pointerId,x:p.x,y:p.y,startX:handoff.startX,startY:handoff.startY,distance};handoff.x=p.x;handoff.y=p.y;return}
 let dx,dy;
 if(!handoff.engaged){dx=fromReleaseX;dy=fromReleaseY;handoff.engaged=true;}
 else{dx=p.x-handoff.x;dy=p.y-handoff.y;}
 handoff.x=p.x;handoff.y=p.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||(dx===0&&dy===0))return;
 state.lastMove={branch:'rotate',pointerId:event.pointerId,x:p.x,y:p.y,startX:handoff.startX,startY:handoff.startY,distance,dx,dy};
 renderer.rotate(dx,dy);state.handoffMoves++;state.lastGesture='handoff-drag';
}
function finish(event,cancelled=false){
 const known=pointers.has(event.pointerId);if(!known)return false;
 const hadPinch=pinchSeen||pointers.size>=2;pointers.delete(event.pointerId);
 if(cancelled){
  state.cancellations++;pinchSeen=false;handoff=null;state.lastGesture='pinch-cancel';
  if(pointers.size===0)state.lastRemainingPointer=null;
  return true;
 }
 if(pointers.size>=2){pinchSeen=true;handoff=null;return true}
 if(pointers.size===1&&hadPinch){
  const [pointerId,p]=pointers.entries().next().value;
  handoff={pointerId,startX:p.x,startY:p.y,x:p.x,y:p.y,engaged:false};pinchSeen=false;state.handoffs++;state.lastRemainingPointer=pointerId;state.lastGesture='pinch-handoff';return true;
 }
 pinchSeen=false;handoff=null;if(pointers.size===0)state.lastRemainingPointer=null;return true;
}
function up(event){finish(event,false)}
function cancel(event){finish(event,true)}
function lostCapture(event){
 if(!pointers.has(event.pointerId))return;
 state.captureLosses++;finish(event,true);
}
function detach(status='detached'){
 const target=boundCanvas;if(!target)return;
 target.removeEventListener('pointerdown',down,false);target.removeEventListener('pointermove',move,false);target.removeEventListener('pointerup',up,false);target.removeEventListener('pointercancel',cancel,false);target.removeEventListener('lostpointercapture',lostCapture,false);
 if(target.dataset.ofuPinchHandoffInstance===String(instanceSerial)){delete target.dataset.ofuPinchHandoff;delete target.dataset.ofuPinchHandoffInstance;}
 boundCanvas=null;state.ready=false;state.attachStatus=status;
}
function dispose(reason='disposed'){
 if(disposed)return;disposed=true;if(retryTimer){root.clearTimeout(retryTimer);retryTimer=0}detach('disposed');pointers.clear();handoff=null;pinchSeen=false;state.lastRemainingPointer=null;state.disposals++;state.lastGesture='disposed:'+reason;
}
function bind(target){
 if(disposed)return;if(boundCanvas===target&&state.ready)return;if(boundCanvas)detach('reattaching');
 canvas=target;boundCanvas=target;
 target.addEventListener('pointerdown',down,false);target.addEventListener('pointermove',move,false);target.addEventListener('pointerup',up,false);target.addEventListener('pointercancel',cancel,false);target.addEventListener('lostpointercapture',lostCapture,false);
 target.dataset.ofuPinchHandoff='ready';target.dataset.ofuPinchHandoffInstance=String(instanceSerial);state.ready=true;state.attachStatus='attached';
}
function attach(){
 if(disposed)return;state.attachAttempts++;product=O.v1LivingProduct;renderer=product?.renderer;const target=document.getElementById('living-view');
 if(!product?.snapshot||!renderer?.rotate||!target){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}retryTimer=root.setTimeout(()=>{retryTimer=0;attach()},50);return}
 bind(target);
}
const api=Object.freeze({VERSION,MAX_ATTACH_ATTEMPTS,DRAG_THRESHOLD_PX,instanceSerial,state,attach,dispose,snapshot:()=>Object.freeze({...state,activePointers:pointers.size,pinchSeen,handoffActive:!!handoff,handoffPointerId:handoff?.pointerId??null,handoffEngaged:!!handoff?.engaged,thresholdPx:DRAG_THRESHOLD_PX,activeOwner:root[OWNER_KEY]===api,boundCanvasId:boundCanvas?.id||null,disposed})});
const previous=root[OWNER_KEY];if(previous&&previous!==api)previous.dispose?.('superseded');root[OWNER_KEY]=api;O.v11LivingPinchHandoff=api;root.__OFU_LIVING_PINCH_HANDOFF__=api;attach();
})(typeof globalThis!=='undefined'?globalThis:this);
