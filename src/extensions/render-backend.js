(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;if(!C)throw new Error('PX contracts required');
const VERSION='ofu-px-render-backend-1',passes=new Map();let sealed=false;
function resourceOwner({maxResources=256,maxBytes=16777216}={}){
 C.assert(Number.isSafeInteger(maxResources)&&maxResources>0&&maxResources<=4096&&Number.isSafeInteger(maxBytes)&&maxBytes>0&&maxBytes<=67108864,'BUDGET','GPU allocation limits');
 const resources=new Map();let bytes=0,generation=1,valid=true,disposed=false,allocating=false,created=0,destroyed=0,invalidated=0,cleanupFailures=0;
 function allocate(specs){C.assert(valid,'CONTEXT_LOST','allocation on lost context');C.assert(!disposed&&!allocating,'ALLOCATION','disposed or reentrant allocation');C.assert(Array.isArray(specs)&&specs.length<=maxResources,'BUDGET','allocation batch');let addition=0;const keys=new Set();
  for(const s of specs){C.token(s.id);C.assert(!resources.has(s.id)&&!keys.has(s.id),'COLLISION',s.id);keys.add(s.id);C.assert(Number.isSafeInteger(s.bytes)&&s.bytes>=0&&typeof s.create==='function'&&typeof s.destroy==='function','ALLOCATION','descriptor');addition+=s.bytes;}
  C.assert(resources.size+specs.length<=maxResources&&bytes+addition<=maxBytes,'BUDGET','pre-allocation bounds');
  const pending=[],startedGeneration=generation;allocating=true;
  try{for(const spec of specs){const handle=spec.create();C.assert(handle!==null&&handle!==undefined,'ALLOCATION','create failed');created++;pending.push({...spec,handle,generation:startedGeneration});C.assert(valid&&generation===startedGeneration,'CONTEXT_LOST','loss during allocation');}}
  catch(error){for(const r of pending.reverse()){if(valid&&generation===startedGeneration){try{r.destroy(r.handle);destroyed++;}catch{cleanupFailures++;resources.set(r.id,r);bytes+=r.bytes;}}else invalidated++;}throw error;}
  finally{allocating=false;}
  for(const r of pending)resources.set(r.id,r);bytes+=addition;return Object.freeze(pending.map(r=>Object.freeze({id:r.id,generation:r.generation,handle:r.handle})));
 }
 // A failed deletion retains ownership and budget pressure. It is not counted
 // as cleanup until a retry succeeds or an actual context loss invalidates it.
 function release(id){const r=resources.get(id);if(!r)return false;C.assert(valid,'CONTEXT_LOST','release on lost context');try{r.destroy(r.handle);}catch(error){cleanupFailures++;throw error;}resources.delete(id);bytes-=r.bytes;destroyed++;return true;}
 function lose(){if(!valid)return;valid=false;invalidated+=resources.size;resources.clear();bytes=0;}
 function restore(){C.assert(!valid&&!disposed&&!allocating,'CONTEXT','restore requires loss, not disposal');generation++;valid=true;}
 function dispose(){disposed=true;let failure=null;for(const id of [...resources.keys()])try{release(id);}catch(error){failure=error;}if(failure)throw failure;valid=false;return snapshot();}
 function snapshot(){return Object.freeze({generation,valid,disposed,liveResources:resources.size,trackedBytes:bytes,maxResources,maxBytes,created,destroyed,invalidated,cleanupFailures,accountingExact:created===destroyed+invalidated+resources.size,physicalVRAM:'NOT_MEASURABLE'});}
 return Object.freeze({allocate,release,lose,restore,dispose,snapshot});
}
function register(input,implementation){C.assert(!sealed,'REGISTRY_SEALED','renderer registrations');const d=C.data(input);C.keys(d,['id','pass','backend','authority','maxMeshes','maxBytes','optional']);C.token(d.id);C.token(d.pass);C.assert(d.authority==='PRESENTATION_ONLY','AUTHORITY','renderer');C.assert(['webgl2','webgpu-enhanced'].includes(d.backend),'BACKEND','supported contract');C.assert(typeof d.optional==='boolean'&&Number.isSafeInteger(d.maxMeshes)&&d.maxMeshes>0&&d.maxMeshes<=512&&Number.isSafeInteger(d.maxBytes)&&d.maxBytes>0&&d.maxBytes<=67108864,'BUDGET','renderer');C.assert(!(d.backend==='webgpu-enhanced'&&!d.optional),'BACKEND','WebGPU must remain optional');const key=d.pass+'/'+d.backend;C.assert(!passes.has(key),'COLLISION',key);C.assert(implementation&&['render','snapshot','dispose'].every(k=>typeof implementation[k]==='function'),'IMPLEMENTATION','renderer');passes.set(key,Object.freeze({descriptor:d,render:implementation.render,snapshot:implementation.snapshot,dispose:implementation.dispose}));}
function seal(){C.assert([...passes.values()].some(p=>p.descriptor.backend==='webgl2'&&!p.descriptor.optional),'BACKEND','strict portable baseline required');sealed=true;return capabilities();}
function capabilities(){return C.data({version:VERSION,sealed,authority:'PRESENTATION_ONLY',baseline:'WebGL2 Strict',optional:'WebGPU Enhanced',webgpuAPIExposed:!!root.navigator?.gpu,webgpuImplemented:[...passes.values()].some(p=>p.descriptor.backend==='webgpu-enhanced'),passes:[...passes.values()].map(p=>p.descriptor).sort((a,b)=>a.id<b.id?-1:1),scientificStateAccess:'NONE'});}
function render(pass,canvas,session,camera,options={}){
 C.assert(sealed,'REGISTRY_UNSEALED','backend host');const requested=options.enhanced===true?'webgpu-enhanced':'webgl2',impl=passes.get(pass+'/'+requested)||passes.get(pass+'/webgl2');C.assert(impl,'BACKEND','no portable pass '+pass);
 const d=impl.descriptor;C.assert(session&&session.active instanceof Map,'REPRESENTATION','bounded render session');
 C.assert(session.active.size<=d.maxMeshes,'BUDGET','active meshes before render');
 const before=typeof session.provider?.planetId==='string'?session.provider.planetId:null;
 const reserve=pass==='surface'?32768:0;const bounded={...options,maxGpuMeshes:Math.min(options.maxGpuMeshes||d.maxMeshes,d.maxMeshes),maxGpuBytes:Math.min(options.maxGpuBytes||d.maxBytes,d.maxBytes-reserve)};
 const result=impl.render(canvas,session,camera,bounded);C.assert(result&&typeof result.backend==='string','BACKEND','missing render result');
 if(options.requireStrict)C.assert(result.backend==='webgl2'||result.backend==='webgl2-local-surface'||result.backend==='webgpu-enhanced','BACKEND','strict render evidence unavailable');
 if(before!==null)C.assert(session.provider.planetId===before,'IDENTITY','renderer changed provider identity');
 const gpu=impl.snapshot(canvas)?.gpu;if(gpu){const used=gpu.totalTrackedBytes??gpu.liveTrackedBytes??0;C.assert(used<=d.maxBytes&&gpu.liveMeshes<=d.maxMeshes&&gpu.lifecycleAccountingExact!==false,'BUDGET','tracked renderer allocation');}
 return result;
}
function dispose(pass,canvas){const p=passes.get(pass+'/webgl2');C.assert(p,'BACKEND',pass);return p.dispose(canvas);}
O.pxRenderBackend=Object.freeze({VERSION,resourceOwner,register,seal,capabilities,render,dispose});
})(globalThis);
