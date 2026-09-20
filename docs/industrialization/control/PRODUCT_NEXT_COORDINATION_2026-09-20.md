# OFU Post-M0 Product Next Control Coordination

**Authority:** PLANNING_METADATA_ONLY  
**PROMPT_ID:** CTRL-WAVE-EPOCH  
**Epoch:** `OFU-POST-M0-PRODUCT-NEXT-2026-09-20-296565BB`  
**Control PR:** #312  
**Control branch:** `control/post-m0-product-next-2026-09-20`

## Follow-on ownership adjudication — 2026-09-20

The product epoch is continued, not restarted. Before this follow-on grant, PR #312 was at `92ae51b193d3e9a545c9760df3e6f0922728b3d0`, tree `2b8f210772609a22cf3c24affe4a636ae025b62a`, with exact-head cumulative CI **10/10 SUCCESS** including Spatial Continuum.

Already converged into #312:
- `PROD-W1-SCI-WHY` — PR #314, merge `72ea01f2d24897c9532519207dc512b9374b6d1f`.
- `PROD-W2-SEARCH` — PR #317, merge `fecae5a2e3ec4334b449a56cfd4141c998622d36`.
- `PROD-W2-TIME` — PR #319, merge `07f63e111d573ca025bf28cad44d1b9032f55e68`.

`PRODUCT-MACRO` continues only in existing PR #313 at `79d4fee113ff6e556cbf19c179b6945cbefd7274`. It remains **IN_PROGRESS** with failure fingerprint `PRODUCT_MACRO_REVERSAL_HARNESS_COMMITTED_STATE_TIMING_RACE` and remains the sole owner of shared macro renderer/product-composition surfaces.

## Newly authorized additive writers

### PROD-W1-INSTRUMENTS
- scientific instrument / measurement projection only;
- additive write scope: `src/product/w1/instruments/**`, focused lane tests/docs/state/handoff;
- read-only dependency on Scientific Fingerprint, SCI-WHY and governed scientific/authority state;
- no renderer, camera, picking, canonical P2/P4 or scientific-authority promotion.

### PROD-W2-COMPARE
- synchronized evidence comparison and typed causal divergence only;
- additive write scope: `src/product/exploration/compare/**`, focused lane tests/docs/state/handoff;
- read-only dependency on Atlas Core, SCI-WHY and governed product projections;
- no shared camera/render composition ownership, canonical mutation or scientific-authority promotion.

No matching INSTRUMENTS or COMPARE branch or PR existed at grant time, and neither additive source surface existed in the current product tree.

## Exact child-base rule

Both new lanes must branch from the **exact final #312 head after all follow-on control-record mutations**, externally bound by the PR #312 control comment.

Required branches:
- `work/post-m0/prod-w1-instruments-ofu-post-m0-product-next-2026-09-20-296565bb`
- `work/post-m0/prod-w2-compare-ofu-post-m0-product-next-2026-09-20-296565bb`

Both Draft PRs target `control/post-m0-product-next-2026-09-20`. They must not branch from the original activation SHA `de06cc7f8e4b74e57aad583a8764ac756b06b9da`. Once lane evidence is published, no rebase: later control movement is handled by convergence.

## Shared-surface reservation

`PRODUCT-MACRO` remains the sole shared renderer/product-composition writer. These remain deferred and are not activated:
- `PRODUCT-HUMAN`
- `PRODUCT-VISUAL-CONTINUITY`
- `PROD-W2-DIRECTOR`
- `PRODUCT-AUDIO`

Camera remains single-authority. Picking remains renderer-owned.

## Control-owned integration surfaces

`package.json`, `.github/workflows/**`, central test registration, shared renderer/composition, camera/picking, canonical P2/P4 and canonical scientific authority remain protected/control-owned.

Any child need for those surfaces must become an `INTEGRATION_PATCH_REQUEST` with:
`requesting_prompt_id`, `target_surface`, `target_path`, `expected_authority`, `intended_change`, `rationale`, `invariants`, `tests`.

## Wave0 separation

Wave0 PR #290 is independently ahead at `951946411b5aa5fb8685f066360099cabbdbb26e`; relative to the frozen product base it is 20 commits ahead and 0 behind. G0A is PASS on that separate industrialization track.

This task does not merge #312 into #290, merge #290 into #312, rebase either track, or resolve the shared `package.json` divergence by blind merge/rebase.

## CI rule

Fresh exact-head cumulative CI is required after the follow-on control mutations before terminalizing this control action. The grant authorizes implementation work only after that exact final head is externally bound.

## Non-actions

No mutation of `main`; no merge of #274/#275/#287/#290; no R7; no tag/release; no force-push; no canonical P2/P4 mutation; no scientific-authority promotion.
