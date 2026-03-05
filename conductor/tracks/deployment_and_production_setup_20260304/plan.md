# Implementation Plan: 本番環境へのデプロイと公開 (Deployment_and_Production_Setup)

このプランは、バックエンドを Railway、フロントエンドを Vercel へデプロイし、本番環境を構築する手順を定義します。

## Phase 1: Railway (Backend & DB) の構築とデプロイ

- [x] Task: CLI ツールのインストールと認証
    - [x] `railway login` および `vercel login` が完了しているか確認。
- [x] Task: データベースのセットアップとマイグレーション
    - [x] Railway の PostgreSQL インスタンスへ接続。
    - [x] ローカルから本番 DB へ `alembic upgrade head` を実行。 (Railway デプロイ時に自動実行)
- [x] Task: バックエンドのデプロイと環境変数設定
    - [x] `backend` ディレクトリを Railway へアップロード (`railway up`)。
    - [x] 本番用の `DATABASE_URL`, `SUPABASE_JWT_SECRET` 等を Railway ダッシュボードで設定。
    - [x] API のベース URL (Railway 提供ドメイン) を取得。 (https://postgresql-production-ba08.up.railway.app)
- [x] Task: Conductor - User Manual Verification 'Railway (Backend & DB) の構築とデプロイ' (Protocol in workflow.md)

## Phase 2: Vercel (Frontend) のデプロイ

- [x] Task: フロントエンドのデプロイ設定
    - [x] `frontend` ディレクトリにて `vercel` コマンドを実行し、プロジェクトをリンク。
    - [x] `NEXT_PUBLIC_API_URL` に Phase 1 で取得した Railway の URL を設定。
    - [x] Supabase の本番用環境変数を設定。
- [x] Task: デプロイ実行と動作確認
    - [x] `vercel --prod` で本番ビルドを実行。
    - [x] 公開された Vercel ドメインを取得。 (https://investment-sim-frontend.vercel.app)
- [x] Task: Railway 側の CORS 設定更新
    - [x] Railway の `ALLOWED_ORIGINS` に Vercel の公開ドメインを追加して更新。
- [x] Task: Conductor - User Manual Verification 'Vercel (Frontend) のデプロイ' (Protocol in workflow.md)

## Phase 3: 本番データの投入と最終統合確認

- [x] Task: 本番資産データのシード実行
    - [x] 本番 DB に対して `seed_assets.py` を実行（リモート実行または Railway 内のジョブとして）。
    - [x] `collect_historical_data.py` を実行して過去データを収集。
- [x] Task: 全機能の疎通確認
    - [x] 公開 URL でのログイン、シミュレーション実行、ダッシュボード表示を最終確認。
- [x] Task: Conductor - User Manual Verification '本番データの投入と最終統合確認' (Protocol in workflow.md)
