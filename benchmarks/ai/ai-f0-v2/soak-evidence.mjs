function exactKeys(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
function safeInt(v,max=Number.MAX_SAFE_INTEGER){return Number.isSafeInteger(v)&&v>=0&&v<=max;}
function percentile(sorted,p){if(sorted.length===0)return null;const i=Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1);return sorted[Math.max(0,i)];}

export function validateSoakCycle(r){
  const keys=['cycle','initMs','inferenceMs','beforeBytes','peakBytes','afterDisposeBytes','oom','error'];
  return exactKeys(r,keys)&&safeInt(r.cycle,1_000_000)&&safeInt(r.initMs,3_600_000)&&safeInt(r.inferenceMs,3_600_000)&&safeInt(r.beforeBytes)&&safeInt(r.peakBytes)&&safeInt(r.afterDisposeBytes)&&r.peakBytes>=r.beforeBytes&&typeof r.oom==='boolean'&&(r.error===null||(typeof r.error==='string'&&r.error.length>0&&r.error.length<=1024));
}

export function aggregateSoak(records,{realRuntime}={}){
  if(typeof realRuntime!=='boolean'||!Array.isArray(records)||records.length<2||records.length>10000)throw new Error('SOAK_SCHEMA');
  const seen=new Set();let previous=-1;
  for(const r of records){if(!validateSoakCycle(r))throw new Error('SOAK_CYCLE_SCHEMA');if(seen.has(r.cycle)||r.cycle<=previous)throw new Error('SOAK_CYCLE_ORDER');seen.add(r.cycle);previous=r.cycle;}
  const rest=records.map(r=>r.afterDisposeBytes),base=rest[0],final=rest.at(-1),maxRest=Math.max(...rest),maxPeak=Math.max(...records.map(r=>r.peakBytes));
  const init=records.map(r=>r.initMs).sort((a,b)=>a-b),infer=records.map(r=>r.inferenceMs).sort((a,b)=>a-b);
  return Object.freeze({schema:'ofu-ai-f0-soak-summary-1',classification:realRuntime?'MEASURED_REAL_RUNTIME_SOAK':'SYNTHETIC_OR_DRY_RUN_NOT_RUNTIME_EVIDENCE',realRuntime,cycles:records.length,oomCount:records.filter(r=>r.oom).length,errorCount:records.filter(r=>r.error!==null).length,restingBytes:Object.freeze({baseline:base,final,max:maxRest,finalGrowthBytes:Math.max(0,final-base),maxGrowthBytes:Math.max(0,maxRest-base)}),maxPeakBytes:maxPeak,latencyMs:Object.freeze({initP95:percentile(init,0.95),inferenceP95:percentile(infer,0.95)}),shippingPromotion:false});
}

export function adjudicateSoak(summary,{minCycles,maxFinalGrowthBytes,maxRestingGrowthBytes,maxPeakBytes,maxInitP95Ms,maxInferenceP95Ms}){
  if(!summary||summary.schema!=='ofu-ai-f0-soak-summary-1'||![minCycles,maxFinalGrowthBytes,maxRestingGrowthBytes,maxPeakBytes,maxInitP95Ms,maxInferenceP95Ms].every(v=>safeInt(v)))throw new Error('SOAK_GATE_SCHEMA');
  const fail=reason=>Object.freeze({eligible:false,reason,shippingPromotion:false});
  if(!summary.realRuntime)return fail('REAL_RUNTIME_REQUIRED');
  if(summary.cycles<minCycles)return fail('INSUFFICIENT_CYCLES');
  if(summary.oomCount>0)return fail('OOM_OBSERVED');
  if(summary.errorCount>0)return fail('RUNTIME_ERROR_OBSERVED');
  if(summary.restingBytes.finalGrowthBytes>maxFinalGrowthBytes)return fail('FINAL_RESTING_GROWTH_EXCEEDED');
  if(summary.restingBytes.maxGrowthBytes>maxRestingGrowthBytes)return fail('MAX_RESTING_GROWTH_EXCEEDED');
  if(summary.maxPeakBytes>maxPeakBytes)return fail('PEAK_MEMORY_EXCEEDED');
  if(summary.latencyMs.initP95>maxInitP95Ms)return fail('INIT_P95_EXCEEDED');
  if(summary.latencyMs.inferenceP95>maxInferenceP95Ms)return fail('INFERENCE_P95_EXCEEDED');
  return Object.freeze({eligible:true,reason:'SOAK_GATE_MET_RESEARCH_ONLY',shippingPromotion:false});
}
