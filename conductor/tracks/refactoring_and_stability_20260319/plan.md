# Implementation Plan - Comprehensive System Refactoring & Stability Improvement

本プロジェクトの技術的負債を解消し、長期的な保守性とパフォーマンスを向上させるためのリファクタリングプランです。

## Phase 1: Backend Core Refactoring
バックエンドの計算ロジックとエンドポイント構造を整理し、堅牢性を高めます。

- [x] Task: `simulation.py` のモジュール化と数学的安定性の強化 [4264348]
    - [x] Write Tests: シミュレーション計算（幾何平均、年換算、キャップ処理）の境界値テストを記述
    - [x] Implement: `simulation.py` を整理し、責務ごとに内部関数を分割。計算ロジックの再利用性を高める。
- [x] Task: `seed_assets.py` のデータ・コード分離 [4264348]
    - [x] Write Tests: 事前計算データのバリデーション（型、期待される範囲）テストを記述
    - [x] Implement: `PRECOMPUTED_DATA` を別ファイル（例: `data/precomputed_assets.py` または JSON）に切り出し、スクリプト本体をクリーンにする。
- [x] Task: `main.py` のエンドポイント整理と共通依存関係の標準化 [4264348]
    - [x] Write Tests: 各エンドポイントのレスポンス形式と共通エラーハンドリングのテストを記述
    - [x] Implement: 共通の `Depends` や例外処理をデコレータやミドルウェアに整理し、`main.py` の見通しを良くする。
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend Core Refactoring' (Protocol in workflow.md)

## Phase 2: Frontend Infrastructure & Hook Standardization
フロントエンドの共通基盤とデータフェッチロジックを標準化します。

- [ ] Task: カスタムフックのパターン統一とエラーハンドリング一元化
    - [ ] Write Tests: `useEfficientFrontier` 等のフックが、バックエンドのエラーを正しく統一形式で捕捉するテストを記述
    - [ ] Implement: `hooks/` 以下の React Query フックをベースクラスや共通パターンに合わせ、冗長なコードを削除。
- [ ] Task: 型定義の整理と API 同期の強化
    - [ ] Write Tests: `types/simulation.ts` がバックエンドの Pydantic スキーマと一致していることを確認する静的チェック
    - [ ] Implement: 重複した型定義を削除し、共通の `types/` ディレクトリに集約。
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Infrastructure & Hook Standardization' (Protocol in workflow.md)

## Phase 3: Frontend Component Modularization & State Consistency
UIコンポーネントの分割と状態管理の一貫性を確保します。

- [ ] Task: 肥大化したシミュレーション画面の分割
    - [ ] Write Tests: 分割後のサブコンポーネントが単体で正しくレンダリングされるテストを記述
    - [ ] Implement: `EfficientFrontier` ページ等の巨大なコンポーネントを、グラフ、入力フォーム、結果サマリーなどの小さなコンポーネントに分割。
- [ ] Task: Zustand ストアの `hasHydrated` フラグ利用の統一
    - [ ] Write Tests: ストア読み込み完了前にサイドエフェクトが発生しないことを検証するテストを記述
    - [ ] Implement: 全ての Persist ストアで `hasHydrated` パターンを徹底し、ハイドレーションエラーを防止。
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Component Modularization & State Consistency' (Protocol in workflow.md)

## Phase 4: Final Verification & Lesson Learned
システム全体の統合テストを行い、得られた知見を記録します。

- [ ] Task: 全テストスイートの実行とカバレッジ確認
    - [ ] Execute: `pytest` および `vitest` を実行し、リファクタリングによるデグレードがないことを確認
- [ ] Task: Lesson Learned Protocol の実行
    - [ ] Extract: 今回発見した「ベストプラクティス」や「アンチパターン」を抽出
    - [ ] Update: `GEMINI.md` に知見を記録
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification & Lesson Learned' (Protocol in workflow.md)
