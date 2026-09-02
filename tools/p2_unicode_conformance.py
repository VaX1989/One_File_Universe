#!/usr/bin/env python3
import hashlib,json,os,sys,unicodedata
sys.path.insert(0,os.path.dirname(__file__))
import p2_oracle as O
if len(sys.argv)!=3:raise SystemExit('usage: p2_unicode_conformance.py UnicodeData.txt NormalizationTest.txt')
ud,nt=sys.argv[1:]
def sha(p):return hashlib.sha256(open(p,'rb').read()).hexdigest()
def seq(s):return ''.join(chr(int(x,16)) for x in s.strip().split() if x)
text=open(nt,encoding='utf-8').read()
if 'NormalizationTest-15.1.0.txt' not in text:raise SystemExit('NormalizationTest version mismatch')
rows=assertions=0
for raw in text.splitlines():
 line=raw.split('#',1)[0].strip()
 if not line or line.startswith('@'):continue
 f=line.split(';')
 if len(f)<5:continue
 c1,c2,c3,c4,c5=map(seq,f[:5])
 for x in (c1,c2,c3,c4,c5):O.inspect_text(x)
 if not (O.norm(c1)==c2 and O.norm(c2)==c2 and O.norm(c3)==c2 and O.norm(c4)==c4 and O.norm(c5)==c4):raise SystemExit(f'NFC conformance failure at row {rows+1}')
 rows+=1;assertions+=5
result={'status':'PASS','pythonUnicodeVersion':unicodedata.unidata_version,'unicodeVersion':O.UNICODE_VERSION,'profileVersion':O.UNICODE_PROFILE_VERSION,'rangeCount':O.UNICODE_RANGE_COUNT,'rangeSha256':O.UNICODE_RANGE_SHA256,'unicodeDataSha256':sha(ud),'normalizationTestSha256':sha(nt),'normalizationRows':rows,'nfcAssertions':assertions}
print(json.dumps(result,sort_keys=True))
