#!/usr/bin/env python3
import json
from fractions import Fraction
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GOLDEN=ROOT/'tests'/'p5-environment-next-science'/'golden-frontier-v3.json'
MOLAR={'H2O':18_015_300,'N2':28_013_400}

def rhe(n,d):
    if d<=0: raise ValueError('denominator')
    q,r=divmod(n,d)
    if 2*r>d or (2*r==d and q&1): q+=1
    return q

def pressure(atm_tg,g_micro,r_m):
    return rhe(atm_tg*1_000_000_000*g_micro*113,4*355*r_m*r_m*1_000_000)

def mean_molar(masses):
    total=sum(masses.values())
    if total==0: return None
    amount=sum((Fraction(m,MOLAR[s]) for s,m in masses.items()),Fraction(0,1))
    x=Fraction(total,1)/amount
    return rhe(x.numerator,x.denominator)

def move(state,species,src,dst,mass):
    if src=='lostTg': raise ValueError('lost terminal')
    if mass<=0 or state[species][src]<mass: raise ValueError('invalid mass')
    before=sum(state[species].values())
    out={s:dict(v) for s,v in state.items()}
    out[species][src]-=mass;out[species][dst]+=mass
    if sum(out[species].values())!=before: raise AssertionError('non-conservation')
    return out

def main():
    g=json.loads(GOLDEN.read_text())
    grav=int(g['initial']['gravityMicroMs2']);radius=int(g['initial']['meanRadiusM'])
    state={'H2O':{'atmosphereTg':1_000_000,'condensedSurfaceTg':0,'subsurfaceInteriorTg':0,'lostTg':0},'N2':{'atmosphereTg':9_000_000,'condensedSurfaceTg':0,'subsurfaceInteriorTg':0,'lostTg':0}}
    masses={s:v['atmosphereTg'] for s,v in state.items()}
    assert pressure(sum(masses.values()),grav,radius)==int(g['initial']['pressurePa'])
    assert mean_molar(masses)==int(g['initial']['meanMolarMassNanoKgPerMol'])
    state=move(state,'H2O','atmosphereTg','condensedSurfaceTg',int(g['condensation']['massTg']))
    masses={s:v['atmosphereTg'] for s,v in state.items()}
    assert pressure(sum(masses.values()),grav,radius)==int(g['condensation']['postPressurePa'])
    assert mean_molar(masses)==int(g['condensation']['postMeanMolarMassNanoKgPerMol'])
    state=move(state,'H2O','atmosphereTg','lostTg',int(g['lossAfterCondensation']['massTg']))
    masses={s:v['atmosphereTg'] for s,v in state.items()}
    assert pressure(sum(masses.values()),grav,radius)==int(g['lossAfterCondensation']['postPressurePa'])
    assert mean_molar(masses)==int(g['lossAfterCondensation']['postMeanMolarMassNanoKgPerMol'])
    assert g['boundedness']['maxTransferStepsPerQuery']==4096 and g['boundedness']['retainedHistoryEntries']==0
    print('P5 environment frontier v3 independent oracle: PASS')
if __name__=='__main__': main()
