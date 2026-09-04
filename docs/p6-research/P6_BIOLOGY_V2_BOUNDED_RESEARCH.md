# P6 Biology v2 — Bounded Evolution Research Freeze

Status: **RESEARCH / NON-CANONICAL / NOT FOR PROMOTION**  
Branch: `research/p6-biology-v2`  
Rebaseline upstream: `main` at `ddc31e9f15ae63293d2111782ba643df8524ab2f`  
Historical research head adjudicated: `0e0c97b30050000d9647ad83d779f17602cf3e05`  
Canonical P6 v1 remains untouched and fail-closed.

## 1. Live forensic adjudication

The historical Biology v2 research was useful but its boundedness argument was insufficient. It cited P4 `MAX_HISTORICAL_EVENTS=65536`, `MAX_TAIL_EVENTS=4096` and checkpoint compaction as if they bounded biological persistence. They do not bound the lifetime number of entities retained inside checkpoint state: P4 permits checkpoint `coveredEventCount` to advance while compacting the event tail. Therefore a biology reducer that indefinitely creates new lineage/species tombstones or new trait keys can grow persistent checkpoint state without a Biology-level lifetime limit.

That concern is **CONFIRMED and repaired in this research revision**.

A second semantic concern was aggregate ecology. The historical reducer checked each lineage allocation against a supplied ceiling independently. Multiple lineages could therefore each consume the same biosphere ceiling. This revision binds one immutable-per-epoch biosphere energy ceiling and rejects an allocation when the **sum of active lineage allocations** would exceed it.

The upstream scientific dependency concern is also **CONFIRMED and unresolved**. Frozen P5 Environment v2 has no canonical volatile genesis, authoritative surface temperature, geochemical usable-energy/nutrient state, or sufficient viable-medium truth for positive biology. P5-next research remains non-canonical and still does not establish geochemical energy or a canonical state producer. Biology v2 therefore has no canonical positive-genesis path.

## 2. Research authority boundary

Research contract: `ofu-p6-biology-v2-bounded-research`  
Model: `p6-biology-v2-bounded-research-1`  
Transition contract: `ofu.p6.biology-v2-bounded-research-transition` / `2.0.0`  
Identity policy: `p6-biological-lineage-stable-key-research-v3`  
Positive fixture authority: exactly `P6_RESEARCH_ENVIRONMENT_ONLY`.

P2 remains sole Entity Identity / derivation authority. P4 remains sole time, event identity, ordering, replay, checkpoint, compaction and archive authority. P5 remains sole canonical environment authority. P6 research owns only biological payload and reducer semantics.

A research environment must carry an explicit source contract, source model, 32-byte source digest, planet binding and environment epoch. A payload labeled `P5_CANONICAL` is rejected. Research fixtures are evidence for reducer behavior only and cannot establish canonical life.

## 3. Bounded lineage and species model

The research resource policy is deliberately operational, not a biological law:

- at most **1 biosphere per P4 research world**;
- at most **1024 lifetime lineages/species per biosphere**;
- at most **256 simultaneously active lineages per biosphere**;
- at most **32 distinct persisted trait keys per lineage**;
- at most **8 trophic transfer levels**;
- MICRO individuals are ephemeral and never persist.

Each accepted lineage creates exactly one persistent species record. Therefore, excluding the single biosphere record, maximum persistent biological entities are:

`1024 lineage records + 1024 species records = 2048 records`.

Extinction does not reclaim or recycle identity; the extinct lineage and species remain bounded tombstones inside the same 1024 lifetime budget. This preserves ancestry and replay without allowing extinction/re-speciation churn to grow state indefinitely.

### Stable identity

Biosphere Entity Identity is rooted in `{planetId, identityPolicy}`.

Lineage Entity Identity is rooted in `{biosphereId, parentLineageId, birthOperationKey, identityPolicy}`.

Species Entity Identity is rooted in `{lineageId, speciationOperationKey, identityPolicy}`.

Reducers recompute all expected P2 IDs from accepted event descriptors. Payload IDs are claims, never authority. The operation key removes ordinal allocation and avoids the circular dependency `lineageId <- eventId <- target/payload <- lineageId`.

## 4. Transition semantics

Research event families are version `@2`:

- `p6.biosphere.genesis.research@2`
- `p6.lineage.found.research@2`
- `p6.lineage.speciate.research@2`
- `p6.lineage.extinct.research@2`
- `p6.population.set.research@2`
- `p6.ecology.allocate.research@2`
- `p6.adaptation.commit.research@2`

Founder creation requires no parent. Speciation requires an ACTIVE parent in the same biosphere. There is no automatic speciation threshold or rate: a speciation event is an explicitly accepted research transition, because no universal biological speciation law is scientifically justified here.

Extinction is irreversible in this transition version: ACTIVE/EXTANT becomes EXTINCT, population and energy allocation become zero, species is tombstoned, and identity is never reused. Population or adaptation events against an extinct lineage reject. Any future recolonization/revival semantics must be a separately versioned model, not an implicit mutation of this one.

Adaptation is aggregate state only. Each bounded trait records a ppm value and a declared selection-pressure proxy. It is classified `HYPOTHETICAL / STYLIZED`; deterministic replay does not turn it into a biological law.

## 5. Ecology semantics

The deterministic substrate remains integer energy accounting:

`primary = captured_phototrophic + captured_chemotrophic`

`allocatable = primary - floor(primary * maintenance_fraction)`

Each trophic ceiling is:

`floor(previous_ceiling * transfer_efficiency)`.

All energy proxies are non-negative `u64`; efficiencies are ppm `0..1,000,000`; invalid range and overflow reject. Missing chemotrophic usable energy remains `null` and is not synthesized.

A biosphere energy allocation event establishes a single `biosphereEnergyCeilingU` for the current research epoch. Later allocation events must use the same ceiling and the sum of ACTIVE lineage allocations must remain `<= ceiling`. Extinction releases that lineage's allocation by setting it to zero.

This is an accounting constraint, not calibrated extraterrestrial ecology. No conversion from energy to canonical individuals, biomass, carrying capacity or speciation probability is promoted.

## 6. Boundedness argument

The boundedness proof no longer depends on finite event-tail length.

For one P4 Biology-v2 research world:

1. Genesis reducer rejects a second biosphere.
2. Every founder/speciation reducer checks `totalLineages < 1024` before creation and increments the counter exactly once.
3. Extinction never decrements `totalLineages`; therefore churn cannot reopen lifetime capacity.
4. Every founder/speciation also checks `activeLineages < 256`; extinction decrements only the active counter.
5. Exactly one species record is created with each lineage; no independent species-creation event exists.
6. Every adaptation insertion checks `traitCount < 32`; updating an existing key does not grow the key set.
7. MICRO samples are pure addressed derivations with `persistent=false` and `individualIdentityPromoted=false`.
8. P4 bounds the live event tail and owns compaction/archive mechanics, while Biology bounds checkpoint payload growth independently.

Thus persistent Biology state is O(1) with respect to universe size and O(1) over unbounded simulated time under the explicit resource policy. The policy cap may be revised only by a new research/canonical semantic version.

## 7. Determinism and replay contract

All persistent mutation is a P4 transition contract. Biology owns no clock, event ID, ordering, checkpoint, compaction, archive or private history.

Research verification covers:

- full P4 live replay;
- repeated checkpoint compaction;
- archive export/import and reopen;
- exact state-digest equality after reopen/compaction;
- deterministic stable P2 biosphere/lineage/species IDs;
- deterministic MICRO addressed sampling;
- forged/invalid authority rejection;
- extinction non-revival;
- shared-energy ceiling rejection;
- explicit total-lineage, active-lineage and trait boundary guards;
- independent Python stable-key + arithmetic oracle;
- Chromium / Firefox / Playwright WebKit stable-key and ecology equality.

## 8. P5 dependency contract

### Canonical dependency

Required canonical base today: `ofu-p5-p6-environment-v2` / `p5-environment-2` / `P5_CANONICAL`.

Current result remains:

- `canonicalPositivePath = false`;
- reason: `INSUFFICIENT_ENVIRONMENT`;
- canonical P6 v1 must continue to expose `biologyEstablished=false` and reject positive genesis.

### P5-next research

Observed research contract: `ofu-p5-environment-next-research-v1` / authority `P5_RESEARCH_DRAFT`.

It improves source-driven volatile-state algebra but explicitly lacks a canonical state producer and still does not establish geochemical usable energy, nutrients, or a promoted surface-temperature/viable-medium path. It therefore also has:

- `researchNextPositivePath = false`.

### Minimum future inputs before Biology eligibility can be re-adjudicated

A future versioned P5 authority must provide, with provenance and validity domain, enough state to establish rather than guess:

1. a canonical environmental state producer / accepted P4 history;
2. a defensible viable biological medium state;
3. usable phototrophic energy inputs where applicable and/or geochemical usable-energy authority for chemotrophy;
4. temperature / solvent constraints sufficient for the claimed biological validity domain;
5. required nutrient/redox or other limiting inputs if the future biology law depends on them;
6. explicit uncertainty/unknown semantics so missing fields cannot collapse to zero or a hidden Earth prior.

Even then, a future P5 contract must not automatically unlock life. P6 eligibility and genesis science require a separate versioned adjudication.

## 9. Remaining scientific blockers

### MATERIAL

- No canonical P5 positive environmental path currently establishes the prerequisites for biosphere genesis.
- No scientifically adjudicated universal abiogenesis/genesis trigger is established.
- No calibrated environment-to-biomass/population law suitable for arbitrary OFU planets is established.
- No calibrated speciation/extinction dynamics are established; current explicit transition mechanics remain stylized research semantics.
- Geochemical usable energy and nutrient/redox constraints remain unsupported upstream.

### ENGINEERING / EVIDENCE BEFORE ANY FUTURE PROMOTION REVIEW

- A future candidate would need an exact versioned P5 dependency rather than `P6_RESEARCH_ENVIRONMENT_ONLY` fixtures.
- Save/migration compatibility for any promoted v2 transition would need an explicit policy.
- Exact-candidate cross-runtime and independent-oracle evidence must be re-established at the future promotion head.
- Resource caps would need product/system calibration and an explicit canonical policy decision; the current numbers are research safety envelopes, not scientific constants.

## 10. Research freeze decision

This branch advances deterministic lifecycle semantics and closes the known unbounded-persistence defect without fabricating missing environmental or evolutionary science.

**PROMOTION REQUESTED = NO**

Do not merge this branch into `main` or canonical P6 v1 without a separately authorized future promotion transaction.
