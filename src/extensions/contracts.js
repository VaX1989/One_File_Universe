(function (root) {
'use strict';
const O = root.OFU = root.OFU || {};
const VERSION = 'ofu-px-contracts-1';
const AUTHORITIES = Object.freeze(['CANONICAL_PROVEN', 'DERIVED', 'MODEL_DERIVED_SIMULATION', 'PRESENTATION_ONLY', 'MEASURED_RUNTIME_EVIDENCE']);
const KINDS = Object.freeze(['domain', 'model', 'scale', 'query', 'representation', 'scene', 'renderer', 'inspector', 'interaction', 'persistence', 'test']);
const OPERATIONS = Object.freeze(['DISCOVER', 'INSPECT', 'REPRESENT', 'TRAVEL', 'REFINE', 'PROJECT', 'RECONCILE', 'TRANSITION', 'ENCODE', 'DECODE', 'MEASURE']);
const TIERS = Object.freeze(['FAST_LOCAL', 'LANE_TARGETED', 'INTEGRATION', 'CUMULATIVE', 'RELEASE']);
const LIMITS = Object.freeze({bytes: 1048576, nodes: 32768, depth: 24, entries: 512, string: 65536, entities: 65536, operations: 1048576, queue: 4096});
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const tokenPattern = /^[a-z][a-z0-9._:/-]{0,127}$/;
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const hexPattern = /^[a-f0-9]{64}$/;
const unsignedPattern = /^(0|[1-9][0-9]{0,19})$/;
const encoder = new TextEncoder();
function fail(code, detail) { const e = new Error('OFU PX ' + code + ': ' + detail); e.code = code; throw e; }
function assert(condition, code, detail) { if (!condition) fail(code, detail); }
function token(value, label = 'identifier') { assert(typeof value === 'string' && tokenPattern.test(value) && !forbidden.has(value), 'IDENTIFIER', label); return value; }
function version(value) { assert(typeof value === 'string' && value.length <= 48 && versionPattern.test(value), 'VERSION', 'exact semantic version required'); return value; }
function hash(value, label = 'digest') { assert(typeof value === 'string' && hexPattern.test(value), 'HASH', label); return value; }
function uint(value, label = 'unsigned integer') { assert(typeof value === 'string' && unsignedPattern.test(value), 'UINT', label); assert(BigInt(value) <= 18446744073709551615n, 'UINT', label + ' overflow'); return value; }
function text(value, label, max = 2048) { assert(typeof value === 'string' && value.length > 0 && value.length <= max, 'TEXT', label); return value; }
function keys(value, required, optional = []) {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'SCHEMA', 'record required');
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) assert(allowed.has(key), 'SCHEMA', 'unknown field ' + key);
  for (const key of required) assert(Object.prototype.hasOwnProperty.call(value, key), 'SCHEMA', 'missing field ' + key);
}
// Copy before admitting data. Reject accessors, prototype pollution, sparse arrays,
// cycles, unsafe numbers and hidden state. Outputs contain only frozen JSON data.
function data(value, options = {}) {
  const limits = {...LIMITS, ...options};
  for (const k of Object.keys(options)) assert(['bytes', 'nodes', 'depth', 'string'].includes(k), 'LIMIT', k);
  for (const k of ['bytes', 'nodes', 'depth', 'string']) assert(Number.isSafeInteger(limits[k]) && limits[k] > 0 && limits[k] <= LIMITS[k], 'LIMIT', k);
  let nodes = 0, stringBytes = 0; const seen = new Set();
  function copy(v, depth) {
    assert(++nodes <= limits.nodes && depth <= limits.depth, 'DATA_BUDGET', 'nodes/depth');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') { assert(Number.isFinite(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER && !Object.is(v, -0), 'NUMBER', 'finite safe-magnitude number required'); return v; }
    if (typeof v === 'string') { assert(v.length <= limits.string, 'DATA_BUDGET', 'string'); stringBytes += encoder.encode(v).length; assert(stringBytes <= limits.bytes, 'DATA_BUDGET', 'bytes'); return v; }
    assert(v && typeof v === 'object', 'DATA_TYPE', 'JSON data required');
    const prototype = Object.getPrototypeOf(v);
    assert(Array.isArray(v) ? prototype === Array.prototype : prototype === Object.prototype || prototype === null, 'DATA_TYPE', 'plain data required');
    assert(!seen.has(v), 'DATA_CYCLE', 'cyclic value'); seen.add(v);
    const names = Reflect.ownKeys(v); let out;
    if (Array.isArray(v)) {
      assert(v.length <= limits.nodes && names.length === v.length + 1, 'DATA_TYPE', 'dense array without extra fields required');
      out = new Array(v.length);
      for (let i = 0; i < v.length; i++) { const d = Object.getOwnPropertyDescriptor(v, String(i)); assert(d && d.enumerable && 'value' in d, 'DATA_TYPE', 'array accessor/hole'); out[i] = copy(d.value, depth + 1); }
    } else {
      out = {};
      assert(names.length <= limits.nodes, 'DATA_BUDGET', 'record fields');
      for (const k of names) assert(typeof k === 'string' && !forbidden.has(k) && k.length <= 128, 'DATA_KEY', 'unsupported key');
      for (const k of names.sort()) { const d = Object.getOwnPropertyDescriptor(v, k); assert(d && d.enumerable && 'value' in d, 'DATA_TYPE', 'record accessor/hidden field'); stringBytes += encoder.encode(k).length; assert(stringBytes <= limits.bytes, 'DATA_BUDGET', 'key bytes'); out[k] = copy(d.value, depth + 1); }
    }
    seen.delete(v); return Object.freeze(out);
  }
  const result = copy(value, 0); assert(encoder.encode(JSON.stringify(result)).length <= limits.bytes, 'DATA_BUDGET', 'encoded bytes'); return result;
}
function stable(value) { return JSON.stringify(data(value)); }
function digest(value) { assert(O.sha256, 'DEPENDENCY', 'frozen SHA-256 required'); return O.sha256.hex(encoder.encode('OFU-PX-1\0' + stable(value))); }
function list(values, label, check = token, max = 128) {
  assert(Array.isArray(values) && values.length <= max, 'LIST', label); const seen = new Set();
  return values.map(value => { check(value, label); const k = typeof value === 'string' ? value : stable(value); assert(!seen.has(k), 'DUPLICATE', label); seen.add(k); return value; });
}
function budget(input, ceiling = LIMITS) {
  const b = data(input); keys(b, ['entities', 'bytes', 'operations', 'queue']);
  for (const k of Object.keys(b)) assert(Number.isSafeInteger(b[k]) && b[k] >= 0 && b[k] <= ceiling[k] && b[k] <= LIMITS[k], 'BUDGET', k);
  assert(b.bytes > 0 && b.operations > 0, 'BUDGET', 'positive byte/operation budget required'); return b;
}
function authority(input) {
  const a = data(input, {bytes: 32768, nodes: 2048});
  keys(a, ['class', 'contract', 'model', 'version', 'sources', 'assumptions', 'limitations', 'evidence']);
  assert(AUTHORITIES.includes(a.class), 'AUTHORITY', 'unknown class'); token(a.contract); token(a.model); version(a.version);
  list(a.sources, 'sources', v => text(v, 'source', 2048), 32);
  list(a.assumptions, 'assumptions', v => text(v, 'assumption'), 32);
  list(a.limitations, 'limitations', v => text(v, 'limitation'), 32);
  list(a.evidence, 'evidence', e => { keys(e, ['id', 'kind', 'digest']); token(e.id); assert(['PROMOTED_CONTRACT', 'MODEL_TEST', 'PRESENTATION_TEST', 'MEASUREMENT', 'RESEARCH'].includes(e.kind), 'EVIDENCE', e.kind); hash(e.digest); }, 64);
  assert(a.sources.length > 0 && a.limitations.length > 0, 'PROVENANCE', 'source and limits required');
  if (a.class === 'CANONICAL_PROVEN') assert(a.evidence.some(e => e.kind === 'PROMOTED_CONTRACT'), 'AUTHORITY', 'canonical contract must name promoted evidence');
  if (a.class === 'MEASURED_RUNTIME_EVIDENCE') assert(a.evidence.some(e => e.kind === 'MEASUREMENT'), 'AUTHORITY', 'measured class requires a measurement');
  return a;
}
function fidelity(input) {
  const f = data(input); keys(f, ['regime', 'validity', 'resolution', 'uncertainty']); token(f.regime); text(f.validity, 'validity'); text(f.resolution, 'resolution'); text(f.uncertainty, 'uncertainty'); return f;
}
function entity(input) {
  const e = data(input); keys(e, ['universeId', 'entityId', 'parentId', 'kind', 'address']); hash(e.universeId); hash(e.entityId); if (e.parentId !== null) hash(e.parentId); token(e.kind);
  assert(Array.isArray(e.address) && e.address.length > 0 && e.address.length <= 32, 'IDENTITY', 'bounded hierarchical address');
  for (const part of e.address) text(part, 'address part', 256); return e;
}
function time(input) {
  const t = data(input); keys(t, ['protocol', 'seconds', 'micros', 'lineageId', 'historyDigest']); assert(t.protocol === 'ofu-p4-temporal-v1', 'TIME', 'P4 is the sole temporal protocol'); uint(t.seconds); uint(t.micros); assert(BigInt(t.micros) < 1000000n, 'TIME', 'microsecond range'); hash(t.lineageId); hash(t.historyDigest); return t;
}
function selection(input) {
  const s = data(input); keys(s, ['contract', 'target', 'context', 'time', 'authority']); assert(s.contract === VERSION, 'CONTRACT', 'selection'); entity(s.target); assert(Array.isArray(s.context) && s.context.length <= 32, 'SELECTION', 'parent context'); s.context.forEach(entity); time(s.time); authority(s.authority);
  for (const parent of s.context) assert(parent.universeId === s.target.universeId, 'IDENTITY', 'cross-universe parent'); return s;
}
function provider(input) {
  const p = data(input, {bytes: 65536, nodes: 4096});
  keys(p, ['contract', 'id', 'version', 'owner', 'kind', 'authority', 'fidelity', 'lifecycle', 'requires', 'claims', 'operations', 'budget', 'evidence', 'mandatory']);
  assert(p.contract === VERSION, 'CONTRACT', 'provider'); token(p.id); token(p.owner); version(p.version); assert(KINDS.includes(p.kind), 'KIND', p.kind); authority(p.authority); fidelity(p.fidelity); budget(p.budget);
  assert(['FROZEN', 'SHIPPING', 'RESEARCH'].includes(p.lifecycle), 'LIFECYCLE', p.id); assert(typeof p.mandatory === 'boolean', 'SCHEMA', 'mandatory');
  if (p.lifecycle === 'RESEARCH') assert(p.authority.class !== 'CANONICAL_PROVEN', 'AUTHORITY', 'research cannot acquire canonical authority through registration');
  list(p.requires, 'dependencies', d => { keys(d, ['id', 'version', 'authority']); token(d.id); version(d.version); assert(AUTHORITIES.includes(d.authority), 'AUTHORITY', 'dependency'); });
  assert(new Set(p.requires.map(d => d.id)).size === p.requires.length, 'DUPLICATE', 'dependency ids');
  list(p.claims, 'claims'); list(p.operations, 'operations', v => assert(OPERATIONS.includes(v), 'OPERATION', v), 32); assert(p.operations.length > 0, 'OPERATION', 'provider must expose operations');
  list(p.evidence, 'test evidence', e => { keys(e, ['id', 'tier']); token(e.id); assert(TIERS.includes(e.tier), 'TIER', e.tier); }, 64);
  if (p.operations.includes('TRANSITION')) assert(['CANONICAL_PROVEN', 'MODEL_DERIVED_SIMULATION'].includes(p.authority.class), 'AUTHORITY', 'presentation/derived/measurement providers have no state-changing capability');
  if (['scene', 'renderer', 'representation'].includes(p.kind)) assert(p.authority.class === 'PRESENTATION_ONLY', 'AUTHORITY', 'rendering is presentation, never scientific state');
  return p;
}
function request(input, descriptor) {
  const r = data(input); keys(r, ['contract', 'provider', 'operation', 'selection', 'fidelity', 'budget', 'payload']);
  assert(r.contract === VERSION && r.provider === descriptor.id, 'CONTRACT', 'request target');
  assert(OPERATIONS.includes(r.operation) && descriptor.operations.includes(r.operation), 'CAPABILITY', r.operation); selection(r.selection); fidelity(r.fidelity); budget(r.budget, descriptor.budget);
  assert(r.fidelity.regime === descriptor.fidelity.regime, 'REGIME', 'request regime mismatch'); return r;
}
function envelope(input, descriptor, requestValue) {
  const r = data(input, {bytes: requestValue.budget.bytes}); keys(r, ['contract', 'provider', 'version', 'authority', 'selection', 'fidelity', 'usage', 'value']);
  assert(r.contract === VERSION && r.provider === descriptor.id && r.version === descriptor.version, 'CONTRACT', 'result identity');
  assert(stable(r.authority) === stable(descriptor.authority), 'AUTHORITY', 'provider may not silently change authority or provenance');
  assert(stable(r.selection) === stable(requestValue.selection), 'IDENTITY', 'result changed selection/time/history'); fidelity(r.fidelity);
  assert(r.fidelity.regime === descriptor.fidelity.regime, 'REGIME', 'result regime mismatch'); budget(r.usage, requestValue.budget);
  assert(encoder.encode(stable(r.value)).length <= r.usage.bytes, 'BUDGET', 'under-reported result bytes'); return r;
}
function discovery(input) {
  const q = data(input); keys(q, ['address', 'cursor', 'limit', 'filters']); assert(Array.isArray(q.address) && q.address.length <= 32, 'QUERY', 'address'); q.address.forEach(p => text(p, 'address', 256));
  if (q.cursor !== null) text(q.cursor, 'cursor', 512); assert(Number.isSafeInteger(q.limit) && q.limit > 0 && q.limit <= 256, 'QUERY', 'limit'); assert(q.filters && !Array.isArray(q.filters) && typeof q.filters === 'object', 'QUERY', 'filters'); return q;
}
function travel(input) {
  const t = data(input); keys(t, ['operation', 'from', 'to', 'selection', 'commitments', 'budget']); assert(['REFINE', 'PROJECT', 'RECONCILE'].includes(t.operation), 'TRAVEL', 'cross-scale operation'); token(t.from); token(t.to); selection(t.selection); budget(t.budget); return t;
}
function temporal(input) {
  const e = data(input); keys(e, ['contract', 'provider', 'type', 'version', 'operationKey', 'time', 'targets', 'causes', 'preconditionDigest', 'payload']);
  assert(e.contract === VERSION, 'CONTRACT', 'temporal adapter'); token(e.provider); token(e.type); version(e.version); token(e.operationKey); time(e.time); list(e.targets, 'targets', hash, 64); list(e.causes, 'causes', hash, 64); hash(e.preconditionDigest); return e;
}
function inspection(input) {
  const i = data(input); keys(i, ['title', 'summary', 'fields', 'authority', 'fidelity']); text(i.title, 'title', 160); text(i.summary, 'summary', 4096); authority(i.authority); fidelity(i.fidelity);
  assert(Array.isArray(i.fields) && i.fields.length <= 128, 'INSPECT', 'fields'); for (const f of i.fields) { keys(f, ['name', 'value', 'unit']); text(f.name, 'field', 128); text(f.unit, 'unit', 64); } return i;
}
function representation(input) {
  const r = data(input); keys(r, ['target', 'regime', 'authority', 'objects', 'budget']); entity(r.target); token(r.regime); authority(r.authority); assert(r.authority.class === 'PRESENTATION_ONLY', 'AUTHORITY', 'representation'); budget(r.budget); assert(Array.isArray(r.objects) && r.objects.length <= r.budget.entities, 'BUDGET', 'representation objects'); return r;
}
function persistence(input) {
  const p = data(input); keys(p, ['contract', 'codec', 'version', 'universeId', 'modelManifestDigest', 'historyDigest', 'payloadDigest', 'payload']); assert(p.contract === VERSION, 'CONTRACT', 'persistence'); token(p.codec); version(p.version); hash(p.universeId); hash(p.modelManifestDigest); hash(p.historyDigest); assert(digest(p.payload) === p.payloadDigest, 'INTEGRITY', 'portable payload digest'); return p;
}
O.pxContracts = Object.freeze({VERSION, AUTHORITIES, KINDS, OPERATIONS, TIERS, LIMITS, fail, assert, token, version, hash, uint, text, keys, data, stable, digest, list, budget, authority, fidelity, entity, time, selection, provider, request, envelope, discovery, travel, temporal, inspection, representation, persistence});
})(typeof globalThis !== 'undefined' ? globalThis : this);
