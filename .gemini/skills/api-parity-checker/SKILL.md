---
name: api-parity-checker
description: Ensures that all backend API routes defined in FastAPI match the requests made by the frontend via fetchApi. Use during refactoring or when backend endpoints are added/removed to prevent broken links.
---

# API Parity Checker

This skill detects inconsistencies between the backend API layer and the frontend data-fetching layer.

## Core Checks

- **Missing Endpoints**: Flags frontend `fetchApi` calls that target paths not defined in `backend/app/main.py`.
- **Path Parameter Mismatches**: Normalizes path parameters (e.g., `{id}` vs `*`) to ensure logical matches.

## Usage

1. **Automatic Scan**: Run the bundled Python script to check for parity issues.
   ```bash
   python .gemini/skills/api-parity-checker/scripts/check_parity.py
   ```

2. **Manual Review**: When modifying backend routes, always search for the path string in the `frontend/src` directory to see if client-side updates are needed.

## Prevention Guidelines

- Never rename a backend route without performing a project-wide grep for the path string.
- If a route is deprecated, mark it with a comment before removal to ensure frontend migration is planned.
