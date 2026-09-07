(function(root){
'use strict';
const DOC=root.document,O=root.OFU=root.OFU||{};
if(!DOC||root.__OFU_V11_TOUCH_CONTINUITY__)return;
const VERSION='ofu-v11-touch-continuity-1',THRESHOLD_PX=5,pointers=new Map();
const state={version:VERSION,authority:'PRESENTATION_ONLY',strategy:'PINCH_RELEASE_PROMOTES_REMAINING_TOUCH_TO_PRESENTATION_DRAG',installed:false,promotions:0,continuationMoves:0,cancellations:0,activePointers:0,continuationPointer:null};
let canvas=null,continuation=null,hadPinch=false,observer=null;
const point=e=>{const rect=canvas?.getBoundingClientRect?.();return{x:Number(e.clientX)-(rect?.left||0),y:Number(e.clientY)-(rect?.top||0),pointerType:String(e.pointerType||'')};};
const supported=e=>e.pointerType==='touch'||e.pointerType==='pen';
const snapshot=()=>Object.freeze({...state,activePointers:pointers.size,continuationPointer:continuation?.id??null});
function clearContinuation(){continuation=null;state.continuationPointer=null;}
function onDown(e){
 if(!supported(e))return;
 const p=point(e);pointers.set(e.pointerId,p);state.activePointers=pointers.size;
 if(pointers.size>=2){hadPinch=true;clearContinuation();}
}
function onMove(e){
 if(!supported(e)||!pointers.has(e.pointerId))return;
 const p=point(e),previous=pointers.get(e.pointerId);pointers.set(e.pointerId,p);state.activePointers=pointers.size;
 if(!continuation||continuation.id!==e.pointerId||pointers.size!==1)return;
 const total=Math.hypot(p.x-continuation.startX,p.y-continuation.startY),dx=p.x-continuation.lastX,dy=p.y-continuation.lastY;
 continuation.lastX=p.x;continuation.lastY=p.y;
 if(!continuation.engaged&&total<=THRESHOLD_PX)return;
 continuation.engaged=true;
 if(!dx&&!dy)return;
 const renderer=O.v1LivingProduct?.renderer;if(!renderer?.rotate)return;
 renderer.rotate(dx,dy);state.continuationMoves++;
}
function finish(e,cancelled=false){
 if(!supported(e)||!pointers.has(e.pointerId))return;
 const before=pointers.size;pointers.delete(e.pointerId);state.activePointers=pointers.size;
 if(cancelled){state.cancellations++;clearContinuation();hadPinch=pointers.size>=2;return;}
 if(before>=2&&pointers.size===1&&hadPinch){
  const [id,p]=pointers.entries().next().value;continuation={id,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,engaged:false};state.promotions++;state.continuationPointer=id;hadPinch=false;return;
 }
 if(continuation?.id===e.pointerId)clearContinuation();
 if(!pointers.size){hadPinch=false;clearContinuation();}
}
function install(){
 if(state.installed)return true;
 const target=DOC.getElementById('living-view'),renderer=O.v1LivingProduct?.renderer;
 if(!target||!renderer?.rotate)return false;
 canvas=target;
 canvas.addEventListener('pointerdown',onDown,false);
 canvas.addEventListener('pointermove',onMove,false);
 canvas.addEventListener('pointerup',e=>finish(e,false),false);
 canvas.addEventListener('pointercancel',e=>finish(e,true),false);
 canvas.addEventListener('lostpointercapture',e=>finish(e,true),false);
 state.installed=true;observer?.disconnect?.();observer=null;return true;
}
const api=Object.freeze({VERSION,AUTHORITY:'PRESENTATION_ONLY',strategy:state.strategy,snapshot,install});
O.v11LivingTouchContinuity=api;root.__OFU_V11_TOUCH_CONTINUITY__=api;
if(!install()){
 observer=new MutationObserver(()=>install());observer.observe(DOC.documentElement,{childList:true,subtree:true});
 DOC.addEventListener('DOMContentLoaded',install,{once:true});root.setTimeout?.(install,0);
}
})(typeof globalThis!=='undefined'?globalThis:this);
