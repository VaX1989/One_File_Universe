# P1 Constitutional Prototype Architecture

P1 is a falsification substrate, not a production universe generator.

## Runtime chain

`MasterSeed256 + GeneratorManifestHash + CanonicalProtocolVersion -> canonical address bytes -> domain/property-separated SHA-256 derivation -> tiny procedural facts -> optional mutable event overlay -> derived/presentation consumers`.

The generated artifact is `dist/One_File_Universe.html`; it is produced from modular source and is intentionally not committed as primary source.

## Canonical kernel

P1 uses a small dependency-free JavaScript reference kernel. Canonical identity/address fields are encoded as explicit bytes; identifiers beyond Number-safe range use BigInt and fixed-width u64 serialization. Canonical object serialization sorts object keys, normalizes text to NFC, rejects non-safe-integer Number values and hashes normative bytes with SHA-256.

This is a P1/P2 candidate, not a frozen final protocol. Any P2 stabilization requires expanded golden vectors and cross-runtime evidence.

## Procedural proof

The micro-generator exercises `galaxy cell -> system -> star -> planet metadata`. It is intentionally tiny and uses only integer-valued properties. It exists to prove sparse addressed derivation, domain separation and order independence.

## Authority boundary

Canonical facts are computed before rendering. WebGL2 consumes a fact snapshot and a 2D diagnostic fallback is available. Renderer choice is never fed back to canonical generation or digest calculation.

## Concurrency

Workers are constructed from embedded source through Blob URLs. Jobs contain explicit canonical addresses, results carry stable IDs, aggregation sorts by ID, and the same corpus is compared for 1 versus N workers. Result payload bytes are returned through a transferable ArrayBuffer path.

SharedArrayBuffer is capability-probed only and never required by Strict.

## WASM experiment

A 41-byte WASM module exporting deterministic i32 addition is base64-embedded and instantiated directly from bytes. The self-test measures decode/init and a small JS-versus-WASM call benchmark. This proves embedded WASM viability only; it does not justify a WASM-first architecture.

## Persistence

P1 saves are versioned JSON containers carrying Universe Identity, canonical protocol version, a bounded event overlay and SHA-256 integrity digest over canonical payload bytes. Import validates format, version, size, structure and integrity before returning state.

## Build integrity

The build has a fixed component order, normalizes line endings, embeds no timestamps/absolute paths/random IDs in the HTML and emits external build metadata separately. Runtime component source strings are hashed before execution; the SHA-256 bootstrap verifier is ultimately covered by the external whole-artifact hash.
