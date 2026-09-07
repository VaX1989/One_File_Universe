const HEX64 = /^[a-f0-9]{64}$/;
const STATES = Object.freeze(['AI_DISABLED','AI_UNAVAILABLE','AI_RESEARCH_READY']);
const REASONS = Object.freeze([
  'AI_NOT_REQUESTED',
  'WASM_UNAVAILABLE',
  'RUNTIME_UNAVAILABLE',
  'RUNTIME_IDENTITY_MISMATCH',
  'MODEL_UNAVAILABLE',
  'MODEL_IDENTITY_MISMATCH',
  'TOKENIZER_UNAVAILABLE',
  'TOKENIZER_IDENTITY_MISMATCH',
  'WORKING_SET_BUDGET_EXCEEDED',
  'READY_FOR_RESEARCH_INITIALIZATION',
]);

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
}
function safeInt(value) { return Number.isSafeInteger(value) && value >= 0; }
function identity(x) {
  return exactKeys(x, ['available','bytes','sha256','expectedBytes','expectedSha256']) && typeof x.available === 'boolean' && safeInt(x.bytes) && safeInt(x.expectedBytes) && typeof x.sha256 === 'string' && HEX64.test(x.sha256) && typeof x.expectedSha256 === 'string' && HEX64.test(x.expectedSha256);
}
function unavailable(reason, detail = {}) {
  return Object.freeze({schema:'ofu-ai-f0-runtime-admission-1',state:'AI_UNAVAILABLE',reason,standardEditionAvailable:true,shippingPromotion:false,...detail});
}

export function decideAIResearchAdmission(input) {
  if (!exactKeys(input, ['aiRequested','wasmAvailable','runtime','model','tokenizer','estimatedWorkingSetBytes','workingSetBudgetBytes'])) throw new Error('ADMISSION_SCHEMA');
  if (typeof input.aiRequested !== 'boolean' || typeof input.wasmAvailable !== 'boolean' || !safeInt(input.estimatedWorkingSetBytes) || !safeInt(input.workingSetBudgetBytes) || !identity(input.runtime) || !identity(input.model) || !identity(input.tokenizer)) throw new Error('ADMISSION_SCHEMA');
  if (!input.aiRequested) return Object.freeze({schema:'ofu-ai-f0-runtime-admission-1',state:'AI_DISABLED',reason:'AI_NOT_REQUESTED',standardEditionAvailable:true,shippingPromotion:false});
  if (!input.wasmAvailable) return unavailable('WASM_UNAVAILABLE');
  if (!input.runtime.available) return unavailable('RUNTIME_UNAVAILABLE');
  if (input.runtime.bytes !== input.runtime.expectedBytes || input.runtime.sha256 !== input.runtime.expectedSha256) return unavailable('RUNTIME_IDENTITY_MISMATCH');
  if (!input.model.available) return unavailable('MODEL_UNAVAILABLE');
  if (input.model.bytes !== input.model.expectedBytes || input.model.sha256 !== input.model.expectedSha256) return unavailable('MODEL_IDENTITY_MISMATCH');
  if (!input.tokenizer.available) return unavailable('TOKENIZER_UNAVAILABLE');
  if (input.tokenizer.bytes !== input.tokenizer.expectedBytes || input.tokenizer.sha256 !== input.tokenizer.expectedSha256) return unavailable('TOKENIZER_IDENTITY_MISMATCH');
  if (input.estimatedWorkingSetBytes > input.workingSetBudgetBytes) return unavailable('WORKING_SET_BUDGET_EXCEEDED',{estimatedWorkingSetBytes:input.estimatedWorkingSetBytes,workingSetBudgetBytes:input.workingSetBudgetBytes});
  return Object.freeze({schema:'ofu-ai-f0-runtime-admission-1',state:'AI_RESEARCH_READY',reason:'READY_FOR_RESEARCH_INITIALIZATION',standardEditionAvailable:true,shippingPromotion:false,backend:'WASM_CPU_BASELINE'});
}

export const ADMISSION_STATES = STATES;
export const ADMISSION_REASONS = REASONS;
