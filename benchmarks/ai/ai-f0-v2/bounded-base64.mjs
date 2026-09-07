import crypto from 'node:crypto';

function safeInt(name, value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`INVALID_${name}`);
  return value;
}

export function planChunkedDecode({encodedChars, expectedBytes, chunkChars = 1024 * 1024}) {
  safeInt('ENCODED_CHARS', encodedChars, 0, Number.MAX_SAFE_INTEGER);
  safeInt('EXPECTED_BYTES', expectedBytes, 0, Number.MAX_SAFE_INTEGER);
  safeInt('CHUNK_CHARS', chunkChars, 4, 16 * 1024 * 1024);
  if (chunkChars % 4 !== 0) throw new Error('CHUNK_ALIGNMENT');
  if (encodedChars % 4 !== 0) throw new Error('BASE64_ALIGNMENT');
  const maxDecodedChunkBytes = (chunkChars / 4) * 3;
  return Object.freeze({
    schema: 'ofu-ai-f0-chunked-decode-plan-1',
    encodedChars,
    expectedBytes,
    chunkChars,
    maxDecodedChunkBytes,
    boundedScratchBytesUpperBound: chunkChars + maxDecodedChunkBytes,
  });
}

export function decodeBase64IntoSink(encoded, {
  expectedBytes,
  expectedSha256,
  chunkChars = 1024 * 1024,
  sink,
} = {}) {
  if (typeof encoded !== 'string') throw new Error('INVALID_BASE64_SOURCE');
  safeInt('EXPECTED_BYTES', expectedBytes, 0, Number.MAX_SAFE_INTEGER);
  if (typeof expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(expectedSha256)) throw new Error('INVALID_EXPECTED_SHA256');
  if (typeof sink !== 'function') throw new Error('INVALID_SINK');
  const plan = planChunkedDecode({encodedChars: encoded.length, expectedBytes, chunkChars});
  const hash = crypto.createHash('sha256');
  let written = 0;
  for (let offset = 0; offset < encoded.length; offset += chunkChars) {
    const text = encoded.slice(offset, Math.min(offset + chunkChars, encoded.length));
    if (text.length % 4 !== 0) throw new Error('BASE64_ALIGNMENT');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error('INVALID_BASE64_ALPHABET');
    const bytes = Buffer.from(text, 'base64');
    if (written + bytes.length > expectedBytes) throw new Error('DECODE_SIZE_EXCEEDED');
    sink(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), written);
    hash.update(bytes);
    written += bytes.length;
  }
  if (written !== expectedBytes) throw new Error('DECODE_SIZE_MISMATCH');
  const actualSha256 = hash.digest('hex');
  if (actualSha256 !== expectedSha256) throw new Error('DECODE_SHA256_MISMATCH');
  return Object.freeze({schema: 'ofu-ai-f0-chunked-decode-result-1', bytes: written, sha256: actualSha256, chunkChars: plan.chunkChars, maxDecodedChunkBytes: plan.maxDecodedChunkBytes});
}
