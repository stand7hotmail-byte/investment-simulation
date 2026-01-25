# Implementation Plan: モンテカルロシミュレーションの実装

このプランは、将来の資産形成を確率的に予測するモンテカルロシミュレーションエンジンの開発と、それを提供するAPIエンドポイントの実装手順を定義します。

## Phase 1: シミュレーションエンジンの拡張 [checkpoint: 1a2f936]

- [x] **Task: モンテカルロ計算ロジックの実装** e14a723
    - [x] `backend/app/simulation.py` に幾何ブラウン運動を用いたシミュレーション関数を追加。
    - [x] 毎月の積み立て、および任意タイミングの追加投資を考慮したロジックを実装。
    - [x] ポートフォリオ配分から全体の期待リターンとリスクを算出する補助関数を実装。
- [x] **Task: ロジックのユニットテスト作成 (TDD Red Phase)** e14a723
    - [x] `backend/tests/test_simulation.py` にモンテカルロシミュレーション用のテストケースを追加。
    - [x] 期待される統計値（中央値や確率）の妥当性を検証するテストを記述。
    - [x] テストを実行し、失敗することを確認。
- [x] **Task: テストをパスさせる実装 (TDD Green Phase)** e14a723
    - [x] `simulation.py` の関数を完成させ、テストをパスさせる。
    - [x] NumPy等を使用してパフォーマンス（1秒以内）を確保。
- [x] **Task: Conductor - User Manual Verification 'シミュレーションエンジン' (Protocol in workflow.md)**

## Phase 2: API統合

- [x] **Task: スキーマの定義** 9e03c6a
    - [ ] `backend/app/schemas.py` に `MonteCarloRequest` および `MonteCarloResponse` スキーマを追加。
    - [ ] 任意タイミングの追加投資を表現するネストされたスキーマを定義。
- [x] **Task: エンドポイントの実装** 16618b5
    - [ ] `backend/app/main.py` に `POST /api/simulate/monte-carlo` を実装。
    - [ ] データベースからポートフォリオ情報を取得し、計算エンジンへ渡す連携処理を実装。
- [x] **Task: 統合テストの作成と実行** 6e64ce4
    - [ ] 実際にAPIを呼び出し、正しいデータ構造とステータスコードが返ることを検証。
- [ ] **Task: Conductor - User Manual Verification 'API統合' (Protocol in workflow.md)**
