# Implementation Plan: Endpoints & Stability Fix

## Step 1: バックエンドAPIの追加
- `backend/app/main.py` に `custom-portfolio` および `simulation-results` のエンドポイントを追加。
- `backend/app/crud.py` に必要なCRUD操作が存在することを確認（確認済み）。

## Step 2: データベース初期化の修正
- `SPEC-006` に違反している以下のファイルを `get_engine()`, `get_session_local()` を使用するように修正。
    - `backend/app/seed_assets.py`
    - `backend/scripts/collect_historical_data.py`
    - `backend/check_db.py`
    - `backend/tests/test_collect_historical_data.py`

## Step 3: ログ解析ユーティリティの復元
- 誤って削除されていた解析関数を `backend/app/log_utils.py` に復元。

## Step 4: 検証
- 新規エンドポイントのテスト `backend/tests/test_new_endpoints.py` を作成。
- `pytest` を実行し、全テストが通過することを確認。
