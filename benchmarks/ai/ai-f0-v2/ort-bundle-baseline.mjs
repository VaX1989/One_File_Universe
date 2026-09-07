const HEX64=/^[a-f0-9]{64}$/;
function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
function exactAsset(a,name){return exact(a,['name','bytes','sha256'])&&a.name===name&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&typeof a.sha256==='string'&&HEX64.test(a.sha256);}
export const ORT_BUNDLE_BASELINE=Object.freeze({package:'onnxruntime-web',version:'1.29.0',bundleJsName:'ort.wasm.bundle.min.mjs',wasmName:'ort-wasm-simd-threaded.wasm',numThreads:1,proxy:false,wasmBinary:true,wasmPaths:false,executionProvider:'wasm',shippingPromotion:false});
export function validateOrtBundlePin(x){
  const keys=['package','version','bundleJs','wasm','numThreads','proxy','wasmBinarySupplied','wasmPathsConfigured','executionProvider','networkFallbackConfigured'];
  if(!exact(x,keys))return Object.freeze({ok:false,reason:'ORT_BUNDLE_SCHEMA'});
  if(x.package!=='onnxruntime-web'||x.version!=='1.29.0')return Object.freeze({ok:false,reason:'ORT_BUNDLE_VERSION_PIN'});
  if(!exactAsset(x.bundleJs,ORT_BUNDLE_BASELINE.bundleJsName))return Object.freeze({ok:false,reason:'ORT_BUNDLE_JS_IDENTITY'});
  if(!exactAsset(x.wasm,ORT_BUNDLE_BASELINE.wasmName))return Object.freeze({ok:false,reason:'ORT_BUNDLE_WASM_IDENTITY'});
  if(x.numThreads!==1)return Object.freeze({ok:false,reason:'ORT_BUNDLE_SINGLE_THREAD_REQUIRED'});
  if(x.proxy!==false)return Object.freeze({ok:false,reason:'ORT_BUNDLE_PROXY_FORBIDDEN'});
  if(x.wasmBinarySupplied!==true)return Object.freeze({ok:false,reason:'ORT_BUNDLE_WASM_BINARY_REQUIRED'});
  if(x.wasmPathsConfigured!==false)return Object.freeze({ok:false,reason:'ORT_BUNDLE_WASM_PATHS_FORBIDDEN'});
  if(x.executionProvider!=='wasm')return Object.freeze({ok:false,reason:'ORT_BUNDLE_WASM_EP_REQUIRED'});
  if(x.networkFallbackConfigured!==false)return Object.freeze({ok:false,reason:'ORT_BUNDLE_NETWORK_FALLBACK_FORBIDDEN'});
  return Object.freeze({ok:true,reason:'ORT_1_29_EMBEDDED_WASM_JS_PLUS_BINARY_PINNED',embeddedWasmJs:true,workerSpawnExpected:false,shippingPromotion:false});
}
