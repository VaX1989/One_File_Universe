function exactKeys(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
export function adjudicateAiF0Exit(x){
  const keys=['assetPinsExact','zeroFetchPackagingTested','runtimeAdmission','fallbackDeterministic','browserMatrix','modelResearchGate','standardEditionUnaffected'];
  if(!exactKeys(x,keys)||typeof x.assetPinsExact!=='boolean'||typeof x.zeroFetchPackagingTested!=='boolean'||typeof x.fallbackDeterministic!=='boolean'||typeof x.standardEditionUnaffected!=='boolean'||!x.runtimeAdmission||!x.browserMatrix||!x.modelResearchGate)throw new Error('AI_F0_EXIT_SCHEMA');
  const fail=reason=>Object.freeze({schema:'ofu-ai-f0-exit-adjudication-1',met:false,reason,shippingPromotion:false});
  if(!x.standardEditionUnaffected)return fail('STANDARD_EDITION_INVARIANT_FAILED');
  if(!x.fallbackDeterministic)return fail('DETERMINISTIC_FALLBACK_REQUIRED');
  if(!x.assetPinsExact)return fail('EXACT_ASSET_PINS_REQUIRED');
  if(!x.zeroFetchPackagingTested)return fail('ZERO_FETCH_PACKAGING_EVIDENCE_REQUIRED');
  if(x.runtimeAdmission.state!=='AI_RESEARCH_READY'||x.runtimeAdmission.reason!=='READY_FOR_RESEARCH_INITIALIZATION')return fail('RUNTIME_ADMISSION_NOT_READY');
  if(x.runtimeAdmission.shippingPromotion!==false||x.runtimeAdmission.standardEditionAvailable!==true)return fail('RUNTIME_ADMISSION_AUTHORITY_VIOLATION');
  if(x.browserMatrix.complete!==true)return fail('DIRECT_FILE_BROWSER_MATRIX_INCOMPLETE');
  if(x.browserMatrix.shippingPromotion!==false)return fail('BROWSER_EVIDENCE_AUTHORITY_VIOLATION');
  if(x.modelResearchGate.eligible!==true||x.modelResearchGate.reason!=='RESEARCH_GATE_MET_NOT_SHIPPING_PROMOTION')return fail('REAL_MODEL_RESEARCH_GATE_NOT_MET');
  if(x.modelResearchGate.shippingPromotion!==false)return fail('MODEL_EVAL_AUTHORITY_VIOLATION');
  return Object.freeze({schema:'ofu-ai-f0-exit-adjudication-1',met:true,reason:'AI_F0_EXIT_GATE_MET_RESEARCH_ONLY',shippingPromotion:false,nextPhaseActivationAuthorized:false});
}
