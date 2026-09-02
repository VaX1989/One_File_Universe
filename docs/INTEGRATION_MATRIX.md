# One File Universe Integration Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Role:** living current contract registry; historical cycle observations belong in `reports/adversarial/**`.  
**Authority rule:** this matrix coordinates ownership and compatibility but does not replace owning phase specifications.

## State vocabulary

- **FROZEN** — irreversible upstream contract. Downstream phases consume it; changes require a reproduced protocol defect and explicit re-certification.
- **STABLE_SNAPSHOT** — cross-phase interface stable enough for parallel consumers, but not a phase freeze. Incompatible change requires coordinated versioning.
- **PROPOSED** — implementation/design exists, but unresolved semantic or conformance work prevents frozen downstream reliance.
- **RESEARCH** — exploratory model/interface; not canonical authority.

## Contract registry

| Contract | Owner | Consumers | Version / ID | State | Current compatibility decision | Reviewed head |
| --- | --- | --- | --- | --- | --- | --- |
| OFU-CBV-1 canonical bytes | P2 | all phases | OFU-CBV-1 | FROZEN | Sole canonical serialization authority. | `main@7bfb738483e0975c2c72e60a64f6ee8f000dbb01` |
| Unicode profile | P2 | all phases | `ofu-unicode-15.1.0-v1` | FROZEN | No downstream normalization/repertoire substitution. | same |
| Universe Identity | P2 | P3+ | P2 v1 | FROZEN | Universe-scoped authority. | same |
| Canonical Entity Identity | P2 | P3+ | P2 v1 | FROZEN | Domain phases define stable keys; never a second Entity ID system. | same |
| Canonical Address / addressed derivation / numeric authority | P2 | P3+ | P2 v1 | FROZEN | Downstream domains bind semantics through P2 manifest/address/derivation contracts. | same |
| Phase-owned conformance evidence | Integration Board + phase CI owner | all phases | `phase-evidence-architecture-v1` | STABLE_SNAPSHOT | Phase workflows execute explicit scope and package only owned evidence; foreign phase input fails closed. Main hardening is being promoted independently of P4. | P4 proof `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0`; main hardening candidate tracked separately |
| Baseline vs mutable authority | Integration Board boundary; owning domains authoritative | P3/P4/P5+ | `baseline-mutable-authority-v1-snapshot` | STABLE_SNAPSHOT | Procedural baseline + P4 history + versioned domain transitions = current persistent world. | P3 `768ceb2…`, P4 `4a855bf…`, P5 `efe2b8c…` |
| P3 Astronomy Facts schema | P3 | P4, P5, later domains | prototype schema 0; target schema v1 | PROPOSED | Preserve strong prototype architecture; canonicalize from current main before freeze. Baseline/reference epoch must be explicit. | `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a` |
| P3 normalized physical system-site identity | P3 under P2 identity | P4, P5 | target P3 v1 | STABLE_SNAPSHOT | Stable key and Address both use normalized absolute site; Sector is only computational partition. | `768ceb2…` |
| P3 -> P5 Planetary Input Snapshot | P3 facts / P5 realization | P5 | `ofu-p3-p5-planetary-input-snapshot-v0` | STABLE_SNAPSHOT | One authority per fact. Baseline mass/orbit/identity are consumed, never rerolled. | P3 `768ceb2…`, P5 `efe2b8c…` |
| P4 Temporal Contract | P4 | P5, P6, P7+ | `ofu-p4-temporal-v1` candidate | PROPOSED | Evidence isolation resolved. Live frontier, checkpoint+bounded-tail mutation and reducer semantic authority remain material blockers. | `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0` |
| P4 -> downstream transition ownership | P4 time/replay + domain transition owner | P5+ | snapshot | STABLE_SNAPSHOT | P4 owns time/order/replay/checkpoint/lineage; domain phases own transition physics/semantics. | P4 `4a855bf…` |
| P5 Planet Physical Contract | P5 | P6+ | research | RESEARCH | Detailed composition/radius/interior/atmosphere/climate/terrain remain P5 research; no private canonical clock. | `efe2b8ce29267deb26f3f34d18433c96947c467e` |

## Current authority boundaries

### P3 baseline authority

P3 owns canonical astronomical identity and generated baseline/reference facts: system/star/planet relations, orbital architecture, formation/reference astronomical state, baseline planet mass and coarse formation/bulk prior. Before schema v1, fields capable of later evolution must explicitly declare their baseline/reference-epoch meaning. See `docs/integration/BASELINE_MUTABLE_AUTHORITY_MATRIX.md`.

### P4 mutable authority

P4 owns canonical time, accepted event ordering, replay, checkpoints, compaction and lineage. It does not own astronomy or planetary physics. Current P4 is not integration-ready until the three material semantic blockers are closed.

### P5 physical authority

P5 owns detailed physical realization: composition fractions, physical radius, density/gravity realization, interior/geodynamics, atmosphere, hydrosphere, climate and terrain. P5 consumes P3 baseline commitments and uses P4 temporal authority for any canonical evolution.

## Current exact heads

| Track | Ref | Head | Integration status |
| --- | --- | --- | --- |
| P2 / integration main | `main` | `7bfb738483e0975c2c72e60a64f6ee8f000dbb01` | FROZEN / CLOSED; generic evidence hardening pending promotion |
| P3 prototype | `prototype/p3-universe-skeleton-pre-freeze` | `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a` | READY FOR CANONICALIZATION; real current-main feature branch not yet present |
| P4 candidate | `feature/p4-temporal-kernel` | `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0` | CONTINUE WITH MATERIAL FIXES |
| P5 research | `research/p5-planetology` | `efe2b8ce29267deb26f3f34d18433c96947c467e` | CONTINUE research |

Exact heads are observations, not permanent phase pins. Every integration cycle rebaselines live state.

## Durable executable integration gates

The acceptance catalogue lives in `tests/integration/README.md`. Tests are promoted from specification to executable form only when the actual dependent phase semantics exist. No mocked/fake phase integration may be used to claim completion.

The disposable `integration/p3-p4` branch is created only when P3 has a stable current-main canonicalization head and P4 has closed its three material semantic blockers.
