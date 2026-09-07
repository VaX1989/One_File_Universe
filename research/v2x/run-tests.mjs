import assert from 'node:assert/strict';
import { pairwiseHillScreen, minimumOuterAxisForCircularHillScreen, rockyRadiusPrem, rockyRadiusPremInterval, hydrostaticScaleHeight, bandpassDistanceModulus, angularObservabilityGeometry } from './astronomy/oracles.mjs';
import { angularMomentumDeficit, collisionCriticalAmd, pairwiseCollisionAmdScreen, circularCoplanarPlanetState, shortHorizonNBodyDiagnostic, shortHorizonNBodyStepConvergence, radialOrbitOverlapScreen, dynamicsEscalation } from './astronomy/dynamics.mjs';
import { mistInterpolationContract, interpolateVersionedStellarSlice, multiplicityPopulationContract, evaluateVersionedMultiplicityCells } from './astronomy/stellar-contracts.mjs';
import { greyAtmosphereSurfaceTemperature, classifyEscapeRegime, convectionDiagnostic, volatileLedger, schlichtingIsothermalImpactLoss, streamPowerIncisionScenario, upliftIncisionElevationStep } from './planetology/oracles.mjs';
import { zeroDimensionalEbm, transientZeroDimensionalEbmStep, zonalEbmStep, orbitalMeanFluxFactor, energyLimitedEscapeApplicability, atmosphereMassBudgetStep, blackbodyEmission } from './planetology/climate-and-escape.mjs';
import { compositionRegimeContract, waterEosApplicabilityContract, interpolateVersionedWaterEos, interpolateVersionedSubNeptuneGrid, thermalLedgerStep, nusseltRayleighScenario, laggedNusseltRayleighScenario } from './planetology/bulk-and-geodynamics.mjs';

function near(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

const EBM_PROVENANCE = Object.freeze({ parameterSetId: 'synthetic-ebm-test', parameterSetHash: 'sha256:synthetic-ebm-test' });
const ESCAPE_THRESHOLDS = Object.freeze({ thresholdSetId: 'research-jeans-threshold-test', thresholdSetHash: 'sha256:research-jeans-threshold-test' });
const CONVECTION_PROVENANCE = Object.freeze({ parameterSetId: 'research-convection-threshold-test', parameterSetHash: 'sha256:research-convection-threshold-test' });
const MIST_DOMAIN = Object.freeze({ ageMinLog10Years: 5, ageMaxLog10Years: 10.3, massMinSolar: 0.1, massMaxSolar: 300, fehMin: -3, fehMax: 0.5 });

// Rocky source-domain witnesses and fail-closed boundaries.
near(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.33 }).radiusEarth, 1.0007, 1e-12, 'PREM 1 Mearth CMF 0.33');
near(rockyRadiusPrem({ massEarth: 8, coreMassFraction: 0.33 }).radiusEarth, 1.7554249820, 1e-9, 'PREM 8 Mearth CMF 0.33');
assert.equal(rockyRadiusPrem({ massEarth: 0.5, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 8.1, coreMassFraction: 0.33 }).status, 'UNSUPPORTED');
assert.equal(rockyRadiusPrem({ massEarth: 1, coreMassFraction: 0.41 }).status, 'UNSUPPORTED');
const rockyInterval = rockyRadiusPremInterval({ massEarthMin: 1, massEarthMax: 8, coreMassFractionMin: 0, coreMassFractionMax: 0.4 });
assert.equal(rockyInterval.status, 'PRESENT');
near(rockyInterval.radiusEarthMin, 0.986, 1e-12, 'rocky interval lower');
near(rockyInterval.radiusEarthMax, 1.8769908371662154, 1e-12, 'rocky interval upper');
assert.equal(rockyRadiusPremInterval({ massEarthMin: 0.9, massEarthMax: 1.1, coreMassFractionMin: 0, coreMassFractionMax: 0.4 }).status, 'UNSUPPORTED');

// Gladman 2sqrt(3) mutual-Hill screen is exact-domain gated to circular/coplanar low-mass inputs.
const hillClose = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.02 });
const hillWide = pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05 });
assert.equal(hillClose.status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.equal(hillWide.status, 'SCREENED_HILL_STABLE');
assert.ok(hillWide.deltaMutualHill > hillClose.deltaMutualHill);
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 1.05, eccentricityInner: 1e-4 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.equal(pairwiseHillScreen({ starMassSolar: 0.1, innerMassEarth: 100, outerMassEarth: 100, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: 2 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');
const hillBoundary = minimumOuterAxisForCircularHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1 });
assert.equal(hillBoundary.status, 'PRESENT');
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: hillBoundary.minimumOuterSemiMajorAxisAu * 1.000001 }).status, 'SCREENED_HILL_STABLE');
assert.equal(pairwiseHillScreen({ starMassSolar: 1, innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 1, outerSemiMajorAxisAu: hillBoundary.minimumOuterSemiMajorAxisAu * 0.999999 }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// AMD and osculating geometry diagnostics remain explicit screens, not long-horizon truth.
const amdCircular = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0, inclinationDeg: 0 }] });
near(amdCircular.amdSI, 0, 0, 'circular coplanar AMD');
const amdExcited = angularMomentumDeficit({ starMassSolar: 1, planets: [{ massEarth: 1, semiMajorAxisAu: 1, eccentricity: 0.1, inclinationDeg: 2 }] });
assert.ok(amdExcited.amdSI > 0);
assert.equal(amdExcited.amdStabilityThresholdApplied, false);
const criticalAmd = collisionCriticalAmd({ alpha: 0.8, gamma: 1 });
assert.equal(criticalAmd.status, 'PRESENT');
near(criticalAmd.criticalInnerEccentricity, 0.10435607626104001, 1e-14, 'critical AMD e1');
near(criticalAmd.criticalOuterEccentricity, 0.11651513899116794, 1e-14, 'critical AMD e2');
near(criticalAmd.relativeCriticalAmd, 0.01169465771712036, 1e-14, 'critical AMD value');
assert.ok(Math.abs(criticalAmd.rootResidual) < 1e-14);
assert.equal(collisionCriticalAmd({ alpha: 1, gamma: 1 }).status, 'UNSUPPORTED');
const amdStable = pairwiseCollisionAmdScreen({ innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 0.8, outerSemiMajorAxisAu: 1, innerEccentricity: 0.05, outerEccentricity: 0.05 });
const amdUnstable = pairwiseCollisionAmdScreen({ innerMassEarth: 1, outerMassEarth: 1, innerSemiMajorAxisAu: 0.8, outerSemiMajorAxisAu: 1, innerEccentricity: 0.2, outerEccentricity: 0.2 });
assert.equal(amdStable.status, 'AMD_COLLISION_STABLE_SCREEN');
assert.equal(amdUnstable.status, 'DYNAMICAL_ANALYSIS_REQUIRED');
assert.ok(amdStable.relativeAmd < amdUnstable.relativeAmd);
const radialSafe = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.05, outerSemiMajorAxisAu: 1.3, outerEccentricity: 0.05 });
const radialOverlap = radialOrbitOverlapScreen({ innerSemiMajorAxisAu: 1, innerEccentricity: 0.2, outerSemiMajorAxisAu: 1.1, outerEccentricity: 0.1 });
assert.equal(radialSafe.status, 'NO_CURRENT_RADIAL_OVERLAP');
assert.equal(radialOverlap.status, 'RADIAL_OVERLAP_OR_TOUCH');
assert.equal(dynamicsEscalation({ hillScreenStatus: 'SCREENED_HILL_STABLE', radialOverlapStatus: radialSafe.status, amdDiagnostic: amdCircular, collisionAmdScreenStatus: amdStable.status }).status, 'LOW_COST_SCREENS_PASSED');
assert.equal(dynamicsEscalation({ hillScreenStatus: 'SCREENED_HILL_STABLE', radialOverlapStatus: radialSafe.status, amdDiagnostic: amdCircular, collisionAmdScreenStatus: amdUnstable.status }).status, 'DYNAMICAL_ANALYSIS_REQUIRED');

// Barycentric short-horizon N-body sanity plus coarse/fine step-convergence witness.
const earthCircular = circularCoplanarPlanetState({ starMassSolar: 1, planetMassEarth: 1, semiMajorAxisAu: 1 });
assert.equal(earthCircular.status, 'PRESENT');
const nbody = shortHorizonNBodyDiagnostic({ starMassSolar: 1, planets: [earthCircular], timestepYears: 1 / 365, steps: 365 });
assert.equal(nbody.status, 'SHORT_HORIZON_NUMERICAL_DIAGNOSTIC');
assert.equal(nbody.barycentricizedInitialState, true);
assert.ok(Math.abs(nbody.relativeEnergyDrift) < 1e-8);
assert.ok(Math.abs(nbody.relativeAngularMomentumDrift) < 1e-10);
assert.ok(Math.abs(nbody.relativeLinearMomentumDrift) < 1e-10);
near(nbody.minimumPairSeparationAu, 1, 5e-4, 'one-year Earth-Sun minimum separation');
const nbodyConvergence = shortHorizonNBodyStepConvergence({ starMassSolar: 1, planets: [earthCircular], coarseTimestepYears: 1 / 180, coarseSteps: 180, refinementFactor: 2 });
assert.equal(nbodyConvergence.status, 'SHORT_HORIZON_STEP_CONVERGENCE_DIAGNOSTIC');
assert.ok(Number.isFinite(nbodyConvergence.rmsFinalPositionDifferenceAu));
assert.ok(nbodyConvergence.rmsFinalPositionDifferenceAu < 1e-2);
assert.ok(nbodyConvergence.rmsFinalVelocityDifferenceAuPerYr < 1e-1);

// Stellar contracts require exact grid metadata and respect published chemistry holes.
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', gridDomain: MIST_DOMAIN, ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.2, rotationFraction: 0 }).status, 'INTERPOLATION_CONTRACT_READY');
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', gridDomain: MIST_DOMAIN, ageLog10Years: 9, initialMassSolar: 1, feh: 0, alphaFe: 0.1, rotationFraction: 0 }).status, 'RESEARCH_REQUIRED');
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', gridDomain: MIST_DOMAIN, ageLog10Years: 9, initialMassSolar: 1, feh: 0.5, alphaFe: 0.6, rotationFraction: 0 }).status, 'UNSUPPORTED');
assert.equal(mistInterpolationContract({ releaseId: 'MIST-II-2026', gridHash: 'sha256:test', gridDomain: { ...MIST_DOMAIN, massMaxSolar: 2 }, ageLog10Years: 9, initialMassSolar: 3, feh: 0, alphaFe: 0.2, rotationFraction: 0 }).status, 'UNSUPPORTED');
const stellarSlice = interpolateVersionedStellarSlice({ releaseId: 'test-grid', gridHash: 'sha256:test', quantityId: 'synthetic-linear', quantityUnits: 'synthetic-unit', ageAxisLog10Years: [8, 10], massAxisSolar: [1, 3], values: [[10, 30], [30, 50]], ageLog10Years: 9, initialMassSolar: 2 });
assert.equal(stellarSlice.status, 'MODEL_DERIVED_INTERPOLATED_SLICE');
near(stellarSlice.value, 30, 1e-12, 'bilinear stellar slice');
assert.equal(interpolateVersionedStellarSlice({ releaseId: 'test-grid', gridHash: 'sha256:test', quantityId: 'x', ageAxisLog10Years: [8, 10], massAxisSolar: [1, 3], values: [[10, 30], [30, 50]], ageLog10Years: 9, initialMassSolar: 2 }).status, 'UNSUPPORTED');

// Multiplicity cells stay within physical q/e bounds and carry weight semantics.
const multi = multiplicityPopulationContract({ primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.5, eccentricity: 0.2, populationId: 'research-population' });
assert.equal(multi.couplingRequired, true);
assert.equal(multi.independentFactorizationAuthorized, false);
const cells = [
  { primaryMassMin: 0.5, primaryMassMax: 1.5, periodMin: 0, periodMax: 5, qMin: 0.1, qMax: 0.8, eMin: 0, eMax: 0.5, weight: 0.25 },
  { primaryMassMin: 0.5, primaryMassMax: 1.5, periodMin: 0, periodMax: 5, qMin: 0.8, qMax: 1, eMin: 0, eMax: 0.5, weight: 0.75 }
];
const cellMatch = evaluateVersionedMultiplicityCells({ populationId: 'research-population', tableHash: 'sha256:test', weightSemantics: 'RELATIVE_WEIGHT', cells, primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.5, eccentricity: 0.2 });
assert.equal(cellMatch.status, 'VERSIONED_CONDITIONAL_CELL');
near(cellMatch.weight, 0.25, 0, 'conditional multiplicity cell');
assert.equal(evaluateVersionedMultiplicityCells({ populationId: 'research-population', tableHash: 'sha256:test', weightSemantics: 'RELATIVE_WEIGHT', cells, primaryMassSolar: 1, periodLog10Days: 3, massRatio: 1, eccentricity: 0.2 }).status, 'VERSIONED_CONDITIONAL_CELL');
assert.equal(evaluateVersionedMultiplicityCells({ populationId: 'research-population', tableHash: 'sha256:test', cells, primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.5, eccentricity: 0.2 }).status, 'UNSUPPORTED');
const nonphysicalCells = [{ ...cells[0], qMax: 1.01 }];
assert.equal(evaluateVersionedMultiplicityCells({ populationId: 'research-population', tableHash: 'sha256:test', weightSemantics: 'RELATIVE_WEIGHT', cells: nonphysicalCells, primaryMassSolar: 1, periodLog10Days: 3, massRatio: 0.5, eccentricity: 0.2 }).status, 'UNSUPPORTED');

// Observability requires explicit bandpass and magnitude system.
const dm10 = bandpassDistanceModulus({ absoluteMagnitude: 5, distancePc: 10, extinctionMagnitude: 0, bandpassId: 'TEST', magnitudeSystem: 'AB' });
assert.equal(dm10.status, 'PRESENT');
near(dm10.distanceModulus, 0, 1e-12, 'distance modulus at 10 pc');
near(dm10.apparentMagnitude, 5, 1e-12, 'apparent magnitude at 10 pc');
const dm100 = bandpassDistanceModulus({ absoluteMagnitude: 5, distancePc: 100, extinctionMagnitude: 0.5, bandpassId: 'TEST', magnitudeSystem: 'VEGA' });
near(dm100.apparentMagnitude, 10.5, 1e-12, 'distance modulus plus extinction');
assert.equal(bandpassDistanceModulus({ absoluteMagnitude: 5, distancePc: 10, extinctionMagnitude: 0, bandpassId: 'TEST' }).status, 'UNSUPPORTED');
const angular = angularObservabilityGeometry({ distancePc: 10, projectedSeparationAu: 5 });
near(angular.parallaxArcsec, 0.1, 1e-12, 'parallax geometry');
near(angular.projectedAngularSeparationArcsec, 0.5, 1e-12, 'angular separation geometry');
assert.equal(angular.detectionProbabilityClaim, false);

// Earth-like ideal-gas hydrostatic scale-height reference and grey-atmosphere witness.
near(hydrostaticScaleHeight({ temperatureK: 288, molarMassKgPerMol: 0.02897, gravityMps2: 9.80665 }).scaleHeightMeters, 8428.64, 0.1, 'Earth-like scale height');
near(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: 2 / 3 }).temperatureK, 255, 1e-12, 'grey tau=2/3');
assert.equal(greyAtmosphereSurfaceTemperature({ effectiveTemperatureK: 255, infraredOpticalDepth: -1 }).status, 'UNSUPPORTED');

// Reduced climate requires parameter provenance and refuses silent insolation renormalization.
const ebmEq = zeroDimensionalEbm({ stellarFluxWm2: 1361, bondAlbedo: 0.3, ...EBM_PROVENANCE });
assert.equal(ebmEq.status, 'PRESENT');
near(ebmEq.absorbedShortwaveWm2, ebmEq.outgoingLongwaveAtSolutionWm2, 1e-12, '0D EBM equilibrium closure');
assert.equal(zeroDimensionalEbm({ stellarFluxWm2: 1361, bondAlbedo: 0.3 }).status, 'RESEARCH_REQUIRED');
const transient = transientZeroDimensionalEbmStep({ temperatureK: 280, heatCapacityJm2K: 4.2e8, stellarFluxWm2: 1361, bondAlbedo: 0.3, durationSeconds: 86400 * 365, ...EBM_PROVENANCE });
assert.equal(transient.status, 'PRESENT');
assert.ok(Math.abs(transient.energyResidualJm2) < 1e-3);
const zonal = zonalEbmStep({ temperaturesK: [270, 280, 290, 300], heatCapacitiesJm2K: [4.2e8, 4.2e8, 4.2e8, 4.2e8], insolationFactors: [0.5, 1, 1.25, 1.25], bondAlbedos: [0.3, 0.3, 0.3, 0.3], stellarFluxWm2: 1361, durationSeconds: 86400 * 30, ...EBM_PROVENANCE });
assert.equal(zonal.status, 'PRESENT');
assert.ok(Math.abs(zonal.transportResidualEnergyMeanJm2) < 1e-8);
assert.ok(Math.abs(zonal.energyResidualMeanJm2) < 1e-3);
assert.equal(zonal.silentRenormalizationPerformed, false);
assert.equal(zonalEbmStep({ temperaturesK: [280, 280], heatCapacitiesJm2K: [1e8, 1e8], insolationFactors: [1, 2], bondAlbedos: [0.3, 0.3], stellarFluxWm2: 1361, durationSeconds: 1, ...EBM_PROVENANCE }).status, 'RESEARCH_REQUIRED');
near(orbitalMeanFluxFactor({ eccentricity: 0.5 }).factor, 1 / Math.sqrt(0.75), 1e-12, 'mean flux e=0.5');
assert.ok(blackbodyEmission({ temperatureK: 300 }).fluxWm2 > blackbodyEmission({ temperatureK: 250 }).fluxWm2);

// Escape regime thresholds are provenance-bound; energy-limited geometry must satisfy R_XUV >= R_planet.
assert.equal(classifyEscapeRegime({ jeansParameter: 2, ...ESCAPE_THRESHOLDS }).regime, 'HYDRODYNAMIC_ESCAPE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 40, ...ESCAPE_THRESHOLDS }).regime, 'JEANS_LIKE_CANDIDATE');
assert.equal(classifyEscapeRegime({ jeansParameter: 10 }).status, 'RESEARCH_REQUIRED');
assert.equal(energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1 }).status, 'RESEARCH_REQUIRED');
assert.equal(energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1, absorptionRadiusEarth: 0.9, rocheCorrection: 0.9 }).status, 'UNSUPPORTED');
const escapeRate = energyLimitedEscapeApplicability({ planetMassEarth: 1, planetRadiusEarth: 1, xuvFluxWm2: 10, efficiency: 0.1, absorptionRadiusEarth: 1.1, rocheCorrection: 0.9 });
assert.equal(escapeRate.status, 'MODEL_DERIVED_RATE_CANDIDATE');
assert.ok(escapeRate.rateKgPerS > 0);
const atmosphereBudget = atmosphereMassBudgetStep({ atmosphereMassKg: 100, escapeRateKgPerS: 3, sourceRateKgPerS: 1, durationSeconds: 10 });
assert.equal(atmosphereBudget.status, 'CONSERVED');
near(atmosphereBudget.afterKg, 80, 1e-12, 'atmosphere budget');
const depleted = atmosphereMassBudgetStep({ atmosphereMassKg: 10, escapeRateKgPerS: 100, durationSeconds: 1 });
assert.equal(depleted.status, 'DEPLETION_CAPPED');
near(depleted.afterKg, 0, 0, 'depletion floor');

// Geodynamic heuristics require provenance; energy ledger remains exact bookkeeping.
const convection = convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6, ...CONVECTION_PROVENANCE });
assert.equal(convection.regime, 'STAGNANT_LID_LIKE');
assert.equal(convection.plateTectonicsTruthClaim, false);
assert.equal(convectionDiagnostic({ rayleighNumber: 1e7, nusseltNumber: 10, viscosityContrast: 1e6 }).status, 'RESEARCH_REQUIRED');
const thermal = thermalLedgerStep({ mantleEnergyJ: 1e20, radiogenicPowerW: 2e12, corePowerW: 1e12, surfaceHeatLossW: 4e12, durationSeconds: 1e6 });
assert.equal(thermal.status, 'CONSERVED');
near(thermal.residualJ, 0, 0, 'thermal ledger residual');
assert.equal(nusseltRayleighScenario({ rayleighNumber: 1e7, regime: 'MOBILE_LID_LIKE' }).exponentBeta, 0.26);
const lagged = laggedNusseltRayleighScenario({ rayleighNumberNow: 1e7, rayleighNumberPast: 2e7, lagMyr: 250, regime: 'MOBILE_LID_LIKE', contextId: 'ONEILL_2020_RESEARCH_CONTEXT', contextHash: 'sha256:oneill-context' });
assert.equal(lagged.status, 'MODEL_DERIVED_SCENARIO');
assert.notEqual(lagged.instantaneousProxy, lagged.laggedSurfaceProxy);
assert.equal(laggedNusseltRayleighScenario({ rayleighNumberNow: 1e7, rayleighNumberPast: 2e7, lagMyr: 250, regime: 'MOBILE_LID_LIKE' }).status, 'UNSUPPORTED');

// Bulk composition, EOS and sub-Neptune grids enforce actual dataset family/validity metadata.
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2 }).status, 'DEGENERATE_BULK_OBSERVABLES');
assert.equal(compositionRegimeContract({ massEarth: 5, radiusEarth: 2, hHeEnvelopeFraction: 0.02, ageGyr: 5, irradiationEarth: 100 }).status, 'SUB_NEPTUNE_SCENARIO_COORDINATE');
const eosEnvelope = { pressureMinPa: 1e9, pressureMaxPa: 50e9, temperatureMinK: 300, temperatureMaxK: 3000 };
const waterEos = waterEosApplicabilityContract({ eosId: 'Huang-et-al-2021-research', eosHash: 'sha256:test', pressurePa: 40e9, temperatureK: 1000, phaseDiagramId: 'research-phase-map', phaseBoundarySourceId: 'research-phase-source', validityEnvelope: eosEnvelope });
assert.equal(waterEos.status, 'EOS_COORDINATE_READY');
assert.equal(waterEos.phaseContext, 'PHASE_MUST_BE_RESOLVED_FROM_VERSIONED_PT_PHASE_DATA_NOT_PRESSURE_ALONE');
assert.equal(waterEos.radiusPredictionAuthorized, false);
assert.equal(waterEosApplicabilityContract({ eosId: 'x', eosHash: 'y', pressurePa: 40e9, temperatureK: 1000 }).status, 'RESEARCH_REQUIRED');
const eosInterpolation = interpolateVersionedWaterEos({ eosId: 'synthetic-eos', eosHash: 'sha256:test', phaseDiagramId: 'synthetic-phase-map', phaseBoundarySourceId: 'synthetic-phase-source', pressureAxisPa: [1e9, 3e9], temperatureAxisK: [300, 500], densityKgM3: [[1000, 1200], [1400, 1600]], pressurePa: 2e9, temperatureK: 400 });
assert.equal(eosInterpolation.status, 'MODEL_DERIVED_EOS_INTERPOLATION');
near(eosInterpolation.densityKgM3, 1300, 1e-12, 'bilinear EOS interpolation');
assert.equal(eosInterpolation.radiusPredictionAuthorized, false);
const massAxis = [1, 20], envelopeAxis = [0.0001, 0.2], irradiationAxis = [0.1, 1000], ageAxis = [0.1, 10];
const flatRadii = [];
for (const m of massAxis) for (const f of envelopeAxis) for (const irr of irradiationAxis) for (const age of ageAxis) flatRadii.push(1 + 0.01 * m + 2 * f + 0.0001 * irr - 0.01 * age);
const subNeptune = interpolateVersionedSubNeptuneGrid({ gridId: 'synthetic-linear-grid', gridHash: 'sha256:test', modelFamilyId: 'LOPEZ_FORTNEY_2014', massAxisEarth: massAxis, envelopeFractionAxis: envelopeAxis, irradiationAxisEarth: irradiationAxis, ageAxisGyr: ageAxis, radiusEarthFlat: flatRadii, massEarth: 10.5, envelopeFraction: 0.10005, irradiationEarth: 500.05, ageGyr: 5.05 });
assert.equal(subNeptune.status, 'MODEL_DERIVED_SUB_NEPTUNE_GRID_INTERPOLATION');
near(subNeptune.radiusEarth, 1 + 0.01 * 10.5 + 2 * 0.10005 + 0.0001 * 500.05 - 0.01 * 5.05, 1e-12, '4D multilinear sub-Neptune interpolation');
assert.equal(interpolateVersionedSubNeptuneGrid({ gridId: 'synthetic-linear-grid', gridHash: 'sha256:test', modelFamilyId: 'UNKNOWN_GRID', massAxisEarth: massAxis, envelopeFractionAxis: envelopeAxis, irradiationAxisEarth: irradiationAxis, ageAxisGyr: ageAxis, radiusEarthFlat: flatRadii, massEarth: 10, envelopeFraction: 0.1, irradiationEarth: 10, ageGyr: 1 }).status, 'UNSUPPORTED');

// Conservation ledger now rejects individually negative post-step reservoirs even if total mass balances.
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.75 }).status, 'CONSERVED');
assert.equal(volatileLedger({ surfaceKg: 3, atmosphereKg: 2, interiorKg: 5, deltaSurfaceKg: -1, deltaAtmosphereKg: 0.25, deltaInteriorKg: 0.5 }).status, 'NON_CONSERVING');
assert.equal(volatileLedger({ surfaceKg: 1, atmosphereKg: 2, interiorKg: 7, deltaSurfaceKg: -2, deltaInteriorKg: 2 }).status, 'UNSUPPORTED');

// Paper-specific impact scenario witness values and bounds.
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 0.5 }).lossFraction, 0.45, 1e-12, 'impact-loss x=0.5');
near(schlichtingIsothermalImpactLoss({ momentumRatioX: 1 }).lossFraction, 1, 1e-12, 'impact-loss x=1');
assert.equal(schlichtingIsothermalImpactLoss({ momentumRatioX: 1.1 }).status, 'UNSUPPORTED');

// Stream-power erosion binds parameter provenance and time units explicitly.
const incision = streamPowerIncisionScenario({ erodibilityK: 1e-6, drainageAreaM2: 1e6, slope: 0.01, areaExponentM: 0.5, slopeExponentN: 1, parameterSetId: 'synthetic-test', parameterSetHash: 'sha256:test', timeUnitId: 'yr' });
assert.equal(incision.status, 'MODEL_DERIVED_SCENARIO');
near(incision.incisionRateMPerTimeUnit, 1e-5, 1e-15, 'stream-power incision witness');
assert.equal(streamPowerIncisionScenario({ erodibilityK: 1e-6, drainageAreaM2: 1e6, slope: 0.01, areaExponentM: 0.5, slopeExponentN: 1, parameterSetId: 'x', parameterSetHash: 'y' }).status, 'UNSUPPORTED');
const elevation = upliftIncisionElevationStep({ elevationM: 1000, upliftRateMPerTimeUnit: 2e-5, incisionRateMPerTimeUnit: incision.incisionRateMPerTimeUnit, durationTimeUnits: 1000, timeUnitId: 'yr', maxAbsoluteElevationStepM: 1 });
assert.equal(elevation.status, 'MODEL_DERIVED_SCENARIO');
near(elevation.afterElevationM, 1000.01, 1e-12, 'uplift-incision step');
assert.equal(upliftIncisionElevationStep({ elevationM: 1000, upliftRateMPerTimeUnit: 1, incisionRateMPerTimeUnit: 0, durationTimeUnits: 1000, timeUnitId: 'yr', maxAbsoluteElevationStepM: 1 }).status, 'RESEARCH_REQUIRED');

console.log('V2X-15 research convergence tests: PASS');
