# Implementation Plan: フロントエンド開発 - 効率的フロンティア画面の実装

このプランは、Next.js 14 を使用したアプリケーションの基盤構築と、資産の最適化曲線を視覚化する「効率的フロンティア」画面の実装手順を定義します。

## Phase 1: フロントエンド基盤と基本レイアウトの構築 [checkpoint: 7b036d6]

- [x] **Task: Next.js プロジェクトの初期化と依存関係のセットアップ** afa84ec
    - [ ] `frontend` ディレクトリを作成し、Next.js 14 (App Router, TypeScript, Tailwind CSS) を初期化。
    - [ ] shadcn/ui, Zustand, TanStack Query, Plotly.js, Lucide React をインストール。
    - [ ] バックエンドとの API 連携用の環境変数設定。
- [x] **Task: サイドバー付きダッシュボードレイアウトの実装** 475416b
    - [ ] サイドバーコンポーネントの作成（「効率的フロンティア」等のリンクを配置）。
    - [ ] メインレイアウト (`app/layout.tsx`) への適用とレスポンシブ対応。
- [x] **Task: ユニットテスト環境の構築 (TDD Red Phase)** 254700a
    - [ ] Vitest と React Testing Library のセットアップ。
    - [ ] 基本的なコンポーネント描画テストを作成し、パスすることを確認。
- [x] **Task: Conductor - User Manual Verification 'フロントエンド基盤' (Protocol in workflow.md)**

## Phase 2: 資産選択とデータ取得の実装 [checkpoint: 21497bb]

- [x] **Task: 資産一覧取得機能の実装** 4793743
    - [ ] TanStack Query を使用した `/api/assets` 呼び出しフックの作成。
    - [ ] 資産選択用のチェックボックスリストコンポーネントの実装。
- [x] **Task: 資産選択状態の管理 (Zustand)** e3eae89
    - [ ] 選択された資産のコードリストを保持する Zustand ストアを作成。
- [x] **Task: コンポーネントのテストと実装 (TDD)** d2d123c
    - [ ] 資産リストが正しく表示・選択されるかをテスト。
    - [ ] テストをパスさせる実装。
- [~] **Task: Conductor - User Manual Verification '資産選択機能' (Protocol in workflow.md)**

## Phase 3: 効率的フロンティアの視覚化

- [x] **Task: シミュレーション API 連携の実装** 1d57c42
    - [ ] `/api/simulate/efficient-frontier` を呼び出すカスタムフックの作成。
    - [ ] 計算実行ボタンとローディング状態の表示。
- [ ] **Task: Plotly.js によるインタラクティブ・グラフの実装**
    - [ ] `EfficientFrontierChart` コンポーネントの作成。
    - [ ] ズーム、パン、ホバー表示（リターン・リスク）の有効化。
- [ ] **Task: フロンティア曲線の描画テスト (TDD)**
    - [ ] API レスポンスに基づきグラフデータが正しく構築されるかを検証するテスト。
    - [ ] テストをパスさせる実装。
- [ ] **Task: Conductor - User Manual Verification 'グラフ視覚化' (Protocol in workflow.md)**

## Phase 4: 資産配分詳細テーブルとポイント連携

- [ ] **Task: ポイント選択連携機能の実装**
    - [ ] グラフ上の点をクリックした際に、選択されたポイントの情報を Zustand ストアに保存。
- [ ] **Task: 資産配分詳細テーブルコンポーネントの実装**
    - [ ] 選択されたポイントの「資産名：比率」を一覧表示するテーブルを作成。
- [ ] **Task: 最終統合テストとリファクタリング (TDD)**
    - [ ] 資産選択 -> 計算 -> グラフ表示 -> ポイント選択 -> テーブル更新 の一連の流れをテスト。
    - [ ] ワークフローに基づくリファクタリングとカバレッジ確認。
- [ ] **Task: Conductor - User Manual Verification '最終統合' (Protocol in workflow.md)**
