# Plan: Multi-language Support (i18n)

## 1. Specification & Review (Phase 1)
- [x] Draft Specification (`.vcsdd/specs/spec_i18n_support.md`)
- [x] Adversarial Review (Phase 1c) - FAIL -> v2 -> PASS (with conditions)

## 2. TDD & Implementation (Phase 2)

### 2a. Red Phase (Tests)
- [ ] Create tests for locale detection in Middleware.
- [ ] Create tests for `useI18n` hook (translation lookup, fallback).
- [ ] Create tests for financial formatting (Invariants I-008, I-012).

### 2b. Green Phase (Implementation)
- [ ] Install dependencies: `accept-language`, `js-cookie` (if needed) or use native tools.
- [ ] Implement `frontend/src/middleware.ts` for URL redirection.
- [ ] Create translation dictionaries (`frontend/src/locales/ja.json`, `frontend/src/locales/en.json`).
- [ ] Implement `I18nProvider` and `useI18n` hook.
- [ ] Refactor `frontend/src/app` to `frontend/src/app/[lang]`.
- [ ] Update `fetchApi` to inject `Accept-Language` header.
- [ ] Implement `formatFinancialValue` helper using `Intl.NumberFormat`.

### 2c. Refactor Phase
- [ ] Optimize dictionary loading (lazy loading if possible).
- [ ] Clean up redundant code.

## 3. Adversarial Review (Phase 3)
- [ ] Hostile Review of the implementation.

## 4. Hardening & Verification (Phase 5/6)
- [ ] Verify Invariants:
  - I-010: Atomic Locale Hydration Integrity
  - I-011: Translation Variable Synchronicity
  - I-012: Currency-Locale Orthogonality
- [ ] Run `vcsdd-verify`.
