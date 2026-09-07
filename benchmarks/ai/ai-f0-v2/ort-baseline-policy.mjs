const HEX64=/^[a-f0-9]{64}$/;
function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
export const ORT_BASELINE=Object.freeze({package:'onnxruntime-web',version:'1.29.0',executionProvider:'wasm',wasmAsset:'ort-wasm-simd-threaded.wasm',numThreads:1,proxy:false,wasmBinaryRequired:true,wasmPathsAllowed:false,webgpuRequired:false,shippingPromotion:false});
export function validateOrtZeroFetchConfig(c){
  const keys=['package','version','executionProvider','wasmAsset','wasmBytes','wasmSha256','numThreads','proxy','wasmBinarySupplied','wasmPathsConfigured','networkFallbackConfigured','webgpuRequired'];
  if(!exact(c,keys))return Object.freeze({ok:false,reason:'ORT_CONFIG_SCHEMA'});
  if(c.package!==ORT_BASELINE.package||c.version!==ORT_BASELINE.version)return Object.freeze({ok:false,reason:'ORT_VERSION_PIN'});
  if(c.executionProvider!=='wasm')return Object.freeze({ok:false,reason:'ORT_WASM_BASELINE_REQUIRED'});
  if(c.wasmAsset!==ORT_BASELINE.wasmAsset)return Object.freeze({ok:false,reason:'ORT_WASM_ASSET_PIN'});
  if(!Number.isSafeInteger(c.wasmBytes)||c.wasmBytes<=0||typeof c.wasmSha256!=='string'||!HEX64.test(c.wasmSha256))return Object.freeze({ok:false,reason:'ORT_WASM_IDENTITY'});
  if(c.numThreads!==1)return Object.freeze({ok:false,reason:'ORT_SINGLE_EXECUTION_THREAD_REQUIRED'});
  if(c.proxy!==false)return Object.freeze({ok:false,reason:'ORT_PROXY_WORKER_FORBIDDEN'});
  if(c.wasmBinarySupplied!==true)return Object.freeze({ok:false,reason:'ORT_WASM_BINARY_BUFFER_REQUIRED'});
  if(c.wasmPathsConfigured!==false)return Object.freeze({ok:false,reason:'ORT_WASM_PATH_FETCH_SURFACE_FORBIDDEN'});
  if(c.networkFallbackConfigured!==false)return Object.freeze({ok:false,reason:'ORT_NETWORK_FALLBACK_FORBIDDEN'});
  if(c.webgpuRequired!==false)return Object.freeze({ok:false,reason:'ORT_WEBGPU_NOT_PORTABLE_BASELINE'});
  return Object.freeze({ok:true,reason:'ORT_1_29_ZERO_FETCH_BASELINE_CONFIGURED',threadCapableBinary:true,workerSpawnExpected:false,shippingPromotion:false});
}
