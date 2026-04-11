# Spec: Railway Deployment Fix (SPEC-004)

## Context
The Railway deployment for the `backend` service is currently failing with the error:
`/bin/bash: line 1: cd: backend: No such file or directory`

This occurs during the `startCommand` execution.

## Root Cause Analysis
- **Hypothesis**: The Railway service "Root Directory" is set to `backend/`.
- **Evidence**: 
  - `backend/railway.toml` contains the `startCommand` starting with `cd backend`.
  - When the Root Directory is set to `backend/`, the runner starts inside that directory.
  - Attempting to `cd backend` inside `backend/` fails because there is no `backend` subdirectory.
  - The repository root has `.railwayignore` which ignores other directories, but it doesn't confirm the "Root Directory" setting in the cloud console. However, the error message is a definitive indicator.

## Proposed Changes
1. **Modify `backend/railway.toml`**:
   - Remove `cd backend &&` from the `startCommand`.
   - The command should start directly with the migration and app startup logic.

## Verification Criteria
- The `startCommand` should execute correctly assuming the current working directory is the `backend` folder.
- `alembic upgrade head` must find `alembic.ini` in the current directory.
- `python -m app.seed_assets` must find the `app` module in the current directory.
- `uvicorn app.main:app` must find the `app` module in the current directory.

## Success Metrics
- Successful deployment on Railway without the "No such file or directory" error.
