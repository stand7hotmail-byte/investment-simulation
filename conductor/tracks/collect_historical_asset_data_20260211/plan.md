# Implementation Plan: 過去資産データ収集・活用機能の実装

このプランは、各種資産の過去データ収集、データモデル拡張、APIエンドポイント実装、およびデータ活用機能の実現のための手順を定義します。

## Phase 1: データモデルの拡張とデータ収集基盤の準備 [checkpoint: 0b7c0a1]

- [x] Task: `AssetData` モデルの `historical_prices` カラム追加とマイグレーション [03e9f6e]
    - [x] `backend/app/models.py` 内の `AssetData` モデルに `historical_prices` (JSONB) カラムを追加。
    - [x] `alembic revision --autogenerate` を実行してマイグレーションファイルを生成。
    - [x] 生成されたマイグレーションファイルの内容を確認し、`alembic upgrade head` で適用。
- [x] Task: Yahoo Finance API クライアントの実装 [60a914b]
    - [x] `backend/app/data_sources/yahoo_finance.py` を新規作成。
    - [x] Yahoo Finance から過去の価格データを取得するための関数を実装（例: 特定のシンボル、開始日、終了日で日足データを取得）。
    - [x] 取得したデータを `historical_prices` JSONB形式に変換するユーティリティ関数を実装。
- [x] Task: 収集スクリプトの作成 [260da39]
    - [x] `backend/scripts/collect_historical_data.py` を新規作成。
    - [x] `AssetData` テーブルに登録されている各資産の過去データを、Yahoo Finance API クライアントを使用して収集するロジックを実装。
    - [x] 収集したデータを `AssetData` モデルの `historical_prices` カラムに保存する処理を実装。
- [x] Task: Conductor - User Manual Verification 'データモデルの拡張とデータ収集基盤の準備' (Protocol in workflow.md) [ae0d72b]

## Phase 2: 過去データAPIエンドポイントの実装と既存機能への統合

- [x] Task: 過去データ取得APIエンドポイントの実装 [40c6b63]
    - [x] `backend/app/schemas.py` に `HistoricalDataResponse` スキーマを定義（日付、価格などのリストを含む）。
    - [x] `backend/app/main.py` に `GET /api/assets/{asset_code}/historical-data` エンドポイントを追加。
    - [x] データベースから `AssetData` の `historical_prices` を取得し、`HistoricalDataResponse` スキーマに沿って整形して返却するロジックを実装。
- [ ] Task: 既存のシミュレーション機能への統合
    - [ ] `backend/app/simulation.py` を更新し、バックテストやモンテカルロシミュレーションが `AssetData` から `historical_prices` を利用できるように修正。
    - [ ] 資産間の相関係数や共分散の計算ロジックが `historical_prices` を利用できるように修正。
- [ ] Task: Conductor - User Manual Verification '過去データAPIエンドポイントの実装と既存機能への統合' (Protocol in workflow.md)

## Phase 3: フロントエンドへの統合と検証

- [ ] Task: 過去価格データ表示コンポーネントの実装
    - [ ] `frontend/src/components/charts/AssetHistoricalChart.tsx` を新規作成。
    - [ ] `GET /api/assets/{asset_code}/historical-data` エンドポイントを呼び出し、取得したデータで価格推移グラフを表示するReactコンポーネントを実装（Plotly.jsまたはRechartsを使用）。
- [ ] Task: 既存機能のUI更新と動作確認
    - [ ] バックテスト、モンテカルロシミュレーション、相関係数表示などの既存のUIが、新しい過去データ基盤と正しく連携していることを確認。
- [ ] Task: Conductor - User Manual Verification 'フロントエンドへの統合と検証' (Protocol in workflow.md)
