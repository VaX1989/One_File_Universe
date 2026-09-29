# IND-LIC-A — Licensing, IP, Redistribution, Contribution, Naming and Certification Decision Dossier

**Status:** decision-ready planning record; not legal advice  
**PROMPT_ID:** `IND-LIC-A`  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`  
**Control base:** `fa88f7cec101a52d07916a0fdd3927c482a6f188` / tree `784e12501a7e0ba9e281787513bddbb6eed1c6bf`  
**Semantic owner:** `LICENSING_DECISION_DOSSIER`

## 1. Executive finding

The repository is publicly visible but has **no project license**. The root README states:

> No project license has been selected yet. Until a license is explicitly added, do not assume permission beyond applicable copyright law.

The npm package is `"private": true` and has no package-level `license` field. This combination means the current repository should not be treated as an open-source or externally reusable codebase merely because the source is publicly readable.

This state does **not** by itself block internal architectural research, internal native feasibility experiments, internal conformance-vector generation, or internal headless/native proof work, provided those activities remain within the repository's existing authority model and do not depend on granting external reuse rights.

It **does** become a blocking decision before the project intentionally grants reusable rights or invites reliance by third parties, including an external SDK beta, reusable public conformance vectors, an open specification intended for third-party implementation, external contribution intake under a stable contribution policy, a trademark/certification program, or commercial runtime redistribution terms.

The correct sequencing is therefore:

```
internal feasibility
  -> minimum technical proof
  -> founder/legal distribution decisions
  -> explicit license / contribution / naming / certification artifacts
  -> public reusable SDK/spec/vector/conformance ecosystem
```

No license is selected by this dossier.

## 2. Verified repository state

### 2.1 Project-level licensing state

- No root `LICENSE`, `LICENCE`, `COPYING`, or equivalent project-grant file is present at the active control head.
- `README.md` explicitly states that no project license has been selected.
- Repository visibility is public, but visibility is not treated as a permission grant.
- `package.json`:
  - name: `one-file-universe`
  - version: `2.0.0`
  - `private: true`
  - no `license` field
  - no `publishConfig`
  - no package `files` publication surface
- `CONTRIBUTING.md` defines engineering workflow and evidence discipline, but does not establish a contributor license agreement, DCO, inbound=outbound rule, or copyright assignment policy.

### 2.2 Third-party state

Direct runtime dependency:

- `@babylonjs/core@9.26.0` — Apache-2.0

Direct development/tooling dependencies:

- `esbuild@0.25.9` — MIT
- `playwright@1.62.1` — Apache-2.0
- `playwright-core@1.62.1` — Apache-2.0
- optional esbuild platform packages and `fsevents` — MIT

Repository lockfile census at the control head:

- 31 non-root package entries
- 28 entries declare MIT
- 3 entries declare Apache-2.0
- 0 lockfile package entries lack a declared license field

The spatial-continuum build embeds the full Babylon.js license text into the generated single-file HTML as `#ofu-spatial-continuum-third-party-license`, and the build manifest records the Babylon.js package/version/license and a license-text digest.

This is useful redistribution hygiene for that artifact, but it is not a substitute for a project-level OFU license.

### 2.3 Assets and generated evidence

The tree contains repository-generated screenshots, SVG evidence, reports, and build/test evidence. No separate root asset license policy was found.

Default treatment until an explicit policy exists:

- generated OFU evidence can be used internally as project evidence;
- do not imply that public reuse, republishing, training-corpus reuse, or inclusion in third-party documentation is granted;
- externally sourced or embedded media must be tracked separately if added later.

## 3. What may continue now without selecting a project license

The following can continue as **internal feasibility / repository development** under the current no-license state, subject to existing OFU technical gates:

| Activity | May proceed now? | Boundary |
|---|---:|---|
| Internal architectural research | YES | No external reuse grant implied |
| Internal headless feasibility | YES | Gate and authority constraints still apply |
| Internal native P2 experiments | YES, when technical gate opens | No public SDK promise |
| Internal C ABI experiments | YES, when technical gate opens | ABI stability does not imply redistribution rights |
| Internal conformance corpus generation | YES | Keep internal-use classification until publication policy chosen |
| Internal malformed/rejection vectors | YES | Same as above |
| Internal performance/security research | YES | No certification claim |
| Internal standard/spec drafting | YES | Drafting is not publication/implementation permission |
| Internal provider/runtime feasibility | YES, when technical gates open | No external distribution rights implied |
| Internal product integration | YES | Existing repository ownership/gates govern |
| Internal use of third-party dependencies | YES | Respect upstream terms and notices |

This dossier therefore does **not** recommend pausing G0A/G0B/G1 technical feasibility solely because OFU lacks a project license.

## 4. What is blocked or unsafe to represent as authorized today

The following should remain blocked until an explicit founder/legal decision is recorded and corresponding repository artifacts exist:

| Surface | Current status | Why |
|---|---|---|
| Public source-code reuse grant | BLOCKED | No project license |
| Public reusable SDK beta | BLOCKED | No outbound code terms, support/brand policy, or third-party notice bundle |
| Public reusable conformance vectors | BLOCKED | No explicit vector/data license or reuse policy |
| Open specification with third-party implementation rights | BLOCKED | No specification copyright/patent/trademark policy |
| External standard conformance program | BLOCKED | No certification mark/rules or implementation-rights policy |
| Formal external contributions | BLOCKED FOR STABLE POLICY | Current `CONTRIBUTING.md` has workflow but no inbound IP grant mechanism |
| CLA/DCO-backed contribution acceptance | NOT ESTABLISHED | No CLA/DCO files or bot/process |
| “Open source” representation | BLOCKED | Explicitly forbidden by repository state |
| Trademark/certification licensing | BLOCKED | No mark ownership/use rules |
| Commercial runtime redistribution terms | BLOCKED | No project outbound commercial terms |
| Dual-license/commercial exception claims | BLOCKED | No selected license family |
| Third-party redistribution guarantee | BLOCKED AS A GLOBAL CLAIM | Current evidence only establishes known dependency metadata and Babylon notice behavior |

## 5. Decision matrix: surfaces that require separate founder/legal choices

### D1 — OFU source code

Decision to record later:

- permissive open-source family;
- reciprocal/copyleft family;
- source-available/custom family;
- proprietary/no public grant;
- dual-license structure.

This dossier does not choose among them.

Required implementation artifacts after decision may include:

- root `LICENSE`;
- root `NOTICE` if appropriate;
- package `license` metadata;
- copyright headers/policy;
- release documentation;
- redistribution notice generation.

### D2 — Open specification text

The specification can be drafted internally before a license decision.

Before public publication intended for independent implementation, decide:

- copyright license for the spec text;
- permission to implement;
- patent posture if applicable;
- trademark/naming restrictions;
- normative vs non-normative asset licensing;
- version/fork naming rules.

Avoid a state where the spec text is readable but implementers lack clear implementation rights.

### D3 — Conformance vectors and fixtures

Treat vectors as a distinct artifact class.

Decide:

- whether vectors are code, data, documentation, or a separately licensed corpus;
- whether redistribution/modification is allowed;
- whether derivative vectors can claim conformance;
- whether test harness code and vector data have different terms;
- whether public vectors can be embedded in commercial products.

Internal vector development may continue before this decision.

### D4 — Reference implementation

If OFU publishes a reference implementation separate from product code, decide whether it:

- shares the project source license;
- has a more permissive interoperability-oriented license;
- is distributed only as examples;
- is dual-licensed.

Do not assume the reference implementation must inherit the commercial/runtime policy.

### D5 — Commercial runtime / SDK

Before any external SDK or commercial redistribution, decide:

- outbound code terms;
- redistribution of runtime dependencies;
- support/warranty/disclaimer posture;
- paid vs free tiers if any;
- sublicensing needs;
- binary/source availability;
- use of OFU names/marks in derived products;
- telemetry/data terms if ever introduced.

### D6 — Contributions

Current `CONTRIBUTING.md` is not enough for a mature external contribution regime.

Founder/legal decision needed among policy families such as:

- inbound equals outbound;
- DCO/sign-off;
- CLA;
- copyright assignment;
- restricted/no external code contributions.

The choice should reflect expected governance, patent exposure, corporate contributors, and future dual-licensing needs.

### D7 — Names, marks and certification

Separate code copyright from brand governance.

Decide:

- whether “One File Universe”, “OFU”, logos, badges, and conformance marks are controlled marks;
- nominative/reference-use policy;
- fork naming requirements;
- compatibility claims;
- who may say “OFU-compatible”, “OFU-conformant”, or similar;
- certification revocation rules;
- whether certification is self-declared or centrally granted.

### D8 — Certification program

Before external certification exists, define:

- certification authority;
- exact test version binding;
- allowed claims;
- evidence retention;
- misuse/removal process;
- relationship between open conformance tests and trademarked certification.

Open tests and controlled marks can coexist, but they are separate policy decisions.

## 6. Policy-family comparison without selecting terms

### Family A — Broad permissive interoperability

Typical characteristics:

- low adoption friction;
- straightforward commercial use;
- easiest external SDK/embedding story;
- weaker reciprocal pressure on downstream modifications.

Use when ecosystem adoption and interoperability dominate reciprocity concerns.

### Family B — Reciprocal/open-core boundary

Typical characteristics:

- preserves stronger sharing obligations on selected open components;
- can coexist with proprietary product/runtime layers if boundaries are clear;
- boundary mistakes create compliance complexity.

Use only with deliberate component separation.

### Family C — Open specification + permissive reference layer + proprietary commercial runtime

Typical characteristics:

- maximizes implementability/interoperability while reserving differentiated product/runtime value;
- requires clean separation of spec, vectors, reference code, marks, and commercial components;
- may fit an ecosystem strategy better than a single repository-wide license.

This is a structural option, not a recommendation.

### Family D — Proprietary/source-visible until product strategy matures

Typical characteristics:

- simplest short-term rights posture;
- external reuse/adoption remains blocked;
- later relicensing can become harder if many contributors accumulate without suitable inbound rights.

This is compatible with continuing internal feasibility now, but contribution provenance becomes increasingly important over time.

## 7. Third-party redistribution decision record

### Babylon.js 9.26.0

Repository evidence:

- direct runtime dependency;
- Apache-2.0 lockfile declaration;
- dedicated `THIRD_PARTY_NOTICES.md`;
- build embeds the complete dependency license text in the single-file artifact;
- build manifest records package/version/license and license digest.

Before public redistribution, re-verify the exact upstream license/NOTICE obligations for the exact packaged version and ensure the distributed artifact continues to include all required notices.

### esbuild / platform packages / fsevents

Repository evidence:

- development/build tooling;
- MIT declarations in lockfile;
- not identified as intentional runtime content in the single-file product.

If any build output starts embedding code from these tools, reclassify that output explicitly rather than relying on “devDependency” status.

### Playwright / playwright-core

Repository evidence:

- development/test tooling;
- Apache-2.0 declarations in lockfile;
- not identified as distributed runtime content.

No external certification claim should imply that Playwright itself certifies OFU.

## 8. Contribution provenance and chain-of-title risk

No repository artifact found establishes a CLA, DCO, assignment regime, or explicit inbound=outbound rule.

Practical implication:

- internal development can continue;
- before external contribution intake becomes strategically important, choose the inbound contribution model;
- if future dual licensing is contemplated, contribution policy should be decided **before** a broad external contributor base forms.

Repository commit history and GitHub authorship metadata are useful provenance evidence but are not, by themselves, a legal chain-of-title determination.

## 9. Naming and certification risk boundaries

Until an explicit marks policy exists:

- do not promise third parties a right to use “One File Universe” or “OFU” as product branding;
- do not create “certified by OFU” or equivalent marks;
- do not conflate passing public tests with a trademark license;
- do not imply independent implementations are endorsed merely because they consume published vectors.

The technical system should keep conformance facts separable from brand/certification authority.

## 10. Stage-by-stage blocker matrix

| Program stage | Licensing decision required to start? | Decision required before exit/publication? |
|---|---:|---:|
| G0A minimum normative slice | NO | NO, if internal only |
| JS headless prototype | NO | YES before public reusable package/API publication |
| External-consumer seam proof run by controlled project test | NO | YES before representing reusable external rights |
| Native P2 feasibility | NO | NO, if internal only |
| C ABI microhost feasibility | NO | NO, if internal only |
| G1 platform proof | NO | NO, if internal only |
| Runtime extraction feasibility | NO | NO, if internal only |
| Persistence/provider feasibility | NO | NO, if internal only |
| Internal standard drafting | NO | YES before public implementation-rights publication |
| Public conformance corpus | NO to develop | YES to publish for reuse |
| Public external conformance program | NO to design | YES before launch |
| SDK implementation | Technical work may proceed only when technical gates permit | YES before external beta/distribution |
| Commercial runtime distribution | N/A | YES, mandatory |
| External contribution program | N/A | YES, mandatory |
| Trademark/certification program | N/A | YES, mandatory |

## 11. Files to create or change after explicit decisions

Potential post-decision artifacts:

- `LICENSE`
- `NOTICE`
- package `license` / publication metadata
- `TRADEMARKS.md` or equivalent
- `CONTRIBUTING.md` update
- `DCO.md` and sign-off policy, or CLA documents/process, if selected
- `THIRD_PARTY_NOTICES.md` at a repository/distribution-wide level
- machine-readable SBOM/license report for release artifacts
- specification license header/policy
- conformance-vector license/policy
- certification policy and mark rules
- SDK redistribution notice bundle
- contributor provenance record appropriate to the selected inbound model

These files must not be created with legal terms until the corresponding decision authority exists.

## 12. Integration issue discovered

The v4 master gates `IND-SDK` behind `G-LICENSING-DISTRIBUTION-DECISION`, which is correct.

However, `STD-EXTERNAL-CONFORMANCE` is gated by `G4_STANDARD_DRAFT_READY` and is not directly tied to the licensing/distribution decision. Because external conformance can imply public specification implementation rights, vector reuse rights, and certification/naming policy, this is a governance gap.

This lane does not edit the shared master. It emits an `INTEGRATION_PATCH_REQUEST` asking the control plane to ensure that **external** conformance activation cannot bypass the relevant licensing/publication decision, while preserving internal standard drafting before that decision.

## 13. Exit assessment

The “no license” condition is no longer treated as a vague universal P0 stop.

It is now staged:

- **internal feasibility:** may continue;
- **public reusable rights / ecosystem distribution:** blocked until explicit decision;
- **external contribution policy:** blocked until explicit inbound model;
- **names/certification:** blocked until explicit mark/certification policy;
- **SDK distribution:** already correctly gated by the v4 licensing-distribution decision;
- **external conformance:** should receive an equivalent publication-rights guard through control-plane integration.

Terminal recommendation for this lane: `READY_FOR_CONTROL_CONVERGENCE`.

