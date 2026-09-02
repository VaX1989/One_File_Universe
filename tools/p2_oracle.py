#!/usr/bin/env python3
import bisect,hashlib,hmac,json,math,struct,sys,unicodedata
U64=(1<<64)-1; I64_MIN=-(1<<63); I64_MAX=(1<<63)-1
UNICODE_PROFILE_VERSION='ofu-unicode-15.1.0-v1'; UNICODE_VERSION='15.1.0'; UNICODE_RANGE_COUNT=707; UNICODE_RANGE_SHA256='d92c96676b97eae626d3f0bd9419ec0a7dcc8c22373c1455f21015d737b47412'
def build_ranges():
 if unicodedata.unidata_version!=UNICODE_VERSION:raise RuntimeError('Python Unicode database must be '+UNICODE_VERSION)
 rs=[];st=None;pr=None
 for cp in range(0x110000):
  ok=not (0xD800<=cp<=0xDFFF) and unicodedata.category(chr(cp))!='Cn'
  if ok:
   if st is None:st=pr=cp
   elif cp==pr+1:pr=cp
   else:rs.append((st,pr));st=pr=cp
 if st is not None:rs.append((st,pr))
 raw=b''.join(struct.pack('>II',a,b) for a,b in rs)
 if len(rs)!=UNICODE_RANGE_COUNT or hashlib.sha256(raw).hexdigest()!=UNICODE_RANGE_SHA256:raise RuntimeError('Unicode profile reconstruction mismatch')
 return tuple(rs)
RANGES=build_ranges()
STARTS=tuple(a for a,_ in RANGES)
MANIFEST_KEYS=('semanticManifestVersion','canonicalProtocolVersion','canonicalAddressVersion','unicodeProfileVersion','numericContractVersion','generatorSuite','generatorSuiteVersion','subsystems','domains','dependencies','lawProfile','genesis')
L={'depth':32,'nodes':100000,'inputBytes':1048576,'byteStringBytes':1048572,'textBytes':262144,'items':65536,'addressSegments':64,'addressNamespaceBytes':1024,'addressSegmentBytes':4096,'addressBytes':65536}
T={'NULL':0,'FALSE':1,'TRUE':2,'SINT':16,'UINT':17,'BYTES':32,'TEXT':33,'ARRAY':48,'MAP':49}
def assigned(cp):
 if not isinstance(cp,int) or cp<0 or cp>0x10ffff or 0xd800<=cp<=0xdfff:return False
 i=bisect.bisect_right(STARTS,cp)-1
 return i>=0 and cp<=RANGES[i][1]
def inspect_text(s):
 if not isinstance(s,str):raise ValueError('text must be string')
 for ch in s:
  cp=ord(ch)
  if not assigned(cp):raise ValueError('code point outside '+UNICODE_PROFILE_VERSION)
 return s
def norm(s):
 inspect_text(s);n=unicodedata.normalize('NFC',s);inspect_text(n);return n
def canonical_text(s):
 inspect_text(s)
 if s!=unicodedata.normalize('NFC',s):raise ValueError('text is not NFC')
 return s
def text_bytes(s):
 b=norm(s).encode('utf-8','strict')
 if len(b)>L['textBytes']:raise ValueError('text too large')
 return b
def nonempty(s,name):
 n=norm(s)
 if not n:raise ValueError(name+' must be non-empty canonical text')
 if len(n.encode('utf-8'))>L['textBytes']:raise ValueError(name+' too large')
 return n
def u64(v,name='u64'):
 if isinstance(v,bool) or not isinstance(v,int) or not 0<=v<=U64:raise ValueError(name+' must be u64')
 return v
def i64(v,name='i64'):
 if isinstance(v,bool) or not isinstance(v,int) or not I64_MIN<=v<=I64_MAX:raise ValueError(name+' must be i64')
 return v
def uleb(x):
 x=u64(int(x),'ULEB64');o=bytearray()
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
   if v>=0:return s.emit(bytes([T['UINT']]),uleb(u64(v,'unsigned integer')))
   i64(v,'signed integer');return s.emit(bytes([T['SINT']]),uleb(-v*2-1))
  if isinstance(v,(bytes,bytearray)):
   v=bytes(v)
   if len(v)>L['byteStringBytes']:raise ValueError('byte string too large')
   return s.emit(bytes([T['BYTES']]),uleb(len(v)),v)
  if isinstance(v,str):
   b=text_bytes(v);return s.emit(bytes([T['TEXT']]),uleb(len(b)),b)
  if isinstance(v,list):
   if len(v)>L['items']:raise ValueError('array too large')
   if id(v) in s.seen:raise ValueError('cycle')
   s.seen.add(id(v));head=s.emit(bytes([T['ARRAY']]),uleb(len(v)));parts=[head]
   for x in v:parts.append(s.e(x,d+1))
   s.seen.remove(id(v));return b''.join(parts)
  if type(v) is dict:
   if len(v)>L['items']:raise ValueError('map too large')
   if id(v) in s.seen:raise ValueError('cycle')
   s.seen.add(id(v));seen=set();pairs=[]
   for k,x in v.items():
    if not isinstance(k,str):raise ValueError('map key')
    nk=norm(k)
    if nk in seen:raise ValueError('normalized collision')
    seen.add(nk);pairs.append((s.e(nk,d+1),s.e(x,d+1)))
   pairs.sort(key=lambda p:p[0]);head=s.emit(bytes([T['MAP']]),uleb(len(pairs)));s.seen.remove(id(v));return head+b''.join(k+x for k,x in pairs)
  raise ValueError('unsupported')
def enc(v):return Enc().e(v)
class Dec:
 def __init__(s,b):
  s.b=bytes(b);s.i=0;s.n=0
  if len(s.b)>L['inputBytes']:raise ValueError('input too large')
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
   x=s.take(n).decode('utf-8','strict');canonical_text(x);return x
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
def exact_keys(o,keys,name):
 if type(o) is not dict or set(o)!=set(keys):raise ValueError(name+' has missing or unknown fields')
def version_map(v,name):
 if type(v) is not dict:raise ValueError(name+' must be map')
 for k,x in v.items():nonempty(k,name+' key');u64(x,name+' version');
 for x in v.values():
  if x<1:raise ValueError(name+' versions must be positive')
def dependency_map(v):
 if type(v) is not dict:raise ValueError('dependencies must be map')
 for k,x in v.items():nonempty(k,'dependency key');nonempty(x,'dependency version')
def validate_manifest(m):
 exact_keys(m,MANIFEST_KEYS,'Semantic Generator Manifest')
 if u64(m['semanticManifestVersion'])!=1:raise ValueError('unsupported semanticManifestVersion')
 if nonempty(m['canonicalProtocolVersion'],'canonicalProtocolVersion')!='ofu-cbv-1':raise ValueError('unsupported canonicalProtocolVersion')
 if u64(m['canonicalAddressVersion'])!=1:raise ValueError('unsupported canonicalAddressVersion')
 if nonempty(m['unicodeProfileVersion'],'unicodeProfileVersion')!=UNICODE_PROFILE_VERSION:raise ValueError('unsupported unicodeProfileVersion')
 if u64(m['numericContractVersion'])!=1:raise ValueError('unsupported numericContractVersion')
 nonempty(m['generatorSuite'],'generatorSuite')
 if u64(m['generatorSuiteVersion'])<1:raise ValueError('generatorSuiteVersion must be positive')
 version_map(m['subsystems'],'subsystems');version_map(m['domains'],'domains');dependency_map(m['dependencies']);nonempty(m['lawProfile'],'lawProfile')
 if type(m['genesis']) is not dict:raise ValueError('genesis must be map')
 enc(m['genesis']);return m
def manifest_bytes(m):validate_manifest(m);return enc(m)
def mh(m):return hashlib.sha256(manifest_bytes(m)).digest()
def universe(seed,h):
 if len(seed)!=32 or len(h)!=32:raise ValueError('Universe Identity sizes')
 d=enc({'canonicalProtocolVersion':'ofu-cbv-1','masterSeed':seed,'semanticManifestHash':h});return d,hashlib.sha256(b'OFU-UNIVERSE-v1\0'+d).digest()
def entity(uid,ns,key):
 if len(uid)!=32:raise ValueError('Entity Identity requires Universe Identity')
 d=enc({'universeIdentity':uid,'namespace':nonempty(ns,'entity namespace'),'stableKey':key});return hashlib.sha256(b'OFU-ENTITY-v1\0'+d).digest()
def address(ss):
 if type(ss) is not list or not 1<=len(ss)<=L['addressSegments']:raise ValueError('invalid address')
 o=bytearray(b'OFUA\1'+uleb(len(ss)))
 for s in ss:
  exact_keys(s,('kind','value'),'address segment');k=s['kind'];v=s['value']
  if k=='namespace':
   b=text_bytes(v)
   if len(b)>L['addressNamespaceBytes']:raise ValueError('address namespace too large')
   o+=b'\1'+uleb(len(b))+b
  elif k=='u64':o+=b'\2'+u64(v,'address u64').to_bytes(8,'big')
  elif k=='i64':o+=b'\3'+(i64(v,'address i64')%(1<<64)).to_bytes(8,'big')
  elif k=='bytes':
   b=bytes(v)
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
   if z>L['addressNamespaceBytes']:raise ValueError('namespace length')
   x=take(z).decode('utf-8','strict');canonical_text(x);o.append({'kind':'namespace','value':x})
  elif t in (2,3):
   x=int.from_bytes(take(8),'big');x=x-(1<<64) if t==3 and x>=1<<63 else x;o.append({'kind':'u64' if t==2 else 'i64','value':x})
  elif t==4:
   z=vu3()
   if z>L['addressSegmentBytes']:raise ValueError('bytes segment too long')
   o.append({'kind':'bytes','value':take(z)})
  else:raise ValueError('unknown segment tag')
 if i!=len(b):raise ValueError('trailing bytes')
 return o
def valid_address(b):
 p=parse_address(b)
 if address(p)!=bytes(b):raise ValueError('non-canonical address')
 return bytes(b)
def derive(seed,h,domain,addr,prop,counter):
 if not isinstance(seed,(bytes,bytearray)) or len(seed)!=32 or not isinstance(h,(bytes,bytearray)) or len(h)!=32:raise ValueError('derive identity sizes')
 valid_address(addr);domain=nonempty(domain,'derive domain');prop=nonempty(prop,'derive property');counter=u64(counter,'derive counter')
 return hmac.new(bytes(seed),enc(['OFU-DERIVE-v1',bytes(h),domain,bytes(addr),prop,counter]),hashlib.sha256).digest()
def add_i64(a,b):
 a=i64(a);b=i64(b);r=a+b
 if not I64_MIN<=r<=I64_MAX:raise ValueError('i64 overflow')
 return r
def mul_fixed(a,b,scale=1000000):
 a=i64(a);b=i64(b);scale=u64(scale,'scale')
 if scale==0:raise ValueError('fixed scale')
 p=a*b;q=abs(p)//scale;q=-q if p<0 else q;r=p-q*scale;t=abs(r)*2
 if t>scale or (t==scale and q&1):q+=-1 if p<0 else 1
 if not I64_MIN<=q<=I64_MAX:raise ValueError('i64 overflow')
 return q
def isqrt(n):return math.isqrt(u64(n,'isqrt input'))
def reject(f):
 try:f()
 except Exception:return
 raise AssertionError('expected rejection')
def stable(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def manifest():return {'semanticManifestVersion':1,'canonicalProtocolVersion':'ofu-cbv-1','canonicalAddressVersion':1,'unicodeProfileVersion':UNICODE_PROFILE_VERSION,'numericContractVersion':1,'generatorSuite':'ofu-p2-reference','generatorSuiteVersion':1,'subsystems':{'identity':1,'test-substrate':1},'domains':{'kernel':1},'dependencies':{},'lawProfile':'baseline','genesis':{'parameters':{}}}
def build_corpus():
 seed=bytes(range(32));m=manifest();h=mh(m);desc,uid=universe(seed,h);cases=[]
 vals=[None,False,True,0,1,127,128,U64,-1,-2,I64_MIN,2**53-1,2**53,2**53+1,b'',b'\0\xff','e\u0301','é','\0','\u200b','😀',[1,'é',None],[],{'b':2,'a':1},{'nested':[0,{'z':'é'}]}]
 for i,v in enumerate(vals):
  b=enc(v);assert enc(dec(b))==b;cases.append({'kind':'value','id':i,'hex':b.hex()})
 adds=[[{'kind':'namespace','value':'astro'}],[{'kind':'u64','value':0}],[{'kind':'u64','value':U64}],[{'kind':'i64','value':I64_MIN}],[{'kind':'i64','value':I64_MAX}],[{'kind':'bytes','value':b''}],[{'kind':'namespace','value':'entity'},{'kind':'bytes','value':bytes.fromhex('000102ff')},{'kind':'i64','value':-1},{'kind':'u64','value':U64}]]
 for i,s in enumerate(adds):
  b=address(s);assert address(parse_address(b))==b;cases.append({'kind':'address','id':i,'segments':[{'kind':x['kind'],'value':x['value'].hex() if isinstance(x['value'],bytes) else str(x['value']) if isinstance(x['value'],int) else x['value']} for x in s],'hex':b.hex(),'derive':derive(seed,h,'domain-'+str(i),b,'property-'+str(i),i).hex()})
 for j,z in enumerate((L['addressSegmentBytes']-1,L['addressSegmentBytes'])):
  raw=bytes((i*17+3)&255 for i in range(z));b=address([{'kind':'bytes','value':raw}]);ix=8+j;cases.append({'kind':'addressPattern','id':ix,'pattern':{'name':'linear-u8','length':z,'multiplier':17,'addend':3},'addressBytes':len(b),'addressSha256':hashlib.sha256(b).hexdigest(),'derive':derive(seed,h,'domain-'+str(ix),b,'property-'+str(ix),ix).hex()})
 rejected_canonical=[('truncated-uint','11'),('nonminimal-uint-zero','118000'),('sint-even-alias','1000'),('sint-even-positive-alias','1002'),('uleb-overflow','11ffffffffffffffffff02'),('uleb-too-long','118080808080808080808000'),('invalid-utf8','2102c328'),('non-nfc-text','210365cc81'),('trailing-data','0000'),('unknown-tag','ff')]
 for name,x in rejected_canonical:reject(lambda x=x:dec(bytes.fromhex(x)));cases.append({'kind':'rejectCanonical','id':name,'hex':x})
 rejected_address=[('empty',''),('truncated','4f46554101'),('version','4f4655410201010178'),('zero-segments','4f4655410100'),('unknown-segment','4f4655410101ff'),('nonminimal-count','4f46554101810001'),('bytes-length-limit-plus-one','4f4655410101048120'),('namespace-length-limit-plus-one','4f4655410101018108')]
 for name,x in rejected_address:reject(lambda x=x:parse_address(bytes.fromhex(x)));cases.append({'kind':'rejectAddress','id':name,'hex':x})
 uid2=universe(bytes(reversed(range(32))),h)[1]
 identity_cases=[
  {'id':'baseline','universeIdentity':uid.hex(),'namespace':'person','stableKey':{'stableId':'alpha'},'entityIdentity':entity(uid,'person',{'stableId':'alpha'}).hex()},
  {'id':'namespace-change','universeIdentity':uid.hex(),'namespace':'organization','stableKey':{'stableId':'alpha'},'entityIdentity':entity(uid,'organization',{'stableId':'alpha'}).hex()},
  {'id':'universe-change','universeIdentity':uid2.hex(),'namespace':'person','stableKey':{'stableId':'alpha'},'entityIdentity':entity(uid2,'person',{'stableId':'alpha'}).hex()},
  {'id':'stable-key-change','universeIdentity':uid.hex(),'namespace':'person','stableKey':{'stableId':'beta'},'entityIdentity':entity(uid,'person',{'stableId':'beta'}).hex()}]
 numeric=[
  {'op':'addI64','args':[str(I64_MAX-1),'1'],'result':str(add_i64(I64_MAX-1,1))},
  {'op':'addI64','args':[str(I64_MIN+1),'-1'],'result':str(add_i64(I64_MIN+1,-1))},
  {'op':'mulFixed','args':['1500000','1500000','1000000'],'result':str(mul_fixed(1500000,1500000,1000000))},
  {'op':'mulFixed','args':['1','1','3'],'result':str(mul_fixed(1,1,3))},
  {'op':'mulFixed','args':['2','1','3'],'result':str(mul_fixed(2,1,3))},
  {'op':'mulFixed','args':['1','1','2'],'result':str(mul_fixed(1,1,2))},
  {'op':'mulFixed','args':['3','1','2'],'result':str(mul_fixed(3,1,2))},
  {'op':'mulFixed','args':['-3','1','2'],'result':str(mul_fixed(-3,1,2))},
  {'op':'isqrt','args':['0'],'result':'0'},{'op':'isqrt','args':['1'],'result':'1'},{'op':'isqrt','args':['15'],'result':'3'},{'op':'isqrt','args':['16'],'result':'4'},{'op':'isqrt','args':['17'],'result':'4'},{'op':'isqrt','args':[str(U64)],'result':str(math.isqrt(U64))}]
 generated=[]
 for i in range(512):
  d=hashlib.sha256(b'OFU-CORPUS-SEED-v1'+i.to_bytes(4,'big')).digest();x=int.from_bytes(d[:8],'big');a=address([{'kind':'namespace','value':'fuzz'},{'kind':'i64','value':x%(1<<63)-(1<<62)},{'kind':'u64','value':x}]);generated.append(derive(seed,h,'fuzz-domain',a,'field',i))
 assert len(enc(bytes(L['byteStringBytes'])))==L['inputBytes'];reject(lambda:enc(bytes(L['byteStringBytes']+1)));reject(lambda:enc([bytes(L['byteStringBytes']),None]));reject(lambda:address([{'kind':'bytes','value':bytes(L['addressSegmentBytes']+1)}]));reject(lambda:address([{'kind':'namespace','value':'a'*(L['addressNamespaceBytes']+1)}]));reject(lambda:enc(U64+1));reject(lambda:enc(I64_MIN-1));reject(lambda:add_i64(I64_MAX,1));reject(lambda:add_i64(I64_MIN,-1));reject(lambda:mul_fixed(I64_MAX,I64_MAX,1));reject(lambda:isqrt(U64+1));reject(lambda:norm(chr(0x0378)))
 p={'version':1,'protocol':'ofu-cbv-1','limits':L,'unicodeProfile':{'version':UNICODE_PROFILE_VERSION,'unicodeVersion':UNICODE_VERSION,'rangeCount':UNICODE_RANGE_COUNT,'rangeSha256':UNICODE_RANGE_SHA256},'seed':seed.hex(),'semanticManifest':m,'semanticManifestHash':h.hex(),'universeDescriptor':desc.hex(),'universeIdentity':uid.hex(),'entityIdentityScope':'UNIVERSE_SCOPED','entityIdentity':identity_cases[0]['entityIdentity'],'identityCases':identity_cases,'cases':cases,'boundaryCases':[{'id':'canonical-total-bytes','limit':L['inputBytes'],'byteStringPayloadAtExactLimit':L['byteStringBytes']},{'id':'canonical-depth','limit':L['depth']},{'id':'canonical-nodes','limit':L['nodes'],'mapPairsAtLimitMinusOne':49999,'mapPairsOverLimit':50000},{'id':'collection-items','limit':L['items']},{'id':'text-bytes','limit':L['textBytes']},{'id':'address-segments','limit':L['addressSegments']},{'id':'address-namespace-bytes','limit':L['addressNamespaceBytes']},{'id':'address-segment-bytes','limit':L['addressSegmentBytes']},{'id':'address-total-bytes','limit':L['addressBytes']}],'generatedCorpus':{'count':512,'seedDomain':'OFU-CORPUS-SEED-v1','addressNamespace':'fuzz','deriveDomain':'fuzz-domain','property':'field'},'numericCases':numeric,'oracleSelfTest':'PASS','generator':'tools/p2_oracle.py:build_corpus','fuzzSeeds':['0x5eed1234','0x00c0ffee','0x9e3779b9','0x243f6a88'],'fuzzIterationsPerSeed':6000}
 p['kernelDigest']=hashlib.sha256(enc(generated)).hexdigest();p['explicitOracleCases']=len(cases)+len(identity_cases)+len(numeric);p['oracleCaseCount']=p['explicitOracleCases']+p['generatedCorpus']['count'];p['corpusDigest']=hashlib.sha256(stable(p)).hexdigest();return p
if __name__=='__main__':print(json.dumps(build_corpus(),indent=2,ensure_ascii=False,sort_keys=True))
