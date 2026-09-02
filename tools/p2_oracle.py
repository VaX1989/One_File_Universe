#!/usr/bin/env python3
import hashlib,hmac,json,unicodedata

def uleb(x):
 x=int(x)
 if x<0: raise ValueError('negative integer')
 o=bytearray()
 while True:
  b=x&127;x>>=7;o.append(b|(128 if x else 0))
  if not x:return bytes(o)

def enc(v):
 if v is None:return b'\x00'
 if v is False:return b'\x01'
 if v is True:return b'\x02'
 if isinstance(v,int) and not isinstance(v,bool):return bytes([17])+uleb(v) if v>=0 else bytes([16])+uleb((-v*2)-1)
 if isinstance(v,(bytes,bytearray)):return bytes([32])+uleb(len(v))+bytes(v)
 if isinstance(v,str):
  n=unicodedata.normalize('NFC',v);b=n.encode('utf-8','strict');return bytes([33])+uleb(len(b))+b
 if isinstance(v,list):return bytes([48])+uleb(len(v))+b''.join(enc(x) for x in v)
 if isinstance(v,dict):
  pairs=[];seen=set()
  for k,val in v.items():
   if not isinstance(k,str):raise ValueError('map key')
   nk=unicodedata.normalize('NFC',k)
   if nk in seen:raise ValueError('normalized collision')
   seen.add(nk);pairs.append((enc(k),enc(val)))
  pairs.sort(key=lambda p:p[0]);return bytes([49])+uleb(len(pairs))+b''.join(k+v for k,v in pairs)
 raise ValueError('unsupported')

def manifest_hash(m):return hashlib.sha256(enc(m)).digest()
def universe(seed,mh):
 d=enc({'canonicalProtocolVersion':'ofu-cbv-1','masterSeed':seed,'semanticManifestHash':mh})
 return d,hashlib.sha256(b'OFU-UNIVERSE-v1\0'+d).digest()
def address(segs):
 o=bytearray(b'OFUA\x01'+uleb(len(segs)))
 for s in segs:
  k=s['kind'];v=s['value']
  if k=='namespace':
   b=unicodedata.normalize('NFC',v).encode();o+=b'\x01'+uleb(len(b))+b
  elif k in ('u64','i64'):
   x=int(v);lo,hi=(0,2**64-1) if k=='u64' else (-2**63,2**63-1)
   if not lo<=x<=hi:raise ValueError('range')
   o.append(2 if k=='u64' else 3);o+=int(x%(2**64)).to_bytes(8,'big')
  elif k=='bytes':
   b=bytes.fromhex(v) if isinstance(v,str) else bytes(v);o+=b'\x04'+uleb(len(b))+b
  else:raise ValueError('kind')
 return bytes(o)
def derive(seed,mh,domain,addr,prop,counter=0):return hmac.new(seed,enc(['OFU-DERIVE-v1',mh,domain,addr,prop,int(counter)]),hashlib.sha256).digest()
def entity(namespace,stable):return hashlib.sha256(b'OFU-ENTITY-v1\0'+enc({'namespace':namespace,'stableKey':stable})).digest()

def build_corpus():
 seed=bytes(range(32));manifest={'addressSchemaVersion':1,'canonicalProtocolVersion':'ofu-cbv-1','generatorSuite':'ofu-p2-reference','genesis':{'lawProfile':'baseline','parameters':{}},'numericContractVersion':1,'subsystems':{'identity':1,'test-substrate':1}}
 mh=manifest_hash(manifest);cases=[]
 vals=[None,False,True,0,1,-1,2**53-1,2**53,2**53+1,2**64-1,-2**63,b'',b'\x00\xff','e\u0301','é','\x00','\u200b','😀',[1,'é',None],{'b':2,'a':1}]
 for i,v in enumerate(vals):cases.append({'kind':'value','id':i,'hex':enc(v).hex()})
 addrs=[[{'kind':'namespace','value':'astro'},{'kind':'i64','value':'-9223372036854775808'},{'kind':'u64','value':'18446744073709551615'}],[{'kind':'namespace','value':'entity'},{'kind':'bytes','value':'000102ff'}],[{'kind':'namespace','value':'local-frame'},{'kind':'i64','value':'-1'},{'kind':'i64','value':'0'},{'kind':'i64','value':'1'}]]
 for i,a in enumerate(addrs):
  ab=address(a);cases.append({'kind':'address','id':i,'hex':ab.hex(),'derive':derive(seed,mh,'domain-'+str(i),ab,'property-'+str(i),i).hex()})
 for i in range(256):
  x=int.from_bytes(hashlib.sha256(b'OFU-CORPUS-SEED-v1'+i.to_bytes(4,'big')).digest()[:8],'big');a=[{'kind':'namespace','value':'fuzz'},{'kind':'i64','value':str((x%(2**63))-2**62)},{'kind':'u64','value':str(x)}];ab=address(a);cases.append({'kind':'generated','id':i,'address':ab.hex(),'derive':derive(seed,mh,'fuzz-domain',ab,'field',i).hex()})
 d,u=universe(seed,mh);payload={'version':1,'protocol':'ofu-cbv-1','seed':seed.hex(),'semanticManifest':manifest,'semanticManifestHash':mh.hex(),'universeDescriptor':d.hex(),'universeIdentity':u.hex(),'entityIdentity':entity('person',{'stableId':'alpha'}).hex(),'cases':cases};canon=json.dumps(payload,sort_keys=True,separators=(',',':')).encode();payload['corpusDigest']=hashlib.sha256(canon).hexdigest();payload['kernelDigest']=hashlib.sha256(enc([bytes.fromhex(c['derive']) for c in cases if c['kind']=='generated'])).hexdigest();return payload
if __name__=='__main__':print(json.dumps(build_corpus(),indent=2,ensure_ascii=False,sort_keys=True))
