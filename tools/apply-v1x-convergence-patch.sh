#!/usr/bin/env bash
set -euo pipefail

if grep -q 'function setTravelDistance(distanceRadii,band)' src/rendering/v1/living-renderer.js 2>/dev/null; then
  echo 'convergence patch already applied'
  exit 0
fi

cat tools/convergence-patch/part*.b64 | tr -d '\n\r' | base64 -d > /tmp/convergence-patch.tgz
echo '49b9e237b65986075cad1499cf04d501a072b67a4247c74b57233c8adf869f12  /tmp/convergence-patch.tgz' | sha256sum -c -
tar -xzf /tmp/convergence-patch.tgz -C /tmp
echo '362b267f65cc860490b137b39ba389415c5e417f140aa3b82906bb9435d969fc  /tmp/convergence.patch' | sha256sum -c -
git apply --check /tmp/convergence.patch
git apply /tmp/convergence.patch

node tests/v1x-convergence/active-authorities.mjs
node tests/v1/session-persistence.mjs
node tests/v1x-04-stellar-system-rendering/static-system-3d-oracle.mjs
node tests/v1x-04-stellar-system-rendering/system-rendering-oracle.mjs
node tests/v1x-04-stellar-system-rendering/continuity.mjs
node tests/v1x-11-runtime-streaming-resources/runtime-resources.mjs
node tests/v1x-12-persistence-gameplay-intervention/governed-action-journey.mjs
npm test

git config user.name 'VaX1989'
git config user.email 'Pietrocorona89@gmail.com'
git add -A
git commit -m 'convergence: activate continuous reality and repair shared authorities'
git push origin HEAD:integration/v1.0-definitive-product-convergence-2026-09-05
