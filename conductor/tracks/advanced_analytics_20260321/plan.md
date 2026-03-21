# Implementation Plan - Advanced Portfolio Analytics

本プロジェクトに「リバランス提案」「ストレステスト」「配当シミュレーション」の3つの高度な分析機能を導入するための実行プランです。

## Phase 1: Backend Data & Logic (Stress Test & Rebalancing)
分析に必要なデータ取得ロジックと計算エンジンをバックエンドに実装します。

- [ ] Task: ストレステスト用計算エンジンの実装
    - [ ] Write Tests: 指定期間（リーマンショック等）のデータ切り出しと、ポートフォリオ騰落率計算のユニットテストを記述。
    - [ ] Implement: `simulation.py` に指定期間のヒストリカルデータからパフォーマンスを算出する関数を追加。
- [ ] Task: リバランス計算ロジックの実装
    - [ ] Write Tests: 目標比率と現在比率の差分計算のユニットテストを記述。
    - [ ] Implement: 2つのポートフォリオ構成（Asset Allocation）を比較し、差分を返す共通ユーティリティを実装。
- [ ] Task: 新しい分析用 API エンドポイントの作成
    - [ ] Write Tests: `/api/portfolios/{id}/analytics/stress-test` などのエンドポイントテストを記述。
    - [ ] Implement: `main.py` に分析結果を返す新しい GET エンドポイントを追加。
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend Data & Logic' (Protocol in workflow.md)

## Phase 2: Dynamic Dividend Data Support
`yfinance` から配当データを取得し、シミュレーションに組み込む基盤を作ります。

- [ ] Task: 配当データ取得ロジックの追加
    - [ ] Write Tests: `yfinance` から配当履歴（Dividends）を正しく取得・パースできるかのテストを記述。
    - [ ] Implement: `yahoo_finance.py` に配当情報取得関数を追加。
- [ ] Task: 資産マスタへの配当データ保存
    - [ ] Write Tests: `AssetData` テーブルに配当利回り（Yield）などのフィールドを追加するマイグレーションテスト。
    - [ ] Implement: Alembic で DB スキーマを更新し、`seed_assets.py` で配当データも同期するように修正。
- [ ] Task: 配当込みシミュレーションエンジンの強化
    - [ ] Write Tests: 配当の再投資を考慮した積立シミュレーションの計算テストを記述。
    - [ ] Implement: モンテカルロシミュレーションに配当利回りを加味するオプションを追加。
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Dynamic Dividend Data Support' (Protocol in workflow.md)

## Phase 3: Frontend Analytics UI & Visualization
収集・計算した分析データをフロントエンドで可視化します。

- [ ] Task: ポートフォリオ詳細画面への「Analyticsタブ」の追加
    - [ ] Write Tests: タブの切り替えと、各セクションの初期レンダリングテストを記述。
    - [ ] Implement: `frontend/src/app/portfolios/[id]/` ページを拡張し、タブUIを導入。
- [ ] Task: リバランスおよびストレステストの可視化
    - [ ] Write Tests: ドローダウンチャートが正しく描画されるかのコンポーネントテスト。
    - [ ] Implement: `RebalancingView` および `StressTestChart` コンポーネントを新規作成。
- [ ] Task: 配当シミュレーションの可視化
    - [ ] Write Tests: キャピタルとインカムの積み上げグラフの表示テスト。
    - [ ] Implement: `IncomeSimulationChart` を実装し、将来の分配金推移を可視化。
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Analytics UI & Visualization' (Protocol in workflow.md)

## Phase 4: Final Integration & Deployment
システム全体の動作確認とドキュメント更新を行います。

- [ ] Task: 全テストスイートの実行とカバレッジ確認
    - [ ] Execute: 全てのバックエンド・フロントエンドテストを実行。
- [ ] Task: Conductor - User Manual Verification
- [ ] Task: プロジェクトドキュメントの同期（Product Definition, Tech Stack）
