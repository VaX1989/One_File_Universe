#!/usr/bin/env python3
"""Independent numerical witnesses for V2X-15 research kernels.

This file intentionally does not import or execute the JavaScript implementation.
It is RESEARCH_ONLY and exists to provide cross-language reference values.
"""
from __future__ import annotations

import json
import math

G = 6.67430e-11
M_EARTH = 5.9722e24
M_SUN = 1.98847e30
R_EARTH = 6_371_000.0
R_GAS = 8.31446261815324


def rocky_radius_prem(mass_earth: float, cmf: float) -> float:
    if not (1.0 <= mass_earth <= 8.0 and 0.0 <= cmf <= 0.4):
        raise ValueError("outside source-backed rocky domain")
    return (1.07 - 0.21 * cmf) * mass_earth ** (1.0 / 3.7)


def hill_delta(star_mass_solar: float, m1_earth: float, m2_earth: float, a1_au: float, a2_au: float) -> float:
    ratio = ((m1_earth + m2_earth) * M_EARTH) / (star_mass_solar * M_SUN)
    rh = ((a1_au + a2_au) / 2.0) * (ratio / 3.0) ** (1.0 / 3.0)
    return (a2_au - a1_au) / rh


def scale_height(t_kelvin: float, molar_mass: float, gravity: float) -> float:
    return R_GAS * t_kelvin / (molar_mass * gravity)


def grey_temperature(teff: float, tau: float) -> float:
    return teff * ((3.0 / 4.0) * (tau + 2.0 / 3.0)) ** 0.25


def impact_loss(x: float) -> float:
    if not 0.0 <= x <= 1.0:
        raise ValueError("outside scenario domain")
    return max(0.0, min(1.0, 0.4 * x + 1.4 * x * x - 0.8 * x * x * x))


def orbital_mean_flux_factor(e: float) -> float:
    if not 0.0 <= e < 1.0:
        raise ValueError("invalid eccentricity")
    return 1.0 / math.sqrt(1.0 - e * e)


def energy_limited_rate(mass_earth: float, rxuv_earth: float, xuv_flux: float, efficiency: float, roche_k: float) -> float:
    return efficiency * math.pi * (rxuv_earth * R_EARTH) ** 3 * xuv_flux / (G * mass_earth * M_EARTH * roche_k)


if __name__ == "__main__":
    out = {
        "rocky_1_cmf033_rearth": rocky_radius_prem(1.0, 0.33),
        "rocky_8_cmf033_rearth": rocky_radius_prem(8.0, 0.33),
        "hill_1_102": hill_delta(1.0, 1.0, 1.0, 1.0, 1.02),
        "hill_1_105": hill_delta(1.0, 1.0, 1.0, 1.0, 1.05),
        "earth_scale_height_m": scale_height(288.0, 0.02897, 9.80665),
        "grey_255_tau_2_3_k": grey_temperature(255.0, 2.0 / 3.0),
        "impact_loss_x_05": impact_loss(0.5),
        "mean_flux_factor_e_05": orbital_mean_flux_factor(0.5),
        "energy_limited_example_kg_s": energy_limited_rate(1.0, 1.1, 10.0, 0.1, 0.9),
        "hill_threshold_2sqrt3": 2.0 * math.sqrt(3.0),
    }
    print(json.dumps(out, sort_keys=True, indent=2))
