# P1 Reproducibility Report

**State:** `REPRODUCIBLE` for the executed P1 build/conformance process.

The P1 build normalizes CRLF to LF, uses fixed source ordering, emits no timestamps or absolute paths into the artifact, uses deterministic JSON inputs and performs a byte-for-byte double-build comparison.

Pinned CI test toolchain: Node `24.20.0`, Playwright `1.62.1`. Playwright is test-only and is not embedded as a runtime dependency.

The machine-enforced matrix on run `33593422984` observed the same release artifact on Linux x64, Windows x64 and macOS arm64 browser jobs:

- bytes: `41,648`
- SHA-256: `9e83a6de553030a954ffce538e7e3d374b39d2830476d977e66be4b62360486d`
- Generator Manifest: `ed862a1a0295e5beaa695e0672bd19b982e322f3e8ba945f8f249442cce8a066`
- Golden Vector hash: `f00e63878645fd03815e6ed402c6535afef532c18f2bf124dc87f8aac4ef8ba0`
- Component Manifest: `31939440fc60b2da9c069d67bd755023c988fbd370b5ec4f7908c0da94a7d93e`

The canonical corpus digest is independently pinned in source and was `4750e06a5820a6cc933a4cce97477e5b8b0ec28a4d021dcef8d32b9e330f1d3e` on every executed target.

Remaining supply-chain limitation: GitHub Actions are version-tag pinned rather than immutable commit-SHA pinned in P1. P2 should strengthen action pinning where practical.
