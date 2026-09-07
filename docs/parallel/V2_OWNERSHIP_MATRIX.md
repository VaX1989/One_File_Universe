# V2.0 Parallel Ownership Matrix

Version: `2026-09-07.6`

This file is the V2.0 launch overlay on `docs/parallel/V2X_OWNERSHIP_MATRIX.json` version `2026-09-07.5`. Existing lane path ownership remains unchanged unless this document is explicitly superseded by the central convergence owner.

## Single central authority

The normative machine-readable map is `docs/parallel/V2_CENTRAL_AUTHORITY_MAP.json`. Exactly one owner, `CONVERGENCE_OWNER`, owns each of: selection, semantic scale, travel distance, camera/spatial frame, scene composition, primary renderer, input router, and persistence/replay. A second primary owner, authority rebinding, or lane claim over any of these is invalid and MUST fail closed.

## Lane law

V2X-01 through V2X-16 remain isolated owners only of their paths from `V2X_OWNERSHIP_MATRIX.json`. A lane may contribute providers, render packets, inspector packets, persistence codecs/state fragments, conformance tests, and artifact reachability witnesses through the additive contracts in `V2_ARTIFACT_CONTRACT.md`. A lane MUST NOT directly mutate central selection, scale, travel-distance, camera/frame, scene-composition, primary-renderer, input-router, persistence/replay, build orchestration, or convergence records.

Duplicate provider IDs, capability claims, fragment slots, or primary-renderer claims are launch blockers. Existing PX component/registry planning is authoritative for collision rejection; there is no last-writer-wins fallback.

## Integration writer

During massive parallel execution, Prompt 01 / `CONVERGENCE_OWNER` is the sole writer for shared semantics and convergence records. Lane checkpoints are evidence inputs, never implicit promotion authority.
