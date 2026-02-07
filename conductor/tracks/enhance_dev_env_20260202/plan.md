# Implementation Plan: 開発基盤と検証環境の強化

## Phase 1: E2Eテスト (Playwright) の導入と検証 [checkpoint: 915fabe]
- [x] Task: Playwright のインストールと Next.js 向けの基本設定 5099ee7
- [x] Task: 「効率的フロンティア」シミュレーションの基本フロー（資産選択〜実行）のテスト作成 2772ad2
- [x] Task: 今回の課題である「チャートの各ポイントクリック」と「テーブル連動」を検証するテストの実装 915fabe
- [x] Task: ヘッドレスブラウザによるテスト自動実行の確認 915fabe
- [x] Task: Conductor - User Manual Verification 'Phase 1: E2E Testing' (Protocol in workflow.md) 915fabe

## Phase 2: コンポーネント隔離環境 (Storybook) の構築
- [x] Task: Storybook のインストールと Tailwind CSS / Lucide アイコンの統合 f90eccd
- [ ] Task: `EfficientFrontierChart` のストーリー作成（複数のモックデータでの表示確認）
- [ ] Task: `AllocationTable` のストーリー作成
- [ ] Task: Storybook 上での「クリックによる Props 変更」のシミュレーション環境整備
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Component Stories' (Protocol in workflow.md)

## Phase 3: データベース可視化ツールの整備
- [ ] Task: エージェントが DB テーブル構造と全レコードを一括取得するための Python スクリプトの実装
- [ ] Task: シミュレーションキャッシュ (`simulation_results`) を JSON で出力・閲覧するユーティリティの作成
- [ ] Task: DBツールを使用したデータの整合性検証（計算結果が正しく保存されているかの確認）
- [ ] Task: Conductor - User Manual Verification 'Phase 3: DB Tools' (Protocol in workflow.md)

## Phase 4: 基盤を活用した UI 不具合の最終修正
- [x] Task: Playwright と Storybook を駆使して、保留となっている「チャートのクリック挙動」をデバッグ 915fabe
- [x] Task: 修正プログラムの適用と自動テストによる回帰テストの実施 915fabe
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Polishing' (Protocol in workflow.md) 915fabe