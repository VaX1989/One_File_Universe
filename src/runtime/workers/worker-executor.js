(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,R=O.v2x01Contracts,V='ofu-v2x01-worker-executor-4';
if(!C||!R)throw Error('V2X-01 worker dependencies');
function err(c,m){const e=Error('OFU V2X-01 '+c+': '+m);e.code=c;return e}
function detachedErr(c,m,run){const e=err(c,m);e.detached=run;return e}
function create(o={}){
  C.keys(o,[],['maxPayloadBytes','maxChunkBytes','maxStreamChunks','timeoutMs']);
  const maxPayload=R.integer(o.maxPayloadBytes??R.DEFAULTS.taskBytes,'worker payload',1,R.HARD.taskBytes),maxChunk=R.integer(o.maxChunkBytes??maxPayload,'worker stream chunk',1,R.HARD.taskBytes),maxChunks=R.integer(o.maxStreamChunks??256,'worker stream chunks',1,4096),timeout=R.integer(o.timeoutMs??10000,'worker timeout',1,120000),h=new Map(),m={workerRuns:0,fallbackRuns:0,cancelled:0,timeouts:0,failures:0,streamWorkerRuns:0,streamFallbackRuns:0,streamChunks:0,streamAcks:0,streamFailures:0};
  function register(x){
    C.keys(x,['id','version','direct'],['workerProgram','directStream','workerStreamProgram']);
    const id=C.token(x.id),version=C.version(x.version);C.assert(typeof x.direct==='function'&&!h.has(id),'SCHEMA','worker handler');
    if(x.workerProgram!=null)C.assert(typeof x.workerProgram==='string'&&x.workerProgram.length<=65536,'BUDGET','worker program');
    if(x.directStream!=null)C.assert(typeof x.directStream==='function','SCHEMA','direct stream handler');
    if(x.workerStreamProgram!=null)C.assert(typeof x.workerStreamProgram==='string'&&x.workerStreamProgram.length<=65536,'BUDGET','worker stream program');
    if(x.workerStreamProgram!=null)C.assert(typeof x.directStream==='function','SCHEMA','worker stream requires direct fallback');
    const v=Object.freeze({id,version,direct:x.direct,workerProgram:x.workerProgram||null,directStream:x.directStream||null,workerStreamProgram:x.workerStreamProgram||null});h.set(id,v);return v;
  }
  function capableProgram(program){return !!(program&&root.Worker&&root.Blob&&root.URL?.createObjectURL&&root.URL?.revokeObjectURL)}
  function capable(v){return capableProgram(v.workerProgram)}
  function streamCapable(v){return capableProgram(v.workerStreamProgram)}
  async function direct(v,p,s){
    if(s?.aborted)throw err('CANCELLED','before fallback');m.fallbackRuns++;let timer=null,abort=null;const run=Promise.resolve().then(()=>v.direct(p,s)),guards=[];
    guards.push(new Promise((_,reject)=>{timer=setTimeout(()=>{m.timeouts++;reject(detachedErr('FALLBACK_TIMEOUT',v.id,run))},timeout)}));
    if(s?.addEventListener)guards.push(new Promise((_,reject)=>{abort=()=>{m.cancelled++;reject(detachedErr('CANCELLED','fallback',run))};s.addEventListener('abort',abort,{once:true})}));
    try{return Object.freeze({mode:'SYNC_FALLBACK',value:await Promise.race([run,...guards])})}finally{clearTimeout(timer);if(abort)s?.removeEventListener?.('abort',abort)}
  }
  function worker(v,p,s){
    m.workerRuns++;const source="'use strict';const H=("+v.workerProgram+");self.onmessage=async e=>{try{self.postMessage({ok:true,value:await H(e.data.payload)})}catch(x){self.postMessage({ok:false,error:String(x&&x.message||x)})}}",url=root.URL.createObjectURL(new root.Blob([source],{type:'text/javascript'}));
    return new Promise((res,rej)=>{let w,done=false;const finish=(ok,x)=>{if(done)return;done=true;clearTimeout(t);s?.removeEventListener?.('abort',ab);try{w?.terminate()}catch{}try{root.URL.revokeObjectURL(url)}catch{}ok?res(Object.freeze({mode:'WORKER',value:x})):rej(x)},ab=()=>{m.cancelled++;finish(false,err('CANCELLED','worker'))},t=setTimeout(()=>{m.timeouts++;finish(false,err('WORKER_TIMEOUT',v.id))},timeout);s?.addEventListener?.('abort',ab,{once:true});if(s?.aborted)return ab();try{w=new root.Worker(url);w.onerror=e=>{m.failures++;finish(false,err('WORKER_FAILURE',e?.message||v.id))};w.onmessage=e=>e.data?.ok?finish(true,e.data.value):(m.failures++,finish(false,err('WORKER_FAILURE',e.data?.error||v.id)));w.postMessage({payload:p})}catch(e){m.failures++;finish(false,e)}})
  }
  function streamIterator(value,id){const it=value?.[Symbol.asyncIterator]?.()||value?.[Symbol.iterator]?.();C.assert(it&&typeof it.next==='function','STREAM','stream handler '+id+' must return an iterable');return it}
  async function directStream(v,p,onChunk,s){
    C.assert(v.directStream,'IMPLEMENTATION','stream handler '+v.id);if(s?.aborted)throw err('CANCELLED','before stream fallback');m.streamFallbackRuns++;
    const started=Date.now();let it=null,index=0;
    async function guarded(run,label){
      if(s?.aborted){m.cancelled++;throw err('CANCELLED',label)}const remaining=Math.max(0,timeout-(Date.now()-started));if(!remaining){m.timeouts++;throw err('STREAM_TIMEOUT',v.id)}
      let timer,abort;const guards=[new Promise((_,reject)=>{timer=setTimeout(()=>{m.timeouts++;reject(err('STREAM_TIMEOUT',v.id))},remaining)})];if(s?.addEventListener)guards.push(new Promise((_,reject)=>{abort=()=>{m.cancelled++;reject(err('CANCELLED',label))};s.addEventListener('abort',abort,{once:true})}));try{return await Promise.race([Promise.resolve(run),...guards])}finally{clearTimeout(timer);if(abort)s?.removeEventListener?.('abort',abort)}
    }
    try{
      const stream=await guarded(Promise.resolve().then(()=>v.directStream(p,s)),'stream start');it=streamIterator(stream,v.id);
      for(;;){const step=await guarded(it.next(),'stream next');if(step.done){const value=C.data(step.value,{bytes:maxPayload,nodes:4096});return Object.freeze({mode:'STREAM_FALLBACK',value,chunks:index})}C.assert(index<maxChunks,'STREAM_BUDGET','stream chunks');const chunk=C.data(step.value,{bytes:maxChunk,nodes:4096});m.streamChunks++;await guarded(onChunk(chunk,index),'stream backpressure');m.streamAcks++;index++}
    }catch(e){m.streamFailures++;try{await it?.return?.()}catch{}throw e}
  }
  function workerStream(v,p,onChunk,s){
    m.streamWorkerRuns++;
    const source="'use strict';const H=("+v.workerStreamProgram+");let ACK=null;self.onmessage=async e=>{if(e.data&&e.data.type==='ACK'){if(ACK&&ACK.index===e.data.index){const r=ACK.resolve;ACK=null;r()}return}if(!e.data||e.data.type!=='START')return;try{const value=await H(e.data.payload),it=(value&&value[Symbol.asyncIterator]?value[Symbol.asyncIterator]():value&&value[Symbol.iterator]?value[Symbol.iterator]():null);if(!it||typeof it.next!=='function')throw Error('stream handler must return iterable');let i=0;for(;;){const step=await it.next();if(step.done){self.postMessage({type:'DONE',value:step.value,chunks:i});break}self.postMessage({type:'CHUNK',index:i,value:step.value});await new Promise(resolve=>{ACK={index:i,resolve}});i++}}catch(x){self.postMessage({type:'ERROR',error:String(x&&x.message||x)})}}",url=root.URL.createObjectURL(new root.Blob([source],{type:'text/javascript'}));
    return new Promise((res,rej)=>{let w,done=false,expected=0,processing=Promise.resolve();const finish=(ok,x)=>{if(done)return;done=true;clearTimeout(t);s?.removeEventListener?.('abort',ab);try{w?.terminate()}catch{}try{root.URL.revokeObjectURL(url)}catch{}ok?res(x):rej(x)},ab=()=>{m.cancelled++;finish(false,err('CANCELLED','worker stream'))},t=setTimeout(()=>{m.timeouts++;finish(false,err('STREAM_TIMEOUT',v.id))},timeout);s?.addEventListener?.('abort',ab,{once:true});if(s?.aborted)return ab();try{
      w=new root.Worker(url);w.onerror=e=>{m.streamFailures++;finish(false,err('WORKER_STREAM_FAILURE',e?.message||v.id))};w.onmessage=e=>{const d=e.data||{};if(d.type==='CHUNK'){processing=processing.then(async()=>{if(done)return;C.assert(d.index===expected,'STREAM_ORDER','worker stream chunk order');C.assert(expected<maxChunks,'STREAM_BUDGET','stream chunks');const chunk=C.data(d.value,{bytes:maxChunk,nodes:4096});m.streamChunks++;await onChunk(chunk,expected);if(done)return;m.streamAcks++;w.postMessage({type:'ACK',index:expected});expected++}).catch(error=>{m.streamFailures++;finish(false,error)});return}if(d.type==='DONE'){processing.then(()=>{if(done)return;C.assert(d.chunks===expected,'STREAM_ORDER','worker stream final count');const value=C.data(d.value,{bytes:maxPayload,nodes:4096});finish(true,Object.freeze({mode:'WORKER_STREAM',value,chunks:expected}))}).catch(error=>{m.streamFailures++;finish(false,error)});return}if(d.type==='ERROR'){m.streamFailures++;finish(false,err('WORKER_STREAM_FAILURE',d.error||v.id))}};w.postMessage({type:'START',payload:p})
    }catch(e){m.streamFailures++;finish(false,e)}})
  }
  function canRunWorker(id){const v=h.get(C.token(id));C.assert(v,'IMPLEMENTATION','worker handler');return capable(v)}
  function canRunStreamWorker(id){const v=h.get(C.token(id));C.assert(v,'IMPLEMENTATION','worker handler');return streamCapable(v)}
  async function execute(x){C.keys(x,['handlerId','payload'],['signal','preferWorker']);if(x.preferWorker!==undefined)C.assert(typeof x.preferWorker==='boolean','SCHEMA','preferWorker');const v=h.get(C.token(x.handlerId));C.assert(v,'IMPLEMENTATION','worker handler');const p=C.data(x.payload,{bytes:maxPayload,nodes:4096});return x.preferWorker!==false&&capable(v)?worker(v,p,x.signal):direct(v,p,x.signal)}
  async function executeStream(x){C.keys(x,['handlerId','payload','onChunk'],['signal','preferWorker']);if(x.preferWorker!==undefined)C.assert(typeof x.preferWorker==='boolean','SCHEMA','preferWorker');C.assert(typeof x.onChunk==='function','SCHEMA','stream onChunk');const v=h.get(C.token(x.handlerId));C.assert(v&&v.directStream,'IMPLEMENTATION','stream handler');const p=C.data(x.payload,{bytes:maxPayload,nodes:4096});return x.preferWorker!==false&&streamCapable(v)?workerStream(v,p,x.onChunk,x.signal):directStream(v,p,x.onChunk,x.signal)}
  function snapshot(){return C.data({version:V,limits:{maxPayloadBytes:maxPayload,maxChunkBytes:maxChunk,maxStreamChunks:maxChunks,timeoutMs:timeout},available:{worker:!!root.Worker,blobWorker:!!(root.Worker&&root.Blob&&root.URL?.createObjectURL&&root.URL?.revokeObjectURL)},handlers:[...h.values()].map(x=>({id:x.id,version:x.version,workerCapable:!!x.workerProgram,streamCapable:!!x.workerStreamProgram})),metrics:m})}
  return Object.freeze({VERSION:V,register,canRunWorker,canRunStreamWorker,execute,executeStream,snapshot})
}
O.v2x01WorkerExecutor=Object.freeze({VERSION:V,create})
})(globalThis);
