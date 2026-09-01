# P1 Verification Report

Evidence states are not promoted beyond what actually executed.

## Executed locally before CI

- foundation validation: PASS
- dependency-free Node conformance suite: PASS
- SHA-256 known answer (`abc`): PASS
- repeated canonical micro-generation: PASS
- query-order metamorphic test: PASS
- >2^53 address identity represented through BigInt/u64: PASS
- u64 overflow rejection: PASS
- unsafe floating Number canonical serialization rejection: PASS
- portable save export/import digest equality: PASS
- corrupted save integrity rejection: PASS
- malformed save rejection: PASS
- unsupported future save version rejection: PASS
- two-build byte reproducibility: PASS

Local sample digest: `fcc9c8a641a899ab719f023de9acc2c5227e12c6fc5efbd907d66a36086776b1`.

## Browser evidence gate

The branch defines a Playwright matrix for Chromium, Firefox and WebKit. Each job first builds the single HTML, opens it through an actual `file://` URL, instruments and blocks fetch/XHR/WebSocket plus observes external requests, runs 1-vs-N Blob workers with transferable ArrayBuffer results, instantiates embedded WASM, checks save round-trip and renderer authority separation, then separately serves the identical bytes over localhost as Enhanced and requires Strict/Enhanced canonical digest equality.

Browser results remain `TEST_DEFINED / NOT_VERIFIED` until the GitHub Actions run completes. A browser capability absent from the executed runner must be reported `ENVIRONMENT_LIMITED`, not PASS.

## Initial gate table

| Requirement | Implemented | Test executed | Result | Platforms | Evidence | Remaining risk |
|---|---|---|---|---|---|---|
| modular -> one HTML | yes | yes | PASS | Node 22 local | build script + artifact hash | CI Node 20 comparison pending |
| Strict Direct-Open | yes | no | NOT_VERIFIED | browser CI pending | direct-open harness | file-origin engine differences |
| zero required network | yes | no | NOT_VERIFIED | browser CI pending | active network blockers | browser request surface |
| canonical addressed derivation | yes | yes | PASS | Node 22 local | node tests | browser cross-runtime pending |
| canonical serialization/digest | yes | yes | PASS | Node 22 local | SHA/vector tests | protocol remains P1 candidate |
| query-order independence | yes | yes | PASS | Node 22 local | metamorphic test | browser pending |
| worker/scheduling independence | yes | no | NOT_VERIFIED | browser CI pending | 1-vs-N test | Blob Worker file-origin policy |
| embedded WASM | yes | no | NOT_VERIFIED | browser CI pending | real 41-byte module | direct-open engine policy |
| WebGL2 baseline | yes | no | NOT_VERIFIED | browser CI pending | renderer probe | headless GPU availability |
| WebGPU capability behavior | yes | no | NOT_VERIFIED | browser CI pending | capability probe only | runner support varies |
| portable save round-trip | yes | yes | PASS | Node 22 local | state digest equality | browser replay pending |
| corrupted-save fail-closed | yes | yes | PASS | Node 22 local | adversarial test | schema is intentionally minimal |
| performance/memory evidence | partial | partial | PARTIAL | Node 22 local | bytes; browser timers defined | heap API varies by engine |
| reproducible build | yes | yes | REPRODUCIBLE | Node 22 local | two byte-identical builds | independent CI pending |
| cross-runtime corpus | yes | no | NOT_VERIFIED | browser CI pending | browser matrix | must not close P1 early |
