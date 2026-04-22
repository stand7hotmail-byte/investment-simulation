# Adversarial Review: Multi-language Support (i18n) - FINAL

**Persona:** Elite, Hostile Senior Engineer & Security Specialist
**Verdict:** **FAIL**

## Executive Summary
The "FIXED" implementation is a facade. While it addresses the surface-level requirements (adding files, adding links), it fails on critical technical invariants and provides a broken SEO experience. The implementation of `hreflang` is technically incorrect as it ignores path preservation, and the locale hydration integrity is compromised by missing cookie persistence in the middleware.

## Findings

### F-013: Broken `hreflang` Path Preservation (SEO CRITICAL)
- **Status:** **CRITICAL**
- **Location:** `frontend/src/app/[lang]/layout.tsx`
- **Description:** The `rel="alternate"` links are hardcoded to the root of the locale (`href={`${baseUrl}/${l]}`).
- **Impact:** If a user is on `/ja/simulation`, the alternate link for English points to `/en`, NOT `/en/simulation`. This is a violation of SEO best practices and tells search engines that all pages in one language are equivalent to the home page of the other language.
- **Requirement:** `hreflang` must preserve the current path segments.

### F-014: Non-Translated Metadata (Spec Fidelity)
- **Status:** **MAJOR**
- **Location:** `frontend/src/app/[lang]/layout.tsx`
- **Description:** The `metadata` object is a static constant in English.
- **Impact:** The `<title>` and `<meta name="description">` tags remain in English regardless of the selected locale. Users on the Japanese site will see English tab titles and search result snippets.
- **Requirement:** Metadata must be dynamically generated based on the locale using `generateMetadata`.

### F-015: Locale Hydration Race Condition (I-010 Violation)
- **Status:** **MAJOR**
- **Location:** `frontend/src/middleware.ts` / `frontend/src/lib/api.ts`
- **Description:** The middleware redirects to a locale-prefixed route but fails to set the `NEXT_LOCALE` cookie.
- **Impact:** On the first visit, `fetchApi` in Client-Side Rendering (CSR) will fail to find the `NEXT_LOCALE` cookie. It will send requests to the backend without the `Accept-Language` header.
- **Result:** The UI renders in Japanese (via URL segment), but the data fetched via CSR uses the backend default (English). This breaks Atomic Locale Hydration Integrity (I-010).

### F-016: "Phantom" Build-time Check (I-011 Violation)
- **Status:** **MINOR / PROCESS**
- **Location:** `frontend/scripts/check-i18n.ts` / `package.json`
- **Description:** The `check-i18n.ts` script exists but is not integrated into the `package.json` `build` or `test` scripts.
- **Impact:** The invariant I-011 ("Build-time check script exists and passes") is NOT met because the script is never executed automatically. It is dead code that will not prevent developers from introducing unsynchronized keys in the future.

### F-017: Brittle Financial Logic & Hardcoded Locales (I-012 Violation)
- **Status:** **MINOR**
- **Location:** `frontend/src/lib/i18n.ts`
- **Description:** `formatFinancialValue` hardcodes the BCP 47 mapping (`locale === 'ja' ? 'ja-JP' : 'en-US'`).
- **Impact:** This approach is unscalable and technically incorrect for a multi-language app. If a third locale is added, formatting will fallback to `en-US` regardless of the language's actual separators, violating the "Separators vary by locale" requirement of I-012.

## Recommendations
1.  **Fix `hreflang`**: Use `headers()` in a Server Component or a utility to capture the current pathname and correctly map it across alternates.
2.  **Dynamic Metadata**: Implement `generateMetadata` in `layout.tsx` to fetch the dictionary and translate the title/description.
3.  **Middleware Cookie Persistence**: Ensure `middleware.ts` sets the `NEXT_LOCALE` cookie upon redirection or locale detection.
4.  **Process Integration**: Add `node frontend/scripts/check-i18n.ts` to the `build` or `lint` scripts in `package.json`.
5.  **Refactor `i18n.ts`**: Use the `locale` parameter to derive the BCP 47 tag dynamically or use a more robust mapping.
