# 証券会社アフィリエイト統合 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 投資シミュレーション結果画面に、ユーザーの地域（日本/海外）に応じた証券会社のアフィリエイトリンクを動的に表示する。

**Architecture:** 証券会社データをPostgreSQLで管理し、FastAPIエンドポイントがリクエストIPから地域を判別して最適なデータを返す。フロントエンドはReact Queryを用いてこれを取得し、シミュレーション結果の下部にカード形式で表示する。

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Next.js, Tailwind CSS, React Query, Lucide React

---

### Task 1: バックエンド・データベースモデルの追加

**Files:**
- Modify: `backend/app/models.py`
- Create: (Alembic migration)

- [ ] **Step 1: `AffiliateBroker` モデルを定義する**

```python
# backend/app/models.py に追加
class AffiliateBroker(Base):
    __tablename__ = "affiliate_brokers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String, nullable=False) # "JP" or "GLOBAL"
    description = Column(JSON_TYPE, nullable=False) # List of strings
    cta_text = Column(String, default="口座開設はこちら")
    affiliate_url = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
```

- [ ] **Step 2: データベースマイグレーションを実行する**

Run: `cd backend; alembic revision --autogenerate -m "add affiliate_brokers table"; alembic upgrade head`

- [ ] **Step 3: コミット**

```bash
git add backend/app/models.py backend/alembic/versions/
git commit -m "backend: add AffiliateBroker model and migration"
```

---

### Task 2: バックエンド・スキーマとCRUDの作成

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/crud.py`

- [ ] **Step 1: Pydanticスキーマを定義する**

```python
# backend/app/schemas.py に追加
class AffiliateBrokerBase(BaseModel):
    name: str
    region: str
    description: List[str]
    cta_text: str
    affiliate_url: str
    logo_url: str | None = None
    priority: int = 0

class AffiliateBrokerRead(AffiliateBrokerBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
```

- [ ] **Step 2: CRUD関数を実装する**

```python
# backend/app/crud.py に追加
def get_active_affiliates_by_region(db: Session, region: str):
    return db.query(models.AffiliateBroker)\
             .filter(models.AffiliateBroker.region == region, 
                     models.AffiliateBroker.is_active == True)\
             .order_by(models.AffiliateBroker.priority.desc())\
             .all()
```

- [ ] **Step 3: コミット**

```bash
git add backend/app/schemas.py backend/app/crud.py
git commit -m "backend: add affiliate schemas and crud functions"
```

---

### Task 3: バックエンド・APIエンドポイントの実装 (地域判定ロジック含む)

**Files:**
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_affiliates.py`

- [ ] **Step 1: IPから地域を判定するエンドポイントを作成する**

```python
# backend/app/main.py に追加
from fastapi import Request

@app.get("/api/affiliates/recommendations", response_model=List[schemas.AffiliateBrokerRead])
def get_affiliate_recommendations(request: Request, db: Session = Depends(get_db)):
    # Get client IP
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
    
    # Simple region logic
    country_code = request.headers.get("cf-ipcountry", 
                   request.headers.get("x-vercel-ip-country", "UNKNOWN")).upper()
    
    region = "JP" if country_code == "JP" else "GLOBAL"
    
    # Local development fallback
    if client_ip in ("127.0.0.1", "localhost", "::1"):
        override_region = request.query_params.get("region")
        if override_region:
            region = override_region.upper()
        else:
            region = "JP" 
            
    return crud.get_active_affiliates_by_region(db, region=region)
```

- [ ] **Step 2: テストを作成して実行する**

Run: `pytest backend/tests/test_affiliates.py`

- [ ] **Step 3: コミット**

```bash
git add backend/app/main.py backend/tests/test_affiliates.py
git commit -m "backend: implement affiliate recommendations endpoint"
```

---

### Task 4: 初期データのシード (Seed Data)

**Files:**
- Modify: `backend/app/seed_assets.py`

- [ ] **Step 1: 日本および海外の証券会社データを投入するスクリプトを更新する**

- [ ] **Step 2: シードを実行する**

Run: `python backend/app/seed_assets.py`

- [ ] **Step 3: コミット**

```bash
git add backend/app/seed_assets.py
git commit -m "backend: seed initial affiliate broker data"
```

---

### Task 5: フロントエンド・コンポーネントの作成

**Files:**
- Create: `frontend/src/components/simulation/AffiliateBrokerCard.tsx`
- Create: `frontend/src/components/simulation/AffiliateSection.tsx`

- [ ] **Step 1: `AffiliateBrokerCard` (単体カード) を作成する**

- [ ] **Step 2: `AffiliateSection` (API取得・リスト表示) を作成する**

- [ ] **Step 3: コミット**

```bash
git add frontend/src/components/simulation/AffiliateBrokerCard.tsx frontend/src/components/simulation/AffiliateSection.tsx
git commit -m "frontend: add affiliate card and section components"
```

---

### Task 6: フロントエンド・シミュレーション結果への統合

**Files:**
- Modify: `frontend/src/app/simulation/efficient-frontier/results/page.tsx`
- Modify: `frontend/src/app/simulation/accumulation/results/page.tsx`

- [ ] **Step 1: 効率的フロンティアの結果画面に `AffiliateSection` を追加する**

- [ ] **Step 2: 積立シミュレーションの結果画面に `AffiliateSection` を追加する**

- [ ] **Step 3: コミット**

```bash
git add frontend/src/app/simulation/
git commit -m "frontend: integrate affiliate section into simulation result pages"
```
