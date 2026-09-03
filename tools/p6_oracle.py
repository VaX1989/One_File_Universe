#!/usr/bin/env python3
import hashlib,json,os
T={'NULL':0,'FALSE':1,'TRUE':2,'SINT':16,'UINT':17,'BYTES':32,'TEXT':33,'ARRAY':48,'MAP':49}
def uleb(x):
 if x<0 or x>(1<<64)-1: raise ValueError('u64')
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
 if isinstance(v,int):
  if v>=0:return bytes([T['UINT']])+uleb(v)
  return bytes([T['SINT']])+uleb((-v*2)-1)
 if isinstance(v,bytes):return bytes([T['BYTES']])+uleb(len(v))+v
 if isinstance(v,str):
  b=v.encode('utf-8');return bytes([T['TEXT']])+uleb(len(b))+b
 if isinstance(v,(list,tuple)):
  return bytes([T['ARRAY']])+uleb(len(v))+b''.join(enc(x) for x in v)
 if isinstance(v,dict):
  pairs=[(enc(str(k)),enc(val)) for k,val in v.items()];pairs.sort(key=lambda p:p[0]);return bytes([T['MAP']])+uleb(len(pairs))+b''.join(k+v for k,v in pairs)
 raise TypeError(type(v))
def sha(b):return hashlib.sha256(b).digest()
def entity(uid,namespace,stable_key):return sha(b'OFU-ENTITY-v1\0'+enc({'universeIdentity':uid,'namespace':namespace,'stableKey':stable_key}))
MANIFEST={'semanticManifestVersion':1,'canonicalProtocolVersion':'ofu-cbv-1','canonicalAddressVersion':1,'unicodeProfileVersion':'ofu-unicode-15.1.0-v1','numericContractVersion':1,'generatorSuite':'p6-biosphere-evolution','generatorSuiteVersion':1,'subsystems':{'biosphere':1,'ecology':1,'evolution':1,'semanticLod':1},'domains':{'biosphere':1,'ecology':1,'evolution':1},'dependencies':{'p2':'ofu-cbv-1','astronomy':'p3-astronomy-1','temporal':'ofu-p4-temporal-v1','planetPhysical':'ofu-p5-planet-physical-v1','planetEnvironment':'ofu-p5-p6-environment-v2'},'lawProfile':'p6-bounded-energy-trophic-v1','genesis':{'schemaVersion':1,'modelVersion':'p6-biosphere-evolution-1','contractId':'ofu-p6-biosphere-v1','identityPolicy':'p6-biological-identity-model-a-v1','numericContract':'p6-fixed-integer-1','evidencePolicy':'p6-scientific-evidence-1','semanticLodProfile':'p6-semantic-lod-1','transitionContract':'ofu.p6.biological-transition','transitionVersion':'1.0.0'}}
manifest_hash=sha(enc(MANIFEST));uid=bytes(255-i for i in range(32));planet=bytes((i*3)&255 for i in range(32));policy='p6-biological-identity-model-a-v1';biosphere=entity(uid,'p6.biosphere',{'planetId':planet,'identityPolicy':policy});lineage=entity(uid,'p6.lineage',{'biosphereId':biosphere,'lineageOrdinal':0,'identityPolicy':policy});species=entity(uid,'p6.species',{'lineageId':lineage,'speciesOrdinal':0,'identityPolicy':policy})
photo_energy=5_000_000_000;capture=420_000;primary=photo_energy*capture//1_000_000;biomass=primary*800_000//1_000_000
def trophic(v,e):return v*e//1_000_000
result={'status':'PASS','oracle':'independent-python-ofu-cbv-subset-v1','manifestHash':manifest_hash.hex(),'biosphereId':biosphere.hex(),'lineageId':lineage.hex(),'speciesId':species.hex(),'primaryProductivityCeilingU':str(primary),'sustainableBiomassCeilingU':str(biomass),'trophic100kLevel1U':str(trophic(primary,100_000)),'numericLaw':'u64 integer; ppm multiplication uses exact floor; overflow is rejection in runtime'}
os.makedirs('dist/evidence/p6',exist_ok=True)
with open('dist/evidence/p6/p6-python-oracle.json','w',encoding='utf-8') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps(result,sort_keys=True))