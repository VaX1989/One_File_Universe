# Production Rendering — Final-Convergence Adversarial Review

## Scope

Review target: production rendering realigned onto signed P6 canonical main
`79d1817abc446f01825a66db93a2dc16aa379d7b`.

The review attacks terrain visibility, topology, GPU lifecycle, context loss,
integer-to-float precision boundaries, camera/LOD/cache/draw-order canonical
non-interference, P6 authority leakage, direct-file/offline operation,
reproducibility and release-asset traceability.

## Original four-runtime failure

Run `33738005905` reached direct `file://` rendering on every failed job.

- macOS ARM64 Playwright WebKit, Windows Chromium and Linux Playwright WebKit
  failed the first visual assertion because the terrain produced no measurable
  non-background pixels.
- Linux Chromium passed that assertion but failed GPU eviction evidence because
  the post-restore state reported no explicit deletion.
- Linux Firefox passed only through the Canvas2D fallback and therefore did not
  disprove the WebGL defects.

## Material findings and corrections

### Inward canonical terrain winding — FIXED

The base quad index order `a,c,b / b,c,d` wound every canonical cube-face
triangle inward. With WebGL back-face culling enabled, conforming engines culled
the terrain. The order is now `a,b,c / b,d,c`. A deterministic Node test proves
all 192 sampled canonical surface triangles across all six faces point outward.
The correction preserves vertex identity, elevation samples, seams and topology.

### Context restoration erased lifecycle evidence — FIXED

The `webglcontextrestored` path deleted the renderer state object. That reset
generation and deletion counters, so real evictions before restoration vanished
from the final evidence. Restoration now advances to a fresh GPU generation while
preserving cumulative created, deleted, invalidated and live counts. The invariant
`created = deleted + context-invalidated + live` is checked after eviction and
context-loss/restoration stress.

### Timing treated as a portable semantic threshold — CORRECTED

RAF percentiles, cold/warm startup, CPU mesh build and GPU submission wall time
remain measured and reported. They are validated for measurement integrity, but
not compared to a fabricated byte-deterministic cross-machine threshold.
Correctness, cache/resource bounds and witness equality remain hard failures.

## Canonical non-interference seal

The browser campaign captures P3 fact, P4 current/replay, P5 physical, P5 terrain,
P5 Environment v2 and P6 eligibility witnesses before aggressive rendering. It
then exercises continuous approach, surface traversal, mixed LOD, cache churn,
integer-origin rebasing, viewport/DPI changes, reversed draw order and WebGL
context loss/restoration where measurable. Exact witness equality is required
afterward.

The shipped artifact contains no `P6_CONFORMANCE_ONLY` authority. Its preview
requires the canonical Environment v2 projection and reports
`INSUFFICIENT_ENVIRONMENT / canonical biosphere established: NO`.

## Evidence policy

- `MEASURED`: RAF p50/p95/p99 and long frames, CPU terrain build, startup,
  cache counts, WebGL upload submission wall time where WebGL2 is active, heap
  where the engine exposes it, and GPU timer only when a valid non-disjoint query
  completes.
- `DERIVED`: renderer-controlled live/peak GPU allocation bytes.
- `NOT MEASURABLE`: unavailable heap/GPU timer and physical driver VRAM.

Missing telemetry is never synthesized. Playwright WebKit is not Safari/iOS
certification.

## Final gate

MATERIAL BLOCKERS may be declared zero only when the exact candidate and exact
merged main both pass the full frozen P1–P6 Node/oracle/replay/Golden suite,
deterministic exact-source single-file build, all five browser/runtime profiles,
aggregate witness seal, and published-asset byte verification.
