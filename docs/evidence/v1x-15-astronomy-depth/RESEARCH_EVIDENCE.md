# V1X-15 Research Evidence

Lane `PROMPT 15 / R&D-15`, owner namespace `v1x-15-astronomy-depth`, authority `RESEARCH_ONLY`.

Live-verified base branch `integration/v1.0-definitive-product-convergence-2026-09-05` was exactly commit `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19`, tree `3324e6354b5ff1b90156d1693e6051595b6f1219`. V1X-15 is dependency-free and the ownership matrix assigns the RESEARCH policy while freezing `src/domains/astronomy/**` and P0-P6 source/tests/specs.

## Diagnostic execution before repository write

```text
node /tmp/v1x15/run-tests.mjs
V1X-15 research tests: PASS

python3 /tmp/v1x15/oracle.py | cmp - /tmp/v1x15/fixtures/oracle-v1.json
ORACLE_REPRO_PASS

node --version
v22.16.0
python3 --version
Python 3.13.5
```

Classification: **DIAGNOSTIC_EXECUTION_PASS, NOT CANONICAL_RUNTIME_CERTIFICATION**. The repository requires Node `24.20.x`; Node 22.16.0 was the available execution environment. The integer-only model and independent Python oracle agree, but canonical runtime evidence still requires Node 24.20.x and normal cross-runtime execution.

The first diagnostic test invocation found a harness-only `Number * BigInt` type error in a loop constant. It was fixed before any repository write. During adversarial review a second logical edge case was found: hierarchy flooring could move a period outside its originally sampled regime. The implementation now reclassifies the final period before q/e bounds are assigned.

`p3-compat-smoke.mjs` is committed but not executed here because the code-execution container had no repository checkout and outbound `git clone` was unavailable. It is designed for an exact repository checkout and uses the same frozen P2/P3 runtime-loading pattern as existing P3 integration tests.

## Adversarial safeguards

- Observability carries `SURVEY_NEUTRAL_HEURISTIC_NOT_COMPLETENESS_PROBABILITY` to prevent a score being misrepresented as selection completeness.
- Spatial output forces `coordinateAuthority: NONE` and `physicalTruthClaim: false` so P3 procedural density cannot masquerade as observed cosmic-web geometry.
- Research P2 derivation domain is versioned `research.v1x15.astronomy-depth.v1`; semantics-changing revisions require a new version.
- Adapter tests retain the original P3 `canonical.id` and keep observer/query context out of identity.
- The model imports no P4 mutation surface and emits no temporal event.

No browser, hosted-CI, physical-device, Node-24, or canonical-promotion claim is made by this checkpoint.
