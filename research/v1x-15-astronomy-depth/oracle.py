#!/usr/bin/env python3
import json
Q16=65536

def clamp(x,lo,hi): return lo if x<lo else hi if x>hi else x

def morphology(mass,density):
    mass=clamp(int(mass),7000,12000); density=clamp(int(density),0,65535)
    mass_term=((mass-7000)*30000)//5000
    density_term=(density*18000)//65535
    sph=clamp(5000+mass_term+density_term,2000,50000)
    irr=clamp(18000-mass_term//3-density_term//4,500,18000)
    return {'SPHEROID':sph,'DISK':Q16-sph-irr,'IRREGULAR':irr}

def observability(lum_milli,d_mpc,crowding=0,reference=1000):
    flux=(int(lum_milli)*100_000_000_000)//(int(d_mpc)*int(d_mpc))
    flux_score=0 if flux==0 else (flux*Q16)//(flux+int(reference))
    transmission=Q16-(int(crowding)*3)//4
    return {
      'relativeFluxAt10pcPpm': flux,
      'parallaxMicroArcsec': 1_000_000_000//int(d_mpc),
      'detectabilityScoreQ16': (flux_score*transmission)//Q16
    }

cases=[]
for m,d in [(7000,0),(8500,12000),(10000,32768),(11000,50000),(12000,65535)]:
    cases.append({'kind':'morphology','input':{'massLog10MilliDex':m,'environmentDensityQ16':d},'expected':morphology(m,d)})
for lum,dist,crowd in [(1000,10000,0),(1000,100000,0),(1000,100000,32768),(60000,1000000,10000)]:
    cases.append({'kind':'observability','input':{'luminosityMilliSolar':lum,'distanceMilliPc':dist,'crowdingQ16':crowd},'expected':observability(lum,dist,crowd)})
print(json.dumps({'schema':'rd15-oracle-fixture-1','cases':cases},indent=2,sort_keys=True))
