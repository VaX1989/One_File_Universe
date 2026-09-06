#!/usr/bin/env python3
"""Independent Python oracle for V1X-17 research fixed-point/hash witnesses."""
import hashlib,json
from pathlib import Path
P=1_000_000
G=json.loads((Path(__file__).parent/'golden-frontier.json').read_text())
def enc(v):
    if v is None:return'null'
    if v is True:return'true'
    if v is False:return'false'
    if isinstance(v,str):return json.dumps(v,separators=(',',':'))
    if isinstance(v,int):return '{"$bigint":'+json.dumps(str(v))+'}'
    if isinstance(v,list):return '['+','.join(enc(x) for x in v)+']'
    if isinstance(v,dict):return '{'+','.join(json.dumps(k)+':'+enc(v[k]) for k in sorted(v))+'}'
    raise TypeError(type(v))
def dig(v,d='OFU-V1X17-v1'):return hashlib.sha256((d+'\0'+enc(v)).encode()).hexdigest()
def rid(k,v):return 'r17:'+k+':'+dig(v,'OFU-V1X17-ID-'+k+'-v1')
def ppm(v,q):return v*q//P
assert hashlib.sha256(b'abc').hexdigest()=='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
lp=rid('lineage-seed',{'seed':'producer'});lc=rid('lineage-seed',{'seed':'consumer'});lg=rid('lineage-seed',{'seed':'ghost'})
p1=rid('population',{'lineageId':lp,'patch':'1'});p2=rid('population',{'lineageId':lp,'patch':'2'});pc=rid('population',{'lineageId':lc,'patch':'c'});pg=rid('population',{'lineageId':lg,'patch':'g'})
payload={'environmentEpochKey':'env:1','resources':[{'populationId':p1,'energyU':1000,'nutrients':[{'id':'N','availableU':100}]},{'populationId':p2,'energyU':1000,'nutrients':[{'id':'N','availableU':100}]},{'populationId':pc,'energyU':0,'nutrients':[{'id':'N','availableU':5}]},{'populationId':pg,'energyU':0,'nutrients':[]}]}
pd=dig({'type':'ECOLOGY','payload':payload},'OFU-V1X17-EVENT-PAYLOAD-v1');eid=rid('event',{'type':'ECOLOGY','p4OperationKey':'p4:eco:1','payloadDigest':pd});assert eid==G['ecologyEventId']
# independent ecology arithmetic
p1after=1000-ppm(1000,50_000)-ppm(1000,100_000)-ppm(1000,50_000)+ppm(500,20_000)+100
p2birth=ppm(500,100_000)*(1500-500)//1500;p2after=500-ppm(500,50_000)-ppm(500,20_000)+ppm(1000,50_000)+p2birth
captured=ppm(ppm(1000,100_000)*5,200_000);cbirth=min(ppm(100,100_000)*(500-100)//500,captured//20,5);cafter=100-ppm(100,20_000)+cbirth
assert {'p1':str(p1after),'p2':str(p2after),'consumer':str(cafter),'ghost':'0'}==G['populationAfter']
# mutation hash / modulo abstraction
mh=dig({'lineageId':lc,'traitId':'size','p4OperationKey':'p4:mut:1'},'OFU-V1X17-MUTATION-v1');assert mh==G['mutationRngDigest'];fires=int(mh[:16],16)%P<500_000;delta=(int(mh[16:32],16)%7)-3 if fires else 0;after=max(1,min(100,20+delta));assert str(after-20)==G['mutationDeltaI']
# lifecycle count conservation
j=100-ppm(100,100_000)-ppm(100,300_000)+20;a=50-ppm(50,200_000)+ppm(100,300_000);assert {'juvenile':str(j),'adult':str(a)}==G['lifecycleAfter'] and j+a==150
print('V1X-17 independent Python oracle: PASS')
print(json.dumps({'ecologyEventId':eid,'mutationRngDigest':mh,'populationAfter':G['populationAfter'],'lifecycleAfter':G['lifecycleAfter']},indent=2))
