import crypto from 'node:crypto';

export const PX_COMPONENT_MAX_BYTES = 4 * 1024 * 1024;
export const PX_PLAN_MAX_BYTES = 64 * 1024 * 1024;
export const AI_LARGE_ASSET_POLICY = Object.freeze({
  schema: 'ofu-ai-f0-large-asset-policy-1',
  standardEditionMayDependOnAI: false,
  ordinaryComponentChannelAllowed: false,
  requiredIdentity: 'EXACT_BYTES_SHA256',
  runtimeFetchAllowed: false,
  canonicalAuthorityAllowed: false,
});

function integer(name, value, {min = 0, max = Number.MAX_SAFE_INTEGER} = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`INVALID_${name}`);
  return value;
}

export function base64Bytes(rawBytes) {
  integer('RAW_BYTES', rawBytes);
  return Math.ceil(rawBytes / 3) * 4;
}

export function estimateEmbeddedArtifact({modelBytes, tokenizerBytes = 0, runtimeJsBytes = 0, runtimeWasmBytes = 0, fixedHtmlBytes = 0}) {
  for (const [k, v] of Object.entries({modelBytes, tokenizerBytes, runtimeJsBytes, runtimeWasmBytes, fixedHtmlBytes})) integer(k.toUpperCase(), v);
  const rawAssetBytes = modelBytes + tokenizerBytes + runtimeJsBytes + runtimeWasmBytes;
  const encodedAssetBytes = base64Bytes(rawAssetBytes);
  const artifactBytesUpperBound = encodedAssetBytes + fixedHtmlBytes;
  const transientDecodeBytesLowerBound = rawAssetBytes + encodedAssetBytes;
  return Object.freeze({rawAssetBytes, encodedAssetBytes, artifactBytesUpperBound, transientDecodeBytesLowerBound});
}

export function classifyAgainstConvergedPX({modelBytes, tokenizerBytes = 0, runtimeJsBytes = 0, runtimeWasmBytes = 0, fixedHtmlBytes = 0}) {
  const estimate = estimateEmbeddedArtifact({modelBytes, tokenizerBytes, runtimeJsBytes, runtimeWasmBytes, fixedHtmlBytes});
  const largestAssetBytes = Math.max(modelBytes, tokenizerBytes, runtimeJsBytes, runtimeWasmBytes);
  const fitsOrdinaryComponent = largestAssetBytes <= PX_COMPONENT_MAX_BYTES && estimate.rawAssetBytes <= PX_PLAN_MAX_BYTES;
  return Object.freeze({
    schema: 'ofu-ai-f0-px-budget-classification-1',
    ...estimate,
    largestAssetBytes,
    pxComponentMaxBytes: PX_COMPONENT_MAX_BYTES,
    pxPlanMaxBytes: PX_PLAN_MAX_BYTES,
    fitsOrdinaryComponent,
    requiredChannel: fitsOrdinaryComponent ? 'ORDINARY_PX_COMPONENT' : 'SEPARATE_BOUNDED_AI_LARGE_ASSET_CHANNEL',
    standardEditionDependencyAllowed: false,
    shippingPromotion: false,
  });
}

export function verifyAssetIdentity(bytes, expectedSha256) {
  if (!(bytes instanceof Uint8Array)) throw new Error('INVALID_ASSET_BYTES');
  if (typeof expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(expectedSha256)) throw new Error('INVALID_EXPECTED_SHA256');
  const actualSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return Object.freeze({ok: actualSha256 === expectedSha256, actualSha256, expectedSha256, bytes: bytes.byteLength});
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [modelBytes, tokenizerBytes = '0', runtimeJsBytes = '0', runtimeWasmBytes = '0', fixedHtmlBytes = '0'] = process.argv.slice(2);
  if (modelBytes === undefined) {
    console.error('usage: node ai-artifact-budget.mjs MODEL_BYTES [TOKENIZER_BYTES RUNTIME_JS_BYTES RUNTIME_WASM_BYTES FIXED_HTML_BYTES]');
    process.exit(2);
  }
  console.log(JSON.stringify(classifyAgainstConvergedPX({
    modelBytes: Number(modelBytes), tokenizerBytes: Number(tokenizerBytes), runtimeJsBytes: Number(runtimeJsBytes), runtimeWasmBytes: Number(runtimeWasmBytes), fixedHtmlBytes: Number(fixedHtmlBytes)
  }), null, 2));
}
