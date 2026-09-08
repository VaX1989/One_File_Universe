# Contributing to One File Universe

Thank you for considering a contribution to One File Universe (OFU). OFU is evidence-gated and authority-aware: contributions are evaluated not only for whether they work locally, but for whether they preserve canonical semantics, portability, scientific honesty, resource bounds, and the deterministic one-file product.

New contributors should begin with [`docs/community/START_HERE.md`](docs/community/START_HERE.md) and [`docs/community/OFU_WAY.md`](docs/community/OFU_WAY.md).

## License and contribution rights

The Open Source code is licensed under **GPL-3.0-only**; see [`LICENSE`](LICENSE) and [`LICENSING.md`](LICENSING.md). Commercial use under the GPL is allowed.

OFU intends to offer optional commercial licenses with different permissions, so contribution rights must be handled explicitly. Contributors retain their copyright by default; a pull request is not silently treated as copyright assignment or automatic commercial-relicensing permission. Read [`docs/community/CONTRIBUTOR_RIGHTS.md`](docs/community/CONTRIBUTOR_RIGHTS.md).

Until the final contributor agreement and durable acceptance mechanism are legally reviewed and activated, maintainers must avoid creating ambiguity over commercial relicensing rights for copyright-significant third-party contributions.

## Workflow

1. Start from the branch/base identified by the current development or issue instructions; do not assume historical `main` is always the active development base.
2. Run `npm run contrib:doctor`.
3. Use `npm run contrib:explain -- <path>` for unfamiliar paths before editing them.
4. Choose a focused branch (`feature/`, `fix/`, `research/`, `docs/`, `governance/`, or another project-established lane prefix).
5. Identify affected constitutional contracts/ADRs/RFCs and whether a Contribution Unit is required.
6. Add or update tests before claiming verification.
7. Run the narrow relevant tests, then the required gate for the risk class.
8. Open a pull request using the repository template and report executed and unexecuted evidence separately.

## Contribution areas, ownership and risk

Machine-readable area ownership and change risk live in:

- `config/governance/areas.json`
- `config/governance/ownership.json`
- `config/governance/risk-policy.json`

Inspect one or more paths with:

```bash
npm run contrib:explain -- src/path/file.js tests/path/test.mjs
```

For a compact risk-only view:

```bash
npm run contrib:classify -- src/path/file.js tests/path/test.mjs
```

The exact PR control plane computes the aggregate risk and areas from the complete base...head diff. A changed path with no declared area fails closed instead of receiving accidental ownership.

Path classification is a lower bound, not authority to downgrade a semantically more dangerous change. If a leaf-looking file changes canonical meaning, persistence compatibility, scientific authority, security boundaries or constitutional policy, declare and review the higher semantic risk.

## Contribution Units

Significant new providers, canonical authorities, persistence codecs, render backends, cross-domain subsystems and durable control-plane surfaces should have a machine-readable Contribution Unit. See [`docs/community/CONTRIBUTION_UNITS.md`](docs/community/CONTRIBUTION_UNITS.md) and `config/governance/contribution-unit.schema.json`.

A Contribution Unit records what a subsystem owns, its authority and determinism class, canonical/persistence impact, dependencies/capabilities, tests/evidence, resource budget and whether it is required in the shipping one-file artifact.

Legacy systems are migrated incrementally; do not pretend historical coverage is complete.

## Required PR questions

A substantive PR should make it possible to answer:

- What problem does this solve?
- Which area owns the change?
- Does it change canonical world meaning or authority?
- Does it alter Universe Identity, Generator Manifest, event, replay, persistence, or save semantics?
- Which determinism class applies?
- Does it change Strict Direct-Open or single-file composition?
- Does it increase runtime working-set requirements or resource ceilings?
- Does it introduce a runtime network dependency? Strict releases may not require one.
- Does it change a public/provider/cross-scale contract?
- Which tests/invariants/oracles prove the claim?
- What relevant evidence was **not** executed?
- Is an RFC or new/superseding ADR required?
- Are all third-party code/data/assets and licenses identified?
- Does a significant new subsystem need a Contribution Unit or model card?

## Evidence discipline

Code existence is not verification. A test that has not run is not a PASS. A browser, operating system, physical device, screen reader, GPU, dataset, scientific oracle, security setting or repository-admin feature that was not tested/observed is unverified.

Use explicit states such as `NOT_RUN`, `NOT_VERIFIED`, `NOT_MEASURABLE`, `UNSUPPORTED`, or `UNKNOWN` rather than silently upgrading missing evidence.

## Scientific contributions

Scientific/model contributions must preserve authority, model fidelity, uncertainty, units, limitations, forbidden claims, dataset licensing, and provenance. Read [`docs/community/SCIENCE_CONTRIBUTIONS.md`](docs/community/SCIENCE_CONTRIBUTIONS.md). A machine-readable model-card schema is available at `config/governance/scientific-model-card.schema.json`.

Research is welcome even when it is not ready for product promotion. Research-only code must not silently become canonical truth.

## Third-party and data provenance

Unknown licensing status is not permission. New third-party code, data or assets should have the provenance required by `config/governance/ip-provenance-policy.json`; shipping-embedded data must have explicit redistribution rights. See [`THIRD_PARTY_POLICY.md`](THIRD_PARTY_POLICY.md) and [`docs/community/IP_PROVENANCE.md`](docs/community/IP_PROVENANCE.md).

OFU targets REUSE/SPDX-style machine-readable licensing, but it does not claim complete REUSE compliance until the historical corpus is actually audited and migrated.

## AI-assisted contributions

AI assistance is allowed. The submitter remains responsible for correctness, licensing, provenance, security, and evidence. Material AI assistance should be disclosed when it changes reviewer risk. See [`docs/community/AI_ASSISTED_CONTRIBUTIONS.md`](docs/community/AI_ASSISTED_CONTRIBUTIONS.md).

## Architecture and RFCs

Local changes generally do not need RFCs. Durable public interfaces, authority transfers, compatibility changes, cross-domain contracts, or constitutional proposals normally do. See [`docs/community/RFC_PROCESS.md`](docs/community/RFC_PROCESS.md).

Accepted durable decisions are recorded in ADRs. An ADR does not become low-risk merely because it is Markdown.

## Experiments

OFU encourages competing prototypes for numeric representations, WASM strategy, PRF primitives, compression, rendering, scheduling, model mechanisms, and other reversible choices. Experimental code must be labeled as such and must not silently become normative architecture.

## Generated artifacts

Large generated HTML artifacts should not be committed as ordinary source unless a phase-specific policy explicitly requires it. The repository is the source of truth; release artifacts are reproducibly generated products.

## Community behavior and security

Participation is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Rigorous criticism is welcome; personal attacks, harassment, and attempts to purchase or pressure technical/scientific authority are not.

Potential vulnerabilities follow [`SECURITY.md`](SECURITY.md). Never post exploitable or sensitive security details in a normal public issue.

## Normative language

English is the normative project language. Use English for source identifiers, comments, normative documentation, ADRs, RFCs, schemas, manifests, tests, CI output, issue/specification text, pull requests, commit/release descriptions, and canonical user-facing terminology. Future localization may contain translations, but translations are non-normative and must not define canonical identifiers or semantics.
