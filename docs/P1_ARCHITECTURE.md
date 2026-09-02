# P1 Constitutional Prototype Architecture

## Status

P1 is an end-to-end constitutional falsification prototype. It is deliberately not a production universe generator.

## Authority boundary

Canonical authority is limited to the dependency-free SHA-256 implementation, canonical integer/address/serialization primitives, framed addressed derivation, and the tiny micro-universe conformance substrate. Rendering, WebGPU capability detection, the embedded WASM experiment, timing, heap samples and native transcendental probes are non-authoritative.

## One-file runtime

`tools/build-p1.mjs` deterministically embeds source components, CSS, golden vectors, the Generator Manifest and Worker kernel source into `dist/One_File_Universe.html`. Runtime component SHA-256 checks execute before component evaluation. Strict execution uses `file://` and requires no application-owned external runtime resource. The browser harness observes request events, DOM resource references, Resource Timing entries and explicit network APIs. A deliberately injected local `file://` script is a positive control proving the harness detects application-owned local subresources.

Self-generated `blob:` Worker code and `data:`/`about:` resources are the only classified non-document resource schemes admitted by the P1 harness. They are derived from content already embedded in the artifact.

## Portable save contract

P1 portable event data is intentionally narrower than the prototype canonical in-memory serializer. It admits only null, booleans, NFC-normalized well-formed Unicode strings, safe integers, dense arrays and plain/null-prototype records. It rejects BigInt, floats, unsafe integers, undefined/functions/symbols, accessors, symbols, sparse/augmented arrays, cycles, excessive depth/nodes/keys/items/string bytes, invalid UTF-16, normalized-key collisions and prototype-sensitive keys.

Portable JSON is emitted in deterministic sorted-key form. Import requires exact known fields, exact outer and inner schema versions, exact canonical protocol version, exact Universe Identity shape, contiguous event sequence numbers, canonical normalized payload representation, SHA-256 integrity and optional expected seed/manifest identity. Unsupported future versions fail closed.

## Concurrency and failure behavior

Workers use an embedded complete canonical kernel closure, transferable result buffers, stable ID aggregation and a bounded timeout. Worker absence or hang is `ENVIRONMENT_LIMITED`; it cannot alter the direct canonical corpus digest. Worker counts 1, 2 and 4 are conformance-tested.

## Renderer safety

Capability probes guard Window-only globals and context creation. Missing `document`, `navigator`, canvas, WebGL2 or 2D context reports an unavailable capability/backend instead of causing an accidental `ReferenceError`. Rendering is outside canonical authority.

## P1 pinned semantic baseline

The committed P1 corpus digest is `4750e06a5820a6cc933a4cce97477e5b8b0ec28a4d021dcef8d32b9e330f1d3e`. A semantic change must deliberately evolve the vector/protocol baseline rather than allowing engines to agree on an unintended new result.
