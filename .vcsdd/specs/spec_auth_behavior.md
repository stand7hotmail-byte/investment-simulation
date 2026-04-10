# SPEC-002: Strict JWT Authentication

## Description
Authenticates users using Supabase JWTs with mandatory signature verification for both HS256 and ES256 algorithms.

## Pre-conditions
- JWT must be present in `Authorization: Bearer <token>` header.
- For ES256, `jwks.json` must be fetchable or stale-cache must exist.

## Inputs
- Bearer Token (JWT).

## Outputs/Effects
- Returns `uuid.UUID` of the user (`sub` claim).
- Raises `401 Unauthorized` for invalid signatures, expired tokens, or malformed JWTs.

## Invariants (Safety Rules)
1. **Signature Integrity**: NEVER bypass signature verification for any algorithm.
2. **Algorithm Enforcement**: ONLY allow algorithms specified in the header if they match the configured provider's keys.

## Edge Cases
- JWKS server down: Use failsafe mechanism with cached keys.
- Token with `alg: "none"`: Must be rejected.
