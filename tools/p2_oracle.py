#!/usr/bin/env python3
import hashlib,hmac,json,math,unicodedata
U64=(1<<64)-1; I64_MIN=-(1<<63); I64_MAX=(1<<63)-1
L={'depth':32,'nodes':100000,'inputBytes':1048576,'byteStringBytes':1048572,'textBytes':262144,'items':65536,'addressSegments':64,'addressNamespaceBytes':1024,'addressSegmentBytes':4096,'addressBytes':65536}
T={'NULL':0,'FALSE':1,'TRUE':2,'SINT':16,'UINT':17,'BYTES':32,'TEXT':33,'ARRAY':48,'MAP':49}
def uleb(x):
 x=int(x); assert 0<=x<=U64
 o=bytearray()
 while 1:
  b=x&127;x>>=7;o.append(b|(128 if x else 0))
  if not x:return bytes(o)
class Enc:
 def __init__(s):s.n=0;s.z=0;s.seen=set()
 def emit(s,*p):
  s.z+=sum(map(len,p))
  if s.z>L['inputBytes']:raise ValueError('encoded value too large')
  return b''.join(p)
 def e(s,v,d=0):
  if d>L['depth']:raise ValueError('depth limit')
  s.n+=1
  if s.n>L['nodes']:raise ValueError('node limit')
  if v is None:return s.emit(b'\0')
  if v is False:return s.emit(b'\1')
  if v is True:return s.emit(b'\2')
  if isinstance(v,int) and not isinstance(v,bool):
   if v>=0:
    if v>U64:raise ValueError('unsigned integer range')
    return s.emit(bytes([T['UINT']]),uleb(v))
   if v<I64_MIN:raise ValueError('signed integer range')
   return s.emit(bytes([T['SINT']]),uleb(-v*2-1))
  if isinstance(v,(bytes,bytearray)):
   v=bytes(v)
   if len(v)>L['byteStringBytes']:raise ValueError('byte string too large')
   return s.emit(bytes([T['BYTES']]),uleb(len(v)),v)
  if isinstance(v,str):
   b=unicodedata.normalize('NFC',v).encode('utf-8','strict')
   if len(b)>L['textBytes']:raise ValueError('text too large')
   return s.emit(bytes([T['TEXT']]),uleb(len(b)),b)
  if isinstance(v,list):
   if len(v)>L['items']:raise ValueError('array too large')
   if id(v) in s.seen:raise ValueError('cycle')
   s.seen.add(id(v));o=[s.emit(bytes([T['ARRAY']]),uleb(len(v)))]+[s.e(x,d+1) for x in v];s.seen.remove(id(v));return b''.join(o)
  if isinstance(v,dict):
   if len(v)>L['items']:raise ValueError('map too large')
   if id(v) in s.seen:raise ValueError('cycle')
   s.seen.add(id(v));seen=set();pairs=[]
   for k,x in v.items():
    if not isinstance(k,str):raise ValueError('map key')
    nk=unicodedata.normalize('NFC',k)
    if nk in seen:raise ValueError('normalized collision')
    seen.add(nk);pairs.append((s.e(k,d+1),s.e(x,d+1)))
   pairs.sort();head=s.emit(bytes([T['MAP']]),uleb(len(pairs)));s.seen.remove(id(v));return head+b''.join(k+x for k,x in pairs)
  raise ValueError('unsupported')
def enc(v):return Enc().e(v)
class Dec:
 def __init__(s,b):s.b=bytes(b);s.i=0;s.n=0; (len(s.b)<=L['inputBytes']) or (_ for _ in()).throw(ValueError('input too large'))
 def rd(s):
  if s.i>=len(s.b):raise ValueError('truncated input')
  x=s.b[s.i];s.i+=1;return x
 def vu(s):
  x=0;sh=0
  for c in range(10):
   b=s.rd();p=b&127
   if c==9 and b&0xfe:raise ValueError('varint overflow')
   x|=p<<sh
   if not b&128:
    if c and p==0:raise ValueError('non-minimal varint')
    return x
   sh+=7
  raise ValueError('varint too long')
 def take(s,n):
  if n<0 or s.i+n>len(s.b):raise ValueError('invalid length')
  o=s.b[s.i:s.i+n];s.i+=n;return o
 def v(s,d=0):
  if d>L['depth']:raise ValueError('depth limit')
  s.n+=1
  if s.n>L['nodes']:raise ValueError('node limit')
  t=s.rd()
  if t==0:return None
  if t==1:return False
  if t==2:return True
  if t==T['UINT']:return s.vu()
  if t==T['SINT']:
   z=s.vu()
   if not z&1:raise ValueError('non-canonical signed integer')
   return -(z+1)//2
  if t==T['BYTES']:
   n=s.vu()
   if n>L['byteStringBytes']:raise ValueError('byte string too large')
   return s.take(n)
  if t==T['TEXT']:
   n=s.vu()
   if n>L['textBytes']:raise ValueError('text too large')
   x=s.take(n).decode('utf-8','strict')
   if x!=unicodedata.normalize('NFC',x):raise ValueError('non-canonical Unicode')
   return x
  if t==T['ARRAY']:
   n=s.vu()
   if n>L['items']:raise ValueError('array too large')
   return [s.v(d+1) for _ in range(n)]
  if t==T['MAP']:
   n=s.vu()
   if n>L['items']:raise ValueError('map too large')
   o={};prev=None
   for _ in range(n):
    st=s.i;k=s.v(d+1);kb=s.b[st:s.i]
    if not isinstance(k,str) or (prev is not None and prev>=kb) or k in o:raise ValueError('map canonicality')
    prev=kb;o[k]=s.v(d+1)
   return o
  raise ValueError('unknown tag')
 def all(s):
  v=s.v()
  if s.i!=len(s.b):raise ValueError('trailing bytes')
  return v
def dec(b):return Dec(b).all()
def mh(m):return hashlib.sha256(enc(m)).digest()
def universe(seed,h):
 d=enc({'canonicalProtocolVersion':'ofu-cbv-1','masterSeed':seed,'semanticManifestHash':h});return d,hashlib.sha256(b'OFU-UNIVERSE-v1\0'+d).digest()
def entity(ns,key):return hashlib.sha256(b'OFU-ENTITY-v1\0'+enc({'namespace':ns,'stableKey':key})).digest()
def address(ss):
 if not isinstance(ss,list) or not 1<=len(ss)<=L['addressSegments']:raise ValueError('invalid address')
 o=bytearray(b'OFUA\1'+uleb(len(ss)))
 for s in ss:
  k=s['kind'];v=s['value']
  if k=='namespace':
   b=unicodedata.normalize('NFC',v).encode('utf-8','strict')
   if len(b)>L['addressNamespaceBytes']:raise ValueError('address namespace too large')
   o+=b'\1'+uleb(len(b))+b
  elif k in ('u64','i64'):
   x=int(v);lo,hi=(0,U64) if k=='u64' else (I64_MIN,I64_MAX)
   if not lo<=x<=hi:raise ValueError(k+' range')
   o+=bytes([2 if k=='u64' else 3])+(x%(1<<64)).to_bytes(8,'big')
  elif k=='bytes':
   b=bytes.fromhex(v) if isinstance(v,str) else bytes(v)
   if len(b)>L['addressSegmentBytes']:raise ValueError('address bytes')
   o+=b'\4'+uleb(len(b))+b
  else:raise ValueError('unknown address segment')
  if len(o)>L['addressBytes']:raise ValueError('address too large')
 return bytes(o)
def parse_address(b):
 b=bytes(b)
 if len(b)>L['addressBytes']:raise ValueError('address too large')
 i=0
 def rd():
  nonlocal i
  if i>=len(b):raise ValueError('truncated')
  x=b[i];i+=1;return x
 def take(n):
  nonlocal i
  if i+n>len(b):raise ValueError('truncated')
  x=b[i:i+n];i+=n;return x
 def vu3():
  x=sh=0
  for c in range(3):
   q=rd();p=q&127;x|=p<<sh
   if not q&128:
    if c and p==0:raise ValueError('non-minimal length')
    return x
   sh+=7
  raise ValueError('length varint too long')
 if take(4)!=b'OFUA' or rd()!=1:raise ValueError('address header')
 n=vu3()
 if not 1<=n<=L['addressSegments']:raise ValueError('segment count')
 o=[]
 for _ in range(n):
  t=rd()
  if t==1:
   z=vu3()
   if z>L['addressNamespaceBytes']:raise ValueError('namespace too long')
   x=take(z).decode('utf-8','strict')
   if x!=unicodedata.normalize('NFC',x):raise ValueError('non-canonical Unicode')
   o.append({'kind':'namespace','value':x})
  elif t in (2,3):
   x=int.from_bytes(take(8),'big');x=x-(1<<64) if t==3 and x>=1<<63 else x;o.append({'kind':'u64' if t==2 else 'i64','value':x})
  elif t==4:
   z=vu3()
   if z>L['addressSegmentBytes']:raise ValueError('bytes segment too long')
   o.append({'kind':'bytes','value':take(z)})
  else:raise ValueError('unknown segment tag')
 if i!=len(b):raise ValueError('trailing bytes')
 return o
def derive(seed,h,domain,addr,prop,counter=0):
 if len(seed)!=32 or len(h)!=32 or len(addr)>L['addressBytes']:raise ValueError('derive bounds')
 return hmac.new(seed,enc(['OFU-DERIVE-v1',h,domain,addr,prop,int(counter)]),hashlib.sha256).digest()
def add_i64(a,b):
 r=int(a)+int(b)
 if not I64_MIN<=r<=I64_MAX:raise ValueError('i64 overflow')
 return r
def mul_fixed(a,b,scale=1000000):
 a=int(a);b=int(b);scale=int(scale)
 if scale<=0:raise ValueError('fixed scale')
 p=a*b;q=abs(p)//scale;q=-q if p<0 else q;r=p-q*scale;t=abs(r)*2
 if t>scale or (t==scale and q&1):q+=-1 if p<0 else 1
 return q
def reject(f):
 try:f()
 except Exception:return
 raise AssertionError('expected rejection')
def stable(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def build_corpus():
 seed=bytes(range(32));m={'addressSchemaVersion':1,'canonicalProtocolVersion':'ofu-cbv-1','generatorSuite':'ofu-p2-reference','genesis':{'lawProfile':'baseline','parameters':{}},'numericContractVersion':1,'subsystems':{'identity':1,'test-substrate':1}};h=mh(m);cases=[]
 vals=[None,False,True,0,1,U64,-1,I64_MIN,2**53-1,2**53,2**53+1,b'',b'\0\xff','e\u0301','é','\0','\u200b','😀',[1,'é',None],{'b':2,'a':1}]
 for i,v in enumerate(vals):
  b=enc(v);assert enc(dec(b))==b;cases.append({'kind':'value','id':i,'hex':b.hex()})
 adds=[[{'kind':'namespace','value':'astro'}],[{'kind':'u64','value':'0'}],[{'kind':'u64','value':str(U64)}],[{'kind':'i64','value':str(I64_MIN)}],[{'kind':'i64','value':str(I64_MAX)}],[{'kind':'bytes','value':''}],[{'kind':'namespace','value':'entity'},{'kind':'bytes','value':'000102ff'},{'kind':'i64','value':'-1'},{'kind':'u64','value':str(U64)}]]
 for i,s in enumerate(adds):
  b=address(s);assert address(parse_address(b))==b;cases.append({'kind':'address','id':i,'segments':s,'hex':b.hex(),'derive':derive(seed,h,'domain-'+str(i),b,'property-'+str(i),i).hex()})
 for j,z in enumerate((L['addressSegmentBytes']-1,L['addressSegmentBytes'])):
  raw=bytes((i*17+3)&255 for i in range(z));b=address([{'kind':'bytes','value':raw}]);i=7+j;cases.append({'kind':'addressPattern','id':i,'pattern':{'name':'linear-u8','length':z,'multiplier':17,'addend':3},'addressBytes':len(b),'addressSha256':hashlib.sha256(b).hexdigest(),'derive':derive(seed,h,'domain-'+str(i),b,'property-'+str(i),i).hex()})
 for name,x in [('truncated-uint','11'),('nonminimal-uint-zero','118000'),('sint-even-alias','1000'),('sint-even-positive-alias','1002'),('uleb-overflow','11ffffffffffffffffff02'),('uleb-too-long','118080808080808080808000'),('invalid-utf8','2102c328'),('non-nfc-text','210365cc81'),('trailing-data','0000'),('unknown-tag','ff')]:reject(lambda x=x:dec(bytes.fromhex(x)));cases.append({'kind':'rejectCanonical','id':name,'hex':x})
 for name,x in [('empty',''),('truncated','4f46554101'),('version','4f4655410201010178'),('zero-segments','4f4655410100'),('unknown-segment','4f4655410101ff'),('nonminimal-count','4f46554101810001'),('bytes-length-limit-plus-one','4f4655410101048120'),('namespace-length-limit-plus-one','4f4655410101018108')]:reject(lambda x=x:parse_address(bytes.fromhex(x)));cases.append({'kind':'rejectAddress','id':name,'hex':x})
 gen=[]
 for i in range(256):
  d=hashlib.sha256(b'OFU-CORPUS-SEED-v1'+i.to_bytes(4,'big')).digest();x=int.from_bytes(d[:8],'big');a=address([{'kind':'namespace','value':'fuzz'},{'kind':'i64','value':str(x%(1<<63)-(1<<62))},{'kind':'u64','value':str(x)}]);gen.append(derive(seed,h,'fuzz-domain',a,'field',i))
 assert len(enc(bytes(L['byteStringBytes'])))==L['inputBytes'];reject(lambda:enc(bytes(L['byteStringBytes']+1)));reject(lambda:enc([bytes(L['byteStringBytes']),None]));reject(lambda:address([{'kind':'bytes','value':bytes(L['addressSegmentBytes']+1)}]));reject(lambda:address([{'kind':'namespace','value':'a'*(L['addressNamespaceBytes']+1)}]));reject(lambda:enc(U64+1));reject(lambda:enc(I64_MIN-1));reject(lambda:add_i64(I64_MAX,1));reject(lambda:add_i64(I64_MIN,-1));reject(lambda:math.isqrt(-1));assert mul_fixed(1,1,3)==0 and mul_fixed(2,1,3)==1
 desc,uid=universe(seed,h);p={'version':1,'protocol':'ofu-cbv-1','limits':L,'seed':seed.hex(),'semanticManifest':m,'semanticManifestHash':h.hex(),'universeDescriptor':desc.hex(),'universeIdentity':uid.hex(),'entityIdentity':entity('person',{'stableId':'alpha'}).hex(),'cases':cases,'boundaryCases':[{'id':'canonical-total-bytes','limit':L['inputBytes'],'byteStringPayloadAtExactLimit':L['byteStringBytes']},{'id':'canonical-depth','limit':L['depth']},{'id':'canonical-nodes','limit':L['nodes'],'mapPairsAtLimitMinusOne':49999,'mapPairsOverLimit':50000},{'id':'collection-items','limit':L['items']},{'id':'text-bytes','limit':L['textBytes']},{'id':'address-segments','limit':L['addressSegments']},{'id':'address-namespace-bytes','limit':L['addressNamespaceBytes']},{'id':'address-segment-bytes','limit':L['addressSegmentBytes']},{'id':'address-total-bytes','limit':L['addressBytes']}],'generatedCorpus':{'count':256,'seedDomain':'OFU-CORPUS-SEED-v1','addressNamespace':'fuzz','deriveDomain':'fuzz-domain','property':'field'},'numericCases':[{'op':'addI64','args':[str(I64_MAX-1),'1'],'result':str(add_i64(I64_MAX-1,1))},{'op':'addI64','args':[str(I64_MIN+1),'-1'],'result':str(add_i64(I64_MIN+1,-1))},{'op':'mulFixed','args':['1500000','1500000','1000000'],'result':str(mul_fixed(1500000,1500000,1000000))},{'op':'mulFixed','args':['1','1','3'],'result':str(mul_fixed(1,1,3))},{'op':'mulFixed','args':['2','1','3'],'result':str(mul_fixed(2,1,3))},{'op':'mulFixed','args':['1','1','2'],'result':str(mul_fixed(1,1,2))},{'op':'mulFixed','args':['3','1','2'],'result':str(mul_fixed(3,1,2))},{'op':'mulFixed','args':['-3','1','2'],'result':str(mul_fixed(-3,1,2))},{'op':'isqrt','args':['0'],'result':'0'},{'op':'isqrt','args':['17'],'result':'4'}],'oracleSelfTest':'PASS','generator':'tools/p2_oracle.py:build_corpus','fuzzSeeds':['0x5eed1234','0x00c0ffee']};p['kernelDigest']=hashlib.sha256(enc(gen)).hexdigest();p['corpusDigest']=hashlib.sha256(stable(p)).hexdigest();return p
if __name__=='__main__':print(json.dumps(build_corpus(),indent=2,ensure_ascii=False,sort_keys=True))
