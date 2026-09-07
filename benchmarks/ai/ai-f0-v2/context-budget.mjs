function safe(name,v,{min=0,max=Number.MAX_SAFE_INTEGER}={}){if(!Number.isSafeInteger(v)||v<min||v>max)throw new Error(`INVALID_${name}`);return v;}
export function kvBytesPerTokenFp16({layers,kvHeads,headDim}){
  safe('LAYERS',layers,{min:1,max:10000});safe('KV_HEADS',kvHeads,{min:1,max:10000});safe('HEAD_DIM',headDim,{min:1,max:100000});
  const n=2*layers*kvHeads*headDim*2;
  if(!Number.isSafeInteger(n))throw new Error('KV_OVERFLOW');
  return n;
}
export function planContextBudget({modelBytes,runtimeBytes,tokenizerBytes,fixedReserveBytes,workingSetBudgetBytes,architecture,requestedTokens}){
  for(const [k,v] of Object.entries({modelBytes,runtimeBytes,tokenizerBytes,fixedReserveBytes,workingSetBudgetBytes,requestedTokens}))safe(k.toUpperCase(),v);
  if(!architecture||typeof architecture!=='object')throw new Error('ARCHITECTURE_SCHEMA');
  const maxContext=safe('MAX_CONTEXT',architecture.maxContext,{min:1,max:1_000_000});
  const kvPerToken=kvBytesPerTokenFp16(architecture);
  const fixedBytes=modelBytes+runtimeBytes+tokenizerBytes+fixedReserveBytes;
  if(!Number.isSafeInteger(fixedBytes))throw new Error('FIXED_BYTES_OVERFLOW');
  const availableForKv=Math.max(0,workingSetBudgetBytes-fixedBytes);
  const maxTokensByMemory=Math.floor(availableForKv/kvPerToken);
  const admittedTokens=Math.min(requestedTokens,maxContext,maxTokensByMemory);
  const requiredBytesAtAdmission=fixedBytes+admittedTokens*kvPerToken;
  let reason='REQUEST_ADMITTED';
  if(fixedBytes>workingSetBudgetBytes)reason='FIXED_WORKING_SET_EXCEEDS_BUDGET';
  else if(requestedTokens>maxContext)reason='CLAMPED_MODEL_MAX_CONTEXT';
  else if(requestedTokens>maxTokensByMemory)reason='CLAMPED_WORKING_SET_BUDGET';
  return Object.freeze({schema:'ofu-ai-f0-context-budget-1',kvBytesPerToken:kvPerToken,fixedBytes,workingSetBudgetBytes,availableForKv,maxTokensByMemory,modelMaxContext:maxContext,requestedTokens,admittedTokens,requiredBytesAtAdmission,reason,canInitialize:fixedBytes<=workingSetBudgetBytes,shippingPromotion:false});
}
