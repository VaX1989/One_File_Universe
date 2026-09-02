# P1 Decision Record

P1 evidence supports the following decisions without freezing P2 protocol details.

| Area | P1 decision | Status for P2 |
|---|---|---|
| Runtime authority | dependency-free JS canonical reference is viable | candidate, not permanent language lock-in |
| WASM | embedded WASM executes in Strict direct-open | experiment only; Rust/WASM and Zig/WASM unverified |
| Numerics | checked integer/BigInt/fixed-point candidates are viable; native sin/log remain non-canonical | P2 must define domain-specific numeric contract |
| Parallelism | Blob Workers + transferables are viable and order-independent in the executed matrix | retain; SharedArrayBuffer optional only |
| Rendering | WebGL2/2D diagnostic fallback can consume facts without authority | presentation only |
| Persistence | portable JSON can be made bounded and fail-closed for P1 | do not confuse with final P2 canonical binary value model |
| Strict resource proof | one-file proof must observe local as well as network resources | retain as conformance invariant |
| Corpus | matrix agreement alone is insufficient; expected digest must be committed | retain and strengthen in Golden Universe Corpus v1 |
| Language | English is normative; localization is non-normative | constitutional policy |

No accepted P0 ADR was superseded by P1. P2 must separately adjudicate canonical value encoding, exact derivation construction, semantic versus implementation manifests, and multiscale identity/query implications before freezing long-lived bytes.
