# Implementation Plan: リスクパリティ戦略の追加実装

## Phase 1: バックエンド - リスクパリティ計算ロジックの実装 [checkpoint: c7177a5]
- [x] Task: 期待リターンと共分散行列からリスクパリティ配分を計算するコアロジックのユニットテスト作成 4b8b12e
- [x] Task: SciPyを用いた最適化ロジックの実装（各資産のリスク寄与度を均一化） 4b8b12e
- [x] Task: 資産配分の上下限制約（Bounds）の適用機能の実装 4b8b12e
- [x] Task: コアロジック hostのテスト通過確認 4b8b12e
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Logic' (Protocol in workflow.md) c7177a5

## Phase 2: バックエンド - APIエンドポイントとキャッシュの実装 [checkpoint: 61d32e6]
- [x] Task: リスクパリティ計算用APIエンドポイント (`/simulation/risk-parity`) の統合テスト作成 61d32e6
- [x] Task: FastAPIによるAPIエンドポイントの実装 7cce8b2
- [x] Task: 計算結果のキャッシュ機構（同一パラメータでの再計算防止）の実装 7cce8b2
- [x] Task: 統合テストの通過確認 61d32e6
- [x] Task: Conductor - User Manual Verification 'Phase 2: API & Cache' (Protocol in workflow.md)

## Phase 3: フロントエンド - API連携とデータ取得
- [ ] Task: リスクパリティAPIを呼び出す `useRiskParity` カスタムフックの作成
- [ ] Task: シミュレーションストア (`useSimulationStore`) へのリスクパリティ結果の保持機能追加
- [ ] Task: コンポーネントレベルでのAPI連携テスト
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Integration' (Protocol in workflow.md)

## Phase 4: フロントエンド - チャート表示とUI統合
- [ ] Task: EfficientFrontierChart (Plotly.js) へのリスクパリティプロットの追加
- [ ] Task: チャート上のツールチップおよび凡例の更新
- [ ] Task: 戦略比較UIでの表示切替ロジックの実装
- [ ] Task: E2Eテスト（リスクパリティの結果が正しく表示されること）の実施
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI & Visualization' (Protocol in workflow.md)