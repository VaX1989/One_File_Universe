# R6/W0 M0 External Incident Ledger

Freeze: `OFU-R6-W0-2026-09-15-27657AB9`

This ledger records environment limitations separately from repository-controlled engineering defects. It must not be used to waive a failing repository-controlled gate.

## EXT-01 — Physical GPU evidence unavailable on hosted CI

- Classification: `EXTERNAL_EVIDENCE_LIMITATION`
- Scope: physical-GPU frame pacing / device rendering evidence only.
- Hosted GitHub Actions browser jobs report software rendering (SwiftShader) rather than a verified physical GPU.
- Repository-controlled performance, resource-boundedness, browser compatibility, visual-sequence, scientific-authority and deterministic-build gates remain mandatory and must pass independently.
- Disposition: deferred physical-device evidence; not represented as verified.

## EXT-02 — Local assistant execution environment cannot provide the authoritative GitHub browser/runtime path

- Classification: `REPRODUCIBILITY_ENVIRONMENT`
- Scope: local ad-hoc reproduction only.
- The local execution environment previously could not resolve `github.com` for a direct clone and did not provide the repository Playwright browser runtime.
- Exact-source GitHub Actions plus the authenticated GitHub repository API remain available and are the authoritative reproducible path for this closure.
- Disposition: archived as environment-only; no repository defect inferred from this condition.

## Closure rule

M0 engineering closure may proceed only when the exact final convergence SHA passes every repository-controlled gate, including multi-world, visual/scientific authority, the >=50-loop resource soak, clean-room byte-identical build, and Chromium/Firefox/WebKit. Any remaining physical-GPU/device evidence must be named explicitly as deferred evidence in the terminal closure packet.
