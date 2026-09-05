#!/usr/bin/env python3
"""Independent arithmetic oracle for WV-C research fixtures. No repository imports."""

PPM = 1_000_000

def mul_ppm_floor(value: int, factor: int) -> int:
    assert value >= 0 and 0 <= factor <= PPM
    return value * factor // PPM

def energy_oracle():
    sources = [
        (1000, 1200, 200_000, 300_000),
        (500, 700, 100_000, 200_000),
    ]
    captured_lo = sum(mul_ppm_floor(lo, eff_lo) for lo, hi, eff_lo, eff_hi in sources)
    captured_hi = sum(mul_ppm_floor(hi, eff_hi) for lo, hi, eff_lo, eff_hi in sources)
    maintenance = (mul_ppm_floor(captured_lo, 100_000), mul_ppm_floor(captured_hi, 200_000))
    allocatable = (mul_ppm_floor(captured_lo, 800_000), mul_ppm_floor(captured_hi, 900_000))
    assert (captured_lo, captured_hi) == (250, 500)
    assert maintenance == (25, 100)
    assert allocatable == (200, 450)
    return captured_lo, captured_hi, maintenance, allocatable

def stage_oracle():
    juvenile = 100
    adult = 50
    juvenile_deaths = mul_ppm_floor(juvenile, 100_000)
    juvenile_to_adult = mul_ppm_floor(juvenile, 400_000)
    adult_deaths = mul_ppm_floor(adult, 100_000)
    births = 20
    juvenile_after = juvenile - juvenile_deaths - juvenile_to_adult + births
    adult_after = adult - adult_deaths + juvenile_to_adult
    assert (juvenile_after, adult_after) == (70, 85)
    assert juvenile_after + adult_after == juvenile + adult - juvenile_deaths - adult_deaths + births == 155
    return juvenile_after, adult_after

if __name__ == '__main__':
    energy_oracle()
    stage_oracle()
    print('WV-C independent oracle: PASS')
