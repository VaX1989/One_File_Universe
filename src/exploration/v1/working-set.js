(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1-exploration-working-set-1';
const TIERS=Object.freeze(['COLD','WARM','HOT','IMMEDIATE']);
const DEFAULT_CAPS=Object.freeze({COLD:96,WARM:48,HOT:24,IMMEDIATE:8});
function assert(ok,message){if(!ok)throw new Error('v1 exploration working set: '+message)}
function tier(value){const t=String(value||'WARM').toUpperCase();assert(TIERS.includes(t),'invalid lifecycle tier '+t);return t}
function positiveInt(value,label,max=1000000){const n=Number(value);assert(Number.isSafeInteger(n)&&n>=0&&n<=max,label);return n}
function key(value){const k=String(value||'');assert(k.length>0&&k.length<=512,'bounded cache key');return k}
function create({caps=DEFAULT_CAPS,maxRequests=8}={}){
 const limits={};for(const t of TIERS)limits[t]=positiveInt(caps[t]??DEFAULT_CAPS[t],t+' cap',1024);
 maxRequests=positiveInt(maxRequests,'request cap',64);assert(maxRequests>0,'positive request cap');
 const entries=new Map(),requests=new Map(),metrics={gets:0,hits:0,puts:0,evictions:0,promotions:0,demotions:0,requests:0,cancellations:0,completions:0};let clock=0,requestSequence=0;
 function counts(){const out={COLD:0,WARM:0,HOT:0,IMMEDIATE:0};for(const e of entries.values())out[e.tier]++;return out}
 function enforce(targetTier){const c=counts();for(const t of TIERS){while(c[t]>limits[t]){let victim=null;for(const e of entries.values())if(e.tier===t&&(!victim||e.touched<victim.touched||(e.touched===victim.touched&&e.key<victim.key)))victim=e;if(!victim)break;entries.delete(victim.key);c[t]--;metrics.evictions++;}}
 if(targetTier&&c[targetTier]>limits[targetTier])throw new Error('working-set cap enforcement failed');
 }
 function put(cacheKey,value,{lifecycle='WARM',identity=null}={}){cacheKey=key(cacheKey);const t=tier(lifecycle),prev=entries.get(cacheKey);if(prev)entries.delete(cacheKey);entries.set(cacheKey,{key:cacheKey,value,identity:identity===null?cacheKey:String(identity),tier:t,touched:++clock,created:prev?.created??clock});metrics.puts++;enforce(t);return value}
 function get(cacheKey,{promote=null}={}){cacheKey=key(cacheKey);metrics.gets++;const e=entries.get(cacheKey);if(!e)return null;metrics.hits++;e.touched=++clock;if(promote!==null){const next=tier(promote),before=TIERS.indexOf(e.tier),after=TIERS.indexOf(next);if(before!==after){if(after>before)metrics.promotions++;else metrics.demotions++;e.tier=next;enforce(next)}}return e.value}
 function has(cacheKey){return entries.has(key(cacheKey))}
 function setLifecycle(cacheKey,lifecycle){cacheKey=key(cacheKey);const e=entries.get(cacheKey);if(!e)return false;const next=tier(lifecycle),before=TIERS.indexOf(e.tier),after=TIERS.indexOf(next);if(before!==after){if(after>before)metrics.promotions++;else metrics.demotions++;e.tier=next;e.touched=++clock;enforce(next)}return true}
 function remove(cacheKey){return entries.delete(key(cacheKey))}
 function clearLifecycle(lifecycle){const t=tier(lifecycle);let n=0;for(const [k,e] of entries)if(e.tier===t){entries.delete(k);n++}return n}
 function request(requestKey,executor,{lifecycle='HOT',replace=true}={}){requestKey=key(requestKey);assert(typeof executor==='function','request executor required');if(requests.has(requestKey)){if(!replace)return requests.get(requestKey).public;cancel(requestKey,'REPLACED')}
 while(requests.size>=maxRequests){let oldest=null;for(const r of requests.values())if(!oldest||r.sequence<oldest.sequence)oldest=r;if(!oldest)break;cancel(oldest.key,'QUEUE_CAP')}
 const record={key:requestKey,sequence:++requestSequence,cancelled:false,reason:null,completed:false};metrics.requests++;
 const signal=Object.freeze({get cancelled(){return record.cancelled},get reason(){return record.reason},throwIfCancelled(){if(record.cancelled)throw new Error('exploration request cancelled: '+record.reason)}});
 const publicRecord=Object.freeze({id:record.sequence,key:requestKey,signal,cancel:(reason='CALLER')=>cancel(requestKey,reason)});record.public=publicRecord;requests.set(requestKey,record);
 Promise.resolve().then(()=>executor(signal)).then(value=>{if(record.cancelled)return;record.completed=true;metrics.completions++;put(requestKey,value,{lifecycle});requests.delete(requestKey)}).catch(error=>{record.error=error;requests.delete(requestKey)});
 return publicRecord;
 }
 function cancel(requestKey,reason='OBSOLETE'){requestKey=key(requestKey);const r=requests.get(requestKey);if(!r)return false;r.cancelled=true;r.reason=String(reason);requests.delete(requestKey);metrics.cancellations++;return true}
 function cancelAll(reason='OBSOLETE'){for(const k of [...requests.keys()])cancel(k,reason)}
 function snapshot(){const c=counts(),byLifecycle={};for(const t of TIERS)byLifecycle[t]=Object.freeze([...entries.values()].filter(e=>e.tier===t).sort((a,b)=>b.touched-a.touched).map(e=>Object.freeze({key:e.key,identity:e.identity,touched:e.touched})));return Object.freeze({version:VERSION,tiers:TIERS,caps:Object.freeze({...limits}),counts:Object.freeze(c),entries:entries.size,requestCap:maxRequests,pendingRequests:requests.size,metrics:Object.freeze({...metrics}),byLifecycle:Object.freeze(byLifecycle)});}
 return Object.freeze({VERSION,TIERS,put,get,has,setLifecycle,remove,clearLifecycle,request,cancel,cancelAll,snapshot});
}
O.v1ExplorationWorkingSet=Object.freeze({VERSION,TIERS,DEFAULT_CAPS,create});
})(typeof globalThis!=='undefined'?globalThis:this);
