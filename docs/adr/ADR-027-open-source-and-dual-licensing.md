# ADR-027 — GPL-3.0-only Open Source core and optional commercial proprietary licensing

**Status:** Accepted

**Ratified:** 2026-09-08 by the project founder for the forward Open Source foundation transaction. Acceptance defines the intended licensing architecture; commercial relicensing of third-party contributions remains unavailable until the required contributor-rights chain has been legally reviewed and established.

## Context

OFU intends to become a durable Open Source scientific/simulation commons while retaining a sustainable path for organizations that require proprietary distribution rights. A permissive license would maximize reuse but allow proprietary appropriation with little reciprocity. A custom royalty license or source-available license would undermine standard Open Source compatibility and increase contributor/legal friction. AGPL would close the network-use gap but adds restrictions that are not currently necessary for OFU's primary distributed single-file product.

The project also expects multiple long-lived legal surfaces: the reciprocal implementation core, public interoperability boundaries, scientific data, documentation, possible future network services, user-created outputs, trademarks, and separately negotiated proprietary permissions. Those surfaces should not drift through implicit exceptions.

## Decision

1. OFU code is offered by default under the standard GNU General Public License version 3 only (`GPL-3.0-only`).
2. Commercial use under GPL is permitted without an OFU fee when the license is followed.
3. OFU may separately offer commercial proprietary permissions where the project has the legal rights to do so. Such permissions are additive and do not tax or revoke GPL rights.
4. The Open Source license contains no automatic revenue royalty.
5. Accepted Open Source Core material remains available under an OSI-approved Open Source license permanently; a commercial offer is not a mechanism for retroactively withdrawing the commons.
6. Contributors retain copyright unless a separately reviewed agreement explicitly says otherwise. The intended contributor-rights model grants only the explicit rights needed for Open Source distribution, project stewardship, and optional OFU commercial relicensing while preserving contributor ownership.
7. Submission of a pull request alone is never treated as commercial relicensing permission.
8. `GPL-3.0-only` is deliberate. No future GPL version becomes applicable automatically. A license-version migration requires a superseding R5 ADR, contributor-rights verification, compatibility analysis, and legal review.
9. Licensing scope is machine-readable in `config/governance/licensing-scope.json`. The default license applies unless an explicit file/directory notice and R5 review establish an override; silent relicensing is forbidden.
10. Public protocols, schemas, interoperability specifications, and SDK/client libraries may be placed under a permissive license such as `Apache-2.0` only through an explicit future path-level decision. This ADR does not relicense any current path to Apache-2.0.
11. Community/user documentation may receive a documentation-specific license such as `CC-BY-SA-4.0` only through an explicit migration. This ADR does not silently relicense current documentation.
12. A future network-centric OFU server may justify `AGPL-3.0-only`; that requires a separate ADR and explicit scope. No present component becomes AGPL under this decision.
13. The deterministic one-file artifact is a licensing surface. Release policy must connect the artifact to exact source identity and verifiable license/notice/data-provenance closure. The precise Corresponding Source strategy requires legal review before reliance.
14. Code licensing, trademarks, third-party/data rights, user-output policy, contributor agreements, and commercial agreements remain separate legal layers.

## Consequences

- The project stays within a standard, widely understood Open Source license rather than inventing an OFU-specific license.
- Proprietary distributors that cannot comply with GPL can become commercial-license customers rather than forcing the Open Source license to tax ordinary commercial success.
- The Open Source Core promise becomes a machine-checkable governance invariant instead of relying only on prose.
- Interoperability can become permissive where that increases adoption without weakening the reciprocal implementation core, but only through explicit scope changes.
- AGPL remains available for a future server boundary without imposing its adoption cost on the current single-file client.
- A verified contributor-rights process and IP provenance audit are prerequisites before broad commercial relicensing claims can include external contributions or uncertain historical material.
- New-license metadata and historical provenance cleanup should converge in parallel; no REUSE compliance claim is permitted before real evidence exists.
- Changing the Open Source licensing architecture or activating a new license boundary is a constitutional/legal R5 change and requires a superseding ADR or explicit R5 scope transaction rather than silent policy edits.
