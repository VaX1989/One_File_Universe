import test from 'node:test';
import assert from 'node:assert/strict';
import {decideAIResearchAdmission} from './ai-runtime-admission.mjs';

const h = c => c.repeat(64);
const asset = (overrides={}) => ({available:true,bytes:10,sha256:h('a'),expectedBytes:10,expectedSha256:h('a'),...overrides});
const base = () => ({aiRequested:true,wasmAvailable:true,runtime:asset(),model:asset(),tokenizer:asset(),estimatedWorkingSetBytes:100,workingSetBudgetBytes:100});

test('AI not requested leaves standard edition available',()=>{
  const x=base();x.aiRequested=false;const r=decideAIResearchAdmission(x);assert.equal(r.state,'AI_DISABLED');assert.equal(r.standardEditionAvailable,true);assert.equal(r.shippingPromotion,false);
});
test('missing WASM fails before asset admission',()=>{const x=base();x.wasmAvailable=false;x.runtime.available=false;assert.equal(decideAIResearchAdmission(x).reason,'WASM_UNAVAILABLE');});
test('missing runtime fails closed',()=>{const x=base();x.runtime.available=false;assert.equal(decideAIResearchAdmission(x).reason,'RUNTIME_UNAVAILABLE');});
test('runtime identity mismatch fails before model inspection',()=>{const x=base();x.runtime.sha256=h('b');x.model.available=false;assert.equal(decideAIResearchAdmission(x).reason,'RUNTIME_IDENTITY_MISMATCH');});
test('model identity mismatch fails closed',()=>{const x=base();x.model.expectedBytes=11;assert.equal(decideAIResearchAdmission(x).reason,'MODEL_IDENTITY_MISMATCH');});
test('tokenizer identity mismatch fails closed',()=>{const x=base();x.tokenizer.expectedSha256=h('b');assert.equal(decideAIResearchAdmission(x).reason,'TOKENIZER_IDENTITY_MISMATCH');});
test('working set budget is an admission boundary',()=>{const x=base();x.estimatedWorkingSetBytes=101;const r=decideAIResearchAdmission(x);assert.equal(r.reason,'WORKING_SET_BUDGET_EXCEEDED');assert.equal(r.standardEditionAvailable,true);});
test('exact assets plus bounded working set only reach research-ready',()=>{const r=decideAIResearchAdmission(base());assert.equal(r.state,'AI_RESEARCH_READY');assert.equal(r.backend,'WASM_CPU_BASELINE');assert.equal(r.shippingPromotion,false);});
test('unknown fields are rejected rather than ignored',()=>{const x=base();x.extra='smuggle';assert.throws(()=>decideAIResearchAdmission(x),/ADMISSION_SCHEMA/);});
test('invalid numeric metadata is rejected',()=>{const x=base();x.model.bytes=-1;assert.throws(()=>decideAIResearchAdmission(x),/ADMISSION_SCHEMA/);});
