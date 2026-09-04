#!/usr/bin/env python3
from decimal import Decimal, getcontext, ROUND_HALF_EVEN
from fractions import Fraction
import json, pathlib, sys
getcontext().prec=60
PI_NUM,PI_DEN=355,113
N={1:Decimal('1167.0521452767'),2:Decimal('-724213.16703206'),3:Decimal('-17.073846940092'),4:Decimal('12020.82470247'),5:Decimal('-3232555.0322333'),6:Decimal('14.91510861353'),7:Decimal('-4823.2657361591'),8:Decimal('405113.40542057'),9:Decimal('-0.23855557567849'),10:Decimal('650.17534844798')}
def half_even_fraction(x: Fraction)->int:
 q,r=divmod(abs(x.numerator),x.denominator); twice=2*r
 if twice>x.denominator or (twice==x.denominator and q%2): q+=1
 return -q if x.numerator<0 else q
def pressure_pa(g_micro:int,r_m:int,m_tg:int)->int:
 return half_even_fraction(Fraction(m_tg*10**9*g_micro*PI_DEN,4*PI_NUM*r_m*r_m*10**6))
def saturation_pa(temp_mk:int)->int:
 T=Decimal(temp_mk)/Decimal(1000)
 th=T+N[9]/(T-N[10]); A=th*th+N[1]*th+N[2]; B=N[3]*th*th+N[4]*th+N[5]; C=N[6]*th*th+N[7]*th+N[8]
 beta=2*C/(-B+(B*B-4*A*C).sqrt()); p=beta**4*Decimal(1000000)
 return int(p.quantize(Decimal('1'),rounding=ROUND_HALF_EVEN))
def gas_vector(masses,molar,total_p):
 amounts=[Fraction(m,molar[i]) for i,m in enumerate(masses)]; total=sum(amounts,Fraction(0,1))
 return [(half_even_fraction(a/total*1000000),half_even_fraction(a/total*total_p)) for a in amounts]
def main(path):
 data=json.loads(pathlib.Path(path).read_text())
 for v in data['pressureVectors']:
  got=pressure_pa(int(v['gravityMicroMs2']),int(v['meanRadiusM']),int(v['atmosphericMassTg'])); assert got==int(v['expectedPressurePa']),(v,got)
 for v in data['saturationVectors']:
  got=saturation_pa(int(v['temperatureMilliK'])); assert got==int(v['expectedSaturationPressurePa']),(v,got)
 g=data['gasVector']; p=pressure_pa(int(g['gravityMicroMs2']),int(g['meanRadiusM']),sum(int(x['atmosphereTg']) for x in g['species'])); vals=gas_vector([int(x['atmosphereTg']) for x in g['species']],[int(x['molarMassNanoKgPerMol']) for x in g['species']],p)
 assert p==int(g['expectedTotalPressurePa'])
 for row,(ppm,pp) in zip(g['species'],vals): assert ppm==int(row['expectedMoleFractionPpm']) and pp==int(row['expectedPartialPressurePa'])
 print('P5 environment-next independent Python oracle: PASS')
if __name__=='__main__': main(sys.argv[1])
