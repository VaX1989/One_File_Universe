# R6-G integration patch request — optional central CI registration

Lane: `R6-G`  
Applier: `CONTROL_CONVERGENCE`  
Reason: R6-G does not own shared package/workflow surfaces.

## Request 1 — `package.json`

Add one script adjacent to the existing R6 continuum scripts:

```json
"test:continuum:r6-quality": "node tests/spatial-continuum/r6-w0-quality-observatory.mjs",
```

Integration point: the `scripts` object near `test:continuum:r6-local`, `test:continuum:r6-material`, and `test:continuum:r6-lod`.

Evidence: direct lane invocation passes and deterministic reruns are byte-identical.

## Request 2 — `.github/workflows/spatial-continuum-experiment.yml`

Extend the pull-request path filter with:

```yaml
      - 'tools/spatial-continuum/quality-observatory/**'
```

Then, in the `development` job after `npm run test:continuum`, add:

```yaml
      - name: Run R6 quality observatory contract tests
        env:
          OFU_CONTINUUM_EVIDENCE_DIR: reports/ci/quality-observatory
        run: node tests/spatial-continuum/r6-w0-quality-observatory.mjs
```

Optional artifact upload, if central convergence wants fixture evidence retained:

```yaml
      - name: Upload quality observatory evidence
        if: always()
        uses: actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f # v6 / Node 24 runtime
        with:
          name: spatial-continuum-quality-observatory-${{ env.OFU_SOURCE_SHA }}
          path: reports/ci/quality-observatory
          if-no-files-found: error
```

## Scope / safety

This request registers only the additive R6-G tooling contract test. It does not modify product source, scientific authority, browser runtime behavior, release policy, or test thresholds for other lanes.
