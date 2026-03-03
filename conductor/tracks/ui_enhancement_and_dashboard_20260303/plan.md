# Implementation Plan: クリーン・ミニマルなUI改善とダッシュボードの導入 (UI_Enhancement_and_Dashboard)

このプランは、既存のUIを「クリーン・ミニマル」なスタイルへ刷新し、ダッシュボード画面とサイドバーの折りたたみ機能を実装する手順を定義します。

## Phase 1: デザイン基盤と共通コンポーネントの刷新

- [ ] **Task: テーマカラーと基本レイアウトの定義**
    - [ ] `frontend/tailwind.config.ts` または CSS 変数を確認し、白 (#FFFFFF) と薄いグレー (#F3F4F6) を基調としたパレットを設定。
    - [ ] 共通の「カード」コンポーネント（背景白、シャドウ/境界線付き）を shadcn/ui の Card をベースに整理。
- [ ] **Task: サイドバーの折りたたみ機能の実装**
    - [ ] `frontend/src/components/layout/Sidebar.tsx` を修正し、`collapsed` 状態を管理する Zustand ストアまたはローカルステートを導入。
    - [ ] 折りたたみ時にアイコンのみを表示し、ツールチップでラベルを補完する UI を実装。
- [ ] **Task: Conductor - User Manual Verification 'デザイン基盤と共通コンポーネントの刷新' (Protocol in workflow.md)**

## Phase 2: ダッシュボード画面の新規実装

- [ ] **Task: ダッシュボード用バックエンド API の拡充（必要に応じて）**
    - [ ] 主要指標（S&P 500, 日経225, BTC 等）の直近データを取得するための軽量なエンドポイント `/api/market-summary` を `backend/app/main.py` に追加。
- [ ] **Task: ダッシュボードページの作成**
    - [ ] `frontend/src/app/dashboard/page.tsx` を新規作成。
    - [ ] 「クイックアクション」カード（新規シミュレーション等へのリンク）を配置。
    - [ ] 「最近のシミュレーション履歴」カード（`useSimulationResults` フックを利用）を配置。
    - [ ] 「主要指標」カード（`/api/market-summary` を利用）を配置。
- [ ] **Task: ログイン後のリダイレクト先をダッシュボードに変更**
    - [ ] ルートパス (`/`) またはログイン後の遷移先を `/dashboard` に設定。
- [ ] **Task: Conductor - User Manual Verification 'ダッシュボード画面の新規実装' (Protocol in workflow.md)**

## Phase 3: 既存画面のレイアウト調整とクリーンアップ

- [ ] **Task: 効率的フロンティア画面のカード化**
    - [ ] `frontend/src/app/simulation/efficient-frontier/page.tsx` を修正し、入力フォーム、チャート、テーブルを個別のカードコンポーネントで包む。
- [ ] **Task: 積立シミュレーション画面のカード化**
    - [ ] `frontend/src/app/simulation/accumulation/page.tsx` も同様にカードベースのレイアウトへ調整。
- [ ] **Task: シミュレーション履歴画面の調整**
    - [ ] `frontend/src/app/simulation/history/page.tsx` をダッシュボードのデザインと一貫性のあるリスト形式に更新。
- [ ] **Task: Conductor - User Manual Verification '既存画面のレイアウト調整とクリーンアップ' (Protocol in workflow.md)**

## Phase 4: 最終確認とテスト

- [ ] **Task: UI コンポーネントの単体テストと E2E テストの更新**
    - [ ] サイドバーの折りたたみ動作を検証するテストを追加。
    - [ ] ダッシュボードが正しく描画されることを検証するテストを追加。
- [ ] **Task: 全体的なレスポンシブ動作の確認**
    - [ ] デスクトップ環境でのクリーンな表示と、モバイルでの実用的なレイアウトを確認。
- [ ] **Task: Conductor - User Manual Verification '最終確認とテスト' (Protocol in workflow.md)**
