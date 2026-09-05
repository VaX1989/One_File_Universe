from decimal import Decimal, getcontext
from fractions import Fraction
import hashlib, math, json
getcontext().prec=80
PI=Fraction(355,113)
SIGMA=Fraction(5670374419,100000000000000000)
PPM=1000000
CONTRACT='ofu-wave-v-planetology-frontier-research-v1'

def round_half_even_frac(x):
    n,d=x.numerator,x.denominator
    q,r=divmod(abs(n),d)
    if 2*r>d or (2*r==d and q%2==1): q+=1
    return -q if n<0 else q

def teq_mk(insolation_ppm,albedo_ppm):
    x=Fraction(1361*insolation_ppm*(PPM-albedo_ppm)*1000**4,4*PPM*PPM)/SIGMA
    n,d=x.numerator,x.denominator
    q=int((Decimal(n)/Decimal(d)).sqrt().sqrt())
    while (q+1)**4*d<=n:q+=1
    while q**4*d>n:q-=1
    mid=2*q+1
    if 16*n>mid**4*d or (16*n==mid**4*d and q%2==1):q+=1
    return q

def pressure_pa(atm_tg,g_micro,r):
    return round_half_even_frac(Fraction(atm_tg*10**9*g_micro,10**6)*Fraction(113,4*355*r*r))

def escape_kg(f_milli,r,m,t,eta_ppm=150000):
    G=Fraction(667430,10**16)
    return round_half_even_frac(Fraction(eta_ppm,PPM)*PI*r**3*Fraction(f_milli,1000)*t/(G*m))

def hash64(s):return int.from_bytes(hashlib.sha256(s.encode()).digest()[:8],'big')
def signed(seed):return seed%2000000001-1000000000

def geo(planet,level,x,y,budget,parent_relief=0):
    idx=(y%2)*2+(x%2);base,rem=divmod(budget,4);share=base+(1 if idx<rem else 0)
    h1=hash64(f'{CONTRACT}|{planet}|{level}|{x}|{y}|relief')
    h2=hash64(f'{CONTRACT}|{planet}|{level}|{x}|{y}|basin')
    scale=max(1,1000000000//(level+1))
    return share,parent_relief+math.trunc(signed(h1)*scale/1000000000),signed(h2)

def climate(albedo):
    lats=[-60,-20,20,60];T=[260.,280.,280.,260.];flux=[260.,390.,390.,260.]
    weights=[math.cos(math.radians(x)) for x in lats];ws=sum(weights);last=[0.]*4
    for _ in range(3650):
        mean=sum(t*w for t,w in zip(T,weights))/ws;nxt=[]
        for i,t in enumerate(T):
            net=(1-albedo)*flux[i]-(-330+2.0*t)+0.8*(mean-t);last[i]=net;nxt.append(t+net*86400/2.1e8)
        T=nxt
    return sum(t*w for t,w in zip(T,weights))/ws,T,sum(n*w for n,w in zip(last,weights))/ws

assert teq_mk(1000000,300000)==254578
assert pressure_pa(5148000000,9806650,6371000)==98977
assert escape_kg(1000,6371000,5972200000000000000000000,31557600000000)==9647790941222716304
assert sum([100,1080,380,220,20])==1800
assert sum(geo('fixture-planet',1,i%2,i//2,1001)[0] for i in range(4))==1001
share,relief,basin=geo('fixture-planet',2,2,1,577,250000000)
assert (share,relief,basin)==(144,358903927,983213083)
mid,T,closure=climate(.30);low=climate(.34)[0];high=climate(.26)[0]
assert abs(mid-285.0714407480152)<1e-12 and abs(closure-1.254182181354795)<1e-12 and low<mid<high
print(json.dumps({'oracle':'PASS','teqMilliK':teq_mk(1000000,300000),'pressurePa':pressure_pa(5148000000,9806650,6371000),'escapeUpperBoundKg':escape_kg(1000,6371000,5972200000000000000000000,31557600000000),'geography':[share,relief,basin],'climateMeanK':mid,'closureWm2':closure,'sensitivityK':[low,high]},indent=2))
