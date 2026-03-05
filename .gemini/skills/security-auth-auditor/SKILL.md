---
name: security-auth-auditor
description: Scans for authentication vulnerabilities including JWT signature bypasses (ES256), hardcoded secrets, and insecure decoding patterns. Use when reviewing authentication logic or performing a security audit.
---

# Security Auth Auditor

This skill provides automated scanning for common authentication pitfalls in Next.js and FastAPI projects.

## Core Checks

- **ES256 Bypass**: Detects explicit disabling of signature verification for Elliptic Curve JWTs.
- **Hardcoded Secrets**: Identifies potential static JWT secrets in source code.
- **Insecure Decode**: Flags usage of `jwt.decode` with `verify_signature: False`.

## Usage

1. **Automatic Scan**: Run the bundled Python script to audit the project.
   ```bash
   python .gemini/skills/security-auth-auditor/scripts/scan_auth.py .
   ```

2. **Manual Review**: When modifying `get_current_user_id` or `Supabase` integration, always verify that `PyJWKClient` is used for `ES256` tokens.

## Remediation Patterns

### Insecure (ES256)
```python
payload = jwt.decode(token, options={"verify_signature": False})
```

### Secure (ES256)
```python
jwks_client = jwt.PyJWKClient(jwks_url)
signing_key = jwks_client.get_signing_key_from_jwt(token)
payload = jwt.decode(token, signing_key.key, algorithms=["ES256"])
```
