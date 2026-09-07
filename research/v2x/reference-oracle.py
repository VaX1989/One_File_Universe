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


def minimum_outer_axis_hill(star_mass_solar: float, m1_earth: float, m2_earth: float, a1_au: float) -> float:
    mu_third = ((((m1_earth + m2_earth) * M_EARTH) / (star_mass_solar * M_SUN)) / 3.0) ** (1.0 / 3.0)
    k = math.sqrt(3.0) * mu_third
    if k >= 1.0:
        raise ValueError("low-mass Hill approximation breakdown")
    return a1_au * (1.0 + k) / (1.0 - k)


def collision_critical_amd(alpha: float, gamma: float, iterations: int = 160) -> tuple[float, float, float, float]:
    if not (0.0 < alpha < 1.0 and gamma > 0.0):
        raise ValueError("invalid alpha/gamma")

    def f(e1: float) -> float:
        return alpha * e1 + gamma * e1 / math.sqrt(alpha * (1.0 - e1 * e1) + gamma * gamma * e1 * e1) - 1.0 + alpha

    lo = 0.0
    hi = math.nextafter(1.0, 0.0)
    if f(lo) > 0.0 or f(hi) < 0.0:
        raise ValueError("root not bracketed")
    for _ in range(iterations):
        mid = (lo + hi) / 2.0
        if f(mid) > 0.0:
            hi = mid
        else:
            lo = mid
    e1c = (lo + hi) / 2.0
    e2c = 1.0 - alpha - alpha * e1c
    cc = gamma * math.sqrt(alpha) * (1.0 - math.sqrt(1.0 - e1c * e1c)) + (1.0 - math.sqrt(1.0 - e2c * e2c))
    return e1c, e2c, cc, f(e1c)


def pair_relative_amd(alpha: float, gamma: float, e1: float, e2: float) -> float:
    return gamma * math.sqrt(alpha) * (1.0 - math.sqrt(1.0 - e1 * e1)) + (1.0 - math.sqrt(1.0 - e2 * e2))


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
    e1c_08, e2c_08, cc_08, residual_08 = collision_critical_amd(0.8, 1.0)
    out = {
        "rocky_1_cmf033_rearth": rocky_radius_prem(1.0, 0.33),
        "rocky_8_cmf033_rearth": rocky_radius_prem(8.0, 0.33),
        "rocky_8_cmf0_rearth": rocky_radius_prem(8.0, 0.0),
        "hill_1_102": hill_delta(1.0, 1.0, 1.0, 1.0, 1.02),
        "hill_1_105": hill_delta(1.0, 1.0, 1.0, 1.0, 1.05),
        "hill_min_outer_earth_pair_1au": minimum_outer_axis_hill(1.0, 1.0, 1.0, 1.0),
        "critical_amd_alpha08_gamma1_e1": e1c_08,
        "critical_amd_alpha08_gamma1_e2": e2c_08,
        "critical_amd_alpha08_gamma1_relative": cc_08,
        "critical_amd_alpha08_gamma1_root_residual": residual_08,
        "pair_amd_alpha08_gamma1_e005_e005": pair_relative_amd(0.8, 1.0, 0.05, 0.05),
        "pair_amd_alpha08_gamma1_e02_e02": pair_relative_amd(0.8, 1.0, 0.2, 0.2),
        "earth_scale_height_m": scale_height(288.0, 0.02897, 9.80665),
        "grey_255_tau_2_3_k": grey_temperature(255.0, 2.0 / 3.0),
        "impact_loss_x_05": impact_loss(0.5),
        "mean_flux_factor_e_05": orbital_mean_flux_factor(0.5),
        "energy_limited_example_kg_s": energy_limited_rate(1.0, 1.1, 10.0, 0.1, 0.9),
        "hill_threshold_2sqrt3": 2.0 * math.sqrt(3.0),
    }
    print(json.dumps(out, sort_keys=True, indent=2))
