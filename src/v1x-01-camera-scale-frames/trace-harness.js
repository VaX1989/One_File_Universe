(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(!O.v1xCameraAuthority)throw new Error('V1X trace harness requires camera authority');
const VERSION='ofu-v1x-camera-trace-1';
const AUTHORITY='MEASURED_RUNTIME_EVIDENCE';
function stable(value){
 if(value===null||typeof value==='number'||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
 throw new TypeError('unsupported deterministic trace value');
}
function fnv1a(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
function compact(snapshot){return Object.freeze({logDistanceM:snapshot.logDistanceM,semanticScale:snapshot.semanticScale,frameId:snapshot.pose.frameId,position:snapshot.pose.position,orientation:snapshot.pose.orientation,selectionToken:snapshot.selectionToken,commandCount:snapshot.commandCount,belowWaveIVHuman:snapshot.belowWaveIVHuman,lastOperation:snapshot.lastOperation});}
function execute(camera,operation){
 if(!operation||typeof operation!=='object')throw new TypeError('trace operation required');
 const action=String(operation.action||'');
 if(action==='distance-delta')return camera.applyDistanceDelta(operation.deltaLog10M,{source:operation.source||'trace'});
 if(action==='frame-handoff')return camera.frameHandoff(operation.frameId,{source:operation.source||'trace'});
 if(action==='look')return camera.look({yawRadians:operation.yawRadians||0,pitchRadians:operation.pitchRadians||0,source:operation.source||'trace'});
 if(action==='translate')return camera.translateLocal(operation.delta,{source:operation.source||'trace'});
 if(action==='fast-travel')return camera.travelToLogDistance(operation.logDistanceM,{source:operation.source||'trace',fastTravel:operation.explicit===true});
 if(action==='intent')return camera.applyIntent(operation.intent,{source:operation.source||'trace'});
 throw new Error('unknown trace action: '+action);
}
function runTrace(camera,operations,{id='v1x-camera-trace'}={}){
 if(!camera||typeof camera.snapshot!=='function'||!Array.isArray(operations)||operations.length>1024)throw new TypeError('bounded camera trace required');
 const initial=compact(camera.snapshot()),steps=[];
 for(let i=0;i<operations.length;i++){const before=compact(camera.snapshot()),after=compact(execute(camera,operations[i]));steps.push(Object.freeze({index:i,operation:Object.freeze({...operations[i]}),before,after}));}
 const final=compact(camera.snapshot()),body=Object.freeze({contract:VERSION,authority:AUTHORITY,id:String(id),initial,steps:Object.freeze(steps),final});
 return Object.freeze({...body,digest:fnv1a(stable(body))});
}
function finiteTrace(trace){return !!trace&&trace.steps.every(step=>[...step.after.position,...step.after.orientation,step.after.logDistanceM].every(Number.isFinite));}
O.v1xCameraTrace=Object.freeze({VERSION,AUTHORITY,stable,fnv1a,compact,runTrace,finiteTrace});
})(typeof globalThis!=='undefined'?globalThis:this);
