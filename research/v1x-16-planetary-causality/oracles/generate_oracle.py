#!/usr/bin/env python3
"""Independent floating/high-precision oracle for R&D-16 reduced models.

This is deliberately not an implementation dependency. It supplies comparison
fixtures for a subset of formulas so JS fixed-point errors are visible.
"""
from __future__ import annotations
from decimal import Decimal, getcontext, ROUND_HALF_EVEN
import json
from pathlib import Path

getcontext().prec = 90

EARTH_MASS_KG = 5_972_200_000_000_000_000_000_000
G = Decimal('6.67430e-11')
PI = Decimal(355) / Decimal(113)
SECONDS_PER_KYR = Decimal('31557600000')
KG_PER_TG = Decimal('1e9')

def round_even_decimal(v: Decimal) -> int:
    return int(v.quantize(Decimal(1), rounding=ROUND_HALF_EVEN))

def rocky_radius(mass_milli_earth: int, core_permille: int) -> int:
    m = Decimal(mass_milli_earth) / Decimal(1000)
    exponent = Decimal(10) / Decimal(37)
    factor = Decimal('1.07') - Decimal('0.00021') * Decimal(core_permille)
    radius = Decimal(6_371_000) * (m ** exponent) * factor
    return round_even_decimal(radius)

def grey_temperature(teff_mk: int, tau_ppm: int) -> int:
    tau = Decimal(tau_ppm) / Decimal(1_000_000)
    factor = (Decimal(3) / Decimal(4)) * (tau + Decimal(2) / Decimal(3))
    return round_even_decimal(Decimal(teff_mk) * (factor ** (Decimal(1) / Decimal(4))))

def energy_limited_escape_tg(case: dict) -> int:
    eta = Decimal(case['efficiencyPpm']) / Decimal(1_000_000)
    flux = Decimal(case['xuvFluxMilliWm2']) / Decimal(1000)
    radius = Decimal(case['xuvRadiusM'])
    mass = Decimal(EARTH_MASS_KG) * Decimal(case['massMilliEarth']) / Decimal(1000)
    roche = Decimal(case['rocheFactorPpm']) / Decimal(1_000_000)
    dt = Decimal(case['dtKyr']) * SECONDS_PER_KYR
    kg = eta * PI * flux * radius**3 * dt / (G * mass * roche)
    return round_even_decimal(kg / KG_PER_TG)

rocky_cases = [
    dict(massMilliEarth=500, corePermille=200),
    dict(massMilliEarth=1000, corePermille=320),
    dict(massMilliEarth=2000, corePermille=300),
    dict(massMilliEarth=5000, corePermille=350),
    dict(massMilliEarth=8000, corePermille=400),
]
for c in rocky_cases:
    c['radiusM'] = rocky_radius(c['massMilliEarth'], c['corePermille'])

grey_cases = [
    dict(effectiveTemperatureMilliK=254578, opticalDepthPpm=0),
    dict(effectiveTemperatureMilliK=254578, opticalDepthPpm=666667),
    dict(effectiveTemperatureMilliK=254578, opticalDepthPpm=1_000_000),
    dict(effectiveTemperatureMilliK=254578, opticalDepthPpm=4_000_000),
    dict(effectiveTemperatureMilliK=180000, opticalDepthPpm=10_000_000),
]
for c in grey_cases:
    c['temperatureMilliK'] = grey_temperature(c['effectiveTemperatureMilliK'], c['opticalDepthPpm'])

escape_cases = [
    dict(efficiencyPpm=150000, xuvFluxMilliWm2=4640, xuvRadiusM=6_371_000, massMilliEarth=1000, rocheFactorPpm=1_000_000, dtKyr=1),
    dict(efficiencyPpm=100000, xuvFluxMilliWm2=500_000, xuvRadiusM=8_000_000, massMilliEarth=2000, rocheFactorPpm=900000, dtKyr=10),
    dict(efficiencyPpm=300000, xuvFluxMilliWm2=10_000_000, xuvRadiusM=10_000_000, massMilliEarth=5000, rocheFactorPpm=500000, dtKyr=100),
]
for c in escape_cases:
    c['escapeTg'] = energy_limited_escape_tg(c)

fixture = {
    'schema': 'ofu-rd16-independent-oracle-1',
    'numericAuthority': 'NON_CANONICAL_TEST_ORACLE',
    'method': 'Python Decimal(90 digits); no production-code import',
    'rockyCases': rocky_cases,
    'greyCases': grey_cases,
    'escapeCases': escape_cases,
}
out = Path(__file__).resolve().parents[1] / 'fixtures' / 'oracle-cases.json'
out.write_text(json.dumps(fixture, indent=2) + '\n', encoding='utf-8')
print(out)
