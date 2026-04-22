# Adversarial Findings: Multi-language Support (i18n) - Final v2

## Finding ID: I18N-001 - Hydration Instability
**Severity: CRITICAL**
The spec fails to define how to synchronize the server-rendered locale with the client-side hydration process. If Middleware redirects based on a cookie that the client-side React tree hasn't processed yet, or if `Intl` polyfills differ between environments, a Hydration Mismatch is guaranteed. This leads to broken UIs and SEO penalties.

## Finding ID: I18N-002 - Shallow Dictionary Parity
**Severity: HIGH**
R-004 and I-007 only mandate "key parity". This is a naive check. Real-world failures occur when **interpolation variables** (e.g., `{name}`, `{amount}`) differ between languages. The spec allows a build to pass even if `en.json` expects a variable that `ja.json` lacks, leading to runtime crashes or "undefined" displays.

## Finding ID: I18N-003 - Undefined Error Fallback
**Severity: MEDIUM**
R-005 assumes the Frontend always has a translation for every Backend Error Code. There is no requirement for a "Catch-all" translation or a fallback mechanism for unknown codes. As the backend evolves, the frontend will inevitably encounter unmapped codes, resulting in poor UX or broken UI logic.

## Finding ID: I18N-004 - Currency Separator Ambiguity
**Severity: MEDIUM**
While I-008 addresses decimal precision, it ignores **group/decimal separators** (e.g., `1,000.00` vs `1.000,00`). The spec doesn't clarify if separators follow the `ui_locale` or if there are specific overrides for financial safety. This ambiguity creates "Visual Financial Corruption" in non-standard locales.

# Mandated Hostile Invariants

1. **[I-010: Atomic Locale Hydration Integrity]**: The locale used for the first meaningful paint MUST be identical to the locale used during SSR. Any mismatch detected during hydration MUST be handled by an explicit normalization step rather than a silent React error.
2. **[I-011: Translation Variable Synchronicity]**: Build MUST fail if any translation key containing interpolation tokens (e.g., `{count}`) does not have the EXACT same set of tokens in all language files.
3. **[I-012: Currency-Locale Orthogonality]**: Numeric formatting MUST be a deterministic function where `currency_code` strictly controls precision and `ui_locale` strictly controls separators. The output MUST be idempotent across server and client environments.
