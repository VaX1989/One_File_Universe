import assert from 'node:assert/strict';
import { pairwiseHillScreen, minimumOuterAxisForCircularHillScreen, rockyRadiusPrem, rockyRadiusPremInterval, hydrostaticScaleHeight } from './astronomy/oracles.mjs';
import { angularMomentumDeficit, radialOrbitOverlapScreen, dynamicsEscalation } from './astronomy/dynamics.mjs';
import { mistInterpolationContract, multiplicityPopulationContract } from './astronomy/stellar-contracts.mjs';
import { greyAtmosphereSurfaceTemperature, classifyEscapeRegime, convectionDiagnostic, volatileLedger, schlichtingIsothermalImpactLoss } from './planetology/oracles.mjs';
import { zeroDimensionalEbm, transientZeroDimensionalEbmStep, orbitalMeanFluxFactor, energyLimitedEscapeApplicability, atmosphereMassBudgetStep, blackbodyEmission } from './planetology/climate-and-escape.mjs';
import { compositionRegimeContract, waterEosApplicabilityContract, thermalLedgerStep, nusseltRayleighScenario, laggedNusseltRayleighScenario } from './planetology/bulk-and-geodynamics.mjs';

function near(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

// Rocky source-domain witnesses and fail-closed boundaries.
near(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.33 }).radiusEarth, 1.0007, 1e-12, 'PREM 1 Mearth CMF 0.33');
near(rockyRadiusPrem({ massEarth: 8, coreMassFraction: 0.33 }).radiusEarth, 1.7554249820, 1e-9, 'PREM 8 Mearth CMF 0.33');
assert.equal(rockyRadiusPrem({ massEarth: 0.5, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 8.1, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.41 }).status, 'UNSUPPORTED');
const rockyInterval = rockyRadiusPremInterval({ massEarthMin: 1, massEarthMax: 8, coreMassFractionMin: 0, coreMassFractionMax: 0.4 });
assert.equal(rockyInterval.status, 'PRESENT');
near(rockyInterval.radiusEarthMin, 0.986, 1e-12, 'rocky interval lower');
near(rockyInterval.radiusEarthMax, 1.876987986, 1e-6, 'rocky interval upper');
assert.equal(rockyRadiusPremInterval({ massEarthMin: 0.9, massEarthMax: 1.1, coreMassFractionMin: 0, coreMassFractionMax: 0.4 }).status, 'UNSUPPORTED');

// Pairwise mutual-Hill screen and algebraic threshold inversion.
const hillClose = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.02 });
const hillWide = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05 });
assert.equal(hillClose.status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.equal(hillWide.status, 'SCREENED_HILL_STABLE');
assert.ok(hillWide.deltaMutualHill > hillClose.deltaMutualHill);
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05, eccentricityInner: 0.2 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');
const hillBoundary = minimumOuterAxisForCircularHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1 });
assert.equal(hillBoundary.status, 'PRESENT');
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: hillBoundary.minimumOuterSemiMajorAxisAu * 1.000001 }).status, 'SCREENED_HILL_STABLE');
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: hillBoundary.minimumOuterSemiMajorAxisAu * 0.999999 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// AMD and osculating geometry diagnostics remain explicit screens, not N-body truth.
const amdCircular = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0, inclinationDeg: 0 }] });
near(amdCircular.amdSI, 0, 0, 'circular coplanar AMD');
const amdExcited = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0.1, inclinationDeg: 2 }] });
assert.ok(amdExcited.amdSI > 0);
assert.equal(amdExcited.amdStabilityThresholdApplied, false);
const radialSafe = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.05, outerSemiMajorAxisAu: 1.3, outerEccentricity: 0.05 });
const radialOverlap = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.2, outerSemiMajorAxisAu: 1.1, outerEccentricity: 0.1 });
assert.equal(radialSafe.status, 'NO_CURRENT_RADIAL_OVERLAP');
assert.equal(radialOverlap.status, 'RADIAL_OVERLAP_OR_TOUCH');
assert.equal(dynamicsEscalation({ hillScreenStatus: 'SCREENED_HILL_STABLE', radialOverlapStatus: radialSafe.status, amdDiagnostic: amdCircular }).status, 'LOW_COST_SCREENS_PASSED');
assert.equal(dynamicsEscalation({ hillScreenStatus: 'SCREENED_HILL_STABLE', radialOverlapStatus: radialOverlap.status, amdDiagnostic: amdCircular }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// Stellar/multiplicity contracts enforce versioning and coupled priors.
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.2 }).status, 'INTERPOLATION_CONTRACT_READY');
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.1 }).status, 'RESEARCH_REQUIRED');
const multi = multiplicityPopulationContract({ primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.5, eccentricity: 0.2, populationId: 'research-population' });
assert.equal(multi.couplingRequired, true);
assert.equal(multi.independentFactorizationAuthorized, false);

// Earth-like ideal-gas hydrostatic scale-height reference.
near(hydrostaticScaleHeight({ temperatureK: 288, molarMassKgPerMol: 0.02897, gravityMps2: 9.80665 }).scaleHeightMeters, 8428.64, 0.1, 'Earth-like scale height');

// Grey-atmosphere reference: tau=2/3 returns Teff exactly under selected closure.
near(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: 2 / 3 }).temperatureK, 255, 1e-12, 'grey tau=2/3');
assert.equal(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: -1 }).status, 'UNSUPPORTED');

// Reduced climate equilibrium and transient energy closure.
const ebmEq = zeroDimensionalEbm({ stellarFluxWm2: 1361, bondAlbedo: 0.3 });
assert.equal(ebmEq.status, 'PRESENT');
near(ebmEq.absorbedShortwaveWm2, ebmEq.outgoingLongwaveAtSolutionWm2, 1e-12, '0D EBM equilibrium closure');
const transient = transientZeroDimensionalEbmStep({ temperatureK: 280, heatCapacityJm2K: 4.2e8, stellarFluxWm2: 1361, bondAlbedo: 0.3, durationSeconds: 86400 * 365 });
assert.equal(transient.status, 'PRESENT');
assert.ok(Math.abs(transient.energyResidualJm2) < 1e-3);
assert.ok(transient.temperatureK > 0);
assert.equal(transientZeroDimensionalEbmStep({ temperatureK: 280, heatCapacityJm2K: 1, stellarFluxWm2: 1e9, bondAlbedo: 0, durationSeconds: 1e9, maxTemperatureStepK: 0.001 }).status, 'UNSUPPORTED');
near(orbitalMeanFluxFactor({ eccentricity: 0.5 }).factor, 1 / Math.sqrt(0.75), 1e-12, 'mean flux e=0.5');
assert.ok(blackbodyEmission({ temperatureK: 300 }).fluxWm2 > blackbodyEmission({ temperatureK: 250 }).fluxWm2);

// Escape discriminator and rate applicability fail closed when required physics is absent.
assert.equal(classifyEscapeRegime({ jeansParameter: 2 }).regime, 'HYDRODYNAMIC_ESCAPE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 40 }).regime, 'JEANS_LIKE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).status, 'RESEARCH_REQUIRED');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).rateModelAuthorized, false);
assert.equal(energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1 }).status, 'RESEARCH_REQUIRED');
const escapeRate = energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1, absorptionRadiusEarth: 1.1, rocheCorrection: 0.9 });
assert.equal(escapeRate.status, 'MODEL_DERIVED_RATE_CANDIDATE');
assert.ok(escapeRate.rateKgPerS > 0);
const atmosphereBudget = atmosphereMassBudgetStep({ atmosphereMassKg: 100, escapeRateKgPerS: 3, sourceRateKgPerS: 1, durationSeconds: 10 });
assert.equal(atmosphereBudget.status, 'CONSERVED');
near(atmosphereBudget.afterKg, 80, 1e-12, 'atmosphere budget');
const depleted = atmosphereMassBudgetStep({ atmosphereMassKg: 10, escapeRateKgPerS: 100, durationSeconds: 1 });
assert.equal(depleted.status, 'DEPLETION_CAPPED');
near(depleted.afterKg, 0, 0, 'depletion floor');

// Geodynamic classifiers and energy ledger are explicitly scenario-only.
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).regime, 'STAGNANT_LID_LIKE');
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).plateTectonicsTruthClaim, false);
const thermal = thermalLedgerStep({ mantleEnergyJ: 1e20, radiogenicPowerW: 2e12, corePowerW: 1e12, surfaceHeatLossW: 4e12, durationSeconds: 1e6 });
assert.equal(thermal.status, 'CONSERVED');
near(thermal.residualJ, 0, 0, 'thermal ledger residual');
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'MOBILE_LID_LIKE' }).exponentBeta, 0.26);
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'STAGNANT_LID_LIKE' }).exponentBeta, 0.12);
const lagged = laggedNusseltRayleighScenario({ rayleighNumberNow: 1e7, rayleighNumberPast: 2e7, lagMyr: 250, regime: 'MOBILE_LID_LIKE' });
assert.equal(lagged.status, 'MODEL_DERIVED_SCENARIO');
assert.notEqual(lagged.instantaneousProxy, lagged.laggedSurfaceProxy);
assert.equal(laggedNusseltRayleighScenario({ rayleighNumberNow: 1e7, rayleighNumberPast: 2e7, lagMyr: 100, regime: 'MOBILE_LID_LIKE' }).status, 'RESEARCH_REQUIRED');

// Bulk composition stays degenerate unless scenario coordinates are explicit.
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2 }).status, 'DEGENERATE_BULK_OBSERVABLES');
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2, hHeEnvelopeFraction: 0.02, ageGyr: 5, irradiationEarth: 100 }).status, 'SUB_NEPTUNE_SCENARIO_COORDINATE');
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2, hHeEnvelopeFraction: 0.5, ageGyr: 5, irradiationEarth: 100 }).status, 'UNSUPPORTED');
const waterEos = waterEosApplicabilityContract({ eosId: 'Huang-et-al-2021-research', eosHash: 'sha256:test', pressurePa: 40e9, temperatureK: 1000, phaseDiagramId: 'research-phase-map' });
assert.equal(waterEos.status, 'EOS_COORDINATE_READY');
assert.equal(waterEos.phaseContext, 'ICE_X_OR_IONIC_BONDING_RELEVANT');
assert.equal(waterEosApplicabilityContract({ eosId: 'x', eosHash: 'y', pressurePa: 40e9, temperatureK: 1000 }).status, 'RESEARCH_REQUIRED');

// Conservation/metamorphic volatile ledger checks.
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.75 }).status, 'CONSERVED');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.5 }).status, 'NON_CONSERVING');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: 2, externalSourceKg: 2 }).status, 'CONSERVED');

// Paper-specific impact scenario witness values and bounds.
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 0.5 }).lossFraction, 0.45, 1e-12, 'impact-loss x=0.5');
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 1 }).lossFraction, 1, 1e-12, 'impact-loss x=1');
assert.equal(schlichtingIsothermalImpactLoss({ momentumRatioX: 1.1 }).status, 'UNSUPPORTED');

console.log('V2X-15 research tests: PASS');
