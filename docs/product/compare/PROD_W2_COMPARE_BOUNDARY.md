# PROD-W2-COMPARE — governed synchronized comparison boundary

**PROMPT_ID:** `PROD-W2-COMPARE`  
**Epoch:** `OFU-POST-M0-PRODUCT-NEXT-2026-09-20-296565BB`  
**Authority:** analysis/product projection only.

## Purpose

This lane compares saved Personal Atlas observations by exact Atlas reference. It never copies, forks or mutates a world. The comparison result is a deterministic descriptor over existing W1/Atlas, P4, Scientific Fingerprint and SCI-WHY evidence.

The comparison is intended to answer: what is the same, what differs, whether scale/time are actually aligned, and which typed scientific/causal/provenance/authority records explain an observed divergence. It must not manufacture an explanation when SCI-WHY does not contain one.

## Runtime contracts

- engine: `ofu-prod-w2-governed-compare-1`
- descriptor: `ofu-prod-w2-compare-descriptor-1`
- result: `ofu-prod-w2-compare-result-1`
- workspace: `ofu-prod-w2-compare-workspace-1`
- terminal comparison states: `MATCHED | DIVERGENT | UNKNOWN | INCOMPARABLE`

A descriptor contains only left/right Atlas entry identifiers and explicit alignment policy. Its content hash creates deterministic descriptor identity. The result identity is separately hashed from the complete normalized comparison projection.

## Atlas-reference rule

Both sides are resolved through `AtlasCore.getEntry()` plus its reference-only `revisitPlan()`. A valid side must preserve `mutatesWorld=false`, `mutatesSelection=false` and `mutatesCamera=false`. The result carries semantic references only:

- canonical subject reference;
- P4 temporal reference, when saved;
- Scientific Fingerprint reference, when saved;
- presentation-only return/scale hint, when saved.

No renderer object, camera state, mutable world copy or second world authority is created.

## Explicit alignment

### Identity

Canonical identity is compared as universe, entity kind, canonical ID and canonical key. Identity divergence is reported; it is never repaired by coercion.

### Governed time

P4 references are compared before any scientific divergence is interpreted:

- both absent -> `UNKNOWN`;
- one absent -> `INCOMPARABLE`;
- universe or lineage mismatch -> `INCOMPARABLE`;
- exact complete P4 reference -> `MATCHED`;
- same exact frontier but different state digest -> `DIVERGENT` with matched time and divergent state;
- same state digest but inconsistent reference metadata -> `DIVERGENT`, never silently accepted as a match;
- otherwise distinct governed references in the same lineage -> `DIVERGENT` without claiming synchronized time.

### Scale

Return references are presentation-only. Exact semantic-scale and distance-intent equality is a presentation match. Any difference stays `PRESENTATION_ONLY` and cannot become scientific evidence.

### Scientific context

Scientific Fingerprint references are comparable only when scientific-state contract and scientific-model version match. Missing context is explicit. Contract/model mismatch is `INCOMPARABLE`; differing context hashes under the same contract/model are `DIVERGENT`.

## Typed SCI-WHY divergence

Optional SCI-WHY graphs are accepted only after integrity, subject, fingerprint and resource-bound validation. Comparison never creates new causal edges or prose explanations.

Existing typed edges are compared by semantic structure, then differences are separated into:

- causal relation differences (`CAUSES` with an explicit causal claim);
- factual/scientific-evidence relation differences;
- presentation-only relation differences;
- authority differences;
- provenance differences;
- knowledge-status differences.

Explicit assumptions and uncertainties are compared by stable upstream IDs. `UNKNOWN`, `UNSUPPORTED`, undeclared uncertainty, and missing WHY graphs remain first-class states. They are not converted into zeros, absence-of-effect, or fabricated causal explanations.

## Bounded resource model

Default hard-bounded lane limits:

- 512 WHY nodes per side;
- 1024 WHY edges per side;
- 256 returned difference items per difference class;
- 524288 bytes for the canonical compare result.

Callers may lower or raise limits only inside fixed hard maxima. Difference totals remain visible if returned detail is truncated. Resource pressure changes truncation/evidence availability, not the admitted canonical facts.

## Authority boundary

COMPARE is `ANALYSIS_ONLY`. It:

- does not mutate Atlas, world, P2 or P4;
- does not own renderer, scene, camera, path coordination or picking;
- does not promote presentation differences into science;
- does not promote model-derived or analysis output to canonical truth;
- does not infer causal explanations absent from SCI-WHY;
- requires no runtime network resource.

`PRODUCT-MACRO` remains the sole writer for shared renderer/product-composition surfaces during this epoch.

## Dependency resolution

The canonical v4 master requires `PROD-W1-ATLAS-CORE` and `PROD-W1-SCI-WHY`. Earlier source prompts also listed INSTRUMENTS. The v4 dependency override is authoritative, so this lane deliberately does not read, wait for, or depend on `PROD-W1-INSTRUMENTS`.

Resolved immutable source prompt refs:

- PR287 v3 master `6494c3a43596c2d16c43237c052d404d5b1a7e74`, `PROD-W2-COMPARE`;
- PR275 product DAG `86e19cae0e8c393661d6696617c5a5e49eb78983`, `R6-W2-COMPARE`.

## Focused evidence

`tests/product/prod-w2-compare.mjs` falsifies deterministic descriptor/result identity, exact Atlas replay references, matched-frontier P4 divergence, presentation-only scale separation, Scientific Fingerprint model boundaries, typed causal/factual/presentation/authority/provenance/uncertainty differences, preserved UNKNOWN, explicit incomparable states, resource bounds, graph/descriptor integrity, unknown Atlas references and canonical non-mutation.

The lane does not edit `package.json` or workflows. Central registration is requested separately through the lane-local integration patch request.
