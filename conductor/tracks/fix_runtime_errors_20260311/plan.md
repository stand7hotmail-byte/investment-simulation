# Implementation Plan - Fix Production Runtime Errors and Improve Stability

本番環境で特定された潜在的なランタイムエラーを修正し、アプリケーションの堅牢性を向上させます。

## Phase 1: Frontend Runtime Error Fixes [checkpoint: 40256e3]
フロントエンドの各コンポーネントにおける JS クラッシュのリスクを解消します。

- [x] Task: Dashboard の日付フォーマット処理の堅牢化 ef4c61f
    - [x] `DashboardPage` のテストを作成し、不正な `created_at` でクラッシュすることを確認 (Red Phase)
    - [x] `new Date()` へのガードと `isValid` チェックを追加 (Green Phase)
- [x] Task: Efficient Frontier チャートの計算ガード追加 5ed6a9f
    - [x] `EfficientFrontierChart` で候補データが空の場合の `reduce` クラッシュを再現するテストを作成 (Red Phase)
    - [x] 配列の長さチェックまたは初期値の導入により修正 (Green Phase)
- [x] Task: Accumulation Sim の結果マッピングの安全化 1c628d9
    - [x] `AccumulationPage` で `results.history` が欠落しているケースのテストを作成 (Red Phase)
    - [x] オプショナルチェイニングとフォールバック値の導入 (Green Phase)
- [x] Task: Sparkline コンポーネントの描画ガード 527689c
    - [x] データが空または要素が1つの場合のテストを作成 (Red Phase)
    - [x] `Math.min/max` の安全な呼び出しと SVG パスのガードを実装 (Green Phase)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Frontend Runtime Error Fixes' (Protocol in workflow.md) 745d6e2

## Phase 2: Backend Calculation Stability
資産データ不足時の計算の不安定さを解消します。

- [x] Task: `simulation.py` の共分散行列計算のガード実装 410c96c
    - [ ] 資産間の過去データの重なりが極端に短い場合に警告/エラーが出るテストを作成 (Red Phase)
    - [ ] `np.cov` 実行前のデータ長チェックと、自由度不足時の安全なフォールバックを実装 (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Calculation Stability' (Protocol in workflow.md)

## Phase 3: Final Validation and Cleanup
全体の整合性とカバレッジを確認します。

- [ ] Task: 全テストの実行とカバレッジ確認
    - [ ] `npm test` および `pytest` を実行し、全件パスを確認
    - [ ] 新規修正箇所のカバレッジが 80% 以上であることを確認
- [ ] Task: 不要な非Null表明（!）の削除
    - [ ] 修正箇所の周辺で不要になった `!` を削除し、型安全なコードに整理
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Validation and Cleanup' (Protocol in workflow.md)
