const ENGINES = new Set(['chromium','firefox','webkit']);
function exactKeys(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
function safeInt(v,max=1_000_000){return Number.isSafeInteger(v)&&v>=0&&v<=max;}

export function adjudicateDirectFileAttempt(r){
  const keys=['engine','engineAvailable','originProtocol','pageExecuted','networkGuardActive','networkRequestsAttempted','networkRequestsSucceeded','wasmInitialized','modelInitialized','inferenceCompleted','policyBlocked','physicalDevice'];
  if(!exactKeys(r,keys)||!ENGINES.has(r.engine)||![r.engineAvailable,r.pageExecuted,r.networkGuardActive,r.wasmInitialized,r.modelInitialized,r.inferenceCompleted,r.policyBlocked,r.physicalDevice].every(x=>typeof x==='boolean')||typeof r.originProtocol!=='string'||!safeInt(r.networkRequestsAttempted)||!safeInt(r.networkRequestsSucceeded))throw new Error('DIRECT_FILE_EVIDENCE_SCHEMA');
  if(!r.engineAvailable)return Object.freeze({classification:'ENGINE_UNAVAILABLE',positiveEvidence:false,physicalDeviceEvidence:false});
  if(r.policyBlocked)return Object.freeze({classification:'ENVIRONMENT_POLICY_BLOCKED',positiveEvidence:false,physicalDeviceEvidence:false});
  if(r.originProtocol!=='file:')return Object.freeze({classification:'NOT_DIRECT_FILE',positiveEvidence:false,physicalDeviceEvidence:false});
  if(!r.pageExecuted)return Object.freeze({classification:'DIRECT_FILE_PAGE_NOT_EXECUTED',positiveEvidence:false,physicalDeviceEvidence:false});
  if(!r.networkGuardActive)return Object.freeze({classification:'NETWORK_GUARD_MISSING',positiveEvidence:false,physicalDeviceEvidence:false});
  if(r.networkRequestsSucceeded>0)return Object.freeze({classification:'NETWORK_LEAK_OBSERVED',positiveEvidence:false,physicalDeviceEvidence:r.physicalDevice});
  if(!r.wasmInitialized)return Object.freeze({classification:'WASM_NOT_INITIALIZED',positiveEvidence:false,physicalDeviceEvidence:r.physicalDevice});
  if(!r.modelInitialized)return Object.freeze({classification:'MODEL_NOT_INITIALIZED',positiveEvidence:false,physicalDeviceEvidence:r.physicalDevice});
  if(!r.inferenceCompleted)return Object.freeze({classification:'INFERENCE_NOT_COMPLETED',positiveEvidence:false,physicalDeviceEvidence:r.physicalDevice});
  return Object.freeze({classification:'DIRECT_FILE_ZERO_NETWORK_INFERENCE_PASS',positiveEvidence:true,physicalDeviceEvidence:r.physicalDevice,networkRequestsAttempted:r.networkRequestsAttempted,networkRequestsSucceeded:0});
}

export function summarizeBrowserMatrix(attempts,{requiredEngines=['chromium','firefox','webkit']}={}){
  if(!Array.isArray(attempts)||attempts.length===0||attempts.length>128||!Array.isArray(requiredEngines)||requiredEngines.length===0||requiredEngines.some(e=>!ENGINES.has(e)))throw new Error('BROWSER_MATRIX_SCHEMA');
  const byEngine=new Map();
  for(const attempt of attempts){const result=adjudicateDirectFileAttempt(attempt);if(byEngine.has(attempt.engine))throw new Error('DUPLICATE_ENGINE_ATTEMPT');byEngine.set(attempt.engine,result);}
  const missing=requiredEngines.filter(e=>!byEngine.has(e));
  const failing=requiredEngines.filter(e=>byEngine.has(e)&&!byEngine.get(e).positiveEvidence);
  return Object.freeze({schema:'ofu-ai-f0-browser-matrix-1',complete:missing.length===0&&failing.length===0,missing:Object.freeze(missing),failing:Object.freeze(failing),physicalDeviceCovered:requiredEngines.every(e=>byEngine.get(e)?.physicalDeviceEvidence===true),shippingPromotion:false});
}
