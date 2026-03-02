# 完全技術スタック仕様書
## 投資シミュレーション&データ可視化Webアプリケーション

**最終更新:** 2026年2月21日  
**想定規模:** 100-1,000ユーザー  
**開発体制:** 個人開発  
**予算:** Railway Starter ($5/月) + その他無料枠

---

## 📋 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [技術スタック詳細](#技術スタック詳細)
4. [データベース設計](#データベース設計)
5. [API設計](#api設計)
6. [状態管理戦略](#状態管理戦略)
7. [データ可視化](#データ可視化)
8. [認証・認可](#認証認可)
9. [デプロイ構成](#デプロイ構成)
10. [テスト戦略](#テスト戦略)
11. [プロジェクト構成](#プロジェクト構成)
12. [開発ロードマップ](#開発ロードマップ)
13. [コスト試算](#コスト試算)

---

## システム概要

### 主要機能

1. **ポートフォリオ管理**
   - 個人の保有資産登録・編集
   - 目標ポートフォリオ設定
   - リバランス提案

2. **金融計算・シミュレーション**
   - 効率的フロンティア算出（平均分散最適化）
   - モンテカルロシミュレーション（幾何ブラウン運動を用いた離散時間シミュレーション、10,000回以上の試行）
   - バックテスト（過去データでの検証）
   - リスクパリティ戦略算出

3. **データ可視化**
   - リスク・リターンマップ（散布図）
   - 効率的フロンティア曲線
   - 資産価格推移（折れ線グラフ）
   - 相関行列ヒートマップ
   - アニメーション付きシミュレーション結果

### 非機能要件

- **パフォーマンス:** 計算実行時間 < 1秒
- **可用性:** 99%以上（Railway稼働率に準拠）
- **セキュリティ:** JWT認証、Row Level Security
- **対応環境:** デスクトップブラウザ優先（Chrome/Firefox/Safari最新版）
- **検証基盤:** Playwright による E2E テスト、Storybook によるコンポーネント隔離環境

---

## アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│                   User Browser                        │
│  ┌────────────────────────────────────────────────┐  │
│  │         Next.js 14 (App Router)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │ Zustand  │  │React Query│ │Plotly.js │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘    │  │
│  └────────────────────────────────────────────────┘  │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS (REST API + JWT)
                    ▼
┌──────────────────────────────────────────────────────┐
│              Vercel (Frontend Hosting)                │
│         Static Export + Edge Functions                │
└──────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│           Railway Starter ($5/月)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  FastAPI (Python 3.11+)                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │  NumPy   │  │  Pandas  │  │  SciPy   │    │  │
│  │  │  cvxpy   │  │ Pydantic │  │ Supabase │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘    │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │       PostgreSQL 15 (500MB-2GB)                │  │
│  │  - Portfolios, Allocations, Results           │  │
│  │  - Asset Data (Static)                        │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                    ▲
                    │ JWT Verification
                    │
┌──────────────────────────────────────────────────────┐
│            Supabase (Free Tier)                       │
│         Authentication Only (50K MAU)                 │
└──────────────────────────────────────────────────────┘
```

### データフロー

1. ユーザーがSupabase Authでログイン → JWT取得
2. フロントエンド（Next.js）がFastAPI にJWT付きでリクエスト
3. FastAPIがJWT検証 → 計算実行 → PostgreSQLに結果保存
4. React QueryがレスポンスをキャッシュしてUI更新
5. Plotly.jsがグラフをインタラクティブレンダリング

---

## 技術スタック詳細

### Frontend

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **Framework** | Next.js | 14.x (App Router) | ルーティング、レイアウト、静的ビルド |
| **Language** | TypeScript | 5.x | 型安全性、開発効率 |
| **Runtime** | React | 18.x | UIコンポーネント |
| **Styling** | Tailwind CSS | 3.x | ユーティリティファーストCSS |
| **UI Components** | shadcn/ui | Latest | フォーム、ダイアログ、テーブル等 |
| **State Management** | Zustand | 4.x | グローバルUI状態管理 |
| **Data Fetching** | TanStack Query | 5.x | サーバー状態管理、キャッシング |
| **Form Management** | React Hook Form | 7.x | フォーム管理 |
| **Validation** | Zod | 3.x | スキーマバリデーション |
| **Charts** | Plotly.js | 2.x | メインビジュアライゼーション |
| **Charts (Sub)** | Recharts | 2.x | シンプルなグラフ用 |
| **Icons** | Lucide React | Latest | アイコンセット |
| **Auth Client** | @supabase/supabase-js | 2.x | 認証クライアント |

### Backend

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **Framework** | FastAPI | 0.109+ | REST APIフレームワーク |
| **Language** | Python | 3.11+ | 数値計算言語 |
| **ASGI Server** | Uvicorn | 0.27+ | 非同期サーバー |
| **Validation** | Pydantic | 2.x | リクエスト/レスポンス検証 |
| **数値計算** | NumPy | 1.26+ | 行列演算、基礎計算 |
| **データ処理** | Pandas | 2.1+ | データフレーム操作 |
| **科学計算** | SciPy | 1.11+ | 最適化、統計関数 |
| **データ収集** | yfinance | Latest | 過去の金融データ取得 |
| **最適化** | cvxpy | 1.4+ | 凸最適化（効率的フロンティア） |
| **Auth** | python-jose | 3.3+ | JWT検証 |
| **HTTP Client** | httpx | 0.26+ | Supabase API呼び出し |
| **Environment** | python-dotenv | 1.0+ | 環境変数管理 |

### Database

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **RDBMS** | PostgreSQL | 15.x | メインデータベース |
| **Hosting** | Railway | Starter Plan | DB + Backend統合ホスティング |
| **ORM** | なし | - | 直接SQL使用 |
| **Migration** | Alembic | 1.13+ | スキーママイグレーション |
| **Admin** | pgAdmin | 4.x (Local) | DB管理ツール（開発用） |

### Authentication

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **Provider** | Supabase Auth | ユーザー認証・JWT発行 |
| **Strategy** | JWT (RS256) | トークンベース認証 |
| **Storage** | httpOnly Cookie (Optional) | XSS対策 |

### Deployment

| カテゴリ | サービス | プラン | 用途 |
|---------|---------|-------|------|
| **Frontend** | Vercel | Hobby (Free) | Next.js静的ホスティング |
| **Backend + DB** | Railway | Starter ($5/月) | FastAPI + PostgreSQL |
| **Auth** | Supabase | Free (50K MAU) | 認証のみ |
| **Monitoring** | Railway Dashboard | 標準 | ログ・メトリクス確認 |
| **DNS** | Cloudflare | Free | CDN + SSL |

### Production Environment Details (2026-03-02 Update)

| サービス | 役割 | 本番URL / 接続先 | 備考 |
|---------|------|-----------------|------|
| **Vercel** | Frontend | [https://investment-sim-frontend.vercel.app/](https://investment-sim-frontend.vercel.app/) | Next.js (Production Build) |
| **Railway** | Backend | [https://postgresql-production-ba08.up.railway.app](https://postgresql-production-ba08.up.railway.app) | FastAPI (Auto-deploy from main) |
| **Railway** | Database | `postgresql-production-ba08.up.railway.app:5432` | PostgreSQL 15 |
| **Supabase** | Auth | `https://zsftocgledceyzxklauw.supabase.co` | JWT (ES256/HS256) |

### Testing

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **Unit (Frontend)** | Vitest | Reactコンポーネントテスト |
| **Unit (Backend)** | Pytest | 計算ロジック検証 |
| **E2E** | Playwright | ブラウザ自動テスト（実装済み） |
| **UI Playground** | Storybook | コンポーネントカタログ・隔離開発 |
| **Benchmark** | pytest-benchmark | 計算パフォーマンス測定 |
| **Coverage** | Coverage.py | コードカバレッジ測定 |

### Development Tools

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **Package Manager** | pnpm | フロントエンド依存管理 |
| **Python Package** | Poetry | バックエンド依存管理 |
| **Linter (TS)** | ESLint | コード品質チェック |
| **Formatter (TS)** | Prettier | コード整形 |
| **Linter (Python)** | Ruff | 高速Python Linter |
| **Formatter (Python)** | Black | コード整形 |
| **Type Check (Python)** | mypy | 型チェック |
| **Git Hooks** | Husky | コミット前チェック |
| **DB Inspection** | Custom Scripts | SQLiteデータのJSON抽出・検証 |
| **AI Assistant** | Gemini CLI | コード生成補助 |

---

## データベース設計

### ER図（概念モデル）

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Users     │       │   Portfolios     │       │ Allocations     │
│ (Supabase)  │◄──────│                  │◄──────│                 │
└─────────────┘  1:N  │ - id             │  1:N  │ - portfolio_id  │
                       │ - user_id        │       │ - asset_code    │
                       │ - name           │       │ - weight        │
                       │ - created_at     │       └─────────────────┘
                       └──────────────────┘
                              │ 1:N
                              ▼
                       ┌──────────────────┐
                       │ SimulationResults│
                       │ - portfolio_id   │
                       │ - type           │
                       │ - parameters     │
                       │ - results (JSONB)│
                       └──────────────────┘

                       ┌──────────────────┐
                       │   AssetData      │
                       │ - asset_code (PK)│
                       │ - name           │
                       │ - expected_return│
                       │ - volatility     │
                       │ - correlation    │
                       │ - historical_data│
                       └──────────────────┘
```

### テーブル定義（PostgreSQL DDL）

```sql
-- =======================================
-- ユーザー認証テーブル（Supabase管理）
-- =======================================
-- auth.users テーブルは Supabase が自動作成
-- このテーブルを直接操作せず、参照のみ行う

-- =======================================
-- ポートフォリオテーブル
-- =======================================
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_current BOOLEAN DEFAULT false, -- 現在のポートフォリオフラグ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT check_name_length CHECK (char_length(name) >= 1)
);

-- インデックス
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_created_at ON portfolios(created_at DESC);

-- 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================
-- 資産配分テーブル
-- =======================================
CREATE TABLE portfolio_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_code VARCHAR(20) NOT NULL,
  weight DECIMAL(7,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT check_weight_range CHECK (weight >= 0 AND weight <= 1),
  CONSTRAINT unique_portfolio_asset UNIQUE(portfolio_id, asset_code)
);

-- インデックス
CREATE INDEX idx_allocations_portfolio_id ON portfolio_allocations(portfolio_id);

-- 制約: ポートフォリオ内の weight 合計が 1.0 になることを保証
-- （アプリケーション層で検証するため、DB制約は省略可能）

-- =======================================
-- シミュレーション結果キャッシュテーブル
-- =======================================
CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  simulation_type VARCHAR(50) NOT NULL, -- 'efficient_frontier', 'monte_carlo', 'backtest', 'risk_parity'
  parameters JSONB NOT NULL, -- シミュレーションパラメータ（例: {"n_simulations": 10000, "years": 10}）
  results JSONB NOT NULL, -- 計算結果（例: {"percentiles": {...}, "mean": 1.5}）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- キャッシュ有効期限（NULL = 無期限）
  
  CONSTRAINT check_simulation_type CHECK (
    simulation_type IN ('efficient_frontier', 'monte_carlo', 'backtest', 'risk_parity', 'rebalance')
  )
);

-- インデックス
CREATE INDEX idx_simulation_portfolio_id ON simulation_results(portfolio_id);
CREATE INDEX idx_simulation_type ON simulation_results(simulation_type);
CREATE INDEX idx_simulation_expires_at ON simulation_results(expires_at) WHERE expires_at IS NOT NULL;

-- 期限切れキャッシュの自動削除（Cron Job or Background Task）
-- DELETE FROM simulation_results WHERE expires_at < now();

-- =======================================
-- 資産マスタデータテーブル（静的データ）
-- =======================================
CREATE TABLE asset_data (
  asset_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  asset_class VARCHAR(50), -- 'Stock', 'Bond', 'REIT', 'Commodity', etc.
  expected_return DECIMAL(8,6), -- 年率期待リターン（例: 0.05 = 5%）
  volatility DECIMAL(8,6), -- 年率ボラティリティ（標準偏差）
  correlation_matrix JSONB, -- 他資産との相関係数（例: {"TOPIX": 1.0, "S&P500": 0.7}）
  historical_prices JSONB, -- 過去価格データ（バックテスト用）（例: [{"date": "2020-01-01", "price": 100}, ...]）
  data_source VARCHAR(100), -- データソース（例: "Yahoo Finance", "Static CSV"）
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT check_expected_return CHECK (expected_return IS NULL OR (expected_return >= -1 AND expected_return <= 2)),
  CONSTRAINT check_volatility CHECK (volatility IS NULL OR (volatility >= 0 AND volatility <= 2))
);

-- インデックス
CREATE INDEX idx_asset_data_class ON asset_data(asset_class);

-- =======================================
-- Row Level Security (RLS) 設定
-- =======================================
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

-- ポートフォリオ: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- 資産配分: ポートフォリオの所有者のみアクセス
CREATE POLICY "Users can manage allocations for their portfolios"
  ON portfolio_allocations FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

-- シミュレーション結果: ポートフォリオの所有者のみアクセス
CREATE POLICY "Users can manage simulation results for their portfolios"
  ON simulation_results FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

-- 資産マスタ: 全ユーザーが読み取り可能
ALTER TABLE asset_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read asset data"
  ON asset_data FOR SELECT
  USING (true);

-- =======================================
-- 初期データ投入（例）
-- =======================================
INSERT INTO asset_data (asset_code, name, asset_class, expected_return, volatility, correlation_matrix) VALUES
('TOPIX', '東証株価指数', 'Stock', 0.0500, 0.1800, '{"TOPIX": 1.0, "SP500": 0.70, "MSCI_ACWI": 0.85}'::jsonb),
('SP500', 'S&P 500', 'Stock', 0.0700, 0.1600, '{"TOPIX": 0.70, "SP500": 1.0, "MSCI_ACWI": 0.95}'::jsonb),
('MSCI_ACWI', 'MSCI オール・カントリー・ワールド・インデックス', 'Stock', 0.0650, 0.1700, '{"TOPIX": 0.85, "SP500": 0.95, "MSCI_ACWI": 1.0}'::jsonb),
('US_10Y', '米国10年国債', 'Bond', 0.0300, 0.0500, '{"US_10Y": 1.0, "TOPIX": -0.20, "SP500": -0.15}'::jsonb),
('GOLD', '金 (GOLD)', 'Commodity', 0.0400, 0.1500, '{"GOLD": 1.0, "TOPIX": 0.10, "SP500": 0.05}'::jsonb);
```

### データモデル補足

- **UUIDの使用理由:** セキュリティ（推測不可）、分散システムでの一意性
- **JSONB型の活用:** 相関行列や計算結果などの柔軟なデータ保存
- **RLS（Row Level Security）:** データベースレベルでユーザー分離を保証
- **Soft Delete非採用:** シンプル化のため物理削除。必要に応じて `deleted_at` カラム追加

---

## API設計

### 認証フロー

```
1. [Frontend] Supabase Auth でログイン
   ↓
2. [Supabase] JWT トークン発行（RS256署名）
   ↓
3. [Frontend] localStorage に保存 + axios/fetch のヘッダーに自動付与
   ↓
4. [FastAPI] リクエスト受信 → JWT 検証（Supabase公開鍵）
   ↓
5. [FastAPI] ユーザーID抽出 → DB操作 → レスポンス
```

### エンドポイント一覧

#### 認証系（Supabase経由）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/auth/signup` | POST | 新規ユーザー登録（Supabaseへ委譲） |
| `/auth/login` | POST | ログイン（Supabaseへ委譲） |
| `/auth/logout` | POST | ログアウト |

#### ポートフォリオ管理

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/portfolios` | GET | ユーザーのポートフォリオ一覧取得 |
| `/api/portfolios` | POST | 新規ポートフォリオ作成 |
| `/api/portfolios/{id}` | GET | ポートフォリオ詳細取得 |
| `/api/portfolios/{id}` | PUT | ポートフォリオ更新 |
| `/api/portfolios/{id}` | DELETE | ポートフォリオ削除 |

#### 資産配分

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/portfolios/{id}/allocations` | GET | 資産配分取得 |
| `/api/portfolios/{id}/allocations` | POST | 資産配分設定 |

#### シミュレーション・計算

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/simulate/efficient-frontier` | POST | 効率的フロンティア計算 |
| `/api/simulate/monte-carlo` | POST | モンテカルロシミュレーション |
| `/api/simulate/backtest` | POST | バックテスト実行 |
| `/api/simulate/risk-parity` | POST | リスクパリティ戦略算出 |
| `/api/simulate/rebalance` | POST | リバランス提案計算 |

#### マスタデータ

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/assets` | GET | 利用可能資産一覧取得 |
| `/api/assets/{code}` | GET | 資産詳細取得 |
| `/api/asset-classes` | GET | 利用可能なアセットクラス（株式、債券等）の一覧取得 |

### リクエスト/レスポンス例

#### 効率的フロンティア計算

**Request:**
```http
POST /api/simulate/efficient-frontier
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "assets": ["TOPIX", "SP500", "US_10Y"],
  "n_points": 50,
  "constraints": {
    "min_weight": 0.0,
    "max_weight": 0.6,
    "target_return": null
  }
}
```

**Response:**
```json
{
  "frontier": [
    {
      "expected_return": 0.0300,
      "volatility": 0.0500,
      "weights": {"TOPIX": 0.0, "SP500": 0.0, "US_10Y": 1.0},
      "sharpe_ratio": 0.60
    },
    {
      "expected_return": 0.0400,
      "volatility": 0.0650,
      "weights": {"TOPIX": 0.2, "SP500": 0.3, "US_10Y": 0.5},
      "sharpe_ratio": 0.62
    }
    // ... 48 more points
  ],
  "max_sharpe": {
    "expected_return": 0.0550,
    "volatility": 0.1200,
    "weights": {"TOPIX": 0.3, "SP500": 0.4, "US_10Y": 0.3},
    "sharpe_ratio": 0.46
  },
  "calculation_time_ms": 245
}
```

#### モンテカルロシミュレーション

**Request:**
```http
POST /api/simulate/monte-carlo
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "portfolio_id": "123e4567-e89b-12d3-a456-426614174000",
  "initial_investment": 1000000,
  "monthly_contribution": 50000,
  "years": 20,
  "n_simulations": 10000,
  "inflation_rate": 0.02
}
```

**Response:**
```json
{
  "percentiles": {
    "10": 2500000,
    "25": 3200000,
    "50": 4500000,
    "75": 6100000,
    "90": 8000000
  },
  "mean": 4800000,
  "std_dev": 1500000,
  "probability_of_loss": 0.05,
  "simulations": [...], // 全シミュレーション結果（オプション）
  "calculation_time_ms": 1850
}
```

### エラーレスポンス

```json
{
  "error": {
    "code": "INVALID_WEIGHTS",
    "message": "資産配分の合計が1.0になっていません（合計: 0.95）",
    "details": {
      "sum": 0.95,
      "expected": 1.0
    }
  }
}
```

### API設計原則

1. **RESTful設計:** リソースベースのURL設計
2. **バージョニング:** 将来的に `/v1/api/...` で管理
3. **冪等性:** GET/PUT/DELETE は冪等、POST は非冪等
4. **レート制限:** 未実装（将来的に slowapi で実装）
5. **CORS:** Vercel ドメインからのアクセスのみ許可

---

## 状態管理戦略

### クライアント状態管理の責務分離

| 状態の種類 | 管理方法 | 用途例 |
|----------|---------|--------|
| **UIローカル状態** | React useState | モーダル開閉、フォーム入力中の値 |
| **グローバルUI状態** | Zustand | サイドバー表示/非表示、テーマ設定 |
| **サーバー状態** | TanStack Query | ポートフォリオデータ、計算結果 |
| **フォーム状態** | React Hook Form | 資産配分入力、バリデーション |
| **永続化** | localStorage | ユーザー設定（表示通貨、言語） |

### Zustandストア設計

```typescript
// stores/portfolioStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface Asset {
  code: string
  weight: number
}

interface PortfolioState {
  // State
  currentPortfolio: Asset[]
  targetPortfolio: Asset[]
  selectedPortfolioId: string | null
  
  // Actions
  setCurrentPortfolio: (assets: Asset[]) => void
  setTargetPortfolio: (assets: Asset[]) => void
  selectPortfolio: (id: string) => void
  clearPortfolios: () => void
}

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    persist(
      (set) => ({
        currentPortfolio: [],
        targetPortfolio: [],
        selectedPortfolioId: null,
        
        setCurrentPortfolio: (assets) => 
          set({ currentPortfolio: assets }, false, 'setCurrentPortfolio'),
        
        setTargetPortfolio: (assets) => 
          set({ targetPortfolio: assets }, false, 'setTargetPortfolio'),
        
        selectPortfolio: (id) => 
          set({ selectedPortfolioId: id }, false, 'selectPortfolio'),
        
        clearPortfolios: () => 
          set({ 
            currentPortfolio: [], 
            targetPortfolio: [],
            selectedPortfolioId: null
          }, false, 'clearPortfolios'),
      }),
      { 
        name: 'portfolio-storage',
        partialize: (state) => ({ 
          selectedPortfolioId: state.selectedPortfolioId 
        })
      }
    ),
    { name: 'PortfolioStore' }
  )
)
```

### React Query設定

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      cacheTime: 1000 * 60 * 30, // 30分
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### カスタムフック例

```typescript
// hooks/usePortfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioApi } from '@/lib/api'

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: portfolioApi.getAll,
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: portfolioApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

export function useEfficientFrontier(assets: string[]) {
  return useQuery({
    queryKey: ['efficient-frontier', assets.sort()],
    queryFn: () => portfolioApi.calculateEfficientFrontier({ assets }),
    enabled: assets.length >= 2,
    staleTime: 1000 * 60 * 60 * 24, // 24時間（静的データのため）
  })
}
```

---

## データ可視化

### ライブラリ選定理由

| ライブラリ | 用途 | 理由 |
|----------|------|------|
| **Plotly.js** | 効率的フロンティア、3Dプロット、アニメーション | インタラクティブ性最高、金融チャートに最適 |
| **Recharts** | シンプルな折れ線/棒グラフ | React統合が簡単、軽量 |

### グラフコンポーネント例

#### 効率的フロンティア

```tsx
// components/charts/EfficientFrontierChart.tsx
import Plot from 'react-plotly.js'
import { useEfficientFrontier } from '@/hooks/useSimulations'

interface Props {
  assets: string[]
  currentPortfolio?: { volatility: number; expectedReturn: number }
}

export function EfficientFrontierChart({ assets, currentPortfolio }: Props) {
  const { data, isLoading, error } = useEfficientFrontier(assets)
  
  if (isLoading) return <div className="animate-pulse">計算中...</div>
  if (error) return <div className="text-red-500">エラーが発生しました</div>
  if (!data) return null
  
  const traces = [
    {
      x: data.frontier.map(p => p.volatility),
      y: data.frontier.map(p => p.expected_return),
      type: 'scatter',
      mode: 'lines+markers',
      name: '効率的フロンティア',
      line: { color: '#3b82f6', width: 3 },
      marker: { size: 6 }
    },
    {
      x: data.assets.map(a => a.volatility),
      y: data.assets.map(a => a.expected_return),
      type: 'scatter',
      mode: 'markers+text',
      name: '個別資産',
      marker: { size: 12, color: '#ef4444' },
      text: assets,
      textposition: 'top center',
      hovertemplate: '<b>%{text}</b><br>リスク: %{x:.2%}<br>リターン: %{y:.2%}<extra></extra>'
    }
  ]
  
  if (currentPortfolio) {
    traces.push({
      x: [currentPortfolio.volatility],
      y: [currentPortfolio.expectedReturn],
      type: 'scatter',
      mode: 'markers',
      name: '現在のポートフォリオ',
      marker: { size: 15, color: '#10b981', symbol: 'star' }
    })
  }
  
  return (
    <Plot
      data={traces}
      layout={{
        title: '効率的フロンティア',
        xaxis: { 
          title: 'リスク（標準偏差）', 
          tickformat: '.1%',
          range: [0, Math.max(...data.frontier.map(p => p.volatility)) * 1.1]
        },
        yaxis: { 
          title: '期待リターン', 
          tickformat: '.1%' 
        },
        hovermode: 'closest',
        showlegend: true,
        height: 500,
        margin: { l: 60, r: 30, t: 50, b: 60 }
      }}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false
      }}
      style={{ width: '100%' }}
    />
  )
}
```

#### モンテカルロ結果（アニメーション）

```tsx
// components/charts/MonteCarloChart.tsx
import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'

export function MonteCarloChart({ simulations }: { simulations: number[][] }) {
  const [frame, setFrame] = useState(0)
  const maxFrames = simulations[0].length
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % maxFrames)
    }, 100)
    return () => clearInterval(timer)
  }, [maxFrames])
  
  return (
    <Plot
      data={simulations.slice(0, 100).map((sim, idx) => ({
        x: Array.from({ length: frame + 1 }, (_, i) => i),
        y: sim.slice(0, frame + 1),
        type: 'scatter',
        mode: 'lines',
        line: { width: 1, color: `rgba(59, 130, 246, ${0.1})` },
        showlegend: false,
        hoverinfo: 'skip'
      }))}
      layout={{
        title: `モンテカルロシミュレーション（${frame + 1}/${maxFrames}年）`,
        xaxis: { title: '経過年数' },
        yaxis: { title: 'ポートフォリオ価値（円）', tickformat: ',.0f' },
        height: 400
      }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

---

## 認証・認可

### Supabase Auth設定

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

### FastAPI JWT検証

```python
# backend/app/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import httpx
import os

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """JWT検証してユーザーIDを返す"""
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# 使用例
@app.get("/api/portfolios")
async def get_portfolios(user_id: str = Depends(get_current_user)):
    # user_id を使ってDBクエリ
    pass
```

### 認証フロー実装例（フロントエンド）

```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <Input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <Input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  )
}
```

---

## デプロイ構成

### Railway設定（Backend + Database）

**railway.toml**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "backend"

[services.postgres]
name = "postgres"
```

### Vercel設定（Frontend）

**vercel.json**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-app.railway.app/api/:path*"
    }
  ]
}
```

### 環境変数設定

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API
NEXT_PUBLIC_API_URL=https://your-app.railway.app

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Backend (.env)**
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres.railway.internal:5432/railway

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO

# Calculation Settings
MAX_SIMULATIONS=50000
MAX_ASSETS_PER_PORTFOLIO=20
```

**Production Configuration Notes:**
- `ALLOWED_ORIGINS` は Vercel の本番ドメイン (`*.vercel.app`) に設定済み。
- `DATABASE_URL` は Railway 内部ネットワーク (`.railway.internal`) を優先するようにサービス内で構成。
- `NEXT_PUBLIC_API_URL` はフロントエンド環境変数にて Railway のパブリックドメインに設定済み。

---

## 開発開始チェックリスト

### 事前準備

- [ ] Node.js 18+ インストール
- [ ] Python 3.11+ インストール
- [ ] pnpm インストール (`npm install -g pnpm`)
- [ ] Poetry インストール (`pip install poetry`)
- [ ] Git リポジトリ作成
- [ ] Supabase アカウント作成
- [ ] Railway アカウント作成
- [ ] Vercel アカウント作成

### 初期セットアップ

```bash
# リポジトリクローン
git clone <your-repo-url>
cd investment-simulator

# Frontend セットアップ
cd frontend
pnpm install
cp .env.example .env.local
# .env.local に環境変数を設定

# Backend セットアップ
cd ../backend
poetry install
cp .env.example .env
# .env に環境変数を設定

# データベース初期化
alembic upgrade head
python data/scripts/seed_assets.py

# 開発サーバー起動
# Terminal 1
cd frontend && pnpm dev

# Terminal 2
cd backend && poetry run uvicorn app.main:app --reload
```

### デプロイ準備

- [ ] Supabase プロジェクト作成・認証設定
- [ ] Railway プロジェクト作成
- [ ] Railway に PostgreSQL 追加
- [ ] Railway に環境変数設定
- [ ] Vercel プロジェクト作成
- [ ] Vercel に環境変数設定
- [ ] カスタムドメイン設定（オプション）

---

## トラブルシューティング

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|-----|------|--------|
| JWT検証エラー | Supabase JWT Secret不一致 | Supabase Dashboard → Settings → API → JWT Secret を確認 |
| CORS エラー | ALLOWED_ORIGINS設定漏れ | Backend .env に Vercel URL 追加 |
| DB接続エラー | DATABASE_URL不正 | Railway Dashboard でDB接続文字列確認 |
| Plotly表示されない | Dynamic Import未設定 | `const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })` |
| 計算が遅い | NumPy最適化不足 | `pip install numpy --upgrade` で最新版へ |
| Railway スリープ | Free Tier の制限 | Starter Plan ($5/月) へアップグレード |

### パフォーマンス最適化

**計算高速化:**
```python
# NumPy のマルチスレッド設定
import os
os.environ['OMP_NUM_THREADS'] = '4'
os.environ['OPENBLAS_NUM_THREADS'] = '4'
```

**フロントエンド最適化:**
```typescript
// 大きなグラフのDynamic Import
const MonteCarloChart = dynamic(
  () => import('@/components/charts/MonteCarloChart'),
  { ssr: false, loading: () => <Skeleton /> }
)
```

---

## セキュリティチェックリスト

- [ ] 環境変数を .gitignore に追加
- [ ] HTTPS のみ許可（Railway/Vercel 自動対応）
- [ ] CORS 設定を本番ドメインのみに制限
- [ ] Row Level Security (RLS) 有効化確認
- [ ] SQL インジェクション対策（Parameterized Query）
- [ ] XSS 対策（React自動エスケープ + CSP設定）
- [ ] Rate Limiting 実装（将来的に slowapi 導入）
- [ ] JWT 有効期限設定（Supabase デフォルト: 1時間）
- [ ] 機密データのログ出力禁止
- [ ] 依存パッケージの脆弱性スキャン（`pnpm audit`, `safety check`）

---

## まとめ

本技術スタックは以下の特徴を持ちます:

✅ **個人開発に最適化:** Gemini CLI活用でPython開発を加速  
✅ **低コスト:** 初期 $5/月、成長しても $10-65/月  
✅ **高パフォーマンス:** NumPy/SciPyで<1秒計算、Plotlyで滑らかなグラフ  
✅ **スケーラブル:** 1,000ユーザーまで余裕で対応  
✅ **保守性:** TypeScript + Python の明確な責務分離  
✅ **セキュア:** JWT認証 + RLS でデータ保護  

このドキュメントをベースに、確実に実装を進めてください。不明点があれば随時アップデートします。

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-04  
**Status:** Core simulation features (Efficient Frontier, Risk Parity) and backend caching mechanism implemented.
**Author:** Investment Simulator Development Team.co
