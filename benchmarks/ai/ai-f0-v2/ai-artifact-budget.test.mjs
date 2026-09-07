import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  PX_COMPONENT_MAX_BYTES, PX_PLAN_MAX_BYTES, base64Bytes, estimateEmbeddedArtifact,
  classifyAgainstConvergedPX, verifyAssetIdentity
} from './ai-artifact-budget.mjs';

test('PX limits are frozen to the converged component planner values', () => {
  assert.equal(PX_COMPONENT_MAX_BYTES, 4 * 1024 * 1024);
  assert.equal(PX_PLAN_MAX_BYTES, 64 * 1024 * 1024);
});

test('base64 amplification is exact', () => {
  assert.equal(base64Bytes(0), 0);
  assert.equal(base64Bytes(1), 4);
  assert.equal(base64Bytes(2), 4);
  assert.equal(base64Bytes(3), 4);
  assert.equal(base64Bytes(4), 8);
});

test('SmolLM2 135M cannot use the ordinary PX component channel', () => {
  const r = classifyAgainstConvergedPX({modelBytes: 117266133, tokenizerBytes: 3520000});
  assert.equal(r.fitsOrdinaryComponent, false);
  assert.equal(r.requiredChannel, 'SEPARATE_BOUNDED_AI_LARGE_ASSET_CHANNEL');
  assert.equal(r.standardEditionDependencyAllowed, false);
  assert.equal(r.shippingPromotion, false);
  assert.ok(r.rawAssetBytes > PX_PLAN_MAX_BYTES);
  assert.ok(r.largestAssetBytes > PX_COMPONENT_MAX_BYTES);
});

test('small research fixture remains ordinary-component-sized but gains no shipping promotion', () => {
  const r = classifyAgainstConvergedPX({modelBytes: 120, tokenizerBytes: 0, runtimeJsBytes: 1024, runtimeWasmBytes: 2048});
  assert.equal(r.fitsOrdinaryComponent, true);
  assert.equal(r.requiredChannel, 'ORDINARY_PX_COMPONENT');
  assert.equal(r.shippingPromotion, false);
});

test('artifact and transient decode amplification are conservative and deterministic', () => {
  const x = estimateEmbeddedArtifact({modelBytes: 117266133, tokenizerBytes: 3520000, runtimeJsBytes: 1000000, runtimeWasmBytes: 2000000, fixedHtmlBytes: 5000000});
  const y = estimateEmbeddedArtifact({modelBytes: 117266133, tokenizerBytes: 3520000, runtimeJsBytes: 1000000, runtimeWasmBytes: 2000000, fixedHtmlBytes: 5000000});
  assert.deepEqual(x, y);
  assert.equal(x.rawAssetBytes, 123786133);
  assert.equal(x.encodedAssetBytes, Math.ceil(123786133 / 3) * 4);
  assert.equal(x.artifactBytesUpperBound, x.encodedAssetBytes + 5000000);
  assert.equal(x.transientDecodeBytesLowerBound, x.rawAssetBytes + x.encodedAssetBytes);
});

test('invalid or unsafe numeric inputs fail closed', () => {
  for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => classifyAgainstConvergedPX({modelBytes: bad}));
  }
});

test('asset identity verification is exact SHA-256', () => {
  const bytes = new TextEncoder().encode('ofu-ai-fixture');
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.deepEqual(verifyAssetIdentity(bytes, sha), {ok: true, actualSha256: sha, expectedSha256: sha, bytes: bytes.byteLength});
  assert.equal(verifyAssetIdentity(bytes, '0'.repeat(64)).ok, false);
});
