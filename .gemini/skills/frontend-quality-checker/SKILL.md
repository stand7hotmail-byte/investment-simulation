---
name: frontend-quality-checker
description: Scans frontend source code for common architectural pitfalls and build-breaking issues. Use before finalizing tracks to catch duplicate imports, missing base API URLs, or inconsistent naming in Next.js/TypeScript projects.
---

# Frontend Quality Checker

This skill helps maintain frontend code quality by identifying anti-patterns and potential build errors.

## Checks

- **Duplicate Imports**: Detects if the same symbol or module is imported multiple times, which can break Next.js/Turbopack builds.
- **API Base URL Leaks**: Identifies direct calls to `fetch` or `axios` that bypass the centralized `fetchApi` utility, risking incorrect base URLs.
- **Zustand Persistence Patterns**: Ensures proper hydration flags are used when using persistent storage to avoid redundant renders.

## Usage

1. **Automatic Scan**: Use the `grep` patterns in [PATTERNS.md](references/patterns.md) or run the `scripts/check_pitfalls.js`.
2. **Review Checklist**: See [FRONTEND_CHECKLIST.md](references/frontend_checklist.md).

## Bundled Resources

- `scripts/check_pitfalls.cjs`: Node.js script to scan files for common issues.
- `references/patterns.md`: Grep patterns for quick manual scanning.
