import assert from 'node:assert/strict';
import { pairwiseHillScreen, rockyRadiusPrem, hydrostaticScaleHeight } from './astronomy/oracles.mjs';
import { greyAtmosphereSurfaceTemperature, classifyEscapeRegime, convectionDiagnostic, volatileLedger, schlichtingIsothermalImpactLoss } from './planetology/oracles.mjs';

function near(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

// Rocky source-domain witnesses and fail-closed boundaries.
near(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.33 }).radiusEarth, 1.0007, 1e-12, 'PREM 1 Mearth CMF 0.33');
near(rockyRadiusPrem({ massEarth: 8, coreMassFraction: 0.33 }).radiusEarth, 1.7554249820, 1e-9, 'PREM 8 Mearth CMF 0.33');
assert.equal(rockyRadiusPrem({ massEarth: 0.5, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 8.1, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.41 }).status, 'UNSUPPORTED');

// Pairwise mutual-Hill screen: monotonic spacing sanity around the 2*sqrt(3) threshold.
const hillClose = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.02 });
const hillWide = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05 });
assert.equal(hillClose.status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.equal(hillWide.status, 'SCREENED_HILL_STABLE');
assert.ok(hillWide.deltaMutualHill > hillClose.deltaMutualHill);
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05, eccentricityInner: 0.2 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// Earth-like ideal-gas hydrostatic scale-height reference.
near(hydrostaticScaleHeight({ temperatureK: 288, molarMassKgPerMol: 0.02897, gravityMps2: 9.80665 }).scaleHeightMeters, 8428.64, 0.1, 'Earth-like scale height');

// Grey-atmosphere reference: tau=2/3 returns Teff exactly under the selected closure.
near(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: 2 / 3 }).temperatureK, 255, 1e-12, 'grey tau=2/3');
assert.equal(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: -1 }).status, 'UNSUPPORTED');

// Escape discriminator fails closed instead of assigning a universal rate law.
assert.equal(classifyEscapeRegime({ jeansParameter: 2 }).regime, 'HYDRODYNAMIC_ESCAPE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 40 }).regime, 'JEANS_LIKE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).status, 'RESEARCH_REQUIRED');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).rateModelAuthorized, false);

// Geodynamic classifier is explicitly diagnostic only.
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).regime, 'STAGNANT_LID_LIKE');
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).plateTectonicsTruthClaim, false);

// Conservation/metamorphic ledger checks.
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.75 }).status, 'CONSERVED');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.5 }).status, 'NON_CONSERVING');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: 2, externalSourceKg: 2 }).status, 'CONSERVED');

// Paper-specific impact scenario witness values and bounds.
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 0.5 }).lossFraction, 0.45, 1e-12, 'impact-loss x=0.5');
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 1 }).lossFraction, 1, 1e-12, 'impact-loss x=1');
assert.equal(schlichtingIsothermalImpactLoss({ momentumRatioX: 1.1 }).status, 'UNSUPPORTED');

console.log('V2X-15 research tests: PASS');
