# Specification: 開発基盤と検証環境の強化（E2E・Storybook・DBツール）

## Overview
前回のトラックで課題となった「UIインタラクションのデバッグ」を効率化し、システムの信頼性を高めるための開発基盤を構築します。Playwright による E2E テスト、Storybook によるコンポーネントの隔離、およびデータベースの可視化環境を整備します。

## Functional Requirements
- **E2Eテスト (Playwright)**
  - Playwright の導入と Next.js 環境への最適化設定。
  - 「効率的フロンティア」画面における、チャートの点（リスクパリティ、最大シャープ等）をクリックし、テーブルの数値が連動して更新されることを検証する自動テストの実装。
- **コンポーネント隔離環境 (Storybook)**
  - Storybook の導入と Tailwind CSS の統合。
  - `EfficientFrontierChart` および `AllocationTable` のストーリー作成。
  - ページから切り離した状態で、モックデータを用いたチャートの描画とクリックイベントの動作確認。
- **データ透明性の向上 (DB Tools)**
  - 開発用 SQLite (`test.db`) の中身を視覚的に確認するための手順整備。
  - エージェント（Gemini CLI）がデータベースのテーブル構造やキャッシュデータを一括抽出するための管理用スクリプトの作成。

## Non-Functional Requirements
- **保守性:** Playwright と Storybook の設定を簡潔に保ち、今後の機能追加時にも容易にテストを拡張できるようにする。
- **効率:** テストの実行速度を重視し、開発サイクル（CI/CD）に組み込みやすい構成にする。

## Acceptance Criteria
- コマンド一つで Playwright のテストが走り、チャートのインタラクション検証がパスすること。
- Storybook を起動し、ブラウザ上でチャートコンポーネント単体を操作できること。
- データベースの全テーブルの内容を JSON 等で一括出力し、エージェントが瞬時に内容を把握できること。

## Out of Scope
- プロジェクト全画面の網羅的なテスト作成（今回は重要機能に限定）。
- 本番環境（PostgreSQL）向けの高度なモニタリングツールの導入。
