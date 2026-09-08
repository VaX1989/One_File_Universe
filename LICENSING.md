# One File Universe Licensing

## Current Open Source license

Unless a file, directory, embedded dataset, asset, or third-party notice states otherwise, the One File Universe (OFU) source code in this forward-development tree is licensed under the **GNU General Public License version 3 only (`GPL-3.0-only`)**. The complete license text is in [`LICENSE`](LICENSE).

GPL-3.0-only permits commercial as well as non-commercial use. A person or company does **not** owe OFU a fee merely because it earns money while complying with the GPL.

The project deliberately uses copyleft so that a distributed OFU-derived program cannot take the freedoms received from the Open Source edition away from downstream users.

## GPL plus optional commercial proprietary permissions

OFU intends to support an Open Source GPL core plus optional separately negotiated commercial permissions for organizations whose intended proprietary distribution, OEM embedding, or other deployment model cannot or does not wish to follow the GPL obligations that would otherwise apply.

This model is sometimes described as dual licensing. For OFU policy, the important rule is narrower: a commercial agreement grants **additional permissions** where the relevant copyright holders have granted OFU the rights to do so. It is not a fee layered onto GPL use, and it cannot revoke rights already granted for an Open Source release.

See [`COMMERCIAL_LICENSING.md`](COMMERCIAL_LICENSING.md).

## Permanent Open Source Core

Code accepted into the OFU Open Source Core is intended to remain available under an OSI-approved Open Source license permanently. Commercial licensing may grant additional permissions; it must not retroactively remove the Open Source availability of an accepted community contribution.

Changes to this principle are constitutional-level governance changes and require the process defined in [`GOVERNANCE.md`](GOVERNANCE.md).

The machine-readable boundary is [`config/governance/licensing-scope.json`](config/governance/licensing-scope.json). The current rule is fail-closed: **GPL-3.0-only remains the default unless an explicit file/directory license notice and the required R5 review establish a narrower exception.** The scope manifest does not silently relicense existing paths.

## Why GPL-3.0-only

`GPL-3.0-only` is currently deliberate. OFU does not automatically delegate future license changes to a not-yet-written GPL version. A future migration to another GPL version or another Open Source license requires a superseding R5 decision, contributor-rights verification, compatibility analysis, and legal review. This protects both long-term flexibility and contributor expectations.

## Interoperability, SDKs, and future network services

OFU wants the implementation core to remain reciprocal while keeping the ecosystem boundary broadly adoptable.

- Public protocols, schemas, interoperability specifications, and SDK/client libraries are candidates for **Apache-2.0** where a future explicit path-level decision determines that a permissive boundary materially improves interoperability.
- A future network-centric OFU server may warrant **AGPL-3.0-only**, but no present component is relicensed to AGPL by policy alone; that requires a separate ADR and explicit path scope.
- Community/user documentation may later receive a documentation-specific license such as **CC-BY-SA-4.0** through an explicit migration. Current documentation is not silently relicensed by this statement.

These are controlled licensing classes, not blanket exceptions.

## Extensions, providers, and protocol clients

OFU should make the architectural boundary legible before a large extension ecosystem develops. In-process code that forms part of the covered OFU program remains subject to the normal GPL analysis unless a separate permission applies. A genuinely separate client communicating through a public protocol may use an independent license when it is architecturally and legally separate.

Architecture alone cannot conclusively determine copyright-law classification. The repository therefore records the intended boundary but does not promise that a technical plugin label automatically changes legal obligations.

## Founding corpus and historical rights provenance

Before large-scale external contribution, OFU records the exact pre-community-scale development boundary in [`config/governance/founding-corpus.json`](config/governance/founding-corpus.json) and explains it in [`docs/community/FOUNDING_CORPUS.md`](docs/community/FOUNDING_CORPUS.md).

That record is a provenance boundary, not a legal opinion. It deliberately does **not** assert that exclusive copyright ownership of every historical path or a complete commercial-relicensing chain of title has already been proven. The historical corpus remains subject to an IP/provenance audit covering third-party code, data, assets and material AI-assisted work.

## User-created outputs

Using OFU does not, by itself, make an image, video, paper, simulation result, narrative, exported world description, screenshot, or other user-created output a GPL-covered work. Whether a particular output contains copyrightable portions of OFU is a fact-specific legal question, but ordinary user content and scientific results are not claimed by the project merely because OFU produced or helped produce them.

## The one-file artifact is a licensing surface

OFU's canonical shipping form is a single deterministic HTML artifact. Release certification must therefore treat licensing as part of artifact composition rather than as repository-only paperwork.

The target release transaction must bind the published artifact to exact source identity and provide verifiable closure for applicable license notices, third-party notices, and embedded-data provenance. The precise Corresponding Source strategy for the generated HTML must be reviewed by qualified software/IP counsel before public reliance; policy must not fabricate a legal conclusion from build reproducibility alone.

## Data, models, assets, and third-party material

Scientific data, catalogs, fonts, media, third-party code, and other incorporated material may have independent licenses and attribution requirements. Shipping inside the single-file artifact requires explicit provenance and redistribution permission. See [`THIRD_PARTY_POLICY.md`](THIRD_PARTY_POLICY.md).

## SPDX and REUSE direction

OFU targets REUSE Specification 3.3 and SPDX-style machine-readable license metadata. The migration should proceed in two directions at once: new material should become machine-readable as early as practical, while the historical corpus is audited and backfilled incrementally. OFU must not claim REUSE compliance until actual coverage and tooling prove it.

## Contributor rights

Commercial proprietary licensing only works when the project has the legal rights required to offer alternative terms. OFU does not assume that submitting a pull request automatically transfers copyright or commercial relicensing rights.

The contributor-rights policy is defined in [`docs/community/CONTRIBUTOR_RIGHTS.md`](docs/community/CONTRIBUTOR_RIGHTS.md). Until a legally reviewed contributor agreement and recording mechanism are formally activated, copyright-significant third-party code contributions may be reviewed and developed in public but must not be represented as commercially relicensable by the project.

## No legal advice

Repository documentation explains project policy; it is not legal advice. Commercial licensing, contributor agreements, trademark policy, license-boundary classification, and unusual third-party licensing questions should be reviewed by qualified counsel before reliance.
