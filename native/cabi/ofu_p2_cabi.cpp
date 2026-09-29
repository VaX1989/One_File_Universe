// IND-CABI-MICROHOST: deliberately tiny C-shaped feasibility boundary over IND-NATIVE-P2.
// This is not Runtime and does not freeze a broad provider/engine ABI.
#include "ofu_p2_cabi.h"

#include <algorithm>
#include <cstring>
#include <string>
#include <utility>
#include <vector>

#define main ofu_p2_native_embedded_cli_main
#include "../p2-core/ofu_p2_native.cpp"
#undef main

namespace {

struct DispatchResult {
  std::string transcript;
  int32_t status = OFU_P2_STATUS_OK;
  int32_t rejection = OFU_P2_REJECTION_NONE;
};

int32_t rejection_class(const std::string& code) {
  if(code=="SCHEMA_VIOLATION") return OFU_P2_REJECTION_SCHEMA_VIOLATION;
  if(code=="OUT_OF_DOMAIN") return OFU_P2_REJECTION_OUT_OF_DOMAIN;
  if(code=="LIMIT_EXCEEDED") return OFU_P2_REJECTION_LIMIT_EXCEEDED;
  if(code=="NON_MINIMAL") return OFU_P2_REJECTION_NON_MINIMAL;
  if(code=="OVERFLOW") return OFU_P2_REJECTION_OVERFLOW;
  if(code=="TRUNCATED") return OFU_P2_REJECTION_TRUNCATED;
  if(code=="TRAILING_BYTES") return OFU_P2_REJECTION_TRAILING_BYTES;
  if(code=="UNKNOWN_TAG") return OFU_P2_REJECTION_UNKNOWN_TAG;
  if(code=="NON_CANONICAL_ORDER") return OFU_P2_REJECTION_NON_CANONICAL_ORDER;
  if(code=="DUPLICATE_KEY") return OFU_P2_REJECTION_DUPLICATE_KEY;
  if(code=="DUPLICATE_NORMALIZED_KEY") return OFU_P2_REJECTION_DUPLICATE_NORMALIZED_KEY;
  if(code=="NON_NFC") return OFU_P2_REJECTION_NON_NFC;
  if(code=="UNSUPPORTED_VERSION") return OFU_P2_REJECTION_UNSUPPORTED_VERSION;
  if(code=="NON_CANONICAL") return OFU_P2_REJECTION_NON_CANONICAL;
  if(code=="INVALID_UTF8") return OFU_P2_REJECTION_INVALID_UTF8;
  if(code=="INTERNAL") return OFU_P2_REJECTION_INTERNAL;
  return OFU_P2_REJECTION_OTHER;
}

DispatchResult dispatch(const std::string& line) {
  using namespace ofu;
  try {
    const size_t sp=line.find(' ');
    const std::string cmd=sp==std::string::npos?line:line.substr(0,sp);
    const std::string rest=sp==std::string::npos?"":line.substr(sp+1);
    const auto args=split(rest);
    if(cmd=="ENC"){
      WireParser p{rest}; Value v=p.parse();
      if(p.p!=rest.size()) fail("SCHEMA_VIOLATION","wire trailing");
      return {"OK "+hex(encode(v)),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="DEC"){
      (void)decode(unhex(rest));
      return {"OK",OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="ADDR"){
      WireParser p{rest}; Value v=p.parse();
      if(p.p!=rest.size()) fail("SCHEMA_VIOLATION","wire trailing");
      return {"OK "+hex(address(v)),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="PARSEADDR"){
      validate_address(unhex(rest));
      return {"OK",OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="MH"){
      WireParser p{rest}; Value v=p.parse();
      return {"OK "+hex(manifest_hash(v)),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="UNIVERSE"){
      if(args.size()!=2) fail("SCHEMA_VIOLATION","args");
      auto u=universe(unhex(args[0]),unhex(args[1]));
      return {"OK "+hex(u.first)+" "+hex(u.second),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="ENTITY"){
      if(args.size()!=3) fail("SCHEMA_VIOLATION","args");
      WireParser p{args[2]}; Value v=p.parse(); Bytes nsb=unhex(args[1]);
      return {"OK "+hex(entity(unhex(args[0]),std::string(nsb.begin(),nsb.end()),v)),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="DERIVE"){
      if(args.size()!=6) fail("SCHEMA_VIOLATION","args");
      Bytes d=unhex(args[2]),pr=unhex(args[4]);
      return {"OK "+hex(derive(unhex(args[0]),unhex(args[1]),std::string(d.begin(),d.end()),unhex(args[3]),std::string(pr.begin(),pr.end()),parse_u64(args[5]))),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="ADD"){
      if(args.size()!=2) fail("SCHEMA_VIOLATION","args");
      return {"OK "+std::to_string(add_i64(parse_i64(args[0]),parse_i64(args[1]))),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="MUL"){
      if(args.size()!=3) fail("SCHEMA_VIOLATION","args");
      return {"OK "+std::to_string(mul_fixed(parse_i64(args[0]),parse_i64(args[1]),parse_u64(args[2]))),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    if(cmd=="ISQRT"){
      if(args.size()!=1) fail("SCHEMA_VIOLATION","args");
      return {"OK "+std::to_string(isqrt(parse_u64(args[0]))),OFU_P2_STATUS_OK,OFU_P2_REJECTION_NONE};
    }
    fail("SCHEMA_VIOLATION","unknown command");
  } catch(const ofu::Error& e) {
    return {"ERR "+e.code,OFU_P2_STATUS_REJECTED,rejection_class(e.code)};
  } catch(...) {
    return {"ERR INTERNAL",OFU_P2_STATUS_INTERNAL,OFU_P2_REJECTION_INTERNAL};
  }
}

void fill_result(ofu_p2_result_v1* result,int32_t status,int32_t rejection,uint64_t written,uint64_t required) noexcept {
  result->struct_size=(uint32_t)sizeof(ofu_p2_result_v1);
  result->abi_version=OFU_P2_C_ABI_VERSION;
  result->status=status;
  result->rejection_class=rejection;
  result->bytes_written=written;
  result->bytes_required=required;
}

} // namespace

extern "C" uint32_t ofu_p2_cabi_version(void) {
  return OFU_P2_C_ABI_VERSION;
}

extern "C" int32_t ofu_p2_call_v1(
  uint32_t requested_abi_version,
  const uint8_t *request,
  uint64_t request_len,
  uint8_t *output,
  uint64_t output_capacity,
  ofu_p2_result_v1 *result,
  uint64_t result_capacity
) {
  if(!result || result_capacity < sizeof(ofu_p2_result_v1)) return OFU_P2_STATUS_INVALID_ARGUMENT;
  fill_result(result,OFU_P2_STATUS_INVALID_ARGUMENT,OFU_P2_REJECTION_NONE,0,0);
  if(requested_abi_version!=OFU_P2_C_ABI_VERSION){
    fill_result(result,OFU_P2_STATUS_UNSUPPORTED_ABI,OFU_P2_REJECTION_NONE,0,0);
    return OFU_P2_STATUS_UNSUPPORTED_ABI;
  }
  if(request_len>OFU_P2_C_ABI_MAX_REQUEST_BYTES || (request_len && !request) || (output_capacity && !output)){
    return OFU_P2_STATUS_INVALID_ARGUMENT;
  }
  try {
    std::string line;
    if(request_len) line.assign(reinterpret_cast<const char*>(request),static_cast<size_t>(request_len));
    if(line.find('\n')!=std::string::npos || line.find('\r')!=std::string::npos){
      return OFU_P2_STATUS_INVALID_ARGUMENT;
    }
    const DispatchResult dispatched=dispatch(line);
    const uint64_t required=static_cast<uint64_t>(dispatched.transcript.size());
    if(required>OFU_P2_C_ABI_MAX_RESPONSE_BYTES){
      fill_result(result,OFU_P2_STATUS_INTERNAL,OFU_P2_REJECTION_INTERNAL,0,required);
      return OFU_P2_STATUS_INTERNAL;
    }
    if(output_capacity<required || (required && !output)){
      fill_result(result,OFU_P2_STATUS_BUFFER_TOO_SMALL,dispatched.rejection,0,required);
      return OFU_P2_STATUS_BUFFER_TOO_SMALL;
    }
    if(required) std::memcpy(output,dispatched.transcript.data(),static_cast<size_t>(required));
    fill_result(result,dispatched.status,dispatched.rejection,required,required);
    return dispatched.status;
  } catch(...) {
    fill_result(result,OFU_P2_STATUS_INTERNAL,OFU_P2_REJECTION_INTERNAL,0,0);
    return OFU_P2_STATUS_INTERNAL;
  }
}
