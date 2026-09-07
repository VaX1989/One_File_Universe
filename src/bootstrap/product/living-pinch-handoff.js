(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-pinch-handoff-5',MAX_ATTACH_ATTEMPTS=120,DRAG_THRESHOLD_PX=5;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,pinchStarts:0,handoffs:0,handoffMoves:0,coreOwnedMoves:0,cancellations:0,captureLosses:0,thresholdWaits:0,captureOwnedMoves:0,anchorArms:0,lastRemainingPointer:null,lastGesture:null};
let product=null,renderer=null,canvas=null,handoff=null,pinchSeen=false;
const pointers=new Map();
function position(event){const rect=canvas.getBoundingClientRect();return{x:Number.isFinite(event.clientX)?event.clientX-rect.left:Number(event.offsetX)||0,y:Number.isFinite(event.clientY)?event.clientY-rect.top:Number(event.offsetY)||0}}
function down(event){
 const before=pointers.size,p=position(event);pointers.set(event.pointerId,p);
 if(pointers.size>=2){if(before<2)state.pinchStarts++;pinchSeen=true;handoff=null;state.lastGesture='pinch'}
}
// Handoff continuation is capture-owned. The first remaining-pointer move after
// release establishes a fresh post-release anchor. This avoids turning layout,
// capture or pinch-settling drift into a synthetic drag. Once armed, movement
// must cross the same 5px threshold used by the Living core before this owner
// emits one request through the canonical RAF-paced renderer. Competing bubble
// drag owners never see handoff-owned moves.
function move(event){
 if(!pointers.has(event.pointerId))return;const p=position(event);pointers.set(event.pointerId,p);
 if(!handoff||handoff.pointerId!==event.pointerId||pointers.size!==1)return;
 const coreInput=product?.snapshot?.().input;
 if(coreInput?.lastGesture==='drag'){state.coreOwnedMoves++;handoff=null;state.lastGesture='core-drag';return}
 if(!handoff.armed){handoff.startX=p.x;handoff.startY=p.y;handoff.x=p.x;handoff.y=p.y;handoff.armed=true;state.anchorArms++;state.thresholdWaits++;state.captureOwnedMoves++;state.lastGesture='handoff-anchor';event.preventDefault();event.stopImmediatePropagation();return}
 const fromReleaseX=p.x-handoff.startX,fromReleaseY=p.y-handoff.startY;
 if(!Number.isFinite(fromReleaseX)||!Number.isFinite(fromReleaseY)){event.stopImmediatePropagation();return}
 if(Math.hypot(fromReleaseX,fromReleaseY)<DRAG_THRESHOLD_PX){state.thresholdWaits++;state.captureOwnedMoves++;state.lastGesture='handoff-threshold';handoff.x=p.x;handoff.y=p.y;event.preventDefault();event.stopImmediatePropagation();return}
 let dx,dy;
 if(!handoff.engaged){dx=fromReleaseX;dy=fromReleaseY;handoff.engaged=true}else{dx=p.x-handoff.x;dy=p.y-handoff.y}
 handoff.x=p.x;handoff.y=p.y;state.captureOwnedMoves++;
 if(Number.isFinite(dx)&&Number.isFinite(dy)&&(dx!==0||dy!==0)){renderer.rotate(dx,dy);state.handoffMoves++;state.lastGesture='handoff-drag'}
 event.preventDefault();event.stopImmediatePropagation();
}
function finish(event,cancelled=false){
 const known=pointers.has(event.pointerId);if(!known)return false;
 const hadPinch=pinchSeen||pointers.size>=2;pointers.delete(event.pointerId);
 if(cancelled){state.cancellations++;pinchSeen=false;handoff=null;state.lastGesture='pinch-cancel';if(pointers.size===0)state.lastRemainingPointer=null;return true}
 if(pointers.size>=2){pinchSeen=true;handoff=null;return true}
 if(pointers.size===1&&hadPinch){const [pointerId,p]=pointers.entries().next().value;handoff={pointerId,startX:p.x,startY:p.y,x:p.x,y:p.y,armed:false,engaged:false};pinchSeen=false;state.handoffs++;state.lastRemainingPointer=pointerId;state.lastGesture='pinch-handoff';return true}
 pinchSeen=false;handoff=null;if(pointers.size===0)state.lastRemainingPointer=null;return true;
}
function lostCapture(event){if(!pointers.has(event.pointerId))return;state.captureLosses++;finish(event,true)}
function bind(){
 canvas.addEventListener('pointerdown',down,false);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',event=>finish(event,false),false);canvas.addEventListener('pointercancel',event=>finish(event,true),false);canvas.addEventListener('lostpointercapture',lostCapture,false);
 canvas.dataset.ofuPinchHandoff='ready';state.ready=true;state.attachStatus='attached';
}
function attach(){state.attachAttempts++;product=O.v1LivingProduct;renderer=product?.renderer;canvas=document.getElementById('living-view');if(!product?.snapshot||!renderer?.rotate||!canvas){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}bind()}
const api=Object.freeze({VERSION,MAX_ATTACH_ATTEMPTS,DRAG_THRESHOLD_PX,state,snapshot:()=>Object.freeze({...state,activePointers:pointers.size,pinchSeen,handoffActive:!!handoff,handoffPointerId:handoff?.pointerId??null,handoffArmed:!!handoff?.armed,handoffEngaged:!!handoff?.engaged,thresholdPx:DRAG_THRESHOLD_PX,captureOwned:true})});
O.v11LivingPinchHandoff=api;root.__OFU_LIVING_PINCH_HANDOFF__=api;attach();
})(typeof globalThis!=='undefined'?globalThis:this);
