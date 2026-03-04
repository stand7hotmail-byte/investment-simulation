# Specification: 本番環境へのデプロイと公開 (Deployment_and_Production_Setup)

## 1. 概要 (Overview)
開発した投資シミュレーションアプリを、`tech-stack.md` に定義された構成に基づき本番環境へデプロイする。フロントエンドを Vercel、バックエンドおよび PostgreSQL データベースを Railway にホスティングし、ユーザーがインターネット経由でアクセス可能な状態にする。

## 2. 機能要件 (Functional Requirements)

### 2.1 バックエンド・データベースのデプロイ (Railway)
- **PostgreSQL プロビジョニング:** Railway 上で PostgreSQL データベースを稼働させ、`alembic` を使用してスキーマを本番環境へ適用する。
- **FastAPI デプロイ:** `backend` ディレクトリのコードを Railway へデプロイし、本番用 URL で API が公開されるようにする。
- **環境変数の適用:** `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS` などの本番用シークレットを Railway のダッシュボードで設定する。

### 2.2 フロントエンドのデプロイ (Vercel)
- **Next.js デプロイ:** `frontend` ディレクトリのコードを Vercel へデプロイする。
- **環境変数の適用:** `NEXT_PUBLIC_API_URL` (Railway の URL) および Supabase の接続情報を Vercel のダッシュボードで設定する。
- **CORS 設定の同期:** Vercel のデプロイ完了後、付与された URL を Railway の `ALLOWED_ORIGINS` に追加して通信を許可する。

### 2.3 本番データの初期化 (Seeding)
- **資産データの投入:** 本番環境のデータベースに対して `seed_assets.py` および `collect_historical_data.py` を実行し、シミュレーションに必要な基礎データを投入する。

## 3. 非機能要件 (Non-Functional Requirements)
- **セキュリティ:** 本番環境での JWT 検証が正しく機能することを確認し、CORS を許可されたドメインのみに制限する。
- **可用性:** プラットフォーム標準のヘルスチェックにより、サービスの稼働を確認する。

## 4. 受入基準 (Acceptance Criteria)
- Vercel の公開 URL からアプリケーションにアクセスできること。
- ログイン・新規登録が本番環境で正常に行えること。
- シミュレーション機能（効率的フロンティア、積立シミュレーション）が本番の資産データを使用して計算・表示できること。
- すべての通信が HTTPS 経由で行われていること。

## 5. 対象外 (Out of Scope)
- 独自ドメインの取得および DNS 設定。
- 本番環境での負荷テスト。
