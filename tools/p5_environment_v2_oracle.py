#!/usr/bin/env python3
from decimal import Decimal, getcontext
from fractions import Fraction
import json, pathlib, sys

getcontext().prec = 80
U64_MAX=(1<<64)-1
EARTH_MASS_KG=5972200000000000000000000
KG_PER_TG=1000000000
PI_NUM,PI_DEN=355,113
S0=1361
SIGMA=Decimal('5.670374419e-8')
P3_INSOLATION_MAX=1000000000000
PPM=1000000


def fail(msg):
    raise AssertionError(msg)

def half_even_fraction(n,d):
    if d<=0: fail('positive denominator required')
    neg=n<0
    if neg:n=-n
    q,r=divmod(n,d)
    t=2*r
    if t>d or (t==d and (q&1)):
        q+=1
    return -q if neg else q

def fourth_root_round_fraction(n,d):
    if n<0 or d<=0: fail('invalid fourth-root fraction')
    if n==0:return 0
    q=0
    hi=1
    while hi**4*d<=n:
        q=hi
        hi*=2
    lo=q
    while lo+1<hi:
        m=(lo+hi)//2
        if m**4*d<=n:lo=m
        else:hi=m
    q=lo
    left=16*n
    right=d*(2*q+1)**4
    if left>right or (left==right and (q&1)):
        q+=1
    return q

def planet_mass_tg(milli_earth):
    return half_even_fraction(EARTH_MASS_KG*milli_earth,1000*KG_PER_TG)

def pressure_pa(atm_tg,g_micro,r_m):
    if atm_tg<0:fail('negative atmosphere')
    n=atm_tg*KG_PER_TG*g_micro*PI_DEN
    d=4*PI_NUM*r_m*r_m*1000000
    q=half_even_fraction(n,d)
    if q<0 or q>U64_MAX:fail('pressure overflow')
    return q

def teff_millik(insolation_ppm,albedo_ppm):
    if not 0<=insolation_ppm<=P3_INSOLATION_MAX:fail('insolation domain')
    if not 0<=albedo_ppm<=PPM:fail('albedo domain')
    if insolation_ppm==0 or albedo_ppm==PPM:return 0
    # Independent high precision physical calculation; round to nearest mK ties-to-even.
    flux=Decimal(S0)*Decimal(insolation_ppm)/Decimal(PPM)
    absorbed=flux*(Decimal(PPM-albedo_ppm)/Decimal(PPM))
    t=(absorbed/(Decimal(4)*SIGMA))**(Decimal(1)/Decimal(4))
    return int((t*Decimal(1000)).to_integral_value(rounding='ROUND_HALF_EVEN'))

def exact_teff_millik(insolation_ppm,albedo_ppm):
    if insolation_ppm==0 or albedo_ppm==PPM:return 0
    n=S0*insolation_ppm*(PPM-albedo_ppm)*10**17*1000**4
    d=4*PPM*PPM*5670374419
    return fourth_root_round_fraction(n,d)

def main():
    corpus_path=pathlib.Path('tests/vectors/golden-p5-environment-v2-corpus.json')
    corpus=json.loads(corpus_path.read_text())
    p=corpus['canonicalPlanet']
    assert planet_mass_tg(int(p['baselineMassMilliEarth']))==int(p['baselinePlanetMassTg'])
    for case in corpus['pressureCases']:
        assert pressure_pa(int(case['atmosphericMassTg']),int(p['surfaceGravityMicroMs2']),int(p['meanRadiusM']))==int(case['pressurePa'])
    for case in corpus['radiativeCases']:
        ins=int(case['insolationPpm']);alb=int(case['bondAlbedoPpm']);expected=int(case['effectiveTemperatureMilliK'])
        independent=teff_millik(ins,alb)
        exact=exact_teff_millik(ins,alb)
        assert independent==expected,(case['name'],independent,expected)
        assert exact==expected,(case['name'],exact,expected)
    assert teff_millik(1_000_000,300_000)==254_578
    assert 254_000<=teff_millik(1_000_000,300_000)<=255_000
    assert teff_millik(0,300_000)==0
    assert teff_millik(1_000_000,1_000_000)==0
    assert teff_millik(2_000_000,300_000)>=teff_millik(1_000_000,300_000)
    assert teff_millik(1_000_000,600_000)<=teff_millik(1_000_000,300_000)
    assert pressure_pa(0,int(p['surfaceGravityMicroMs2']),int(p['meanRadiusM']))==0
    print(json.dumps({'status':'PASS','oracle':'p5-environment-v2-python-independent','earthAnchorMilliK':254578,'pressureCases':len(corpus['pressureCases']),'radiativeCases':len(corpus['radiativeCases'])},sort_keys=True))

if __name__=='__main__':main()
