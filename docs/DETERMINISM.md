# Determinism Contract

## Purpose

Determinism is part of OFU world identity, not an implementation detail. The same canonical query under the same Universe Identity and conformance version must produce the same canonical serialized result wherever that conformance class is claimed.

## Universe Identity

```text
UniverseIdentity = {
  masterSeed256,
  generatorManifestHash,
  canonicalProtocolVersion
}
```

The master seed supplies entropy. Versions are not encoded into entropy bits; versioning remains explicit and independently evolvable.

## Canonical addresses

Addresses must use exact representations: fixed-width integers/byte strings or other canonical encodings. JavaScript `Number` MUST NOT represent identifiers requiring integer precision beyond 2^53-1.

An address includes enough domain information to prevent ambiguous interpretation. Human-readable paths are presentation; canonical byte serialization is normative.

## Addressed derivation and domain separation

OFU MUST NOT use one global sequential RNG stream for world meaning.

Conceptually:

```text
PRF(
  masterSeed,
  generatorManifestHash,
  domainTag,
  canonicalAddress,
  propertyTag,
  counter
)
```

Changing `/civilization/language/name` must not perturb `/planet/orbit` merely because one subsystem consumes a different number of random values.

The exact PRF/hash primitive is deliberately open until P1/P2 benchmarking and security/portability review.

## Numeric determinism

Native or accelerated floating-point operations are not presumed bit-exact merely because they are standardized broadly. Canonical subsystems must explicitly choose and test a numeric policy.

Permitted policies include:

- exact integer arithmetic;
- domain-specific fixed point;
- deterministic software implementations of required transcendental functions;
- explicitly rounded/quantized algorithms whose canonical serialized results are stable;
- other algorithms proven by golden-vector conformance.

A single global fixed-point format is NOT a constitutional requirement.

## Canonical serialization

D3 outputs require one normative byte representation specifying at least:

- field ordering;
- integer widths and signedness;
- byte order;
- text normalization/encoding;
- absent vs null semantics;
- collection ordering;
- numeric rounding/quantization;
- schema/protocol version.

JSON may be used for human-facing diagnostics, but arbitrary host `JSON.stringify` output is not automatically canonical serialization.

## Order and concurrency independence

Canonical results must not depend on:

- traversal order;
- number of workers;
- message completion order;
- rendering frame rate;
- prior unrelated queries;
- cache hits/misses.

Where stateful simulation intentionally depends on event order, ordering semantics must be explicit and canonical.

## Generator Manifest

The manifest versions canonical domains independently. A change that can alter canonical output MUST change the appropriate generator identity and therefore the manifest hash.

Presentation-only changes MUST NOT create a new universe identity.

## Golden Universe Corpus

Before complex generators stabilize, OFU will define a versioned corpus of canonical addresses covering edge cases and representative domains.

For every supported conformance target:

```text
Digest(masterSeed, manifest, corpus) == referenceDigest
```

P2 exit requires reproducible canonical digests across the declared browser/architecture matrix.

## Late materialization

Generated detail must satisfy canonical facts already established at coarser levels.

```text
Committed facts -> constraints -> detail generation
```

Later refinement MUST NOT invalidate earlier canonical history unless an explicit migration/new lineage occurs.

## Determinism versus realism

A more physically accurate algorithm is not automatically preferable if it destroys portability or bounded cost. OFU optimizes for explicit fidelity, stable semantics and meaningful causality. Fidelity upgrades that change canonical facts require versioned lineage.