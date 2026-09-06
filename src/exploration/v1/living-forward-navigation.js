(function(root){
'use strict';
const O=root.OFU=root.OFU||{},Base=O.v1LivingRuntime;
if(!Base)throw new Error('Living forward navigation requires v1 Living runtime');
if(Base.FORWARD_NAVIGATION_VERSION)return;
const VERSION='ofu-v11-living-forward-navigation-1';
const HISTORY_METHODS=new Set(['activate','enterGalaxy','enterRegion','enterNeighborhood','enterSystem','enterBody','enterKey','approach','inspectAtmosphere','scale','enterMicro','deeper','time']);
const CONDITIONAL_HISTORY_METHODS=new Set(['setContinuousDistance','setNavigationCoordinate','travelBy']);
const NON_HISTORY_MUTATIONS=new Set(['setCanonicalSelection','selectObject','nextPage','nextWindow']);
function stable(value){if(value===null||value===undefined)return null;if(typeof value==='bigint')return value.toString();if(typeof value==='number')return Number.isFinite(value)?Number(value.toPrecision(15)):String(value);return String(value)}
function fingerprint(s){return JSON.stringify({
 stage:s.stage,node:s.node?.entityId||null,galaxy:s.galaxy?.entityId||s.galaxy?.canonicalId||null,region:s.region?.entityId||null,
 neighborhood:s.neighborhood?.entityId||null,system:s.system?.entityId||s.system?.canonicalId||null,body:s.body?.entityId||s.body?.canonicalId||null,
 point:s.point?.locationIdentity||null,object:s.selectedObjectId||null,epoch:s.world?.civilization?.epoch??null,semanticScale:s.semanticScale,distance:stable(s.continuousDistanceRadii)
})}
function create(options={}){
 const raw=Base.create(options),known=[],forward=[],listeners=new Set();let suppress=0,forwardCount=0,invalidations=0;
 const limit=Math.max(8,Math.min(Number(raw.snapshot().maxHistory||Base.MAX_HISTORY||64),Number(Base.MAX_HISTORY||64)));
 function trim(stack){while(stack.length>limit)stack.shift()}
 function decorated(){const s=raw.snapshot();return Object.freeze({...s,forwardDepth:forward.length,forwardKnownDepth:known.length,forwardNavigationVersion:VERSION,forwardNavigationAvailable:forward.length>0,forwardCount,forwardInvalidations:invalidations})}
 function notify(){const s=decorated();for(const fn of listeners)fn(s);return s}
 function invalidate(){if(known.length||forward.length)invalidations++;known.length=0;forward.length=0}
 raw.onChange(()=>{if(suppress)return;invalidate();notify()});
 function onChange(fn){if(typeof fn!=='function')throw new TypeError('Living forward navigation listener required');listeners.add(fn);return()=>listeners.delete(fn)}
 function record(name,args,after){known.push(Object.freeze({name,args:Object.freeze([...args]),after:fingerprint(after)}));trim(known);forward.length=0}
 function historyWasPushed(name,args,before,after){if(after.revision===before.revision)return false;if(HISTORY_METHODS.has(name))return true;if(name==='navigate'||name==='at')return args[1]?.push!==false;if(CONDITIONAL_HISTORY_METHODS.has(name))return after.stage!==before.stage;return false}
 function invoke(name,args){
  const fn=raw[name];if(typeof fn!=='function')throw new Error('Living forward navigation missing runtime method '+name);
  const before=raw.snapshot();suppress++;let result;
  try{result=fn(...args)}finally{suppress--}
  const after=raw.snapshot();
  if(historyWasPushed(name,args,before,after))record(name,args,after);
  else if(after.revision!==before.revision&&NON_HISTORY_MUTATIONS.has(name)||after.revision!==before.revision&&CONDITIONAL_HISTORY_METHODS.has(name))invalidate();
  return notify();
 }
 function back(){
  const before=raw.snapshot();if(!before.historyDepth)return decorated();
  const descriptor=known.length?known.pop():null,priorForward=[...forward];
  if(descriptor){forward.push(descriptor);trim(forward)}else forward.length=0;
  suppress++;
  try{raw.back()}catch(error){if(descriptor)known.push(descriptor);forward.splice(0,forward.length,...priorForward);throw error}finally{suppress--}
  return notify();
 }
 function forwardTravel(){
  if(!forward.length)return decorated();
  const descriptor=forward.pop(),priorKnown=[...known];known.push(descriptor);trim(known);suppress++;
  try{
   const fn=raw[descriptor.name];if(typeof fn!=='function')throw new Error('Forward replay method unavailable: '+descriptor.name);
   fn(...descriptor.args);
   const after=raw.snapshot();
   if(fingerprint(after)!==descriptor.after){try{raw.back()}catch{}throw new Error('Forward replay failed exact Living context verification')}
   forwardCount++;
  }catch(error){known.splice(0,known.length,...priorKnown);forward.push(descriptor);invalidations++;throw error}finally{suppress--}
  return notify();
 }
 const overrides={};
 for(const name of [...HISTORY_METHODS,...CONDITIONAL_HISTORY_METHODS,...NON_HISTORY_MUTATIONS,'navigate','at'])if(typeof raw[name]==='function')overrides[name]=(...args)=>invoke(name,args);
 return Object.freeze({...raw,...overrides,snapshot:decorated,onChange,back,forward:forwardTravel,FORWARD_NAVIGATION_VERSION:VERSION});
}
O.v1LivingRuntime=Object.freeze({...Base,FORWARD_NAVIGATION_VERSION:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
