# Specification: 資産データ管理の実装

## 概要
投資シミュレーション（効率的フロンティア、モンテカルロなど）に使用する資産の統計データ（期待リターン、リスク、相関）を保存・提供するためのバックエンド機能を構築する。

## 要件
1.  **データモデル (`AssetData`):**
    - `asset_code` (PK): 資産コード (例: "TOPIX", "SP500")
    - `name`: 資産名称
    - `asset_class`: 資産クラス (例: "Stock", "Bond")
    - `expected_return`: 年率期待リターン (DECIMAL)
    - `volatility`: 年率ボラティリティ (DECIMAL)
    - `correlation_matrix`: 他資産との相関係数 (JSONB)
    - `updated_at`: 更新日時

2.  **APIエンドポイント:**
    - `GET /api/assets`: 全資産の一覧取得
    - `GET /api/assets/{asset_code}`: 特定資産の詳細取得
    - (将来的に) `POST/PUT /api/assets`: 管理者用データ更新機能

3.  **初期データ:**
    - シミュレーションをすぐに開始できるよう、代表的な資産クラスのデフォルトデータを投入する。

## 技術的考慮事項
- SQLAlchemyでの `JSONB` 型の扱い。
- Alembic によるマイグレーション管理。
- Pydantic スキーマでのバリデーション。
