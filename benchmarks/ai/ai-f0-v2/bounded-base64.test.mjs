import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {decodeBase64IntoSink, planChunkedDecode} from './bounded-base64.mjs';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('plan exposes an O(chunk) scratch bound', () => {
  const p = planChunkedDecode({encodedChars: 8 * 1024 * 1024, expectedBytes: 6 * 1024 * 1024, chunkChars: 1024 * 1024});
  assert.equal(p.maxDecodedChunkBytes, 786432);
  assert.equal(p.boundedScratchBytesUpperBound, 1835008);
});

test('decodes exact bytes into a preallocated sink with incremental identity', () => {
  const source = Buffer.allocUnsafe(1024 * 1024 + 13);
  for (let i = 0; i < source.length; i++) source[i] = (i * 131 + 17) & 255;
  const encoded = source.toString('base64');
  const target = Buffer.alloc(source.length);
  const result = decodeBase64IntoSink(encoded, {expectedBytes: source.length, expectedSha256: sha(source), chunkChars: 64 * 1024, sink(chunk, offset) { target.set(chunk, offset); }});
  assert.deepEqual(target, source);
  assert.equal(result.bytes, source.length);
});

test('size overflow fails before sink write beyond declared capacity', () => {
  const source = Buffer.from('0123456789abcdef');
  const target = Buffer.alloc(4);
  assert.throws(() => decodeBase64IntoSink(source.toString('base64'), {expectedBytes: 4, expectedSha256: sha(source), chunkChars: 8, sink(chunk, offset) { target.set(chunk.subarray(0, Math.max(0, target.length - offset)), offset); }}), /DECODE_SIZE_EXCEEDED/);
});

test('wrong final size fails closed', () => {
  const source = Buffer.from('abc');
  assert.throws(() => decodeBase64IntoSink(source.toString('base64'), {expectedBytes: 4, expectedSha256: sha(source), chunkChars: 4, sink() {}}), /DECODE_SIZE_MISMATCH/);
});

test('wrong SHA fails closed after bounded decode', () => {
  const source = Buffer.from('abcdef');
  assert.throws(() => decodeBase64IntoSink(source.toString('base64'), {expectedBytes: source.length, expectedSha256: '0'.repeat(64), chunkChars: 4, sink() {}}), /DECODE_SHA256_MISMATCH/);
});

test('invalid alphabet and alignment are rejected', () => {
  assert.throws(() => decodeBase64IntoSink('AAAA*===', {expectedBytes: 3, expectedSha256: '0'.repeat(64), chunkChars: 4, sink() {}}));
  assert.throws(() => planChunkedDecode({encodedChars: 5, expectedBytes: 3, chunkChars: 4}), /BASE64_ALIGNMENT/);
  assert.throws(() => planChunkedDecode({encodedChars: 4, expectedBytes: 3, chunkChars: 6}), /CHUNK_ALIGNMENT/);
});
