#ifndef OFU_P2_CABI_H
#define OFU_P2_CABI_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define OFU_P2_C_ABI_VERSION 1u
#define OFU_P2_C_ABI_MAX_REQUEST_BYTES 4194304ull
#define OFU_P2_C_ABI_MAX_RESPONSE_BYTES 4194304ull

typedef enum ofu_p2_status_v1 {
  OFU_P2_STATUS_OK = 0,
  OFU_P2_STATUS_INVALID_ARGUMENT = 1,
  OFU_P2_STATUS_BUFFER_TOO_SMALL = 2,
  OFU_P2_STATUS_REJECTED = 3,
  OFU_P2_STATUS_INTERNAL = 4,
  OFU_P2_STATUS_UNSUPPORTED_ABI = 5
} ofu_p2_status_v1;

typedef enum ofu_p2_rejection_v1 {
  OFU_P2_REJECTION_NONE = 0,
  OFU_P2_REJECTION_SCHEMA_VIOLATION = 1,
  OFU_P2_REJECTION_OUT_OF_DOMAIN = 2,
  OFU_P2_REJECTION_LIMIT_EXCEEDED = 3,
  OFU_P2_REJECTION_NON_MINIMAL = 4,
  OFU_P2_REJECTION_OVERFLOW = 5,
  OFU_P2_REJECTION_TRUNCATED = 6,
  OFU_P2_REJECTION_TRAILING_BYTES = 7,
  OFU_P2_REJECTION_UNKNOWN_TAG = 8,
  OFU_P2_REJECTION_NON_CANONICAL_ORDER = 9,
  OFU_P2_REJECTION_DUPLICATE_KEY = 10,
  OFU_P2_REJECTION_DUPLICATE_NORMALIZED_KEY = 11,
  OFU_P2_REJECTION_NON_NFC = 12,
  OFU_P2_REJECTION_UNSUPPORTED_VERSION = 13,
  OFU_P2_REJECTION_NON_CANONICAL = 14,
  OFU_P2_REJECTION_INVALID_UTF8 = 15,
  OFU_P2_REJECTION_OTHER = 254,
  OFU_P2_REJECTION_INTERNAL = 255
} ofu_p2_rejection_v1;

typedef struct ofu_p2_result_v1 {
  uint32_t struct_size;
  uint32_t abi_version;
  int32_t status;
  int32_t rejection_class;
  uint64_t bytes_written;
  uint64_t bytes_required;
} ofu_p2_result_v1;

/* Returns the only ABI version implemented by this feasibility capsule. */
uint32_t ofu_p2_cabi_version(void);

/*
 * Executes one frozen P2/Core request.
 *
 * Ownership:
 * - request bytes are borrowed for the duration of the call;
 * - output storage is entirely caller-owned;
 * - the ABI never returns heap ownership or an opaque runtime handle.
 *
 * Safety:
 * - request_len/output_capacity/result_capacity are explicit;
 * - no partial output is written when output_capacity is insufficient;
 * - no C++ exception is permitted to cross this boundary.
 */
int32_t ofu_p2_call_v1(
  uint32_t requested_abi_version,
  const uint8_t *request,
  uint64_t request_len,
  uint8_t *output,
  uint64_t output_capacity,
  ofu_p2_result_v1 *result,
  uint64_t result_capacity
);

#ifdef __cplusplus
}
#endif

#endif
