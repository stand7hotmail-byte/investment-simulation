# Project-Wide Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve code readability and architectural structure by decomposing `main.py` and modularizing frontend pages.

**Architecture:** 
- Backend: Modular APIRouter pattern in `backend/app/routers/`.
- Frontend: Sub-component extraction and shared utility patterns.

**Tech Stack:** FastAPI, SQLAlchemy, Next.js, TypeScript, Plotly.js.

---

### Task 1: Backend Infrastructure & Asset Router

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/assets.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create routers directory and init file**
```python
# backend/app/routers/__init__.py
# (Empty file to make it a package)
```

- [ ] **Step 2: Create Asset Router**
Extract asset-related endpoints from `main.py`.
```python
# backend/app/routers/assets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import numpy as np
from decimal import Decimal
from .. import crud, schemas
from ..dependencies import get_db
from ..log_utils import logger

router = APIRouter(prefix="/api", tags=["assets"])

def _sanitize_asset(asset):
    if asset.expected_return is not None and (np.isnan(float(asset.expected_return)) or np.isinf(float(asset.expected_return))): asset.expected_return = Decimal("0.0")
    if asset.volatility is not None and (np.isnan(float(asset.volatility)) or np.isinf(float(asset.volatility))): asset.volatility = Decimal("0.0")
    if asset.dividend_yield is not None and (np.isnan(float(asset.dividend_yield)) or np.isinf(float(asset.dividend_yield))): asset.dividend_yield = Decimal("0.0")
    if hasattr(asset, "correlation_matrix") and asset.correlation_matrix:
        asset.correlation_matrix = {k: float(np.nan_to_num(v)) for k, v in asset.correlation_matrix.items()}
    return asset

@router.get("/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    try:
        assets = crud.get_assets(db, skip=skip, limit=limit)
        return [_sanitize_asset(a) for a in assets]
    except Exception as e:
        logger.error(f"Read assets failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve assets")

@router.get("/asset-classes", response_model=schemas.AssetClassesResponse)
def get_asset_classes(db: Session = Depends(get_db)):
    return {"asset_classes": crud.get_asset_classes(db)}

@router.get("/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    try:
        db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
        if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
        return _sanitize_asset(db_asset)
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Read asset {asset_code} failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve asset")

@router.get("/assets/{asset_code}/historical-data", response_model=schemas.HistoricalDataResponse)
def get_asset_historical_data(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None: raise HTTPException(status_code=404, detail="Asset not found")
    # ... (Rest of historical data logic from main.py)
```

- [ ] **Step 3: Modify main.py to include Asset Router**
```python
# In main.py
from .routers import assets
# ...
app.include_router(assets.router)
```

- [ ] **Step 4: Run tests**
Run: `pytest backend/tests/test_assets.py`
Expected: PASS

---

### Task 2: Portfolio Router

**Files:**
- Create: `backend/app/routers/portfolios.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create Portfolio Router**
Extract portfolio CRUD endpoints from `main.py`. Handle effective `user_id` logic consistently.
```python
# backend/app/routers/portfolios.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
from decimal import Decimal
import numpy as np
from .. import crud, schemas
from ..dependencies import get_db, get_optional_user_id
from ..log_utils import logger

router = APIRouter(prefix="/api/portfolios", tags=["portfolios"])

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

def _sanitize_weights(portfolio):
    for a in portfolio.allocations:
        a.weight = Decimal(str(np.nan_to_num(float(a.weight))))
    return portfolio

@router.post("", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        return crud.create_portfolio(db=db, portfolio=portfolio, user_id=effective_user_id)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Portfolio creation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create portfolio")

@router.get("", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        portfolios = crud.get_portfolios(db, user_id=effective_user_id, skip=skip, limit=limit)
        return [_sanitize_weights(p) for p in portfolios]
    except Exception as e:
        logger.error(f"Read portfolios failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve portfolios")
# ... (Include GET by ID, PUT, DELETE)
```

- [ ] **Step 2: Modify main.py to include Portfolio Router**
Run: `pytest backend/tests/test_portfolios.py`
Expected: PASS

---

### Task 3: Simulation Router

**Files:**
- Create: `backend/app/routers/simulation.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create Simulation Router**
Extract all `/api/simulate/*` and `/api/simulation-results/*` endpoints.
Ensure `simulation.py` is used correctly.

- [ ] **Step 2: Include in main.py and test**
Run: `pytest backend/tests/test_pure_simulation.py backend/tests/test_analytics_logic.py`

---

### Task 4: Analytics Router

**Files:**
- Create: `backend/app/routers/analytics.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create Analytics Router**
Extract `/api/analytics/*` and `/api/affiliates`.
Include the single-flight `market_summary_lock` and cache here.

---

### Task 5: Main Cleanup & CRUD Consolidation

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/crud.py`

- [ ] **Step 1: Clean main.py**
Remove all route definitions. Keep only:
- Imports
- Lifespan
- Middleware
- Router inclusions
- Base "/" route

- [ ] **Step 2: CRUD Consolidation**
Refactor `create_portfolio` and `update_portfolio` in `crud.py` to use a private `_validate_and_normalize_allocations` helper to reduce code duplication.

---

### Task 6: Frontend - Accumulation Page Refactoring

**Files:**
- Create: `frontend/src/app/[lang]/simulation/accumulation/components/AccumulationForm.tsx`
- Create: `frontend/src/app/[lang]/simulation/accumulation/components/AccumulationChart.tsx`
- Create: `frontend/src/app/[lang]/simulation/accumulation/components/AccumulationSummary.tsx`
- Modify: `frontend/src/app/[lang]/simulation/accumulation/page.tsx`

- [ ] **Step 1: Extract Components**
Move UI sections to sub-components to reduce `page.tsx` complexity.

---

### Task 7: Frontend - Constants & Chart Utils

**Files:**
- Create: `frontend/src/lib/chart-utils.ts`
- Modify: `frontend/src/components/simulation/EfficientFrontierChart.tsx`

- [ ] **Step 1: Centralize Plotly Layouts**
Create a shared configuration for Plotly graphs (responsive margins, grid colors, font styles).
