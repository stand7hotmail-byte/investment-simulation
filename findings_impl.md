# Adversarial Findings: Multi-language Support (i18n) Implementation

**Reviewer Persona:** Elite Hostile Senior Engineer / Security Specialist
**Verdict:** FAIL
**Confidence Score:** 95%

---

## 5D Evaluation

### 1. Spec Fidelity (FAIL)
- **R-003 (SEO Integrity):** Complete implementation failure. There are NO `hreflang` tags in `RootLayout`. This is a critical SEO regression.
- **I-009 (Hreflang Determinism):** No logic exists to generate absolute URLs for alternate locales, as required by the mandate.
- **R-005 (Backend Error Localization):** While `fetchApi` sends the header, there is no evidence that the frontend components actually use the `t()` function to map backend error codes to localized strings.

### 2. Edge Case Coverage (FAIL)
- **Middleware Static Assets:** The `config.matcher` in `middleware.ts` is dangerously broad. It does not exclude file extensions like `.png`, `.svg`, `.json`, etc. This will cause the middleware to attempt to prefix static asset paths with locales (e.g., `/en/logo.png`), resulting in 404s.
- **Unsupported Currencies:** `formatFinancialValue` only knows about `JPY`. Any other zero-decimal currency will be formatted with two decimals, violating financial accuracy requirements for those regions.

### 3. Implementation Accuracy (FAIL)
- **I-012 (Currency-Locale Orthogonality):** The implementation uses a hardcoded ternary `currency === 'JPY' ? 0 : 2`. This is not "determined by the currency code" in any robust way; it's a hack that satisfies one test case but fails the architectural requirement.
- **I-010 (Locale Hydration):** `fetchApi` ignores the locale during Server-Side Rendering (SSR). Since `document` is undefined on the server, the `Accept-Language` header is omitted for all server-side fetches. This creates a "Hydration Gap" where the initial HTML may contain different data/errors than the hydrated client.

### 4. Structural Integrity (POOR)
- **Implicit Global Dependency:** `fetchApi` relies on `document.cookie` for state. This makes it impossible to use cleanly in a headless environment or server context without manual mocks/workarounds.
- **Dictionary Loading:** `getDictionary` uses dynamic imports with `@/locales/${locale}.json`. While standard, it lacks a validation step to ensure the locale is actually supported before attempting the import, relying on the `catch` block for control flow.

### 5. Verification Readiness (PASS)
- `scripts/check-i18n.ts` is a solid addition for build-time parity checks, though it cannot catch the runtime failures identified above.

---

## Finding IDs

| ID | Severity | Title | Description |
|:---|:---|:---|:---|
| **F-001** | **CRITICAL** | SEO Spec Non-Compliance | `hreflang` tags are entirely missing from `layout.tsx`. |
| **F-002** | **HIGH** | Middleware Path Corruption | Static assets (images/manifests) are caught by middleware and redirected to locale-prefixed paths. |
| **F-003** | **HIGH** | SSR Header Omission | `fetchApi` fails to send `Accept-Language` during server-side execution. |
| **F-004** | **MEDIUM** | Brittle Currency Logic | Hardcoded JPY check in `i18n.ts` violates the requirement for general currency-driven precision. |
| **F-005** | **MEDIUM** | Atomic Hydration Risk | No `NEXT_LOCALE` cookie synchronization from URL to Cookie in Middleware; relies on manual cookie setting elsewhere. |

## Hostile Invariant Verification
- **I-010:** FAILED. Header injection is not atomic across SSR/Client.
- **I-011:** PASSED. `check-i18n.ts` correctly validates variable sync.
- **I-012:** FAILED. Precision logic is hardcoded/brittle.
