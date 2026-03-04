# Implementation Plan: 本番環境へのデプロイと公開 (Deployment_and_Production_Setup)

このプランは、バックエンドを Railway、フロントエンドを Vercel へデプロイし、本番環境を構築する手順を定義します。

## Phase 1: Railway (Backend & DB) の構築とデプロイ

- [ ] Task: CLI ツールのインストールと認証
    - [ ] `railway login` および `vercel login` が完了しているか確認。
- [ ] Task: データベースのセットアップとマイグレーション
    - [ ] Railway の PostgreSQL インスタンスへ接続。
    - [ ] ローカルから本番 DB へ `alembic upgrade head` を実行。
- [ ] Task: バックエンドのデプロイと環境変数設定
    - [ ] `backend` ディレクトリを Railway へアップロード (`railway up`)。
    - [ ] 本番用の `DATABASE_URL`, `SUPABASE_JWT_SECRET` 等を Railway ダッシュボードで設定。
    - [ ] API のベース URL (Railway 提供ドメイン) を取得。
- [ ] Task: Conductor - User Manual Verification 'Railway (Backend & DB) の構築とデプロイ' (Protocol in workflow.md)

## Phase 2: Vercel (Frontend) のデプロイ

- [ ] Task: フロントエンドのデプロイ設定
    - [ ] `frontend` ディレクトリにて `vercel` コマンドを実行し、プロジェクトをリンク。
    - [ ] `NEXT_PUBLIC_API_URL` に Phase 1 で取得した Railway の URL を設定。
    - [ ] Supabase の本番用環境変数を設定。
- [ ] Task: デプロイ実行と動作確認
    - [ ] `vercel --prod` で本番ビルドを実行。
    - [ ] 公開された Vercel ドメインを取得。
- [ ] Task: Railway 側の CORS 設定更新
    - [ ] Railway の `ALLOWED_ORIGINS` に Vercel の公開ドメインを追加して更新。
- [ ] Task: Conductor - User Manual Verification 'Vercel (Frontend) のデプロイ' (Protocol in workflow.md)

## Phase 3: 本番データの投入と最終統合確認

- [ ] Task: 本番資産データのシード実行
    - [ ] 本番 DB に対して `seed_assets.py` を実行（リモート実行または Railway 内のジョブとして）。
    - [ ] `collect_historical_data.py` を実行して過去データを収集。
- [ ] Task: 全機能の疎通確認
    - [ ] 公開 URL でのログイン、シミュレーション実行、ダッシュボード表示を最終確認。
- [ ] Task: Conductor - User Manual Verification '本番データの投入と最終統合確認' (Protocol in workflow.md)
