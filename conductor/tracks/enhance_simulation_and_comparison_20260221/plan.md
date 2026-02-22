# シミュレーションの高度化とポートフォリオ比較機能の実装 (enhance_simulation_and_comparison_20260221)

## 完了日

2026年2月22日

## 完了した目標

- **Phase 1: Efficient Frontier の可視化とカスタムプロットの実装**
    - カスタム配分入力 UI の作成
    - カスタムポートフォリオのリスク・リターン計算とプロット
- **Phase 2: 複数のポートフォリオ比較機能の実装**
    - 比較用ポートフォリオの選択 UI の作成
    - ポートフォリオ比較グラフの表示
    - シミュレーション結果の比較分析
- **Phase 3: シミュレーション計算ロジックの適正化**
    - リスク・パリティ最適化の計算効率改善
    - シミュレーション結果の保存と履歴管理
    - 統計的有意性の評価と表示

## 変更の概要

### バックエンド (Python/FastAPI)

- **`backend/app/simulation.py`**:
    - `calculate_risk_parity_weights` 関数において、目的関数を各資産のリスク寄与度の対数の分散を最小化するように変更し、数値安定性と効率を向上。
    - `calculate_risk_parity_weights` 関数の初期値を、各資産の逆ボラティリティに比例する重みに変更し、最適化の収束を改善。
    - `monte_carlo_simulation` 関数に最終ポートフォリオ価値の95%信頼区間を計算して返す機能を追加。
- **`backend/app/models.py`**:
    - `SimulationResult` モデルに `user_id` カラムを追加し、シミュレーション結果をユーザーに紐付け。
- **Alembic マイグレーション**:
    - `533269cf7904_add_user_id_to_simulationresult.py` を手動で修正し、`SimulationResult` テーブルに `user_id` (VARCHAR(36)) カラムを追加するマイグレーションを適用。`test.db` の削除・再作成によりデータベースの状態をクリーンに。
- **`backend/app/crud.py`**:
    - `create_simulation_result` 関数が `user_id` を受け取るように変更。
    - `get_simulation_results` 関数（ユーザーIDでフィルタリング）と `get_simulation_result_by_id` 関数（IDとユーザーIDで取得）を追加。
    - `delete_simulation_result` 関数（IDとユーザーIDで削除）を追加。
- **`backend/app/schemas.py`**:
    - `SimulationResultBase`, `SimulationResultCreate`, `SimulationResult` スキーマを追加。
    - `MonteCarloResponse` スキーマに `confidence_interval_95` フィールドを追加。
- **`backend/app/main.py`**:
    - `/api/simulation-results` (POST, GET, GET/{id}, DELETE) エンドポイントを追加し、シミュレーション結果の保存、取得、削除を可能に。
    - `/api/simulate/risk-parity` エンドポイントで `user_id` を取得し、`crud.create_simulation_result` に渡すように修正。

### フロントエンド (TypeScript/Next.js)

- **`frontend/src/components/simulation/AllocationTable.tsx`**:
    - `comparisonPortfolioPoints` プロップを追加し、複数のポートフォリオを比較するサマリーテーブルを表示。
    - 各ポートフォリオのシャープ・レシオ（無リスク金利0.02を仮定）を計算・表示。
- **`frontend/src/app/simulation/efficient-frontier/page.tsx`**:
    - `AllocationTable` に `comparisonPortfolioPoints` プロップを渡すように修正。
    - シミュレーション結果を保存するための「Save Simulation Result」ボタンを追加。
    - `useSaveSimulationResult` フックを統合し、シミュレーション結果をバックエンドに保存するロジックを実装。
- **`frontend/src/app/simulation/accumulation/page.tsx`**:
    - モンテカルロシミュレーションの結果表示UIに、95%信頼区間の下限と上限を表示するカードを追加。
- **`frontend/src/app/simulation/history/page.tsx` (新規作成)**:
    - ユーザーの保存されたシミュレーション結果の履歴を表示するページを作成。
    - 各結果を読み込んだり、削除したりする機能を提供。
- **`frontend/src/hooks/useSaveSimulationResult.ts` (新規作成)**:
    - `/api/simulation-results` エンドポイントへの POST リクエストを処理し、シミュレーション結果を保存するためのTanStack Queryフック。
- **`frontend/src/hooks/useSimulationResults.ts` (新規作成)**:
    - `/api/simulation-results` エンドポイントへの GET/DELETE リクエストを処理し、シミュレーション結果の履歴を取得・管理するためのTanStack Queryフック。
- **`frontend/src/components/layout/Sidebar.tsx`**:
    - 「Simulation History」ページへのナビゲーションリンクを追加。
- **`frontend/package.json`**:
    - `axios` パッケージを追加。
- **`frontend/vitest.config.ts`**:
    - `optimizeDeps.include` に `axios` を追加し、Vitest 環境での依存解決を改善。

## 確認事項

- すべてのバックエンドテストがパスしました。
- すべてのフロントエンドテストがパスしました。
- `test.db` の削除・再作成により、データベーススキーマの整合性が確保されました。
- フロントエンドの `AllocationTable` および関連ストーリーの `ReferenceError` が解消されました。
- `axios` の導入に伴うフロントエンドのテストエラーが解消されました。

## 次のステップ

このトラックは完了しました。次のタスクまたは機能開発の指示をお待ちしております。
