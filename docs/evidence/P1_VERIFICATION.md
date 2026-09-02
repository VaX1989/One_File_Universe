# P1 Verification Report

**Evidence date:** 2026-09-02  
**Certified code head:** `2eff57ea5402243a120c4e10727e0163a974164d`  
**P1 Conformance run:** `33593422984`  
**Aggregate state:** `CROSS_RUNTIME_VERIFIED`

## Machine-enforced aggregate

- artifact bytes: `41,648`
- artifact SHA-256: `9e83a6de553030a954ffce538e7e3d374b39d2830476d977e66be4b62360486d`
- Generator Manifest hash: `ed862a1a0295e5beaa695e0672bd19b982e322f3e8ba945f8f249442cce8a066`
- Golden Vector hash: `f00e63878645fd03815e6ed402c6535afef532c18f2bf124dc87f8aac4ef8ba0`
- Component Manifest hash: `31939440fc60b2da9c069d67bd755023c988fbd370b5ec4f7908c0da94a7d93e`
- canonical corpus digest: `4750e06a5820a6cc933a4cce97477e5b8b0ec28a4d021dcef8d32b9e330f1d3e`
- aggregate failures: none

## Executed matrix

| Platform | Architecture | Engine | Engine version | Node | Playwright |
|---|---|---|---|---|---|
| Ubuntu 24 runner | x64 | Chromium | 151.0.7922.34 | 24.20.0 | 1.62.1 |
| Ubuntu 24 runner | x64 | Firefox | 153.0 | 24.20.0 | 1.62.1 |
| Ubuntu 24 runner | x64 | WebKit | 26.5 | 24.20.0 | 1.62.1 |
| Windows Server 2025 runner | x64 | Chromium | 151.0.7922.34 | 24.20.0 | 1.62.1 |
| macOS 26 runner | arm64 | WebKit | 26.5 | 24.20.0 | 1.62.1 |

Playwright WebKit is not described as Safari certification.

## Exit adjudication

| Requirement | Implemented | Test executed | Result | Runtime/platforms | Evidence | Remaining risk |
|---|---|---|---|---|---|---|
| Strict direct-open | yes | yes | PASS | all five targets | `file://` browser harness | real Safari/iOS not executed |
| One artifact / no local subresources | yes | yes | PASS | all five targets | request + DOM + Resource Timing audit and positive control | browser instrumentation remains test-harness code |
| No runtime network | yes | yes | PASS | all five targets | request observation plus blocked fetch/XHR/WebSocket/EventSource/WebTransport/beacon | future APIs require harness maintenance |
| Pinned canonical corpus | yes | yes | PASS | all five targets | committed corpus digest + aggregator | P1 corpus is intentionally small |
| Worker count/order independence | yes | yes | PASS | all five targets | 1/2/4 Worker test | SharedArrayBuffer not adopted |
| Worker unavailable/hang safety | yes | yes | PASS | all five targets | unavailable and timeout injections | timeout is a P1 policy, not final P2 scheduler design |
| Strict/Enhanced semantic equality | yes | yes | PASS | all five targets | aggregate equality gate | Enhanced coverage is diagnostic, not performance certification |
| Component corruption rejection | yes | yes | PASS | all five targets | injected source corruption | not a signed supply-chain scheme |
| Portable save round-trip/integrity | yes | yes | PASS | Node + all five browser targets | adversarial save suite | P1 format is not the final P2 canonical value protocol |
| Bounded portable event domain | yes | yes | PASS | Node + all five browser targets | BigInt/cycle/version/NFC tests | limits may evolve with explicit schema compatibility |
| Renderer context safety | yes | yes | PASS | Node + browser matrix | no-Window probe plus renderer authority test | rendering portability beyond executed engines not verified |
| Reproducible local build | yes | yes | PASS | Node 24.20.0 CI | byte-for-byte double build | cross-OS build equality is enforced through browser evidence hashes, not a separate independent compiler |
| Cross-matrix evidence aggregation | yes | yes | PASS | five targets | `aggregate-evidence` job | target matrix is not universal browser certification |
| English normative policy | yes | yes | PASS | Foundation Integrity | conservative marker validation | validator intentionally is not a language detector |

## Adversarial findings closed

- Blob Worker originally omitted the SHA-256 bootstrap: confirmed implementation defect, fixed and cross-runtime verified.
- Signed galaxy coordinates originally risked modulo aliasing: confirmed design defect, fixed with checked signed i64 encoding.
- Portable save admitted values JSON could not represent: confirmed review defect, fixed by an explicit bounded portable domain.
- Renderer probe could reference an absent `navigator`: confirmed review defect, fixed with guarded capability access.
- Initial local-resource positive control depended on engine request events: Firefox falsified that assumption; proof now combines request, DOM and Resource Timing surfaces and passes the full matrix.

## Limitations

Memory metrics are only partially comparable across engines. The 41.6 KB artifact is too small for record-scale compression conclusions. Real distributed Safari/iOS and mobile are `NOT_VERIFIED`. Rust/WASM and Zig/WASM are `NOT_VERIFIED`; only a tiny embedded WASM experiment was executed. P1 does not certify production cosmology or long-lived P2 protocol semantics.
