// Tiny C micro-host for the IND-CABI-MICROHOST feasibility capsule.
#include "ofu_p2_cabi.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int expect_bytes(const unsigned char *p,size_t n,const char *s){
  const size_t z=strlen(s);
  return n==z && memcmp(p,s,z)==0;
}

static int self_test(void){
  if(ofu_p2_cabi_version()!=OFU_P2_C_ABI_VERSION) return 10;
  ofu_p2_result_v1 r;
  unsigned char out[64];
  memset(out,0,sizeof(out));

  int32_t st=ofu_p2_call_v1(999u,(const uint8_t*)"ADD 2 3",7,out,sizeof(out),&r,sizeof(r));
  if(st!=OFU_P2_STATUS_UNSUPPORTED_ABI || r.status!=OFU_P2_STATUS_UNSUPPORTED_ABI) return 11;

  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)"ADD 2 3",7,out,sizeof(out),NULL,0);
  if(st!=OFU_P2_STATUS_INVALID_ARGUMENT) return 12;

  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,NULL,1,out,sizeof(out),&r,sizeof(r));
  if(st!=OFU_P2_STATUS_INVALID_ARGUMENT || r.status!=OFU_P2_STATUS_INVALID_ARGUMENT) return 13;

  unsigned char canary[8]; memset(canary,0xA5,sizeof(canary));
  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)"ADD 2 3",7,canary,2,&r,sizeof(r));
  if(st!=OFU_P2_STATUS_BUFFER_TOO_SMALL || r.bytes_written!=0 || r.bytes_required!=4) return 14;
  for(size_t i=0;i<sizeof(canary);++i) if(canary[i]!=0xA5) return 15;

  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)"ADD 2 3",7,out,sizeof(out),&r,sizeof(r));
  if(st!=OFU_P2_STATUS_OK || r.rejection_class!=OFU_P2_REJECTION_NONE || !expect_bytes(out,(size_t)r.bytes_written,"OK 5")) return 16;

  const char *overflow="ADD 9223372036854775807 1";
  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)overflow,strlen(overflow),out,sizeof(out),&r,sizeof(r));
  if(st!=OFU_P2_STATUS_REJECTED || r.rejection_class!=OFU_P2_REJECTION_OVERFLOW || !expect_bytes(out,(size_t)r.bytes_written,"ERR OVERFLOW")) return 17;

  const char *unknown="NOPE";
  st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)unknown,strlen(unknown),out,sizeof(out),&r,sizeof(r));
  if(st!=OFU_P2_STATUS_REJECTED || r.rejection_class!=OFU_P2_REJECTION_SCHEMA_VIOLATION || !expect_bytes(out,(size_t)r.bytes_written,"ERR SCHEMA_VIOLATION")) return 18;

  puts("OFU_P2_CABI_SELF_TEST=PASS");
  return 0;
}

int main(int argc,char **argv){
  const int meta=argc>1 && strcmp(argv[1],"--meta")==0;
  if(argc>1 && strcmp(argv[1],"--self-test")==0) return self_test();

  char *line=(char*)malloc((size_t)OFU_P2_C_ABI_MAX_REQUEST_BYTES+2u);
  unsigned char *out=(unsigned char*)malloc((size_t)OFU_P2_C_ABI_MAX_RESPONSE_BYTES);
  if(!line || !out){free(line);free(out);return 20;}

  while(fgets(line,(int)OFU_P2_C_ABI_MAX_REQUEST_BYTES+2,stdin)){
    size_t n=strlen(line);
    while(n && (line[n-1]=='\n' || line[n-1]=='\r')) line[--n]='\0';
    ofu_p2_result_v1 r;
    const int32_t st=ofu_p2_call_v1(OFU_P2_C_ABI_VERSION,(const uint8_t*)line,(uint64_t)n,out,OFU_P2_C_ABI_MAX_RESPONSE_BYTES,&r,sizeof(r));
    if(meta) printf("META %d %d %llu %llu|",(int)st,(int)r.rejection_class,(unsigned long long)r.bytes_written,(unsigned long long)r.bytes_required);
    if(r.bytes_written) fwrite(out,1,(size_t)r.bytes_written,stdout);
    fputc('\n',stdout);
    if(st==OFU_P2_STATUS_INTERNAL || st==OFU_P2_STATUS_INVALID_ARGUMENT || st==OFU_P2_STATUS_UNSUPPORTED_ABI || st==OFU_P2_STATUS_BUFFER_TOO_SMALL){
      if(!meta){free(line);free(out);return 21;}
    }
  }
  free(line);free(out);return 0;
}
