# Implementation Plan: 資産データ管理の実装

このプランは、資産データの管理と提供のためのバックエンド実装手順を定義します。

## Phase 1: データベースとモデルの構築

- [ ] **Task: `AssetData` モデルの作成とマイグレーション**
    - [ ] `backend/app/models.py` に `AssetData` クラスを追加。
    - [ ] `alembic revision --autogenerate` でマイグレーションファイルを作成。
    - [ ] `alembic upgrade head` でテーブルを作成。

## Phase 2: CRUD と API の実装

- [ ] **Task: 資産データ用 CRUD 関数の実装**
    - [ ] `backend/app/schemas.py` に `AssetData` スキーマを追加。
    - [ ] `backend/app/crud.py` に `get_assets`, `get_asset_by_code` 関数を追加。

- [ ] **Task: API エンドポイントの実装**
    - [ ] `backend/app/main.py` に `/api/assets` 関連のルートを追加。
    - [ ] 失敗するテストを `backend/tests/test_assets.py` に作成。
    - [ ] テストをパスさせる。

## Phase 3: シードデータの投入

- [ ] **Task: 初期資産データの投入**
    - [ ] 資産データを投入するためのスクリプト `backend/app/seed_assets.py` を作成。
    - [ ] スクリプトを実行して初期データを投入。
