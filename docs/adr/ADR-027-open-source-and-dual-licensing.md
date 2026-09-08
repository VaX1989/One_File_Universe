# ADR-027 — GPL-3.0-only Open Source core and optional commercial dual licensing

**Status:** Accepted

**Ratified:** 2026-09-08 by the project founder for the forward Open Source foundation transaction. Acceptance defines the intended licensing architecture; commercial relicensing of third-party contributions remains unavailable until the required contributor-rights chain has been legally reviewed and established.

## Context

OFU intends to become a durable Open Source scientific/simulation commons while retaining a sustainable path for organizations that require proprietary distribution rights. A permissive license would maximize reuse but allow proprietary appropriation with little reciprocity. A custom royalty license or source-available license would undermine standard Open Source compatibility and increase contributor/legal friction. AGPL would close the network-use gap but adds restrictions that are not currently necessary for OFU's primary distributed single-file product.

## Decision

1. OFU code is offered under the standard GNU General Public License version 3 only (`GPL-3.0-only`).
2. Commercial use under GPL is permitted without an OFU fee when the license is followed.
3. OFU may separately offer commercial licenses granting additional proprietary distribution permissions where the project has the legal rights to do so.
4. The Open Source license contains no automatic revenue royalty.
5. Accepted Open Source Core material remains available under the Open Source license; a commercial offer is additive, not a mechanism for retroactively withdrawing the commons.
6. Contributors retain copyright unless a separately reviewed agreement explicitly says otherwise. The intended contributor-rights model grants the project sufficient explicit rights for GPL distribution and optional commercial relicensing while preserving contributor ownership.
7. Submission of a pull request alone is never treated as commercial relicensing permission.
8. Code licensing, trademarks, third-party/data rights and commercial agreements remain separate legal layers.

## Consequences

- The project stays within a standard, widely understood Open Source license rather than inventing an OFU-specific license.
- Proprietary distributors that cannot comply with GPL can become commercial-license customers rather than forcing the Open Source license to tax ordinary commercial success.
- A verified contributor-rights process and IP provenance audit are prerequisites before broad commercial relicensing claims can include external contributions or uncertain historical material.
- Future network-centric server components may make a separate AGPL decision appropriate; that decision is not made by this ADR.
- Changing the Open Source licensing architecture is a constitutional/legal R5 change and requires a superseding ADR rather than silent policy edits.
