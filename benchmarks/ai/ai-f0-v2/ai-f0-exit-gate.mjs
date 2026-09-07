function exactKeys(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
export function adjudicateAiF0Exit(x){
  const keys=['assetSet','ortBundlePin','zeroFetchPackagingTested','runtimeAdmission','fallbackDeterministic','browserMatrix','modelResearchGate','soakResearchGate','standardEditionUnaffected'];
  if(!exactKeys(x,keys)||typeof x.zeroFetchPackagingTested!=='boolean'||typeof x.fallbackDeterministic!=='boolean'||typeof x.standardEditionUnaffected!=='boolean'||!x.assetSet||!x.ortBundlePin||!x.runtimeAdmission||!x.browserMatrix||!x.modelResearchGate||!x.soakResearchGate)throw new Error('AI_F0_EXIT_SCHEMA');
  const fail=reason=>Object.freeze({schema:'ofu-ai-f0-exit-adjudication-3',met:false,reason,shippingPromotion:false,nextPhaseActivationAuthorized:false});
  if(!x.standardEditionUnaffected)return fail('STANDARD_EDITION_INVARIANT_FAILED');
  if(!x.fallbackDeterministic)return fail('DETERMINISTIC_FALLBACK_REQUIRED');
  if(x.assetSet.ok!==true||x.assetSet.reason!=='EXACT_COMPLETE_ASSET_SET_RESEARCH_ADMISSIBLE')return fail('EXACT_ASSET_SET_REQUIRED');
  if(x.assetSet.shippingPromotion!==false)return fail('ASSET_SET_AUTHORITY_VIOLATION');
  if(x.ortBundlePin.ok!==true||x.ortBundlePin.reason!=='ORT_1_29_EMBEDDED_WASM_JS_PLUS_BINARY_PINNED')return fail('ORT_BUNDLE_PIN_REQUIRED');
  if(x.ortBundlePin.shippingPromotion!==false)return fail('ORT_BUNDLE_PIN_AUTHORITY_VIOLATION');
  if(!x.zeroFetchPackagingTested)return fail('ZERO_FETCH_PACKAGING_EVIDENCE_REQUIRED');
  if(x.runtimeAdmission.state!=='AI_RESEARCH_READY'||x.runtimeAdmission.reason!=='READY_FOR_RESEARCH_INITIALIZATION')return fail('RUNTIME_ADMISSION_NOT_READY');
  if(x.runtimeAdmission.shippingPromotion!==false||x.runtimeAdmission.standardEditionAvailable!==true)return fail('RUNTIME_ADMISSION_AUTHORITY_VIOLATION');
  if(x.browserMatrix.complete!==true)return fail('DIRECT_FILE_BROWSER_MATRIX_INCOMPLETE');
  if(x.browserMatrix.shippingPromotion!==false)return fail('BROWSER_EVIDENCE_AUTHORITY_VIOLATION');
  if(x.modelResearchGate.eligible!==true||x.modelResearchGate.reason!=='RESEARCH_GATE_MET_NOT_SHIPPING_PROMOTION')return fail('REAL_MODEL_RESEARCH_GATE_NOT_MET');
  if(x.modelResearchGate.shippingPromotion!==false)return fail('MODEL_EVAL_AUTHORITY_VIOLATION');
  if(x.soakResearchGate.eligible!==true||x.soakResearchGate.reason!=='SOAK_GATE_MET_RESEARCH_ONLY')return fail('REAL_RUNTIME_SOAK_GATE_NOT_MET');
  if(x.soakResearchGate.shippingPromotion!==false)return fail('SOAK_EVIDENCE_AUTHORITY_VIOLATION');
  return Object.freeze({schema:'ofu-ai-f0-exit-adjudication-3',met:true,reason:'AI_F0_EXIT_GATE_MET_RESEARCH_ONLY',shippingPromotion:false,nextPhaseActivationAuthorized:false});
}
