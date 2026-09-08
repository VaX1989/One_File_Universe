# Contributor Rights and Commercial-Relicensing Boundary

**Status: policy foundation. A final contributor agreement must receive legal review and formal governance adoption before the project represents third-party contributions as commercially relicensable.**

OFU wants a contributor model that supports both a large Open Source community and optional commercial proprietary licensing without taking ownership of contributors' work unnecessarily.

## Non-negotiable principles

1. **Contributors keep copyright.** OFU does not require copyright assignment as the default community model.
2. **Open Source availability is permanent.** An accepted contribution to the Open Source Core remains available under the project's Open Source license.
3. **Commercial relicensing needs explicit rights.** The project does not infer relicensing permission merely from a pull request.
4. **No hidden CLA.** Contributor obligations must be visible before merge, understandable in plain language, and recorded.
5. **Employer and institutional rights matter.** Contributors are responsible for ensuring that they have authority to submit work created in employment, university, grant, or contractual contexts.
6. **Patent rights must be addressed deliberately.** A final contributor agreement should include an appropriate contribution-scoped patent grant rather than leaving patent expectations implicit.
7. **The agreement should be symmetric in trust.** It should give OFU only the rights reasonably required to operate, distribute, protect, evolve, and optionally commercially license the project while preserving contributors' ability to use their own work elsewhere.
8. **License migration authority must be explicit.** Any contributor grant needed for a future GPL-version or Open Source license migration should be stated and bounded rather than inferred later.

## Intended final contributor agreement

The final legally reviewed agreement should, in substance, allow the contributor to retain ownership while granting the OFU licensing steward a perpetual, worldwide, non-exclusive right to use, reproduce, modify, distribute, publicly perform/display where applicable, and sublicense the contribution, including the ability to offer it as part of OFU under the Open Source license and separately negotiated commercial terms.

As a policy objective, commercial relicensing authority should remain connected to OFU, OFU distributions, and OFU-derived commercial offerings rather than becoming an unrelated general-purpose exploitation right. The exact legally effective scope must be determined by qualified software/IP counsel.

The agreement should also bind project policy to the permanent Open Source principle for accepted Open Source Core contributions and address any future Open Source license migration authority explicitly.

This section describes policy intent only; it is **not** the operative legal grant.

## Temporary merge rule

Until the final contributor agreement and durable acceptance registry are active:

- discussion, issues, design proposals, RFCs, reviews, and non-copyrightable factual feedback are welcome;
- external code/documentation contributions can be reviewed and iterated publicly;
- maintainers must not claim that such contributions are available for commercial relicensing without an explicit valid grant;
- the project should avoid merging copyright-significant third-party contributions into a commercially relicensable core when doing so would make future commercial licensing legally ambiguous.

This temporary rule exists to protect contributors and the project, not to create a permanent participation barrier.

## Desired acceptance experience

The mature process should be one-time, auditable, and low-friction: a contributor sees a short plain-language summary, the full legal agreement, accepts it through an authenticated mechanism, and does not repeat the process for every pull request. Organizations should have a corporate agreement path where needed.

The durable registry should identify the agreement version accepted, authenticated contributor identity, acceptance time, and whether an applicable corporate authorization exists, without exposing unnecessary personal data publicly.

## Governance

The contributor agreement, its acceptance system, and any material change to relicensing or license-migration rights are constitutional-risk governance changes and require explicit review under `GOVERNANCE.md`.
