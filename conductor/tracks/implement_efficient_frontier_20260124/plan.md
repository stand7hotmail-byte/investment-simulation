# Implementation Plan: 効率的フロンティア計算の実装

このプランは、効率的フロンティア計算ロジックの実装とAPI統合の手順を定義します。

## Phase 1: 計算エンジンの実装

- [x] **Task: 依存ライブラリのインストール**
    - [x] `cvxpy`, `numpy`, `scipy` がインストールされているか確認、不足していれば追加。
- [x] **Task: 最適化ロジックの実装**
    - [x] `backend/app/simulation.py` を作成。
    - [x] `cvxpy` を使用した平均分散最適化関数を実装。

## Phase 2: API 統合

- [x] **Task: スキーマの定義**
    - [x] `backend/app/schemas.py` にシミュレーション用のリクエスト/レスポンススキーマを追加。
- [x] **Task: エンドポイントの実装**
    - [x] `backend/app/main.py` に `/api/simulate/efficient-frontier` を追加。
    - [x] データベースから資産統計データを取得して計算エンジンに渡す処理を実装。

## Phase 3: 検証

- [x] **Task: ユニットテストと動作確認**
    - [x] `backend/tests/test_simulation.py` を作成して計算結果の妥当性を検証。
    - [x] 既知 babysitter データセットで期待通りのフロンティアが描けるか確認。
