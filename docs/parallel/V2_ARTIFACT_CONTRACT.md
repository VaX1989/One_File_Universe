# V2.0 Artifact and Additive Provider Contract

Version: `2026-09-07.6`

## Frozen base semantics

`V2_PARALLEL_BASE_CURRENT.json.baseSha` and `.baseTree` identify the exact executable source commit that was built, tested, browser-exercised, and artifact-audited. The READY certification record is allowed to be a later metadata-only commit so that the record can point to an already-known immutable SHA/tree without an impossible self-reference. Parallel lanes MUST branch from `baseSha`, never infer the executable base from the certification commit SHA.

## Real shipping artifact

The only launch artifact witness is `dist/One_File_Universe.html` produced by `node tools/build-ofu-rendering-v09.mjs`. A V2 base is valid only when two builds from the same source SHA produce byte-identical HTML and byte-identical rendering manifests, the manifest byte/hash fields match the real file, no manifested executable/resource component is absent from the HTML, and exact browser conformance boots the single-file artifact into the Living product without page errors or external network dependencies.

`tests/governance/v2-parallel-base-artifact-audit.mjs` is the V2 base reproducibility/reachability witness. Existing release browser journeys remain the runtime consumer oracle.

## Additive lane contribution envelope

V2X-01 through V2X-16 may contribute only through governed additive registrations. Conceptually each contribution has:

- `laneId`, `providerId`, `owner`, semantic version and declared capabilities;
- one evidence authority class from the centrally allowed set;
- zero or more rendering packets;
- zero or more inspector packets;
- zero or more namespaced persistence contributions/codecs;
- zero or more conformance contributions;
- one or more artifact-reachability witnesses for every shipping capability.

The concrete PX component descriptors and registry contracts in `tools/extensions/components.mjs`, `src/extensions/contracts.js`, and `src/extensions/registry.js` remain the executable schema. This document freezes the V2 launch law around those interfaces rather than introducing a second competing registry.

## Rendering packets

Rendering contributions are additive scene data/presentation providers. They MUST NOT own selection, semantic scale, travel distance, camera/spatial frame, scene composition, the primary renderer, or the input router. Presentation assets remain `PRESENTATION_ONLY`; runtime measurements remain `MEASURED_RUNTIME_EVIDENCE`. A second primary renderer for one active scene is invalid.

## Inspector packets

Inspector contributions are read-only descriptions/evidence/provenance for addressed state. They MUST preserve the source authority class and MUST NOT promote model-derived or presentation data to canonical evidence. Inspector registration does not confer mutation authority.

## Persistence contributions

Lane persistence state and codecs MUST be namespaced, bounded, versioned, deterministic, and additive. The central persistence/replay authority owns the portable envelope, ordering, restoration, and replay semantics. A lane contribution cannot replace the central codec or reinterpret another lane's persisted state.

## Conformance contributions

Conformance contributions MUST be deterministic, runnable from exact source, bounded, and falsifiable. They may add tests/witnesses but may not weaken, skip, or reinterpret an existing required gate. A failed required contribution blocks promotion.

## Artifact-reachability witnesses

Every shipping lane capability must identify its manifested component/provider and at least one runtime consumer or conformance witness. Manifested executable/resource components that are not embedded in the shipping HTML fail the base audit. Source that is intentionally research-only or documentation-only is not a shipping capability and must not be represented as artifact-reachable.

## Collision and authority law

Duplicate component IDs, provider IDs, capability claims, fragment slots, central-authority claims, and active primary-renderer claims fail closed. There is no last-writer-wins behavior. The normative central map is `docs/parallel/V2_CENTRAL_AUTHORITY_MAP.json`; path ownership is `docs/parallel/V2_OWNERSHIP_MATRIX.md` plus the inherited `V2X_OWNERSHIP_MATRIX.json`.
