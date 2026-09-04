#!/usr/bin/env python3
"""Independent Wave IV P5 oracle. Does not import the JavaScript implementation."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GOLDEN=json.loads((ROOT/'tests/p5-environment-next-science/golden-frontier-v4.json').read_text())

def thermal_offset(e_lo,e_hi,s_lo,s_hi):
    if not (0 <= e_lo <= e_hi <= 10_000_000 and 0 <= s_lo <= s_hi <= 10_000_000):
        raise ValueError('invalid bounded temperature interval')
    return s_lo-e_hi,s_hi-e_lo

def water_phase(t_mk,condensed_tg,saturation_regime,composition_complete=True):
    if not composition_complete:
        return 'UNKNOWN'
    if t_mk < 273_160:
        return 'UNKNOWN'
    if t_mk > 647_096:
        return 'NO_ORDINARY_LIQUID_VAPOR_BOUNDARY'
    if condensed_tg == 0:
        return 'NOT_ESTABLISHED'
    if saturation_regime in {'SUPERSATURATED_CONDENSATION_FAVORED','BOUNDARY_ROUNDING_SENSITIVE'}:
        return 'LIQUID_WATER_THERMODYNAMICALLY_PERMITTED_GLOBAL_IDEALIZED'
    if saturation_regime == 'SUBSATURATED_VAPOR':
        return 'GLOBAL_MEAN_LIQUID_PERSISTENCE_NOT_SUPPORTED'
    return 'UNKNOWN'

def research_readiness(required_flags,post_genesis_authority):
    research=all(required_flags) and post_genesis_authority in {'EXTERNAL_POST_GENESIS_SEED','RESEARCH_FIXTURE_ONLY'}
    return research,False

lo,hi=thermal_offset(250_000,250_000,288_000,290_000)
phase=water_phase(288_000,1000,'SUPERSATURATED_CONDENSATION_FAVORED')
research,canonical=research_readiness([True]*7,'RESEARCH_FIXTURE_ONLY')
actual={
    'contractId':'ofu-p5-environment-next-frontier-research-v4',
    'thermalOffsetLowerMilliK':str(lo),
    'thermalOffsetUpperMilliK':str(hi),
    'waterPhasePlausibility':phase,
    'waterViableBiologicalMediumEstablished':False,
    'researchPostGenesisEligible':research,
    'canonicalPositivePath':canonical,
    'escapeRate':None,
    'researchMode':'RESEARCH_ONLY'
}
assert actual==GOLDEN,(actual,GOLDEN)
assert research_readiness([True,True,False,True,True,True,True],'RESEARCH_FIXTURE_ONLY')==(False,False)
assert water_phase(288_000,1000,'SUBSATURATED_VAPOR')=='GLOBAL_MEAN_LIQUID_PERSISTENCE_NOT_SUPPORTED'
print('P5 Wave IV independent oracle PASS',json.dumps(actual,sort_keys=True))
