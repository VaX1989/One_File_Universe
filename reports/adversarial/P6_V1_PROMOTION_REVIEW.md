# P6 Biosphere & Evolution v1 — Pre-Promotion Adversarial Review

Status: **COMPLETE / MATERIAL BLOCKERS OPEN: 0**

Base: frozen P5 Environment v2 governance merge `58d4cbbc3ff8412ddd29a2fa628746b4d8d0557d`.

## Material blockers found and disposition

1. **Upstream authority not yet canonical at mission start** — RESOLVED. P5 Environment v2 was merged by PR #32 before the P6 canonical branch was created. The canonical P6 branch was created fresh from the resulting exact `main`, not from the research/prep branch.
2. **Unsupported environment state existed in vocabulary but was not independently reachable** — RESOLVED. P6 v1 now classifies required `UNKNOWN` as `INSUFFICIENT_ENVIRONMENT`, required `UNSUPPORTED` as `UNSUPPORTED_ENVIRONMENT` when no higher-priority unknown remains, and fully evaluated/no-genesis as `NO_BIOSPHERE`.
3. **Source-module browser evidence could diverge from shipped single-file behavior** — RESOLVED. Browser certification now builds and opens the actual single-file artifact offline.
4. **Golden vectors were not an explicit exact-head gate** — RESOLVED. The immutable `golden-p6-biosphere-v1` corpus is independently checked in JavaScript and Python.
5. **Legacy save absence semantics needed direct evidence** — RESOLVED. P1–P5 portable saves remain schema v1 and P6 absence remains absence; P6 mutable history uses P4 archives bound to the P6 transition descriptor and baseline law metadata.
6. **Conformance-only authority leaked into shipped canonical construction** — RESOLVED. Positive fixtures moved under `tests/p6/`; the shipped runtime contains neither the authority label nor a positive MACRO constructor. Canonical event, save and rendering boundaries reject those fixtures.
7. **Genesis trusted a payload state label and opaque IDs** — RESOLVED. The reducer now recomputes the exact P5 environment digest, eligibility witness, P4 baseline and Model A P2 biosphere ID. A bare label, tampered projection/digest/manifest/planet or forged ID fails closed.
8. **Speciation referenced unverifiable pseudo-lineages** — RESOLVED BY SCOPE REDUCTION. No lineage/speciation/extinction reducer is promoted in v1. Persistent lineage lifecycle and parentage require a future versioned contract.

## Identity adversarial review

- Model B (generator version in semantic IDs) was rejected because non-semantic model fixes would churn biosphere/lineage/species references.
- Realization-hash identity was rejected because it conflates generated state with semantic identity.
- Model A is selected: P2 Entity Identity uses canonical Universe Identity + semantic stable key + explicit identity-policy version. Model/manifest versions remain realization/replay provenance.
- Individual identity is not promoted in v1.

## Scientific leakage review

- No P6 canonical path accepts the historical `p6-environment-research-v0.2` authority.
- No Earth atmosphere, water, temperature, geology, radiation or chemical-energy default is injected.
- Current real P5 Environment v2 therefore remains eligible for `INSUFFICIENT_ENVIRONMENT` and `canGenerateBiosphere=false`.
- Supported-life conformance exists only in test-only source excluded from the build. The shipped artifact is scanned for the authority label and former positive constructor, and rendering rejects handcrafted positive MACRO data.
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

The sole declared family is `p6.biosphere.genesis@1`. It is a complete witness/identity guard, but current P5 Environment v2 cannot satisfy its positive precondition, so it accepts zero canonical events. Speciation and extinction are not promoted. No canonical biological scheduler or event-rate law is introduced.

## Working-set review

The conformance campaign keeps conceptual queries direct/sparse and bounds simultaneously materialized test refinements. MICRO individuals are ephemeral and non-persistent. No global biosphere/species/individual enumeration is required, and canonical persistent lineage/species counts remain zero.

## Important non-blockers

- P5 Environment v2 does not yet canonically establish water phase, geochemical energy, geological activity, XUV history or a complete climate state. This legitimately prevents real biosphere genesis; it does not invalidate P6 v1's fail-closed contract.
- Detailed genetics, morphology, mutation rates, population ecology, regional food webs and intelligent life remain future research.

## Follow-up after v1

Create separate research issues for advanced ecology/evolution, richer P5 chemistry-energy coupling, population models and any future identity-policy migration.

## Rejected findings

- “P6 must generate life to be complete” — rejected. Scientific insufficiency is a valid canonical outcome.
- “Generator version must be part of Entity ID for reproducibility” — rejected. Reproducibility is bound by manifest/model/reducer provenance; semantic identity has a separate policy.

## Promotion gate

The gate passed. Candidate `b5d0850d46184700e2764a413db59e314ba6ce83`
(tree `f41cb6b18e6af2289f05e898c44320833366b2c8`) passed exact-head
runs `33761698110` and `33762252812`. PR #34 merged as signed commit
`79d1817abc446f01825a66db93a2dc16aa379d7b` with the same tree. Exact-main
run `33762589274` repeated the complete five-runtime P1–P6 campaign successfully;
Issue #24 is closed.
