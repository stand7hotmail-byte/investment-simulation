# Implementation Plan: デプロイ・本番環境構築 (Deployment and Production Setup)

## Phase 1: CLI ツールとプロジェクトの初期セットアップ [checkpoint: d36c35b]
- [x] Task: CLI ツールのインストールと認証
    - [x] Vercel CLI のインストールとログイン (`vercel login`)
    - [x] Railway CLI のインストールとログイン (`railway login`)
- [x] Task: Conductor - User Manual Verification 'CLI ツールとプロジェクトの初期セットアップ' (Protocol in workflow.md)

## Phase 2: バックエンドとデータベースのデプロイ (Railway)
- [ ] Task: Railway プロジェクトと PostgreSQL のプロビジョニング
    - [ ] Railway プロジェクトの初期化 (`railway init`)
    - [ ] PostgreSQL サービスの追加
- [ ] Task: 環境変数の設定 (Railway)
    - [ ] `railway vars set` を使用して `DATABASE_URL` を設定
    - [ ] `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` を設定
    - [ ] `ALLOWED_ORIGINS` を設定（フロントエンドの URL 確定後に更新）
- [ ] Task: デプロイコマンドの構成 (自動マイグレーション設定)
    - [ ] `railway.toml` またはスタートコマンドを編集し、起動前に `alembic upgrade head` と `python app/seed_assets.py` が実行されるように設定
- [ ] Task: バックエンドのデプロイ実行
    - [ ] `railway up` を実行し、ログでマイグレーションと起動の成功を確認
- [ ] Task: Conductor - User Manual Verification 'バックエンドとデータベースのデプロイ' (Protocol in workflow.md)

## Phase 3: フロントエンドのデプロイ (Vercel)
- [ ] Task: Vercel プロジェクトの構成と環境変数の設定
    - [ ] `vercel link` でフロントエンドディレクトリを連携
    - [ ] `vercel env add` で `NEXT_PUBLIC_API_URL` (Railway の URL) を設定
    - [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
- [ ] Task: フロントエンドのデプロイ実行
    - [ ] `vercel --prod` を実行し、プロダクションビルドとデプロイを完了させる
- [ ] Task: CORS と Supabase 設定の最終調整
    - [ ] Railway の `ALLOWED_ORIGINS` を Vercel の本番 URL で更新
    - [ ] Supabase の Auth 設定（Redirect URL 等）に本番ドメインを追加
- [ ] Task: Conductor - User Manual Verification 'フロントエンドのデプロイ' (Protocol in workflow.md)

## Phase 4: 最終統合確認
- [ ] Task: 本番環境でのスモークテスト実行
    - [ ] 公開 URL でホームページが表示されることを確認
    - [ ] ログイン・サインアップが動作することを確認
    - [ ] シミュレーション機能（効率的フロンティア等）が正しく計算・表示されることを確認
- [ ] Task: Conductor - User Manual Verification '最終統合確認' (Protocol in workflow.md)
