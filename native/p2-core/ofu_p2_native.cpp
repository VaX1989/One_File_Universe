// IND-NATIVE-P2: deliberately small, standard-library-only native P2 parity experiment.
// This is not Runtime, not a broad ABI, and not a replacement authority for canonical JS P2.
#include <algorithm>
#include <array>
#include <cctype>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <limits>
#include <map>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace ofu {
struct Error:std::runtime_error{std::string code;Error(std::string c,std::string m):std::runtime_error(m),code(std::move(c)){}};
[[noreturn]] void fail(const char* c,const std::string& m){throw Error(c,m);}
using Bytes=std::vector<uint8_t>;
static constexpr uint64_t U64_MAXV=std::numeric_limits<uint64_t>::max();
static constexpr int64_t I64_MINV=std::numeric_limits<int64_t>::min();
static constexpr int64_t I64_MAXV=std::numeric_limits<int64_t>::max();
static constexpr size_t MAX_DEPTH=32,MAX_NODES=100000,MAX_INPUT=1048576,MAX_BYTES=1048572,MAX_TEXT=262144,MAX_ITEMS=65536;
static constexpr size_t MAX_ADDR_SEGMENTS=64,MAX_ADDR_NAMESPACE=1024,MAX_ADDR_SEGMENT=4096,MAX_ADDRESS=65536;

static int hx(char c){if(c>='0'&&c<='9')return c-'0';if(c>='a'&&c<='f')return c-'a'+10;if(c>='A'&&c<='F')return c-'A'+10;return -1;}
Bytes unhex(const std::string&s){if(s.size()%2)fail("SCHEMA_VIOLATION","odd hex");Bytes o(s.size()/2);for(size_t i=0;i<o.size();++i){int a=hx(s[2*i]),b=hx(s[2*i+1]);if(a<0||b<0)fail("SCHEMA_VIOLATION","bad hex");o[i]=(uint8_t)((a<<4)|b);}return o;}
std::string hex(const Bytes&b){static const char*d="0123456789abcdef";std::string s;s.reserve(b.size()*2);for(auto x:b){s+=d[x>>4];s+=d[x&15];}return s;}
void append(Bytes&o,const Bytes&b){o.insert(o.end(),b.begin(),b.end());}
void append(Bytes&o,const std::string&s){o.insert(o.end(),s.begin(),s.end());}
void put_uleb(Bytes&o,uint64_t x){do{uint8_t b=x&127;x>>=7;if(x)b|=128;o.push_back(b);}while(x);}
bool lex_less(const Bytes&a,const Bytes&b){return std::lexicographical_compare(a.begin(),a.end(),b.begin(),b.end());}

struct Sha256 {
  uint32_t h[8]={0x6a09e667u,0xbb67ae85u,0x3c6ef372u,0xa54ff53au,0x510e527fu,0x9b05688cu,0x1f83d9abu,0x5be0cd19u};
  uint64_t bits=0; uint8_t buf[64]{}; size_t used=0;
  static uint32_t rotr(uint32_t x,int n){return (x>>n)|(x<<(32-n));}
  void block(const uint8_t*p){
    static const uint32_t K[64]={0x428a2f98u,0x71374491u,0xb5c0fbcfu,0xe9b5dba5u,0x3956c25bu,0x59f111f1u,0x923f82a4u,0xab1c5ed5u,0xd807aa98u,0x12835b01u,0x243185beu,0x550c7dc3u,0x72be5d74u,0x80deb1feu,0x9bdc06a7u,0xc19bf174u,0xe49b69c1u,0xefbe4786u,0x0fc19dc6u,0x240ca1ccu,0x2de92c6fu,0x4a7484aau,0x5cb0a9dcu,0x76f988dau,0x983e5152u,0xa831c66du,0xb00327c8u,0xbf597fc7u,0xc6e00bf3u,0xd5a79147u,0x06ca6351u,0x14292967u,0x27b70a85u,0x2e1b2138u,0x4d2c6dfcu,0x53380d13u,0x650a7354u,0x766a0abbu,0x81c2c92eu,0x92722c85u,0xa2bfe8a1u,0xa81a664bu,0xc24b8b70u,0xc76c51a3u,0xd192e819u,0xd6990624u,0xf40e3585u,0x106aa070u,0x19a4c116u,0x1e376c08u,0x2748774cu,0x34b0bcb5u,0x391c0cb3u,0x4ed8aa4au,0x5b9cca4fu,0x682e6ff3u,0x748f82eeu,0x78a5636fu,0x84c87814u,0x8cc70208u,0x90befffau,0xa4506cebu,0xbef9a3f7u,0xc67178f2u};
    uint32_t w[64];for(int i=0;i<16;i++)w[i]=(uint32_t(p[4*i])<<24)|(uint32_t(p[4*i+1])<<16)|(uint32_t(p[4*i+2])<<8)|p[4*i+3];
    for(int i=16;i<64;i++){uint32_t x=w[i-15],y=w[i-2];uint32_t s0=rotr(x,7)^rotr(x,18)^(x>>3),s1=rotr(y,17)^rotr(y,19)^(y>>10);w[i]=w[i-16]+s0+w[i-7]+s1;}
    uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],z=h[7];
    for(int i=0;i<64;i++){uint32_t S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^((~e)&g),t1=z+S1+ch+K[i]+w[i],S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=S0+maj;z=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;}
    h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=z;
  }
  void update(const uint8_t*p,size_t n){bits+=uint64_t(n)*8;while(n){size_t k=std::min(n,64-used);std::memcpy(buf+used,p,k);used+=k;p+=k;n-=k;if(used==64){block(buf);used=0;}}}
  void update(const Bytes&b){update(b.data(),b.size());}
  void update(const std::string&s){update(reinterpret_cast<const uint8_t*>(s.data()),s.size());}
  Bytes final(){uint64_t total=bits;buf[used++]=0x80;if(used>56){while(used<64)buf[used++]=0;block(buf);used=0;}while(used<56)buf[used++]=0;for(int i=7;i>=0;i--)buf[used++]=(uint8_t)(total>>(8*i));block(buf);Bytes out(32);for(int i=0;i<8;i++){out[4*i]=h[i]>>24;out[4*i+1]=h[i]>>16;out[4*i+2]=h[i]>>8;out[4*i+3]=h[i];}return out;}
};
Bytes sha256(const Bytes&b){Sha256 s;s.update(b);return s.final();}
Bytes sha256(const std::string&s){Sha256 h;h.update(s);return h.final();}
Bytes hmac_sha256(const Bytes&key,const Bytes&msg){Bytes k=key;if(k.size()>64)k=sha256(k);k.resize(64,0);Bytes i(64),o(64);for(size_t x=0;x<64;x++){i[x]=k[x]^0x36;o[x]=k[x]^0x5c;}Sha256 a;a.update(i);a.update(msg);Bytes inner=a.final();Sha256 b;b.update(o);b.update(inner);return b.final();}

struct Value{
  enum Kind{NUL,BOOL,INT,BYTES,TEXT,ARRAY,MAP}kind=NUL;bool b=false;bool neg=false;uint64_t mag=0;Bytes bytes;std::vector<Value> arr;std::vector<std::pair<std::string,Value>> map;
  static Value i(const std::string&s){Value v;v.kind=INT;if(s.empty())fail("SCHEMA_VIOLATION","empty int");size_t p=0;if(s[0]=='-'){v.neg=true;p=1;}if(p==s.size())fail("SCHEMA_VIOLATION","bad int");unsigned __int128 n=0;for(;p<s.size();p++){if(!std::isdigit((unsigned char)s[p]))fail("SCHEMA_VIOLATION","bad int");n=n*10+(s[p]-'0');if(n>((unsigned __int128)U64_MAXV+1))fail("OUT_OF_DOMAIN","integer");}if(v.neg){if(n>=(((unsigned __int128)1)<<63)+1)fail("OUT_OF_DOMAIN","i64");v.mag=(uint64_t)n;}else{if(n>U64_MAXV)fail("OUT_OF_DOMAIN","u64");v.mag=(uint64_t)n;}return v;}
};
struct WireParser{
  const std::string&s;size_t p=0;size_t nodes=0;
  std::string until(char d){size_t q=s.find(d,p);if(q==std::string::npos)fail("SCHEMA_VIOLATION","wire delimiter");std::string x=s.substr(p,q-p);p=q+1;return x;}
  uint64_t count(){auto x=until(':');uint64_t n=0;if(x.empty())fail("SCHEMA_VIOLATION","count");for(char c:x){if(!std::isdigit((unsigned char)c))fail("SCHEMA_VIOLATION","count");n=n*10+(c-'0');if(n>MAX_NODES)fail("LIMIT_EXCEEDED","count");}return n;}
  Value parse(size_t d=0){if(d>MAX_DEPTH+2)fail("LIMIT_EXCEEDED","wire depth");if(++nodes>MAX_NODES+100)fail("LIMIT_EXCEEDED","wire nodes");if(p>=s.size())fail("SCHEMA_VIOLATION","wire eof");char t=s[p++];Value v;
    if(t=='N')return v;if(t=='F'||t=='T'){v.kind=Value::BOOL;v.b=t=='T';return v;}
    if(t=='I'){v=Value::i(until(';'));return v;}
    if(t=='B'||t=='S'){auto h=until(';');v.kind=t=='B'?Value::BYTES:Value::TEXT;v.bytes=unhex(h);return v;}
    if(t=='A'){auto n=count();v.kind=Value::ARRAY;if(n>MAX_ITEMS+1)fail("LIMIT_EXCEEDED","wire items");v.arr.reserve((size_t)n);for(uint64_t i=0;i<n;i++)v.arr.push_back(parse(d+1));return v;}
    if(t=='M'){auto n=count();v.kind=Value::MAP;if(n>MAX_ITEMS+1)fail("LIMIT_EXCEEDED","wire items");v.map.reserve((size_t)n);for(uint64_t i=0;i<n;i++){std::string kh=until(':');Bytes kb=unhex(kh);std::string k(kb.begin(),kb.end());v.map.push_back({k,parse(d+1)});}return v;}
    fail("SCHEMA_VIOLATION","wire tag");
  }
};

bool utf8_decode(const Bytes&b,std::vector<uint32_t>&cp){
  for(size_t i=0;i<b.size();){uint8_t c=b[i++];uint32_t x;int n;if(c<0x80){x=c;n=0;}else if((c&0xe0)==0xc0){x=c&31;n=1;if(x<2)return false;}else if((c&0xf0)==0xe0){x=c&15;n=2;}else if((c&0xf8)==0xf0){x=c&7;n=3;if(x>4)return false;}else return false;if(i+n>b.size())return false;for(int k=0;k<n;k++){uint8_t q=b[i++];if((q&0xc0)!=0x80)return false;x=(x<<6)|(q&63);}if((n==2&&x<0x800)||(n==3&&x<0x10000)||x>0x10ffff||(x>=0xd800&&x<=0xdfff))return false;cp.push_back(x);}return true;
}
Bytes utf8_encode(const std::vector<uint32_t>&cp){Bytes b;for(uint32_t x:cp){if(x<0x80)b.push_back(x);else if(x<0x800){b.push_back(0xc0|(x>>6));b.push_back(0x80|(x&63));}else if(x<0x10000){b.push_back(0xe0|(x>>12));b.push_back(0x80|((x>>6)&63));b.push_back(0x80|(x&63));}else{b.push_back(0xf0|(x>>18));b.push_back(0x80|((x>>12)&63));b.push_back(0x80|((x>>6)&63));b.push_back(0x80|(x&63));}}return b;}
bool explicitly_unassigned(uint32_t cp){return cp==0x0378||cp==0x0379||cp==0x0380||cp==0x0381||cp==0x0382||cp==0x0383;}
Bytes normalize_text(const Bytes&in){
  std::vector<uint32_t> cp;if(!utf8_decode(in,cp))fail("INVALID_UTF8","invalid utf8");
  std::vector<uint32_t> out;out.reserve(cp.size());
  for(size_t i=0;i<cp.size();++i){if(explicitly_unassigned(cp[i]))fail("OUT_OF_DOMAIN","unassigned scalar");if(i+1<cp.size()&&cp[i]==0x65&&cp[i+1]==0x301){out.push_back(0xe9);++i;}else out.push_back(cp[i]);}
  return utf8_encode(out);
}
bool is_nfc(const Bytes&b){return normalize_text(b)==b;}

struct Encoder{
  size_t nodes=0;
  Bytes emit(Bytes b){return b;}
  Bytes enc(const Value&v,size_t d=0){if(d>MAX_DEPTH)fail("LIMIT_EXCEEDED","depth");if(++nodes>MAX_NODES)fail("LIMIT_EXCEEDED","nodes");Bytes o;
    switch(v.kind){
      case Value::NUL:o={0};break;case Value::BOOL:o={(uint8_t)(v.b?2:1)};break;
      case Value::INT:if(!v.neg){o.push_back(0x11);put_uleb(o,v.mag);}else{if(v.mag==0||v.mag>(uint64_t(1)<<63))fail("OUT_OF_DOMAIN","signed");o.push_back(0x10);unsigned __int128 z=(unsigned __int128)v.mag*2-1;if(z>U64_MAXV)fail("OUT_OF_DOMAIN","signed");put_uleb(o,(uint64_t)z);}break;
      case Value::BYTES:if(v.bytes.size()>MAX_BYTES)fail("LIMIT_EXCEEDED","bytes");o.push_back(0x20);put_uleb(o,v.bytes.size());append(o,v.bytes);break;
      case Value::TEXT:{Bytes b=normalize_text(v.bytes);if(b.size()>MAX_TEXT)fail("LIMIT_EXCEEDED","text");o.push_back(0x21);put_uleb(o,b.size());append(o,b);break;}
      case Value::ARRAY:if(v.arr.size()>MAX_ITEMS)fail("LIMIT_EXCEEDED","items");o.push_back(0x30);put_uleb(o,v.arr.size());for(auto&x:v.arr)append(o,enc(x,d+1));break;
      case Value::MAP:{if(v.map.size()>MAX_ITEMS)fail("LIMIT_EXCEEDED","items");std::vector<std::pair<Bytes,Bytes>> ps;ps.reserve(v.map.size());for(auto&kv:v.map){Value k;k.kind=Value::TEXT;k.bytes=Bytes(kv.first.begin(),kv.first.end());Bytes kb=enc(k,d+1),vb=enc(kv.second,d+1);for(auto&p:ps)if(p.first==kb)fail("DUPLICATE_NORMALIZED_KEY","key collision");ps.push_back({std::move(kb),std::move(vb)});}std::sort(ps.begin(),ps.end(),[](auto&a,auto&b){return lex_less(a.first,b.first);});o.push_back(0x31);put_uleb(o,ps.size());for(auto&p:ps){append(o,p.first);append(o,p.second);}break;}
    }
    return emit(std::move(o));
  }
};
Bytes encode(const Value&v){Encoder e;Bytes out=e.enc(v);if(out.size()>MAX_INPUT)fail("LIMIT_EXCEEDED","encoded value too large");return out;}

struct Decoder{
  const Bytes&b;size_t p=0,nodes=0;
  uint8_t rd(){if(p>=b.size())fail("TRUNCATED","input");return b[p++];}
  uint64_t vu(){uint64_t x=0;int sh=0;for(int c=0;c<10;c++){uint8_t q=rd(),z=q&127;if(c==9&&(q&0xfe))fail("OVERFLOW","varint");x|=uint64_t(z)<<sh;if(!(q&128)){if(c&&z==0)fail("NON_MINIMAL","varint");return x;}sh+=7;}fail("OVERFLOW","varint long");}
  Bytes take(size_t n){if(p+n>b.size())fail("TRUNCATED","length");Bytes o(b.begin()+p,b.begin()+p+n);p+=n;return o;}
  Value one(size_t d=0){if(d>MAX_DEPTH)fail("LIMIT_EXCEEDED","depth");if(++nodes>MAX_NODES)fail("LIMIT_EXCEEDED","nodes");uint8_t t=rd();Value v;
    if(t==0)return v;if(t==1||t==2){v.kind=Value::BOOL;v.b=t==2;return v;}
    if(t==0x11){v.kind=Value::INT;v.mag=vu();return v;}
    if(t==0x10){uint64_t z=vu();if(!(z&1))fail("NON_CANONICAL","signed alias");v.kind=Value::INT;v.neg=true;v.mag=(z+1)/2;return v;}
    if(t==0x20){uint64_t z=vu();if(z>MAX_BYTES)fail("LIMIT_EXCEEDED","bytes");v.kind=Value::BYTES;v.bytes=take((size_t)z);return v;}
    if(t==0x21){uint64_t z=vu();if(z>MAX_TEXT)fail("LIMIT_EXCEEDED","text");v.kind=Value::TEXT;v.bytes=take((size_t)z);if(!is_nfc(v.bytes))fail("NON_NFC","text");return v;}
    if(t==0x30){uint64_t z=vu();if(z>MAX_ITEMS)fail("LIMIT_EXCEEDED","items");v.kind=Value::ARRAY;for(uint64_t i=0;i<z;i++)v.arr.push_back(one(d+1));return v;}
    if(t==0x31){uint64_t z=vu();if(z>MAX_ITEMS)fail("LIMIT_EXCEEDED","items");v.kind=Value::MAP;Bytes prev;bool has=false;for(uint64_t i=0;i<z;i++){size_t st=p;Value k=one(d+1);Bytes raw(b.begin()+st,b.begin()+p);if(k.kind!=Value::TEXT)fail("NON_CANONICAL_ORDER","map key");if(has&&!lex_less(prev,raw))fail(prev==raw?"DUPLICATE_KEY":"NON_CANONICAL_ORDER","map order");has=true;prev=raw;std::string ks(k.bytes.begin(),k.bytes.end());v.map.push_back({ks,one(d+1)});}return v;}
    fail("UNKNOWN_TAG","tag");
  }
  Value all(){if(b.size()>MAX_INPUT)fail("LIMIT_EXCEEDED","input");Value v=one();if(p!=b.size())fail("TRAILING_BYTES","trailing");return v;}
};
Value decode(const Bytes&b){Decoder d{b};return d.all();}

const Value* map_get(const Value&v,const std::string&k){if(v.kind!=Value::MAP)return nullptr;for(auto&x:v.map)if(x.first==k)return &x.second;return nullptr;}
std::string text_of(const Value&v){if(v.kind!=Value::TEXT)fail("SCHEMA_VIOLATION","text expected");Bytes n=normalize_text(v.bytes);return std::string(n.begin(),n.end());}
uint64_t uint_of(const Value&v){if(v.kind!=Value::INT||v.neg)fail("SCHEMA_VIOLATION","u64 expected");return v.mag;}
void exact_keys(const Value&v,const std::vector<std::string>&keys){if(v.kind!=Value::MAP||v.map.size()!=keys.size())fail("SCHEMA_VIOLATION","manifest fields");for(auto&k:keys)if(!map_get(v,k))fail("SCHEMA_VIOLATION","manifest field "+k);}
void validate_version_map(const Value&v){if(v.kind!=Value::MAP)fail("SCHEMA_VIOLATION","version map");for(auto&kv:v.map){Bytes k(kv.first.begin(),kv.first.end());if(normalize_text(k).empty()||uint_of(kv.second)<1)fail("SCHEMA_VIOLATION","version map entry");}}
void validate_dependencies(const Value&v){if(v.kind!=Value::MAP)fail("SCHEMA_VIOLATION","dependencies");for(auto&kv:v.map){if(kv.first.empty()||text_of(kv.second).empty())fail("SCHEMA_VIOLATION","dependency");}}
void validate_manifest(const Value&m){
  static const std::vector<std::string> keys={"semanticManifestVersion","canonicalProtocolVersion","canonicalAddressVersion","unicodeProfileVersion","numericContractVersion","generatorSuite","generatorSuiteVersion","subsystems","domains","dependencies","lawProfile","genesis"};
  exact_keys(m,keys);
  if(uint_of(*map_get(m,"semanticManifestVersion"))!=1)fail("UNSUPPORTED_VERSION","manifest");
  if(text_of(*map_get(m,"canonicalProtocolVersion"))!="ofu-cbv-1")fail("UNSUPPORTED_VERSION","protocol");
  if(uint_of(*map_get(m,"canonicalAddressVersion"))!=1)fail("UNSUPPORTED_VERSION","address version");
  if(text_of(*map_get(m,"unicodeProfileVersion"))!="ofu-unicode-15.1.0-v1")fail("UNSUPPORTED_VERSION","unicode");
  if(uint_of(*map_get(m,"numericContractVersion"))!=1)fail("UNSUPPORTED_VERSION","numeric");
  if(text_of(*map_get(m,"generatorSuite")).empty()||uint_of(*map_get(m,"generatorSuiteVersion"))<1)fail("SCHEMA_VIOLATION","generator");
  validate_version_map(*map_get(m,"subsystems"));validate_version_map(*map_get(m,"domains"));validate_dependencies(*map_get(m,"dependencies"));
  if(text_of(*map_get(m,"lawProfile")).empty()||map_get(m,"genesis")->kind!=Value::MAP)fail("SCHEMA_VIOLATION","manifest");
  (void)encode(*map_get(m,"genesis"));
}
Bytes manifest_hash(const Value&m){validate_manifest(m);return sha256(encode(m));}
Value txt(const std::string&s){Value v;v.kind=Value::TEXT;v.bytes=Bytes(s.begin(),s.end());return v;}
Value byt(const Bytes&b){Value v;v.kind=Value::BYTES;v.bytes=b;return v;}
Value ui(uint64_t x){Value v;v.kind=Value::INT;v.mag=x;return v;}
Value mp(std::initializer_list<std::pair<std::string,Value>> x){Value v;v.kind=Value::MAP;v.map=x;return v;}
Value ar(std::initializer_list<Value>x){Value v;v.kind=Value::ARRAY;v.arr=x;return v;}
Bytes domain_hash(const std::string&tag,const Value&v){Bytes in(tag.begin(),tag.end());in.push_back(0);append(in,encode(v));return sha256(in);}
std::pair<Bytes,Bytes> universe(const Bytes&seed,const Bytes&mh){if(seed.size()!=32||mh.size()!=32)fail("SCHEMA_VIOLATION","identity sizes");Value d=mp({{"canonicalProtocolVersion",txt("ofu-cbv-1")},{"masterSeed",byt(seed)},{"semanticManifestHash",byt(mh)}});Bytes db=encode(d);Bytes pre({'O','F','U','-','U','N','I','V','E','R','S','E','-','v','1',0});append(pre,db);return {db,sha256(pre)};}
Bytes entity(const Bytes&uid,const std::string&ns,const Value&key){if(uid.size()!=32||ns.empty())fail("SCHEMA_VIOLATION","entity");Value d=mp({{"universeIdentity",byt(uid)},{"namespace",txt(ns)},{"stableKey",key}});return domain_hash("OFU-ENTITY-v1",d);}

Bytes address(const Value&segments){
  if(segments.kind!=Value::ARRAY||segments.arr.empty()||segments.arr.size()>MAX_ADDR_SEGMENTS)fail(segments.kind==Value::ARRAY?"LIMIT_EXCEEDED":"SCHEMA_VIOLATION","address segments");
  Bytes o={'O','F','U','A',1};put_uleb(o,segments.arr.size());
  for(auto&s:segments.arr){const Value*k=map_get(s,"kind"),*v=map_get(s,"value");if(s.kind!=Value::MAP||s.map.size()!=2||!k||!v)fail("SCHEMA_VIOLATION","segment");std::string kind=text_of(*k);
    if(kind=="namespace"){std::string q=text_of(*v);Bytes b(q.begin(),q.end());if(b.size()>MAX_ADDR_NAMESPACE)fail("LIMIT_EXCEEDED","namespace");o.push_back(1);put_uleb(o,b.size());append(o,b);}
    else if(kind=="u64"){uint64_t x=uint_of(*v);o.push_back(2);for(int i=7;i>=0;i--)o.push_back((uint8_t)(x>>(8*i)));}
    else if(kind=="i64"){if(v->kind!=Value::INT)fail("SCHEMA_VIOLATION","i64");uint64_t raw;if(v->neg){if(v->mag>(uint64_t(1)<<63))fail("OUT_OF_DOMAIN","i64");raw=uint64_t(0)-v->mag;}else{if(v->mag>(uint64_t)I64_MAXV)fail("OUT_OF_DOMAIN","i64");raw=v->mag;}o.push_back(3);for(int i=7;i>=0;i--)o.push_back((uint8_t)(raw>>(8*i)));}
    else if(kind=="bytes"){if(v->kind!=Value::BYTES)fail("SCHEMA_VIOLATION","address bytes");if(v->bytes.size()>MAX_ADDR_SEGMENT)fail("LIMIT_EXCEEDED","address bytes");o.push_back(4);put_uleb(o,v->bytes.size());append(o,v->bytes);}
    else fail("UNKNOWN_TAG","address segment");
    if(o.size()>MAX_ADDRESS)fail("LIMIT_EXCEEDED","address");
  }return o;
}
uint64_t addr_vu(const Bytes&b,size_t&p){uint64_t x=0;int sh=0;for(int c=0;c<3;c++){if(p>=b.size())fail("TRUNCATED","address");uint8_t q=b[p++],z=q&127;x|=uint64_t(z)<<sh;if(!(q&128)){if(c&&z==0)fail("NON_MINIMAL","address length");return x;}sh+=7;}fail("OVERFLOW","address length");}
void validate_address(const Bytes&b){if(b.size()>MAX_ADDRESS)fail("LIMIT_EXCEEDED","address");size_t p=0;auto rd=[&](){if(p>=b.size())fail("TRUNCATED","address");return b[p++];};if(b.size()<5)fail("TRUNCATED","address");if(rd()!='O'||rd()!='F'||rd()!='U'||rd()!='A')fail("NON_CANONICAL","magic");if(rd()!=1)fail("UNSUPPORTED_VERSION","address");uint64_t n=addr_vu(b,p);if(n<1)fail("OUT_OF_DOMAIN","zero segments");if(n>MAX_ADDR_SEGMENTS)fail("LIMIT_EXCEEDED","segments");for(uint64_t i=0;i<n;i++){uint8_t t=rd();if(t==1){uint64_t z=addr_vu(b,p);if(z>MAX_ADDR_NAMESPACE)fail("LIMIT_EXCEEDED","namespace");if(p+z>b.size())fail("TRUNCATED","namespace");Bytes q(b.begin()+p,b.begin()+p+z);p+=z;if(!is_nfc(q))fail("NON_NFC","namespace");}else if(t==2||t==3){if(p+8>b.size())fail("TRUNCATED","integer");p+=8;}else if(t==4){uint64_t z=addr_vu(b,p);if(z>MAX_ADDR_SEGMENT)fail("LIMIT_EXCEEDED","bytes");if(p+z>b.size())fail("TRUNCATED","bytes");p+=z;}else fail("UNKNOWN_TAG","address segment");}if(p!=b.size())fail("TRAILING_BYTES","address");}
Bytes derive(const Bytes&seed,const Bytes&mh,const std::string&domain,const Bytes&addr,const std::string&prop,uint64_t counter){if(seed.size()!=32||mh.size()!=32||domain.empty()||prop.empty())fail("SCHEMA_VIOLATION","derive");validate_address(addr);Value q=ar({txt("OFU-DERIVE-v1"),byt(mh),txt(domain),byt(addr),txt(prop),ui(counter)});return hmac_sha256(seed,encode(q));}

int64_t parse_i64(const std::string&s){if(s.empty())fail("SCHEMA_VIOLATION","i64");bool neg=s[0]=='-';size_t p=neg;unsigned __int128 n=0;for(;p<s.size();++p){if(!std::isdigit((unsigned char)s[p]))fail("SCHEMA_VIOLATION","i64");n=n*10+(s[p]-'0');}if(neg){if(n>(((unsigned __int128)1)<<63))fail("OUT_OF_DOMAIN","i64");if(n==(((unsigned __int128)1)<<63))return I64_MINV;return -(int64_t)n;}if(n>(unsigned __int128)I64_MAXV)fail("OUT_OF_DOMAIN","i64");return (int64_t)n;}
uint64_t parse_u64(const std::string&s){unsigned __int128 n=0;if(s.empty())fail("SCHEMA_VIOLATION","u64");for(char c:s){if(!std::isdigit((unsigned char)c))fail("SCHEMA_VIOLATION","u64");n=n*10+(c-'0');if(n>U64_MAXV)fail("OUT_OF_DOMAIN","u64");}return (uint64_t)n;}
int64_t add_i64(int64_t a,int64_t b){__int128 r=(__int128)a+b;if(r<I64_MINV||r>I64_MAXV)fail("OVERFLOW","add");return (int64_t)r;}
int64_t mul_fixed(int64_t a,int64_t b,uint64_t scale){if(!scale)fail("OUT_OF_DOMAIN","scale");__int128 p=(__int128)a*b;__int128 q=p/(int64_t)scale;__int128 r=p-q*(int64_t)scale;unsigned __int128 twice=(r<0?-r:r)*2;unsigned __int128 sc=scale;if(twice>sc||(twice==sc&&(q&1)))q+=p<0?-1:1;if(q<I64_MINV||q>I64_MAXV)fail("OVERFLOW","mul");return (int64_t)q;}
uint64_t isqrt(uint64_t n){uint64_t lo=0,hi=uint64_t(1)<<32;while(lo+1<hi){uint64_t m=lo+(hi-lo)/2;if((unsigned __int128)m*m<=n)lo=m;else hi=m;}return lo;}

std::vector<std::string> split(const std::string&s){std::vector<std::string> v;size_t p=0;while(p<s.size()){while(p<s.size()&&s[p]==' ')p++;if(p>=s.size())break;size_t q=s.find(' ',p);if(q==std::string::npos)q=s.size();v.push_back(s.substr(p,q-p));p=q;}return v;}
}
int main(){using namespace ofu;std::ios::sync_with_stdio(false);std::string line;while(std::getline(std::cin,line)){if(line.empty())continue;try{size_t sp=line.find(' ');std::string cmd=sp==std::string::npos?line:line.substr(0,sp),rest=sp==std::string::npos?"":line.substr(sp+1);auto args=split(rest);
    if(cmd=="ENC"){WireParser p{rest};Value v=p.parse();if(p.p!=rest.size())fail("SCHEMA_VIOLATION","wire trailing");std::cout<<"OK "<<hex(encode(v))<<"\n";}
    else if(cmd=="DEC"){(void)decode(unhex(rest));std::cout<<"OK\n";}
    else if(cmd=="ADDR"){WireParser p{rest};Value v=p.parse();if(p.p!=rest.size())fail("SCHEMA_VIOLATION","wire trailing");std::cout<<"OK "<<hex(address(v))<<"\n";}
    else if(cmd=="PARSEADDR"){validate_address(unhex(rest));std::cout<<"OK\n";}
    else if(cmd=="MH"){WireParser p{rest};Value v=p.parse();std::cout<<"OK "<<hex(manifest_hash(v))<<"\n";}
    else if(cmd=="UNIVERSE"){if(args.size()!=2)fail("SCHEMA_VIOLATION","args");auto u=universe(unhex(args[0]),unhex(args[1]));std::cout<<"OK "<<hex(u.first)<<" "<<hex(u.second)<<"\n";}
    else if(cmd=="ENTITY"){if(args.size()!=3)fail("SCHEMA_VIOLATION","args");WireParser p{args[2]};Value v=p.parse();Bytes nsb=unhex(args[1]);std::cout<<"OK "<<hex(entity(unhex(args[0]),std::string(nsb.begin(),nsb.end()),v))<<"\n";}
    else if(cmd=="DERIVE"){if(args.size()!=6)fail("SCHEMA_VIOLATION","args");Bytes d=unhex(args[2]),pr=unhex(args[4]);std::cout<<"OK "<<hex(derive(unhex(args[0]),unhex(args[1]),std::string(d.begin(),d.end()),unhex(args[3]),std::string(pr.begin(),pr.end()),parse_u64(args[5])))<<"\n";}
    else if(cmd=="ADD"){if(args.size()!=2)fail("SCHEMA_VIOLATION","args");std::cout<<"OK "<<add_i64(parse_i64(args[0]),parse_i64(args[1]))<<"\n";}
    else if(cmd=="MUL"){if(args.size()!=3)fail("SCHEMA_VIOLATION","args");std::cout<<"OK "<<mul_fixed(parse_i64(args[0]),parse_i64(args[1]),parse_u64(args[2]))<<"\n";}
    else if(cmd=="ISQRT"){if(args.size()!=1)fail("SCHEMA_VIOLATION","args");std::cout<<"OK "<<isqrt(parse_u64(args[0]))<<"\n";}
    else fail("SCHEMA_VIOLATION","unknown command");
  }catch(const Error&e){std::cout<<"ERR "<<e.code<<"\n";}catch(const std::exception&e){std::cout<<"ERR INTERNAL\n";}}
}
