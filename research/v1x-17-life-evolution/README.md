# V1X-17 Life / Ecology / Evolution Research Frontier

Status: **RESEARCH / MODEL_DERIVED_SIMULATION CANDIDATE ONLY**. This directory is not a canonical P6 replacement and is not discovered by shipping registries.

## Authority boundary

- Frozen predecessor: `ofu-p6-biosphere-v1` at Prompt-0 base `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19`.
- Research model: `v1x17-life-ecology-evolution-fixed-v1`.
- Positive-life fixtures are explicitly post-genesis/model-derived. `abiogenesisStatus=NOT_MODELED`; canonical genesis/biology flags must be false.
- P4 (`ofu-p4-temporal-v1`) remains sole owner of accepted event order/replay. The model retains a replay accumulator and supplied P4 operation keys, not a private clock/event log.
- `r17:*` identifiers are deterministic research/replay IDs, not canonical P2 IDs.
- No renderer, central registry, build component, canonical domain, persistence surface or frozen P0-P6 file is modified.

## Environment dependency/readiness

`ofu-v1x17-environment-readiness-research-v1` requires an explicit environment packet bound to planet, environment epoch and P4 snapshot. Inputs declare a profile-specific transport medium, energy sources/capture bounds, bioavailable nutrients, redox requirement, and scientific metadata. Its strongest result is `RESEARCH_MODEL_INPUT_READY`: never occupancy, habitability proof, abiogenesis, or canonical life.

Earth-like N/P/redox constraints are declared profile assumptions, not universal life requirements.

## Deterministic ecology

The prototype uses BigInt state and integer ppm fractions with floor semantics. Population updates use explicit per-population vital rates, a **STYLIZED** carrying-capacity birth suppression, explicit energy/nutrient birth ceilings, edge-specific trophic removal/assimilation, dispersal conservation, and non-causal `ASSOCIATION_ONLY` edges. All flows operate on the pre-step state.

The active set is bounded to 64 populations, 128 lineages, 256 edges, 16 traits/lineage, 128 immediate organism samples and 1024 replay events/invocation. Network topology never establishes stability, specialization or coextinction.

## Lifecycle / mutation / speciation / extinction

- `lifecycle` conserves stage counts under supplied mortality, transitions and births. Stage definitions/rates remain model-specific.
- `mutation` deterministically maps lineage/trait/P4 keys through domain-separated SHA-256 to a bounded integer proposal. It is **STYLIZED / LOW fidelity**, not molecular genetics or a universal mutation rate.
- `SPECIATION` requires an explicit satisfied criterion witness; child lineage identity is deterministic. No universal distance/rate or taxonomic truth is inferred.
- `EXTINCTION` becomes formal only when represented aggregate lineage abundance is exactly zero. Extinct lineage records persist with their P4 extinction key; cause witnesses do not automatically establish causation.

## REFINE / PROJECT / RECONCILE

`ofu-v1x17-aggregate-organism-refinement-research-v1` preserves the cross-scale seam:

- **REFINE** requires an exact coarse-state digest and emits at most 128 deterministic ephemeral organism samples.
- **PROJECT** exposes sample/coarse linkage but never infers aggregate abundance from the sample.
- **RECONCILE** requires the same coarse-state digest/hierarchy; stale samples fail closed and cannot mutate coarse commitments.

Samples have `persistent=false` and `individualIdentityPromoted=false`. No anatomy, genetics, behavior or persistent individual history is claimed.

## Environment feedback seam

`feedback` produces bounded signed flux proposals from explicit coefficients/current abundance, with `mayDirectlyMutateEnvironment=false` and `requiresUpstreamEnvironmentAuthority=true`. Earth evidence motivates the seam but does not calibrate a universal feedback coefficient.

## Determinism / portability

- State/parameters: BigInt integers only.
- Fractions: ppm integers `[0,1000000]`.
- Serialization: sorted-key canonical UTF-8 with tagged BigInts.
- Identity/replay: domain-separated SHA-256.
- Floating-point biological state: none.
- Node `createHash` is research-only. A promoted/browser form must use the existing OFU browser-safe hash seam while preserving all golden identities.
- Independent Python oracle reproduces event/mutation hashes plus ecology/lifecycle arithmetic.

Commands:

```text
node research/v1x-17-life-evolution/test-frontier.mjs
python3 research/v1x-17-life-evolution/oracle-frontier.py
```

## Candidate shipping extraction — not performed here

All candidates remain `MODEL_DERIVED_SIMULATION` until separately promoted:

1. profile-bound readiness validator, still incapable of claiming life;
2. integer ecology/conservation helpers with calibrated parameters kept outside the kernel;
3. replay/serialization golden vectors after canonical identity mapping;
4. bounded aggregate-refinement/stale-reconciliation guards;
5. environment feedback **proposal** interface only.

No central component/conformance registry entry is added by this lane.

## Canonical-successor prerequisites

A separately versioned P6 successor requires supported/provenanced upstream environment quantities; explicit genesis/seed authority or continued fail-closed absence; P4-owned event families/serialization; canonical lineage/population/event identity and migration policy; archive/checkpoint/replay semantics; cross-language deterministic conformance; scientific calibration/validation of any promoted vital rates, capacities, efficiencies, demands or feedback coefficients in a declared validity domain; adversarial conservation/overflow/collision/replay/resource-bound/stale-materialization tests; and an explicit authority decision for every field.

Frozen `ofu-p6-biosphere-v1` must remain unchanged; promotion must be a new contract/version.

## Known unsupported

Abiogenesis probability, spontaneous occupancy, non-Earth biochemistry, universal habitability limits, molecular genetics/recombination/genotype-to-fitness, predictive macroevolution, universal species delimitation, alien morphology/anatomy/behavior, persistent individual organisms, unbounded ecosystems, and direct canonical environment mutation remain unsupported.

See `source-ledger.json` and `model-contract.json` for source-by-source/model-by-model fidelity and uncertainty.
