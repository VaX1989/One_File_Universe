(function(root){
'use strict';
const DOC=root.document,O=root.OFU=root.OFU||{};
if(!DOC||root.__OFU_V11_WHEEL_NORMALIZATION__)return;
const VERSION='ofu-v11-wheel-normalization-1',PIXEL=0,LINE=1,PAGE=2,normalizedEvents=new WeakSet();
const state={version:VERSION,authority:'PRESENTATION_ONLY',strategy:'UNIT_AWARE_REDISPATCH_TO_SHIPPING_PIXEL_WHEEL_PATH',lineEvents:0,pageEvents:0,redispatchedEvents:0,ignoredEvents:0,maxAbsNormalizedDeltaY:0};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function livingTarget(event){
 const path=typeof event?.composedPath==='function'?event.composedPath():[];
 return path.find(node=>node?.id==='living-view')||(event?.target?.id==='living-view'?event.target:null);
}
function factorFor(event,target){
 if(event.deltaMode===LINE)return 40;
 if(event.deltaMode===PAGE){const height=Number(target?.clientHeight)||Number(root.innerHeight)||360;return clamp(height*.8,240,600);}
 return 1;
}
function clonePixelWheel(event,target){
 const factor=factorFor(event,target),deltaY=clamp(Number(event.deltaY)*factor,-300,300),deltaX=clamp(Number(event.deltaX||0)*factor,-300,300);
 if(!Number.isFinite(deltaY)||!Number.isFinite(deltaX))return null;
 state.maxAbsNormalizedDeltaY=Math.max(state.maxAbsNormalizedDeltaY,Math.abs(deltaY));
 return new WheelEvent('wheel',{bubbles:true,cancelable:true,composed:true,deltaMode:PIXEL,deltaX,deltaY,deltaZ:0,clientX:Number(event.clientX)||0,clientY:Number(event.clientY)||0,screenX:Number(event.screenX)||0,screenY:Number(event.screenY)||0,ctrlKey:!!event.ctrlKey,shiftKey:!!event.shiftKey,altKey:!!event.altKey,metaKey:!!event.metaKey});
}
function normalize(event){
 if(normalizedEvents.has(event))return;
 const target=livingTarget(event);
 if(!target||event.deltaMode===PIXEL){state.ignoredEvents++;return;}
 if(event.deltaMode!==LINE&&event.deltaMode!==PAGE){state.ignoredEvents++;return;}
 const synthetic=clonePixelWheel(event,target);if(!synthetic){state.ignoredEvents++;return;}
 event.preventDefault();event.stopImmediatePropagation();
 if(event.deltaMode===LINE)state.lineEvents++;else state.pageEvents++;
 state.redispatchedEvents++;normalizedEvents.add(synthetic);target.dispatchEvent(synthetic);
}
DOC.addEventListener('wheel',normalize,{capture:true,passive:false});
const api=Object.freeze({VERSION,AUTHORITY:'PRESENTATION_ONLY',strategy:state.strategy,snapshot:()=>Object.freeze({...state})});
O.v11LivingWheelNormalization=api;root.__OFU_V11_WHEEL_NORMALIZATION__=api;
})(typeof globalThis!=='undefined'?globalThis:this);
