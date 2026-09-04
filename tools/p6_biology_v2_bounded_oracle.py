#!/usr/bin/env python3
import hashlib,json
T={'NULL':0,'FALSE':1,'TRUE':2,'SINT':16,'UINT':17,'BYTES':32,'TEXT':33,'ARRAY':48,'MAP':49};PPM=1_000_000;U64=(1<<64)-1

def uleb(x):
    if x<0 or x>U64: raise ValueError('u64')
    out=bytearray()
    while True:
        b=x&127;x>>=7
        if x:b|=128
        out.append(b)
        if not x:return bytes(out)
def enc(v):
    if v is None:return bytes([T['NULL']])
    if v is False:return bytes([T['FALSE']])
    if v is True:return bytes([T['TRUE']])
    if isinstance(v,int):return bytes([T['UINT']])+uleb(v) if v>=0 else bytes([T['SINT']])+uleb((-v*2)-1)
    if isinstance(v,bytes):return bytes([T['BYTES']])+uleb(len(v))+v
    if isinstance(v,str):
        b=v.encode('utf-8');return bytes([T['TEXT']])+uleb(len(b))+b
    if isinstance(v,(list,tuple)):return bytes([T['ARRAY']])+uleb(len(v))+b''.join(enc(x) for x in v)
    if isinstance(v,dict):
        pairs=[(enc(str(k)),enc(val)) for k,val in v.items()];pairs.sort(key=lambda p:p[0]);return bytes([T['MAP']])+uleb(len(pairs))+b''.join(k+val for k,val in pairs)
    raise TypeError(type(v))
def entity(uid,namespace,stable_key):return hashlib.sha256(b'OFU-ENTITY-v1\0'+enc({'universeIdentity':uid,'namespace':namespace,'stableKey':stable_key})).digest()
def mul(v,f):
    assert 0<=v<=U64 and 0<=f<=PPM
    return v*f//PPM
def budget(photo_u,photo_eff,chemo_u,chemo_eff,maintenance,transfers):
    photo=mul(photo_u,photo_eff);chemo=None if chemo_u is None else mul(chemo_u,chemo_eff);primary=photo+(chemo or 0);assert primary<=U64
    alloc=primary-mul(primary,maintenance);out=[alloc];cur=alloc
    for e in transfers:cur=mul(cur,e);out.append(cur)
    source='MIXED' if photo>0 and chemo is not None and chemo>0 else 'CHEMOTROPHIC' if chemo is not None and chemo>0 else 'PHOTOTROPHIC' if photo>0 else 'UNKNOWN'
    return source,primary,alloc,out
with open('tests/p6-research-v2/golden-bounded-v2.json',encoding='utf-8') as f:g=json.load(f)
uid=bytes.fromhex(g['case']['universeIdentityHex']);planet=bytes.fromhex(g['case']['planetIdHex']);policy=g['identityPolicy'];op=g['case']['founderOperationKey']
bio=entity(uid,'p6.research.v2.biosphere',{'planetId':planet,'identityPolicy':policy});lin=entity(uid,'p6.research.v2.lineage',{'biosphereId':bio,'parentLineageId':None,'birthOperationKey':op,'identityPolicy':policy});sp=entity(uid,'p6.research.v2.species',{'lineageId':lin,'speciationOperationKey':op,'identityPolicy':policy})
assert bio.hex()==g['case']['biosphereIdHex'];assert lin.hex()==g['case']['lineageIdHex'];assert sp.hex()==g['case']['speciesIdHex']
e=g['case']['ecology'];got=budget(int(e['phototrophicUsableEnergyU']),int(e['phototrophicCaptureEfficiencyPpm']),None,None,int(e['maintenanceFractionPpm']),list(map(int,e['trophicEfficienciesPpm'])))
want=(e['energySource'],int(e['primaryProductivityCeilingU']),int(e['allocatableEnergyU']),list(map(int,e['trophicCeilingsU'])));assert got==want,(got,want)
assert g['limits']=={'maxBiospheresPerWorld':1,'maxTotalLineagesPerBiosphere':1024,'maxActiveLineagesPerBiosphere':256,'maxTraitsPerLineage':32,'maxTrophicTransfers':8}
print(json.dumps({'status':'PASS','oracle':'independent-python-ofu-cbv-subset-v1','biosphereId':bio.hex(),'lineageId':lin.hex(),'speciesId':sp.hex(),'ecology':{'source':got[0],'primary':str(got[1]),'allocatable':str(got[2]),'trophic':list(map(str,got[3]))},'limits':g['limits']},sort_keys=True))
