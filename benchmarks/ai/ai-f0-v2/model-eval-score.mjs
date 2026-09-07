function exactKeys(v, keys) { return v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k)); }
function boundedInt(v,max=Number.MAX_SAFE_INTEGER){return Number.isSafeInteger(v)&&v>=0&&v<=max;}
function bool(v){return typeof v==='boolean';}
function ppm(pass,total){return total===0?0:Math.floor(pass*1_000_000/total);}
function percentile(sorted,p){if(sorted.length===0)return null;const i=Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1);return sorted[Math.max(0,i)];}

export function validateEvalRecord(r){
  const keys=['caseId','rawJsonValid','gatewayAccepted','evidenceValid','toolCorrect','unknownPreserved','latencyMs','generatedTokens'];
  return exactKeys(r,keys)&&typeof r.caseId==='string'&&/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(r.caseId)&&[r.rawJsonValid,r.gatewayAccepted,r.evidenceValid,r.toolCorrect,r.unknownPreserved].every(bool)&&boundedInt(r.latencyMs,3_600_000)&&boundedInt(r.generatedTokens,1_000_000);
}

export function aggregateModelEval(records,{realInference}={}){
  if(typeof realInference!=='boolean'||!Array.isArray(records)||records.length===0||records.length>10000)throw new Error('EVAL_SCHEMA');
  const ids=new Set();for(const r of records){if(!validateEvalRecord(r))throw new Error('EVAL_RECORD_SCHEMA');if(ids.has(r.caseId))throw new Error('EVAL_DUPLICATE_CASE');ids.add(r.caseId);}
  const count=records.length,latencies=records.map(r=>r.latencyMs).sort((a,b)=>a-b),tokens=records.reduce((a,r)=>a+r.generatedTokens,0);
  const countTrue=k=>records.reduce((a,r)=>a+(r[k]?1:0),0);
  return Object.freeze({schema:'ofu-ai-f0-model-eval-1',classification:realInference?'MEASURED_REAL_MODEL_EVAL':'SYNTHETIC_OR_DRY_RUN_NOT_MODEL_EVIDENCE',realInference,count,totalGeneratedTokens:tokens,ratesPpm:Object.freeze({rawJsonValid:ppm(countTrue('rawJsonValid'),count),gatewayAccepted:ppm(countTrue('gatewayAccepted'),count),evidenceValid:ppm(countTrue('evidenceValid'),count),toolCorrect:ppm(countTrue('toolCorrect'),count),unknownPreserved:ppm(countTrue('unknownPreserved'),count)}),latencyMs:Object.freeze({min:latencies[0],p50:percentile(latencies,0.50),p95:percentile(latencies,0.95),max:latencies.at(-1)}),shippingPromotion:false});
}

export function adjudicateResearchGate(summary, thresholds){
  const keys=['minCases','minRawJsonValidPpm','minGatewayAcceptedPpm','minEvidenceValidPpm','minToolCorrectPpm','minUnknownPreservedPpm','maxP95LatencyMs'];
  if(!summary||summary.schema!=='ofu-ai-f0-model-eval-1'||!exactKeys(thresholds,keys)||!Object.values(thresholds).every(v=>boundedInt(v,1_000_000_000)))throw new Error('GATE_SCHEMA');
  if(!summary.realInference)return Object.freeze({eligible:false,reason:'REAL_INFERENCE_REQUIRED',shippingPromotion:false});
  if(summary.count<thresholds.minCases)return Object.freeze({eligible:false,reason:'INSUFFICIENT_CASES',shippingPromotion:false});
  const checks=[['rawJsonValid','minRawJsonValidPpm'],['gatewayAccepted','minGatewayAcceptedPpm'],['evidenceValid','minEvidenceValidPpm'],['toolCorrect','minToolCorrectPpm'],['unknownPreserved','minUnknownPreservedPpm']];
  for(const [metric,threshold] of checks)if(summary.ratesPpm[metric]<thresholds[threshold])return Object.freeze({eligible:false,reason:`BELOW_${metric.toUpperCase()}`,shippingPromotion:false});
  if(summary.latencyMs.p95>thresholds.maxP95LatencyMs)return Object.freeze({eligible:false,reason:'P95_LATENCY_EXCEEDED',shippingPromotion:false});
  return Object.freeze({eligible:true,reason:'RESEARCH_GATE_MET_NOT_SHIPPING_PROMOTION',shippingPromotion:false});
}
