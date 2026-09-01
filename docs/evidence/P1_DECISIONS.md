# P1 Decision Experiments

## Language / WASM

| Candidate | P1 evidence | Strength | Cost / risk | P1 disposition |
|---|---|---|---|---|
| JavaScript reference kernel | Executed in Node; browser matrix defined | Minimal tooling, native browser access, easy direct-open embedding | Must constrain numeric semantics explicitly | Retain as reference candidate |
| Embedded WASM helper | Real embedded i32 module + init/interop benchmark | Compact deterministic integer execution is viable | JS/WASM call boundary can dominate tiny operations; toolchain not yet justified | Keep experimental |
| Rust/WASM | Not implemented in P1 | Mature WASM ecosystem | Adds build/toolchain complexity and bytes | NOT_VERIFIED; do not freeze |
| Zig/WASM | Not implemented in P1 | Potential compact output | Adds build/toolchain complexity and less project evidence | NOT_VERIFIED; do not freeze |

## Numeric classes

- exact u32 operations and `Math.imul`: D3 candidates, subject to golden-vector browser confirmation;
- BigInt integer identities/fixed-width serialization: D3 candidate;
- domain-specific integer fixed point: D3 candidate;
- explicitly quantized floating-point: candidate only after cross-runtime corpus evidence;
- native transcendental functions (`sin`, `log`): D1 experimental and MUST NOT define canonical state in P1/P2 without a stronger specified algorithm.

No global Q32.32 requirement is adopted.

## Embedding / compression

P1 embeds source text directly plus a tiny base64 WASM payload. This minimizes decoder complexity and makes component integrity auditable. Compression is deferred: at ~30 KB the prototype is too small for compression tradeoffs to be representative of record-scale artifacts. P12 must revisit parse/decode amplification with realistic payloads.
