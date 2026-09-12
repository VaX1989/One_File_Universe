# Contribution Units

A Contribution Unit is the smallest significant OFU subsystem that should be understandable, reviewable and governable without requiring a maintainer to reconstruct the entire project mentally.

The machine-readable contract is `config/governance/contribution-unit.schema.json`. New significant providers, cross-domain subsystems, persistence codecs, render backends, canonical-state authorities and other durable extension points should acquire a Contribution Unit manifest as they are introduced or materially redesigned.

A unit records its area, authority class, determinism class, scientific fidelity, canonical-state and persistence impact, capabilities, dependencies, source/test/evidence paths, resource budget and whether it must be reachable from the shipping one-file artifact.

Contribution Units do not create canonical authority. They describe and constrain authority that is granted elsewhere by OFU contracts and the Constitution.

## Why this exists

At community scale, source paths alone are not enough. Reviewers need to answer quickly:

- what does this subsystem own;
- what may it read or mutate;
- what does it depend on;
- which tests prove its contract;
- whether it must ship in the final artifact;
- what compatibility obligations exist.

The long-term goal is for CI to detect missing ownership, missing conformance and unreachable mandatory capability automatically.

## Migration

The historical codebase is not falsely declared fully migrated. The first manifest covers the open-source contributor control plane. Existing major systems should be migrated incrementally, prioritizing R4/R5 and cross-domain boundaries before leaf presentation code.
