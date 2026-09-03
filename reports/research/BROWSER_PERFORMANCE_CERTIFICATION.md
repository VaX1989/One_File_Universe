# Browser / Performance Certification Research

Status: RESEARCH-ONLY, NON-CANONICAL

Baseline source: `ffc1630d7c07f41a144945759f02e48b2dc0c9f3`
Baseline tree: `f7958a7c4adfa388f261876831980988e9d85ef5`
Canonical Rendering Production run: `33773986139` (`SUCCESS`)

## Scope and classification

This lane owns verification evidence only. It does not own P1-P6 semantics, product semantics, rendering authority, canonical integration, or releases.

Automated Playwright engine evidence is not called real-browser or real-device evidence. In particular:

- Playwright WebKit is **not Safari certification**.
- GitHub-hosted macOS is **not a real-device certification**.
- Linux Firefox using Canvas2D is **fallback certification**, not WebGL2 certification.
- renderer-tracked GPU allocation bytes are **not physical VRAM**.
- unavailable telemetry is reported as `NOT_MEASURABLE` or `NOT_VERIFIED`, never inferred.

## Live evidence from exact-current-main

The exact-current-main production artifacts from run `33773986139` establish the following automated-engine matrix.

| Environment | Engine version | DPR | Backend obtained | WebGL2 evidence | Classification |
| --- | --- | ---: | --- | --- | --- |
| Linux x64, Chromium | 151.0.7922.34 | 2 | `webgl2` | draw calls 24, pixel readback measured, `glError=0`, context loss/restore PASS | WEBGL2 automated engine |
| Linux x64, Firefox | 153.0 | 1 | `canvas2d` | `NOT_APPLICABLE` | Canvas2D fallback automated engine |
| Linux x64, Playwright WebKit | 26.5 | 1 | `webgl2` | draw calls 24, pixel readback measured, `glError=0`, context loss/restore PASS | WEBGL2 automated engine, not Safari |
| Windows x64, Chromium | 151.0.7922.34 | 1 | `webgl2` | draw calls 24, pixel readback measured, `glError=0`, context loss/restore PASS | WEBGL2 automated engine |
| macOS ARM64, Playwright WebKit | 26.5 | 1 | `webgl2` | draw calls 24, pixel readback measured, `glError=0`, context loss/restore PASS | WEBGL2 automated engine, not Safari |

All five artifacts report zero unexpected runtime network requests and zero page errors while loading the single artifact by `file://`.

## Current performance characterization

Single-run measurements from exact-current-main are evidence, not normative SLOs.

| Environment/backend | Cold / warm startup ms | steady surface p95 ms | LOD churn p95 ms | reference transition p95 ms | >100 ms frames observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Linux Chromium WebGL2 DPR2 | 265 / 216 | 33.4 | 50.0 | 33.4 | 1 in reference transition |
| Linux Firefox Canvas2D | 478 / 204 | 17.12 | 17.12 | 17.12 | 0 |
| Linux WebKit WebGL2 | 555 / 241 | 49 | 46 | 46 | 0 |
| Windows Chromium WebGL2 | 376 / 164 | 16.7 | 16.7 | 16.8 | 0 |
| macOS ARM64 WebKit WebGL2 | 971 / 669 | 18 | 49 | 22 | 1 in LOD churn |

CPU terrain-build telemetry is cumulative over the exercised workload and therefore must not be interpreted as per-frame latency. GPU submission telemetry is CPU wall time around submission, not GPU execution time.

`EXT_disjoint_timer_query_webgl2` was unavailable in the observed WebGL2 environments, so GPU execution time remains `NOT_MEASURABLE` there. Physical driver VRAM also remains `NOT_MEASURABLE` because no portable browser API exposes it.

## Working-set and leak evidence

On WebGL2 runs the production harness exercises GPU eviction and context loss/restoration. The final tracked GPU working set remains bounded by 48 meshes and 8 MiB; exact buffer deletion/invalidation accounting is asserted. The exact-current-main Chromium Linux artifact ended with 24 live meshes, 22,176 tracked live bytes, 2,326 created buffers, 2,188 deleted buffers and 90 invalidated buffers after recovery. Other WebGL2 artifacts show the same bounded final live mesh/byte envelope.

This is strong lifecycle evidence for the bounded test workload. It is **not yet a long-duration leak certification** covering thousands of target switches, thousands of LOD transitions, repeated DPR mutation, and real-device driver behavior.

## Test-quality audit

Confirmed weaknesses of the current production harness:

1. Performance metrics are primarily validity-checked (`MEASURED`, sample count, finite ordered quantiles). They are not governed by mature normative SLO thresholds.
2. The matrix job can succeed when Firefox Linux falls back to Canvas2D. The JSON correctly records the fallback, but the workflow itself did not require an expected backend per platform.
3. Browser metadata is useful but does not yet include an explicit certification class, runner class, viewport metadata in the top-level record, or safely exposed GPU renderer/vendor information.
4. One sample run per matrix cell is inadequate for statistical regression gating.
5. No current environment constitutes real Safari, iOS Safari, Firefox-on-real-GPU, or Android Chrome device certification.
6. Current v0.5 cannot exercise v0.6 dynamic target switching because that product behavior is not canonical/current-main functionality yet.

## Research-branch improvements

This branch adds:

- `tests/rendering/browser-capability-probe.mjs`: backend-explicit probe with expected backend enforcement, WebGL2 context evidence, draw/pixel/error evidence, direct-file/network checks, exact engine/OS/architecture/headless/DPR/viewport metadata, and safely exposed GPU renderer/vendor when available.
- `tests/rendering/performance-certification.mjs`: repeated characterization wrapper preserving every raw run and producing cross-run summaries without inventing a normative pass threshold.
- `.github/workflows/browser-performance-research.yml`: isolated research matrix that explicitly requires `webgl2` or `canvas2d` for each currently known runner/engine cell and labels all evidence as automated-engine rather than real-device certification.

## Candidate SLO research

No hard performance SLO is promoted by this branch. The current evidence is sufficient only to define **candidate classes for calibration**:

- `MINIMUM_SUPPORTED`: hard correctness requirements only (artifact loads by `file://`, no required network, backend disclosed, nonzero draws, WebGL2 pixel/readback/error/lifecycle checks where WebGL2 is claimed, bounded resource accounting, canonical non-interference). Performance remains advisory until real-device calibration exists.
- `TARGET` candidate for desktop WebGL2 calibration: cold startup around <= 1.2 s, warm startup around <= 0.8 s, steady-surface p95 around <= 50 ms, transition/LOD p95 around <= 60 ms, and no sustained >100 ms stalls. These values are intentionally above the present observed envelope and are **not release gates** yet.
- `HIGH_END` candidate: near-refresh-limited steady state (roughly <= 20 ms p95 on 60 Hz-class environments) with transition p95 <= 33 ms. This class cannot be fairly applied to headless CI because RAF scheduling itself can quantize near 33-50 ms.

Before any candidate becomes a regression gate, collect repeated distributions on multiple runner attempts plus real hardware classes. Regression gates should compare distributions and working-set bounds, not one synthetic timing sample.

## Real-device matrix

| Target | Status |
| --- | --- |
| Safari macOS real | `NOT_VERIFIED` |
| Safari iOS real | `NOT_VERIFIED` |
| Chrome Android real | `NOT_VERIFIED` |
| Firefox with real WebGL2 hardware path | `NOT_VERIFIED` |
| Chrome/Chromium macOS real | `NOT_VERIFIED` |

## Promotion handoff

Rendering/Product v0.6 should consume the backend-explicit classification and add target-switch timing/non-interference evidence once arbitrary canonical target selection exists. The Integration Owner should not treat this branch as a promotion request: it is a verification harness and evidence lane only.

### MATERIAL BLOCKERS

For claiming **real-device / Safari / Android / real Firefox-WebGL2 certification**: the required environments are unavailable in current evidence, therefore those certifications are blocked and must remain `NOT_VERIFIED`.

For current canonical v0.5 correctness: none identified by this verification lane from run `33773986139`.

### IMPORTANT NON-BLOCKERS

- Performance SLOs are not mature enough to be hard release gates.
- GPU execution timing is unavailable in current CI engines.
- Physical VRAM is not portably measurable.
- Long-run stress coverage is not yet sufficient for real-device leak claims.
- v0.6 target-switch performance awaits the Product/Rendering candidate that actually implements dynamic target selection.
