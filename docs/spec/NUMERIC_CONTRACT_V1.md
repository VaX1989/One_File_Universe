# Numeric Contract v1

P2 does not impose a global Q32.32 format. Canonical floating point and implementation-provided transcendental functions are excluded from P2 authority.

The reference kernel provides checked i64 addition, exact BigInt intermediates, fixed-point multiplication with an explicit scale and round-to-nearest/ties-to-even behavior, and deterministic integer square root. Overflow and invalid domains throw explicit errors. Future domains may define additional numeric contracts with their own versions and vectors.
