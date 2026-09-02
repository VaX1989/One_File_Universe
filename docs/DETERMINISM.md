# Determinism Contract

## Purpose

Determinism is part of OFU world identity, not an implementation detail. The same canonical query under the same Universe Identity and semantic protocol must produce the same canonical result wherever that conformance class is claimed.

## P2 Universe Identity

```text
SemanticManifestHash
= SHA-256(OFU-CBV-1(SemanticGeneratorManifestV1))

UniverseIdentity
= SHA-256("OFU-UNIVERSE-v1\\0" ||
    OFU-CBV-1({
      canonicalProtocolVersion,
      masterSeed,
      semanticManifestHash
    }))
```

The seed supplies entropy. Semantic lineage remains explicit through the strict Semantic Generator Manifest. Implementation/runtime evidence is excluded. The P0-era identifier `generatorManifestHash` is historical generic terminology; P2's frozen normative name is `semanticManifestHash`.

## Entity Identity

P2 Entity Identity is universe-scoped:

```text
EntityIdentity
= SHA-256("OFU-ENTITY-v1\\0" ||
    OFU-CBV-1({
      universeIdentity,
      namespace,
      stableKey
    }))
```

Location, containment, ownership, QueryContext and ModelRegime do not implicitly rename an entity.

## Canonical addresses and derivation

Canonical Address v1 uses exact tagged representations with bounded segments and total bytes. Human-readable paths are presentation; canonical bytes are normative.

Canonical generation MUST NOT depend on a global sequential RNG stream. P2 freezes:

```text
HMAC-SHA-256(
  masterSeed32,
  OFU-CBV-1([
    "OFU-DERIVE-v1",
    semanticManifestHash32,
    domain,
    canonicalAddressV1Bytes,
    property,
    counterU64
  ])
)
```

Changing an unrelated query must not perturb another fact merely because evaluation order or draw count changed.

## Canonical serialization and Unicode

P2 uses OFU-CBV-1 and frozen Unicode profile `ofu-unicode-15.1.0-v1`. Canonical text is strict UTF-8/NFC over the frozen Unicode 15.1 admitted repertoire. Newly assigned future Unicode code points cannot silently enter the P2 domain.

Canonical arrays and maps are descriptor-bounded data structures; canonical encoding does not execute array accessors or user/ambient array iterators. Hostile/imported values cross the strict canonical-byte boundary.

## Numeric determinism

P2 freezes only checked i64 addition, exact-intermediate/ties-to-even fixed multiplication with checked i64 output, and u64 integer square root. Native transcendental/GPU floating-point results are not presumed canonical. Additional primitives require explicit semantic evolution when a future generator actually needs them.

## Order and concurrency independence

Canonical results must not depend on traversal order, worker count, completion order, frame rate, unrelated prior queries or cache state. P2 conformance compares direct execution and multiple reordered worker schedules against the same Golden Universe Corpus digest.

## Semantic Generator Manifest

A change that can alter canonical output MUST change the appropriate semantic version/profile and therefore the Semantic Manifest hash. Presentation-only, source-layout-only and conformance-evidence-only changes MUST NOT create a new Universe Identity.

## Golden Universe Corpus

P2 uses an independently generated Python oracle corpus with explicit edge/rejection vectors and deterministic generated queries. Every claimed runtime must reproduce the same canonical pins on the exact source SHA. Official Unicode 15.1 normalization data independently certifies host NFC behavior.

## Late materialization

Generated detail must satisfy canonical facts already established at coarser levels:

```text
Committed facts -> constraints -> detail generation
```

Refinement that would invalidate earlier canonical history requires explicit versioned lineage/migration rather than silent reinterpretation.
