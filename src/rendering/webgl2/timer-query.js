(function(root){
'use strict';
const O=root.OFU=root.OFU||{},VERSION='ofu-render-webgl2-timer-query-4',AUTHORITY='MEASURED_RUNTIME_EVIDENCE';
function fail(c,m){const e=new Error(m);e.code=c;throw e}function bound(v,name,min,max){v=Number(v);if(!Number.isSafeInteger(v)||v<min||v>max)fail('BUDGET','invalid '+name);return v}
function create(gl,{maxPending=64,maxLabelLength=96}={}){if(!gl)fail('WEBGL2','context required');maxPending=bound(maxPending,'maxPending',1,4096);maxLabelLength=bound(maxLabelLength,'maxLabelLength',1,256);const ext=gl.getExtension&&gl.getExtension('EXT_disjoint_timer_query_webgl2');let active=null,pending=[],completed=0,discarded=0,failedBegins=0,disposed=false;
 function begin(label='frame'){if(disposed)fail('STATE','disposed');if(active)fail('STATE','query already active');if(!ext)return Object.freeze({supported:false,reason:'EXTENSION_UNAVAILABLE'});if(pending.length>=maxPending)fail('BUDGET','pending timer queries');const q=gl.createQuery();if(!q)fail('ALLOCATE','query');const next={query:q,label:String(label).slice(0,maxLabelLength)};try{gl.beginQuery(ext.TIME_ELAPSED_EXT,q)}catch(e){failedBegins++;try{gl.deleteQuery(q)}catch{}throw e}active=next;return Object.freeze({supported:true,label:active.label})}
 function end(){if(!ext)return false;if(!active)fail('STATE','no active query');gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(active);active=null;return true}
 function discardActive(){if(!active)return;try{gl.endQuery(ext.TIME_ELAPSED_EXT)}catch{}try{gl.deleteQuery(active.query)}catch{}active=null;discarded++}
 function discardPending(){for(const item of pending)try{gl.deleteQuery(item.query)}catch{}discarded+=pending.length;pending=[]}
 function poll(){if(!ext)return Object.freeze({supported:false,status:'UNAVAILABLE',samples:Object.freeze([])});const disjoint=!!gl.getParameter(ext.GPU_DISJOINT_EXT),samples=[];if(disjoint){discardActive();discardPending();return Object.freeze({supported:true,status:'DISJOINT',samples:Object.freeze(samples)})}const keep=[];for(const item of pending){const ready=!!gl.getQueryParameter(item.query,gl.QUERY_RESULT_AVAILABLE);if(!ready){keep.push(item);continue}const ns=Number(gl.getQueryParameter(item.query,gl.QUERY_RESULT));gl.deleteQuery(item.query);if(!Number.isFinite(ns)||ns<0){discarded++;continue}completed++;samples.push(Object.freeze({label:item.label,gpuMs:ns/1e6,measurement:'GPU_TIMER_QUERY'}))}pending=keep;return Object.freeze({supported:true,status:'OK',samples:Object.freeze(samples)})}
 function dispose(){if(disposed)return snapshot();discardActive();discardPending();disposed=true;return snapshot()}
 function snapshot(){return Object.freeze({version:VERSION,authority:AUTHORITY,supported:!!ext,active:!!active,pending:pending.length,maxPending,completed,discarded,failedBegins,disposed,physicalGpuTimingSource:ext?'EXT_disjoint_timer_query_webgl2':'NOT_AVAILABLE'})}
 return Object.freeze({begin,end,poll,dispose,snapshot});
}
O.renderWebGL2TimerQuery=Object.freeze({VERSION,AUTHORITY,create});
})(typeof globalThis!=='undefined'?globalThis:this);
