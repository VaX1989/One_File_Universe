# P6 Biosphere & Evolution v1 — Pre-Promotion Adversarial Review

Status: **OPEN until exact-head promotion gates pass**

Base: live canonical P5 Environment v2 on `main` (`ace38aac27b9098a9c01b390eeaa82933077f4be`).

## Material blockers found and disposition

1. **Upstream authority not yet canonical at mission start** — RESOLVED. P5 Environment v2 was merged by PR #32 before the P6 canonical branch was created. The canonical P6 branch was created fresh from the resulting exact `main`, not from the research/prep branch.
2. **Unsupported environment state existed in vocabulary but was not independently reachable** — RESOLVED. P6 v1 now classifies required `UNKNOWN` as `INSUFFICIENT_ENVIRONMENT`, required `UNSUPPORTED` as `UNSUPPORTED_ENVIRONMENT` when no higher-priority unknown remains, and fully evaluated/no-genesis as `NO_BIOSPHERE`.
3. **Source-module browser evidence could diverge from shipped single-file behavior** — RESOLVED. Browser certification now builds and opens the actual single-file artifact offline.
4. **Golden vectors were not an explicit exact-head gate** — RESOLVED. The immutable `golden-p6-biosphere-v1` corpus is independently checked in JavaScript and Python.
5. **Legacy save absence semantics needed direct evidence** — RESOLVED. P1–P5 portable saves remain schema v1 and P6 absence remains absence; P6 mutable history uses P4 archives bound to the P6 transition descriptor and baseline law metadata.

## Identity adversarial review

- Model B (generator version in semantic IDs) was rejected because non-semantic model fixes would churn biosphere/lineage/species references.
- Realization-hash identity was rejected because it conflates generated state with semantic identity.
- Model A is selected: P2 Entity Identity uses canonical Universe Identity + semantic stable key + explicit identity-policy version. Model/manifest versions remain realization/replay provenance.
- Individual identity is not promoted in v1.

## Scientific leakage review

- No P6 canonical path accepts the historical `p6-environment-research-v0.2` authority.
- No Earth atmosphere, water, temperature, geology, radiation or chemical-energy default is injected.
- Current real P5 Environment v2 therefore remains eligible for `INSUFFICIENT_ENVIRONMENT` and `canGenerateBiosphere=false`.
- Supported-life conformance uses an explicitly separate `P6_CONFORMANCE_ONLY` vector and cannot masquerade as a natural P5 planet.
- Chemotrophy is unavailable without explicit usable chemical-energy input.
- Scientific evidence/fidelity labels remain present in promoted structures and documentation.

## Determinism review

- Persistent/normative P6 numerics are integer-only: u32-like ppm domain `0..1,000,000` represented as validated BigInt and u64 energy/model units.
- Fraction multiplication is exact integer product then floor division by 1,000,000.
- Invalid ranges/overflow reject rather than silently clamp.
- Population count is deliberately outside v1.
- P2 addressed derivation uses the actual P6 Semantic Manifest hash; no global RNG/private biological seed tree exists.

## P4 ownership review

P6 owns payload validation and reducer semantics only. The canonical ownership declaration keeps all of the following false:

- privateClock
- ownsOrdering
- ownsEventIdentity
- ownsReplay
- ownsCheckpoints
- ownsCompaction
- ownsLineage

Promoted event families are limited to genesis, speciation and extinction. No canonical biological scheduler or event-rate law is introduced.

## Working-set review

The conformance campaign keeps conceptual queries direct/sparse and bounds simultaneously materialized refinements. MICRO individuals are ephemeral and non-persistent. No global biosphere/species/individual enumeration is required.

## Important non-blockers

- P5 Environment v2 does not yet canonically establish water phase, geochemical energy, geological activity, XUV history or a complete climate state. This legitimately prevents real biosphere genesis; it does not invalidate P6 v1's fail-closed contract.
- Detailed genetics, morphology, mutation rates, population ecology, regional food webs and intelligent life remain future research.

## Follow-up after v1

Create separate research issues for advanced ecology/evolution, richer P5 chemistry-energy coupling, population models and any future identity-policy migration.

## Rejected findings

- “P6 must generate life to be complete” — rejected. Scientific insufficiency is a valid canonical outcome.
- “Generator version must be part of Entity ID for reproducibility” — rejected. Reproducibility is bound by manifest/model/reducer provenance; semantic identity has a separate policy.

## Promotion gate

Material blocker count may be declared **0 only after the final exact-head Node, P1–P5 upstream, P5 Environment v2, P6, Golden/oracle, persistence, worker-order, shipped single-file browser matrix and sparse-working-set campaign all pass on the exact candidate head**.