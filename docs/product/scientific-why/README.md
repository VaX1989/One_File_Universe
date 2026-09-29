# PROD-W1-SCI-WHY — Typed scientific WHY

`PROD-W1-SCI-WHY` is an additive, read-only product projection over the existing Scientific Fingerprint provider. It does not create scientific truth, mutate canonical world state, or infer causal relationships from visual similarity or correlation.

## Authority boundary

The provider is `ANALYSIS_ONLY`. Its graph preserves the source authority of each endpoint and also records the projection authority, the weakest effective authority, the exact canonical subject, the exact scientific-model version, and the source provenance class.

`UNSUPPORTED` is a lane-local fail-closed classification. It does not extend or modify the frozen W1 contract authority enum.

Presentation consequences remain `PRESENTATION_ONLY`. The R6 `causalTrace.influences` records model-conditioned presentation effects; SCI-WHY exposes those as `MODEL_CONDITIONED_PRESENTATION` with `causalClaim=false`. It never silently upgrades them to scientific `CAUSES`.

## Explicit typed graph

The graph distinguishes subjects, fingerprints, models, scientific domains/properties, model outputs, presentation consequences, assumptions, limitations and uncertainty. Edges distinguish subject/model binding, domain authority, model-conditioned presentation, explicit non-influence, assumptions, uncertainty, causal claims, constraints, correlations, UNKNOWN and UNSUPPORTED.

An explicit `CAUSES` candidate is admitted only when the caller declares `explicitCausalClaim=true`. A correlation or constraint cannot set that flag. Explicit causal cycles fail closed.

## Subject and model applicability

Every external ancestry candidate, assumption and uncertainty record is bound to the exact canonical subject and exact scientific-model version already verified by the Scientific Fingerprint provider. Mismatches throw.

The output graph carries an `EXACT_SUBJECT_MODEL_CONTEXT` applicability record including universe identity, scientific-state contract, model/generator versions and fingerprint context hash when available.

## UNKNOWN, UNSUPPORTED and uncertainty

Missing scientific state produces the existing W1 `UNKNOWN` fingerprint and a WHY graph that does not invent model state or causal authority.

Upstream explicit unknown limitations remain first-class UNKNOWN nodes. UNSUPPORTED edges remain explicit. Uncertainty is first-class only when an upstream/caller record explicitly supplies it; absent uncertainty is reported as `NOT_DECLARED_UPSTREAM`, not fabricated.

## Determinism and bounds

Node/edge identity, canonical graph serialization and graph hashing use the repository's deterministic `stableGenerativeString` / `hashGenerativeState` machinery. Semantically equivalent input ordering yields identical graph identity.

Projection is bounded by node, edge, candidate, assumption, uncertainty and parameter budgets. Inspection is separately bounded by maximum depth and edge count and reports truncation rather than silently pretending the complete ancestry was returned.

## Inspection and prose

`inspectScientificWhy()` is a `PRESENTATION_ONLY` view. Its explanation strings are generated from typed graph edges for usability, but `stateAuthority=false`: prose can never become graph/scientific authority.

## Focused evidence

Focused falsification lives in `tests/product/prod-w1-sci-why.mjs`.

It covers repeated determinism, equivalent input order, exact subject/model binding, mixed-authority downgrade, UNKNOWN and UNSUPPORTED propagation, explicit uncertainty, upstream presentation-only consequences, no correlation-to-causation promotion, malformed claims, cycles, resource bounds, bounded/truncated inspection, canonical serialization/hash integrity and non-authoritative explanatory text.

Central test registration is outside this lane's ownership and is requested through the lane-local integration patch request.
