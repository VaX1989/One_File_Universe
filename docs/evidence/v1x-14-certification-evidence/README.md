# V1X-14 certification evidence

This namespace contains TEST / MEASURED_RUNTIME_EVIDENCE machinery only. It has no product authority and cannot promote presentation, model-derived simulation, or runtime measurements to `CANONICAL_PROVEN`.

## Exact-head rule

Every runtime bundle is written under `reports/v1x-14-certification-evidence/<git-sha>/...` and records the exact commit SHA/tree. Any later commit makes earlier runtime evidence stale for certification. `build-evidence-manifest.mjs` validates its manifest against the checked-out HEAD.

## Anti-test-only closure

Founder-critical experience claims are not closed by tests, CSS, persistence, assertions, or evidence tooling. A claim marked PASS must include a responsible production-file delta plus implementation, semantic, and visual/journey evidence; resource claims additionally require measured resource evidence.

## Browser evidence

`browser-evidence.mjs` runs the shipping single-file artifact directly via `file:` in Chromium, Firefox, and WebKit. It records external HTTP(S) attempts, semantic scale/runtime state, frame hashes, and governed resource snapshots. Motion claims require both changing deterministic state and changing frame hashes; screenshots alone are insufficient.

## Soak evidence

`soak-revisit.mjs` repeatedly traverses the semantic scale ladder, exports/imports session state, and checks upstream cache, history, mesh, GPU-byte, embedded-resource, and canonical-mutation bounds. Physical Android/iOS evidence remains `NOT_VERIFIED` unless a separate real-device campaign supplies it.

## Reference-frame limitation

The frozen public seams expose `selectedCanonicalTarget`, scale state, camera intent, and scene ownership, but do not expose a separately named public reference-frame identity. V1X-14 therefore records reference-frame continuity as `NOT_VERIFIED_NO_PUBLIC_REFERENCE_FRAME_WITNESS` rather than manufacturing an identifier.
