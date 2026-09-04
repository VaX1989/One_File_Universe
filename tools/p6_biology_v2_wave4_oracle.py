#!/usr/bin/env python3
"""Independent arithmetic oracle for the P6 Wave IV research frontier."""
import json
from decimal import Decimal, ROUND_HALF_EVEN
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GOLDEN=json.loads((ROOT/'tests/p6/golden-biology-v2-wave4.json').read_text())
PPM=1_000_000

def mul_ppm(v,p): return int((Decimal(v)*Decimal(p)/Decimal(PPM)).quantize(Decimal('1'),rounding=ROUND_HALF_EVEN))
def energy():
    primary_lo=mul_ppm(1000,200000)+mul_ppm(1000,100000)
    primary_hi=mul_ppm(1000,300000)+mul_ppm(1000,200000)
    maint_lo=mul_ppm(primary_lo,100000); maint_hi=mul_ppm(primary_hi,300000)
    alloc_lo=mul_ppm(primary_lo,PPM-300000); alloc_hi=mul_ppm(primary_hi,PPM-100000)
    return primary_lo,primary_hi,alloc_lo,alloc_hi,mul_ppm(alloc_lo,100000),mul_ppm(alloc_hi,200000)
def trait():
    responses=[mul_ppm(s,h) for s in (50000,100000) for h in (200000,300000)]
    return min(responses),max(responses),500000+min(responses),500000+max(responses)
def pop(before,births,deaths,immigration,emigration):
    available=before+births+immigration; losses=deaths+emigration
    if losses>available: raise ValueError('population loss exceeds available')
    return available-losses
p0,p1,a0,a1,t0,t1=energy();r0,r1,x0,x1=trait()
actual={'contractId':'ofu-p6-biology-v2-frontier-research-wave4','primaryLowerU':str(p0),'primaryUpperU':str(p1),'allocatableLowerU':str(a0),'allocatableUpperU':str(a1),'trophic1LowerU':str(t0),'trophic1UpperU':str(t1),'traitResponseLowerPpm':str(r0),'traitResponseUpperPpm':str(r1),'projectedTraitLowerPpm':str(x0),'projectedTraitUpperPpm':str(x1),'speciationWithoutCriterion':False,'speciationWithCriterion':True,'populationAfterU':str(pop(1000,100,50,10,30)),'canonicalGenesis':False,'privateP6HistoryEntries':0}
assert actual==GOLDEN,(actual,GOLDEN)
try: pop(1,0,2,0,0); raise AssertionError('underflow not rejected')
except ValueError: pass
print('P6 Wave IV independent oracle PASS',json.dumps(actual,sort_keys=True))
