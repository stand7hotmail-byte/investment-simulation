# Project-Specific Rules (Investment Simulation App)

This file contains rules and facts specific to this workspace. Instructions here take precedence over global memory.

## Backend (Python/FastAPI)
- **Data Sources**: When using `yfinance`, extract scalar values from Pandas Series using `.item()` before JSON serialization to avoid `TypeError`.
- **Database**: Use absolute paths for the SQLite database URL in `config.py` to ensure consistency across different working directories.
- **Database (Cross-Environment)**: For JSON columns, always use `JSON().with_variant(JSONB, "postgresql")` from `sqlalchemy.dialects.postgresql` to ensure SQLite compatibility during testing while maintaining JSONB benefits in production.
- **Authentication**: NEVER bypass signature verification for Supabase JWTs, even for `ES256`. Always use `jwks.json` (via `PyJWKClient`) to verify public key signatures.
- **Testing**: In unit tests, clear tables (e.g., `db.query(models.AssetData).delete()`) in the `setUp` method to prevent data leakage between tests.
- **Backward Compatibility**: When refactoring or adding production features, never delete or rename existing endpoints that are covered by `pytest` unless explicitly requested. Always run `pytest` before finalizing any backend change.

## Frontend (Next.js/TypeScript)
- **API Requests**: ALWAYS use `fetchApi` from `@/lib/api.ts` for backend requests. Direct `fetch()` calls are strictly prohibited as they bypass Base URL configuration and Supabase Auth header injection.
- **State Management**: When using `zustand/persist`, implement a `hasHydrated` flag via `onRehydrateStorage` to prevent side effects before the store is fully loaded.
- **Charts (Plotly.js)**: For complex interactions like clicks on custom points, use the `onInitialized` callback to bind Plotly's native events (e.g., `plotly_click`) rather than relying on React synthetic events.
- **Audio (Howler.js)**: Disable `html5` mode (set to `false`) for looping sounds to prioritize the Web Audio API and avoid pool exhaustion.

## Environment & Build
- **Next.js (Turbopack)**: Be vigilant about duplicate imports of the same symbol in a single file, as this will cause a build error.
- **PowerShell (Windows)**: Use `;` for command chaining instead of `&&`.
