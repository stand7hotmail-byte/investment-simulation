# Specification: Multi-language Support (i18n) - Final v2

## 1. Overview
The application shall support Japanese and English with URL-based routing (`/[lang]/...`). It shall ensure SEO integrity via `hreflang` tags, maintain financial precision regardless of locale, and enforce dictionary parity at build time.

## 2. Behavioral Requirements (EARS)

- **[R-001: Automatic Locale Routing]**
  WHEN a user accesses the root path `/`
  THEN the system (via Middleware) shall detect the best locale using `Accept-Language` headers and `NEXT_LOCALE` cookie.
  AND the system shall redirect the user to `/[lang]/`.

- **[R-002: Master Source of Truth (URL)]**
  The URL path shall be the primary source of truth for the active locale.
  All internal links MUST be prefixed with the current locale.

- **[R-003: SEO Integrity (hreflang)]**
  The `<head>` of every page MUST include `rel="alternate" hreflang="..."` tags for all supported languages and `x-default`.

- **[R-004: UI Translation & Dictionary Parity]**
  UI strings shall be looked up from `frontend/src/locales/{lang}.json`.
  A build-time or test-time check MUST ensure both `ja.json` and `en.json` have the exact same set of keys.

- **[R-005: Backend Error Codes]**
  The Backend (FastAPI) shall return unique **Error Codes**.
  The Frontend shall localize these codes based on the current URL locale.

- **[R-006: Explicit Financial Formatting]**
  Numeric formatting shall use `Intl.NumberFormat` pinned to the `lang`.
  **CRITICAL:** Currency fractional digits MUST be determined by the currency code (e.g., JPY=0, USD=2) and MUST NOT be overridden by the locale's default behavior.

## 3. Hostile Invariants (Mandated)

- **[I-007: Dictionary Key Parity]**
  The build MUST fail if `en.json` and `ja.json` keys do not match exactly.
- **[I-008: Currency Precision Invariance]**
  The number of decimal places for a specific currency (e.g., JPY) MUST remain identical whether the UI is in English or Japanese.
- **[I-009: Hreflang Determinism]**
  The `hreflang` URLs MUST be absolute and match the current canonical path for both languages.

## 4. Tech Stack Implementation
- **Next.js Middleware:** For redirection and validation.
- **React Context:** To provide `t()` function and current locale.
- **Dictionary Files:** `ja.json`, `en.json`.
- **Validation Script:** `scripts/check-i18n.ts` to verify key parity.

## 5. Success Criteria
1. `/` redirects to `/ja` or `/en`.
2. `hreflang` tags are present in SSR output.
3. JPY values never show decimal places in English UI.
4. Build fails if a translation key is missing in one language.
