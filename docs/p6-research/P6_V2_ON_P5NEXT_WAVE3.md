# P6 Biology v2 on P5-next — Wave III Research Checkpoint

Status: **RESEARCH ONLY / NON-CANONICAL**  
Stack branch: `research/p6-biology-v2-on-p5next`

This branch deliberately combines the exact bounded Biology-v2 research artifacts from `research/p6-biology-v2` with the P5 Environment-next frontier v3 checkpoint. The hosted Biology-v2 workflow was not copied into the stack; focused repository tests and independent oracles remain the preferred research verification path.

## Preserved Biology-v2 architecture

The bounded Biology-v2 model remains unchanged in its scientific claim scope:

- one biosphere per research world;
- <= 1024 lifetime lineages per biosphere;
- <= 256 active lineages;
- <= 32 persisted traits per lineage;
- <= 8 trophic transfers per ecology calculation;
- stable P2-derived biosphere, lineage, and species identities;
- typed P4 transition contract for research genesis, lineage founding, speciation, extinction, population, ecology allocation, and adaptation;
- extinction retains lineage/species tombstone semantics;
- persistent ordering, replay, checkpoints, compaction, and archive ownership remain P4 responsibilities;
- MICRO individuals remain deterministic ephemeral projections and are never promoted into persistent individual identity;
- macro/meso/micro LOD invariants preserve aggregate population and energy semantics.

Evidence classification remains:

- lifecycle / boundedness: `ESTABLISHED / FORMAL` as software/state semantics;
- ecology energy-accounting proxy: `EMPIRICALLY_CONSTRAINED / APPROXIMATE`;
- evolutionary adaptation/speciation response: `HYPOTHETICAL / STYLIZED`.

No scientific validity claim is added by stacking the branches.

## P5-next dependency repair

The original Biology-v2 research module preserved historical metadata naming the older `ofu-p5-environment-next-research-v1`. Rather than silently rewriting that historical checkpoint, this stack adds the explicit adapter:

`ofu-p6-p5next-environment-adapter-research-v1`

It binds to:

- `ofu-p5-environment-next-research-v2`;
- `ofu-p5-environment-next-frontier-research-v3`;
- `ofu-p5-p6-environment-readiness-research-v1`.

The adapter validates that the P5 readiness witness remains fail-closed and contains the required unsupported prerequisites. Its canonical-style mapping always returns:

- `state = INSUFFICIENT_ENVIRONMENT`;
- `canGenerateBiosphere = false`;
- `biologyEstablished = false`;
- `canonicalGenesisAvailable = false`;
- `persistentLineageTransitionsAuthorized = false`.

A positive canonical Biology path is therefore still absent.

## Research fixture separation

A separate adapter path permits exercising the already-bounded **post-genesis** transition machinery only when an explicit P6 research environment fixture:

- uses `P6_RESEARCH_ENVIRONMENT_ONLY` authority;
- is source-bound to the P5-next research contract family;
- satisfies the bounded Biology-v2 research environment schema.

That result explicitly records:

- `mode = POST_GENESIS_RESEARCH_FIXTURE_ONLY`;
- `canGenerateBiosphere = false`;
- `canonicalGenesisAvailable = false`;
- `canExercisePostGenesisTransitions = true`;
- `fixtureIsCanonicalPlanetFact = false`.

This is the central no-fake-genesis boundary: a fixture can test persistence, extinction, divergence, replay, ecology, and LOD without becoming evidence that life originates on any canonical planet.

## Verification

Preserved Biology-v2 evidence includes its existing focused lifecycle tests, golden vectors, browser smoke test, and independently structured Python oracle from the original research branch.

New stack evidence:

- `tests/p6-research-v2/p5next-interface.mjs` checks fail-closed P5 mapping, fixture-only transition eligibility, source-contract rejection, and forged positive-witness rejection;
- `tools/p6_p5next_adapter_oracle.py` independently verifies that the required unsupported set cannot produce a positive canonical biology path. The independent oracle passes locally.

No full rendering/product CI was invoked.

## Remaining blockers

1. canonical P5 volatile-state producer/source policy;
2. authoritative surface-temperature and viable-medium state;
3. physically authoritative usable energy and nutrient/redox state;
4. accepted transition-rate / selection / speciation calibration before evolutionary dynamics could make stronger scientific claims;
5. abiogenesis remains scientifically unsupported;
6. historical `P5_DEPENDENCY` metadata inside the original bounded-v2 module should be migrated in a future semantic-cleanup transaction if this stack advances toward promotion.

## Readiness

- bounded biological identity/lifecycle: `ORACLE_READY`;
- P4 transition/replay integration: `ORACLE_READY`;
- bounded ecology accounting: `ORACLE_READY` as an approximate research model;
- adaptation/speciation response: `IMPLEMENTATION_READY`, not scientific-promotion-ready;
- P5-next dependency adapter: `ORACLE_READY`;
- post-genesis fixture separation: `ORACLE_READY`;
- abiogenesis: `RESEARCH_ONLY` / unsupported.

**CANONICAL PROMOTION PERFORMED = NO**
