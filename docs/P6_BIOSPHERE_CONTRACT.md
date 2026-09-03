# P6 Biosphere & Evolution v1 — Canonical Contract

**Contract:** `ofu-p6-biosphere-v1`
**Model:** `p6-biosphere-evolution-1`
**Schema:** `1`
**Status:** Accepted and frozen only when the P6 promotion PR is merged to `main`; otherwise this text describes the exact promotion candidate.

## 1. Upstream and authority boundary

P6 consumes only `ofu-p5-p6-environment-v2` / schema `2` / model `p5-environment-2` / authority `P5_CANONICAL`. The adapter validates the frozen P5 Environment v2 manifest, epistemic vocabulary, baseline epoch, atmosphere genesis policy, pressure state, radiative inputs, explicit unsupported fields and P4 temporal ownership. Contract, schema, model, authority, planet or manifest drift fails closed.

The shipped P6 runtime contains no positive conformance-vector constructor. `P6_CONFORMANCE_ONLY` fixtures live under `tests/p6/` and are excluded from the single-file build. They can exercise integer energy laws, Model A identity derivation and semantic-LOD invariants, but they cannot:

- create a canonical MACRO realization;
- create a P4-accepted biological event;
- enter a replayed canonical state;
- survive as established biology in a verified portable archive;
- appear through the production rendering projection.

## 2. Eligibility witness

Every P6 eligibility result is `ofu-p6-environment-eligibility-witness-v1` / schema `1` / semantics `p6-eligibility-semantics-1`. It binds:

- source P5 contract, schema, model and authority;
- source P5 Semantic Manifest hash;
- planet ID;
- exact P5 Environment projection digest;
- P6 eligibility state, reason and retained unknown/unsupported fields;
- P6 identity policy;
- P6 Semantic Manifest hash;
- a domain-separated deterministic witness digest.

The P4 baseline stores that witness and its exact environment digest. The guarded `p6.biosphere.genesis@1` reducer requires an event to carry the full P5 projection and matching eligibility witness, recomputes both digests, verifies equality with the P4 baseline, and recomputes the expected P2 biosphere Entity ID from the state Universe Identity and planet ID.

Current canonical P5 Environment v2 always exposes unknown atmosphere/pressure/albedo and unsupported water, XUV, escape, geology, geochemical energy and ocean-fraction semantics. Therefore current planets evaluate to `INSUFFICIENT_ENVIRONMENT`, and the final genesis gate deterministically rejects them. A payload label saying `BIOSPHERE_SUPPORTED` has no authority.

## 3. Eligibility states

- `INSUFFICIENT_ENVIRONMENT`: upstream truth is incomplete for a biological decision.
- `UNSUPPORTED_ENVIRONMENT`: the environment lies outside P6 v1 semantics.
- `NO_BIOSPHERE`: sufficient supported inputs exist but no canonical genesis trigger exists.
- `BIOSPHERE_SUPPORTED`: reserved for a future versioned upstream path that actually satisfies canonical preconditions; no current P5 Environment v2 input can produce it.

Unknown is not dead, unsupported is not dead, and absence of evidence is not a biosphere.

## 4. Identity policy

P6 adopts Model A under `p6-biological-identity-model-a-v1`: semantic identity survives generator/model revision unless the semantic entity itself is redefined.

Expected IDs are P2 Entity Identities rooted in canonical Universe Identity:

- biosphere: `{ planetId, identityPolicy }`;
- lineage: `{ biosphereId, lineageOrdinal, identityPolicy }`;
- species: `{ lineageId, speciesOrdinal, identityPolicy }`.

Reducers never trust a 32-byte payload identifier. The genesis guard recomputes the biosphere ID. Lineage/species derivations remain deterministic semantic-LOD identities but are not persistent entities in v1 because a sound lineage lifecycle is deliberately deferred. Individual identity is not promoted.

## 5. Persistent transition scope

Transition contract `ofu.p6.biological-transition@1.0.0` has scope `GENESIS_GUARD_ONLY_NO_ACCEPTED_P5_V2_PATH`.

Its only declared family is `p6.biosphere.genesis@1`. The reducer is a complete authority/witness/identity gate, but its final positive precondition cannot be satisfied by the frozen upstream contract. Consequently P6 v1 accepts zero biological state-changing events on current canonical input.

`p6.speciation` and `p6.extinction` are not promoted. This is deliberate: v1 does not freeze orphanable species or pseudo-lineage references without a canonical lineage lifecycle. Unknown biospheres, lineages, species, cross-biosphere references, forged IDs and arbitrary ordinals therefore cannot enter persistent state through P6 v1.

P4 remains sole owner of time, event identity, ordering, replay, checkpoints, compaction, accepted-history normalization and archive mechanics. P6 has no private clock or event log.

## 6. Numeric and energy contract

`p6-fixed-integer-1` uses integers only:

- efficiency and transfer fractions: unsigned ppm, `0..1,000,000`;
- energy/productivity budgets: u64 model units;
- ppm multiplication: exact product followed by floor division by `1,000,000`;
- overflow and invalid ranges: rejection.

The causal hierarchy remains `usable source energy → primary productivity ceiling → sustainable biomass ceiling → trophic ceilings`. Energy sources remain distinct: `PHOTOTROPHIC`, `CHEMOTROPHIC`, `MIXED`, `UNKNOWN`. P6 does not fabricate geochemical energy.

The shipped energy functions are bounded mathematical laws. A numeric result alone never establishes biology.

## 7. Semantic LOD

`p6-semantic-lod-1` defines `MACRO → MESO → MICRO` as refinement, not truth replacement. Refinement preserves planet/biosphere relation, viable medium and energy ceilings. MICRO individuals are `persistent=false` and `individualIdentityPromoted=false`.

Because no canonical positive genesis exists, v1 materializes no production MACRO/MESO/MICRO biology. Test-only fixtures verify the refinement laws without claiming canonical existence.

## 8. Persistence and rendering

P4 archives bind the exact P6 transition descriptor and a baseline containing the P5 environment digest, eligibility witness, P6 model/manifest and identity policy. Full replay, checkpoint replay, repeated compaction and save/reopen converge for the canonical no-biology state. Attempts to replay forged or unsupported biological events fail closed.

The rendering projection accepts only a validated canonical eligibility witness. Current output exposes `INSUFFICIENT_ENVIRONMENT`, `biologyEstablished=false`, the P5 environment authority and witness digest. It rejects test-only or handcrafted MACRO objects.

## 9. Candidate pins after adversarial hardening

- P6 Semantic Manifest hash: `2a3593bad3ce921c4f2f9e4282c64dc8fc3906d9c5863a048d14fa8fe541b0c9`
- Golden corpus: `golden-p6-biosphere-v1`, version `2`
- Golden digest: `1c418401aebcaef62d1ed2ea4f7b6c84440cb6c0e903af35969f7f0794b3e557`
- transition digest: `a73dd89e12d7815b4eb297b5e37d584e3db5e8121c60f223c91241cff7890af0`

These replace the pre-hardening candidate pins. Model A keeps the fixed conformance biosphere/lineage/species identity vectors stable because their semantic stable keys did not change.

## 10. Declared limitations

P6 v1 does not claim naturally generated biospheres, canonical oceans, geochemical energy, genetics, morphology, population dynamics or persistent lineage/speciation/extinction history. Those require separately promoted upstream science and transition semantics.
