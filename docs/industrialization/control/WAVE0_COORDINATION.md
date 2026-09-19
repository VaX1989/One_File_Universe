# OFU Post-M0 Wave-0 Control Coordination

**Authority:** PLANNING_METADATA_ONLY  
**PROMPT_ID:** CTRL-WAVE0  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`  
**Frozen active R6 base:** `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e`  
**Frozen base tree:** `3704247247940fa8c5f08291cd80ec9e24e7d49d`  
**Control branch:** `integration/post-m0-dual-track-wave0-2026-09-17`

## Purpose

This branch is the sole Wave-0 convergence/control plane. It does not implement child lanes. It freezes the exact post-M0 base, semantic ownership, dependencies, gates, runnable queue, and merge ordering required by the canonical v4 master in PR #287.

## Initial runnable writers

- `PROD-W1-CONTRACTS`
- `QOBS-CROSS-PROGRAM`
- `IND-GOV-A`
- `IND-CONF-A`
- `IND-LIC-A`
- `IND-BRIDGE-A`

These writers are peers from the exact externally-bound control head. They target this control branch with Draft PRs. Each owns only its declared semantic surface plus additive lane-local tests/evidence/state.

## Read-only audit/research cells

- `ARCH-PERSIST`
- `ARCH-PROVIDER`
- `ARCH-RUNTIME`
- `ARCH-UE`
- `ARCH-WASM`
- `AUDIT-ABI`
- `AUDIT-AUTHORITY`
- `AUDIT-DETERMINISM`
- `AUDIT-PERFORMANCE`
- `AUDIT-PERSISTENCE`
- `AUDIT-PORTABILITY`
- `AUDIT-PRODUCT`
- `AUDIT-SCIENCE`
- `AUDIT-SECURITY`
- `IND-SEC-A`

They do not own production or shared implementation surfaces.

## Gate discipline

1. `G-PROD-CONTRACTS` requires `PROD-W1-CONTRACTS`.
2. `G0A_MINIMUM_NORMATIVE_SLICE` requires `IND-GOV-A`, `IND-CONF-A`, `IND-BRIDGE-A`, then independent `GATE-G0A-AUDIT`.
3. `G0B_EXTERNAL_CONSUMER_SEAM_PROOF` requires JS headless + external consumer + conformance + audit.
4. `IND-NATIVE-P2` must not activate before G0B.
5. `IND-RUNTIME` must not activate before explicit `G1_PASS_CONTINUE`.
6. Engine adapters remain blocked until G3 plus stable target C ABI.

## Integration policy

The control owner alone advances this branch by integrating evidence-complete lane PRs in dependency order. Shared out-of-scope changes require an `INTEGRATION_PATCH_REQUEST`. Conflicts are resolved by technical/source/contract authority, not timestamp. No lane may self-merge into this branch.

## Non-actions

No mutation of `main`; no merge of #274, #275, or #287; no tag/release; no R7; no force-push; no child implementation by CTRL-WAVE0.
