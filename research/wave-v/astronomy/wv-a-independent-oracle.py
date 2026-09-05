import json, math

def intpow(a,b,alpha):
    return (b**(1-alpha)-a**(1-alpha))/(1-alpha)

seg1=intpow(.08,.5,1.3)
seg2=.5**(2.3-1.3)*intpow(.5,120,2.3)
p_low=seg1/(seg1+seg2)
lo,hi,n=7.0,12.5,200000
dx=(hi-lo)/n
mass=mass_window=0.0
for i in range(n):
    x=lo+(i+.5)*dx
    y=10**(x-10.745)
    phi=math.log(10)*math.exp(-y)*(10**-2.437*y**(1-.466)+10**-3.201*y**(1-1.53))
    mw=phi*10**x*dx
    mass+=mw
    if 9.6<=x<=11.6:
        mass_window+=mw
print(json.dumps({
    'kroupa_number_fraction_below_0_5':p_low,
    'gama_shape_stellar_mass_fraction_9_6_11_6':mass_window/mass,
    'notes':'shape-only reference; not absolute density'
},indent=2))
