import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePinnedRuntimeAsset,validatePinnedRuntimeSet} from './runtime-distribution-pin.mjs';

const exact = (o={}) => ({package:'onnxruntime-web',version:'1.29.0',asset:'ort-wasm-simd-threaded.wasm',bytes:13967360,sha256:'a'.repeat(64),source:'https://cdn.example/npm/onnxruntime-web@1.29.0/dist/ort-wasm-simd-threaded.wasm',...o});

test('accepts exact immutable version plus size/hash/source pin',()=>{const r=validatePinnedRuntimeAsset(exact());assert.equal(r.ok,true);assert.equal(r.shippingPromotion,false);});
test('rejects latest alias in source even with exact metadata',()=>{assert.equal(validatePinnedRuntimeAsset(exact({source:'https://cdn.example/npm/onnxruntime-web@latest/dist/ort.wasm'})).reason,'MUTABLE_SOURCE_ALIAS');});
test('rejects dev prerelease instead of pretending it is stable',()=>{assert.equal(validatePinnedRuntimeAsset(exact({version:'1.30.0-dev.20260825'})).reason,'IMMUTABLE_VERSION_REQUIRED');});
test('rejects unversioned http source',()=>{assert.equal(validatePinnedRuntimeAsset(exact({source:'https://cdn.example/npm/onnxruntime-web/dist/ort.wasm'})).reason,'SOURCE_VERSION_NOT_PINNED');});
test('rejects missing byte identity',()=>{assert.equal(validatePinnedRuntimeAsset(exact({sha256:''})).reason,'ASSET_SHA256');assert.equal(validatePinnedRuntimeAsset(exact({bytes:0})).reason,'ASSET_BYTES');});
test('rejects duplicate asset pins',()=>{const a=exact();const r=validatePinnedRuntimeSet([a,{...a}]);assert.equal(r.ok,false);assert.equal(r.reason,'DUPLICATE_PIN');});
test('accepts a deterministic runtime set without promoting shipping',()=>{const r=validatePinnedRuntimeSet([exact(),exact({asset:'ort.wasm.min.mjs',bytes:50120,sha256:'b'.repeat(64),source:'https://cdn.example/npm/onnxruntime-web@1.29.0/dist/ort.wasm.min.mjs'})]);assert.equal(r.ok,true);assert.equal(r.shippingPromotion,false);assert.deepEqual([...r.assets],[...r.assets].sort());});
test('unknown fields fail exact schema',()=>{assert.equal(validatePinnedRuntimeAsset({...exact(),integrity:'x'}).reason,'PIN_SCHEMA');});
