# PROD-W2-SEARCH — bounded governed discovery boundary

**PROMPT_ID:** `PROD-W2-SEARCH`  
**Epoch:** `OFU-POST-M0-PRODUCT-NEXT-2026-09-20-296565BB`  
**Authority:** product-local discovery/analysis only.

## Purpose

This lane makes the deterministic address space discoverable without constructing or claiming an exhaustive universe index. Search operates over bounded providers and returns exact canonical identity/address references, provenance, explicitly versioned similarity/interestingness metadata and reproducible resource accounting.

## Runtime contracts

- Engine: `ofu-prod-w2-search-engine-1`
- Provider: `ofu-prod-w2-search-provider-1`
- Result: `ofu-prod-w2-search-result-1`
- Similarity metric: `ofu-prod-w2-search-metric-1`
- Interestingness model: `ofu-prod-w2-interestingness-1`

The generic engine budget is finite: 128 candidates, 24 returned results, 262144 result-descriptor bytes and 16 provider calls. All limits are caller-overridable only inside hard maximum bounds. Individual providers may impose a smaller contract limit; the V1 nearby-system adapter clamps requests to the address-space `MAX_RESULTS` export (currently 64) and exposes whether another provider window remains.

## Determinism

Providers are normalized to deterministic `provider id/version` order. Candidate batches are normalized by exact canonical identity before evaluation. Result ranking uses fixed-point integer scores. Ties resolve by canonical id ascending. Equivalent input/provider ordering therefore does not alter the result.

Similarity compares Scientific Fingerprints only when both are PRESENT and their scientific state contract/model version agree. Model/contract mismatch is `UNSUPPORTED`; missing/UNKNOWN science is `UNKNOWN`, never numerical zero.

## Governed interestingness

Interestingness is explicitly analytical and versioned. It consumes only declared `noveltyPpm` and `rarityPpm` properties plus Scientific-Fingerprint authority support when that support is known. Missing authority is omitted with an explicit rationale rather than coerced to zero. User history, prior rankings and mutable behavioral feedback are not inputs.

## Provider surfaces

`createNearbySystemSearchProvider` wraps the pre-existing bounded `discoverNearbySystems` address-space API. It propagates exact system identity and bounded probe/radius provenance, clamps to the provider's declared result cap and marks `wholeUniverseEnumeration=false`. It does not claim that one bounded provider window exhausts the search space.

`createAtlasSearchProvider` searches the Personal Atlas as product-local state. Atlas results carry the exact revisit plan. It can resolve a saved Scientific Fingerprint reference without promoting Atlas state to canonical science.

Additional providers must satisfy the same bounded provider contract and authority declaration.

## Unknown and unsupported data

Every searchable property uses the tri-state `VALUE | UNKNOWN | UNSUPPORTED` representation. A filter must state `unknownPolicy=ALLOW|REJECT`. Unsupported property names and malformed operators fail closed.

## Cancellation and stale results

The engine checks an `AbortSignal` and an optional generation token before and during provider evaluation. A cancelled or stale generation returns no result descriptors. Work already performed remains visible only in resource accounting; stale descriptors are never returned.

## Authority and mutation boundary

Search:

- does not mutate P2/P4/world state;
- does not mutate Scientific Fingerprints or Atlas observations;
- does not own camera, picking, renderer or shared product composition;
- does not use a global index;
- does not enumerate the universe;
- does not require runtime network resources;
- does not make model-derived or presentation-only data canonical.

## Focused evidence

`tests/product/prod-w2-search.mjs` covers repeated determinism, equivalent-order stability, deterministic similarity tie-breaking, bounded candidate/result/byte budgets, malformed and unsupported filters, UNKNOWN policy, Scientific-Fingerprint authority/model boundaries, Atlas exact revisit, the real V1 sparse-address `MAX_RESULTS` boundary, canonical-state non-mutation, cancellation, stale-generation rejection and a zero-network-resource source check.

The test is intentionally not registered in `package.json` by this writer because package/workflow/central-runner paths are protected by the active product epoch. A control-owned integration patch request is included beside this document.
