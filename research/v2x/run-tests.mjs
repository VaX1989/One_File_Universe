import assert from 'node:assert/strict';
import { pairwiseHillScreen, rockyRadiusPrem, hydrostaticScaleHeight } from './astronomy/oracles.mjs';
import { angularMomentumDeficit, radialOrbitOverlapScreen, dynamicsEscalation } from './astronomy/dynamics.mjs';
import { mistInterpolationContract, multiplicityPopulationContract } from './astronomy/stellar-contracts.mjs';
import { greyAtmosphereSurfaceTemperature, classifyEscapeRegime, convectionDiagnostic, volatileLedger, schlichtingIsothermalImpactLoss } from './planetology/oracles.mjs';
import { zeroDimensionalEbm, orbitalMeanFluxFactor, energyLimitedEscapeApplicability } from './planetology/climate-and-escape.mjs';
import { compositionRegimeContract, thermalLedgerStep, nusseltRayleighScenario } from './planetology/bulk-and-geodynamics.mjs';

function near(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

// Rocky source-domain witnesses and fail-closed boundaries.
near(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.33 }).radiusEarth, 1.0007, 1e-12, 'PREM 1 Mearth CMF 0.33');
near(rockyRadiusPrem({ massEarth: 8, coreMassFraction: 0.33 }).radiusEarth, 1.7554249820, 1e-9, 'PREM 8 Mearth CMF 0.33');
assert.equal(rockyRadiusPrem({ massEarth: 0.5, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 8.1, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.41 }).status, 'UNSUPPORTED');

// Pairwise mutual-Hill screen and richer escalation diagnostics.
const hillClose = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.02 });
const hillWide = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05 });
assert.equal(hillClose.status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.equal(hillWide.status, 'SCREENED_HILL_STABLE');
assert.ok(hillWide.deltaMutualHill > hillClose.deltaMutualHill);
const noOverlap = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.01, outerSemiMajorAxisAu: 1.05, outerEccentricity: 0.01 });
const overlap = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.1, outerSemiMajorAxisAu: 1.05, outerEccentricity: 0.1 });
assert.equal(noOverlap.status, 'NO_CURRENT_RADIAL_OVERLAP');
assert.equal(overlap.status, 'RADIAL_OVERLAP_OR_TOUCH');
const amdCircular = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0, inclinationDeg: 0 }, { massEarth: 1, semiMajorAxisAu: 1.05, eccentricity: 0, inclinationDeg: 0 }] });
const amdExcited = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0.1, inclinationDeg: 1 }, { massEarth: 1, semiMajorAxisAu: 1.05, eccentricity: 0.1, inclinationDeg: 1 }] });
near(amdCircular.amdSI, 0, 1e-6, 'circular coplanar AMD');
assert.ok(amdExcited.amdSI > amdCircular.amdSI);
assert.equal(dynamicsEscalation({ hillScreenStatus: hillWide.status, radialOverlapStatus: noOverlap.status, amdDiagnostic: amdExcited }).status, 'LOW_COST_SCREENS_PASSED');
assert.equal(dynamicsEscalation({ hillScreenStatus: hillWide.status, radialOverlapStatus: overlap.status, amdDiagnostic: amdExcited }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// Stellar-grid and multiplicity contracts must retain explicit version/population binding.
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.2, rotationFraction: 0, gridHash: 'sha256:test' }).status, 'INTERPOLATION_CONTRACT_READY');
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.1, rotationFraction: 0, gridHash: 'sha256:test' }).status, 'RESEARCH_REQUIRED');
assert.equal(mistInterpolationContract({ releaseId: '', ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.2, rotationFraction: 0, gridHash: '' }).status, 'UNSUPPORTED');
const mult = multiplicityPopulationContract({ primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.7, eccentricity: 0.2, populationId: 'FIELD_SOLAR_TYPE' });
assert.equal(mult.couplingRequired, true);
assert.equal(mult.independentFactorizationAuthorized, false);

// Earth-like ideal-gas hydrostatic scale-height reference.
near(hydrostaticScaleHeight({ temperatureK: 288, molarMassKgPerMol: 0.02897, gravityMps2: 9.80665 }).scaleHeightMeters, 8428.64, 0.1, 'Earth-like scale height');

// Grey-atmosphere and zero-dimensional EBM reference behavior.
near(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: 2 / 3 }).temperatureK, 255, 1e-12, 'grey tau=2/3');
assert.equal(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: -1 }).status, 'UNSUPPORTED');
const ebmCool = zeroDimensionalEbm({ stellarFluxWm2: 1000, bondAlbedo: 0.3, outgoingLongwaveA: 210, outgoingLongwaveB: 2 });
const ebmWarm = zeroDimensionalEbm({ stellarFluxWm2: 1400, bondAlbedo: 0.3, outgoingLongwaveA: 210, outgoingLongwaveB: 2 });
assert.ok(ebmWarm.temperatureK > ebmCool.temperatureK);
near(ebmWarm.absorbedShortwaveWm2, 245, 1e-12, 'EBM absorbed flux');
near(orbitalMeanFluxFactor({ eccentricity: 0 }).factor, 1, 1e-12, 'circular orbit mean flux factor');
assert.ok(orbitalMeanFluxFactor({ eccentricity: 0.5 }).factor > 1);

// Escape discriminator and applicability gate fail closed before a rate law is allowed.
assert.equal(classifyEscapeRegime({ jeansParameter: 2 }).regime, 'HYDRODYNAMIC_ESCAPE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 40 }).regime, 'JEANS_LIKE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).status, 'RESEARCH_REQUIRED');
assert.equal(energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1 }).status, 'RESEARCH_REQUIRED');
const escapeRate = energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1, absorptionRadiusEarth: 1.1, rocheCorrection: 0.9 });
assert.equal(escapeRate.status, 'MODEL_DERIVED_RATE_CANDIDATE');
assert.ok(escapeRate.rateKgPerS > 0);
assert.equal(energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1, absorptionRadiusEarth: 1.1, rocheCorrection: 0.9, diffusionLimited: true }).rateAuthorized, false);

// Bulk composition remains degenerate unless a scenario family is explicitly supplied.
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2 }).status, 'DEGENERATE_BULK_OBSERVABLES');
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2, ageGyr: 5, irradiationEarth: 100, hHeEnvelopeFraction: 0.05 }).status, 'SUB_NEPTUNE_SCENARIO_COORDINATE');
assert.equal(compositionRegimeContract({ massEarth: 25, radiusEarth: 4, ageGyr: 5, irradiationEarth: 100, hHeEnvelopeFraction: 0.05 }).status, 'UNSUPPORTED');
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2, waterMassFraction: 0.5 }).requiresHighPressureEos, true);

// Geodynamics retains exact energy bookkeeping and scenario-only scaling.
const thermal = thermalLedgerStep({ mantleEnergyJ: 1e30, radiogenicPowerW: 1e13, corePowerW: 2e13, surfaceHeatLossW: 4e13, durationSeconds: 1e6 });
assert.equal(thermal.status, 'CONSERVED');
near(thermal.residualJ, 0, 1e-6, 'thermal ledger residual');
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'MOBILE_LID_LIKE' }).exponentBeta, 0.26);
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'STAGNANT_LID_LIKE' }).exponentBeta, 0.12);
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'UNKNOWN' }).status, 'RESEARCH_REQUIRED');

// Existing diagnostic and conservation kernels.
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).plateTectonicsTruthClaim, false);
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.75 }).status, 'CONSERVED');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.5 }).status, 'NON_CONSERVING');
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 0.5 }).lossFraction, 0.45, 1e-12, 'impact-loss x=0.5');
assert.equal(schlichtingIsothermalImpactLoss({ momentumRatioX: 1.1 }).status, 'UNSUPPORTED');

console.log('V2X-15 research tests: PASS');
