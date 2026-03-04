# Implementation Plan: クリーン・ミニマルなUI改善とダッシュボードの導入 (UI_Enhancement_and_Dashboard)

このプランは、既存のUIを「クリーン・ミニマル」なスタイルへ刷新し、ダッシュボード画面とサイドバーの折りたたみ機能を実装する手順を定義します。

## Phase 1: デザイン基盤と共通コンポーネントの刷新

- [x] **Task: テーマカラーと基本レイアウトの定義** (3676f69)
    - [x] `frontend/tailwind.config.ts` または CSS 変数を確認し、白 (#FFFFFF) と薄いグレー (#F3F4F6) を基調としたパレットを設定。
    - [x] 共通の「カード」コンポーネント（背景白、シャドウ/境界線付き）を shadcn/ui の Card をベースに整理。
- [x] **Task: サイドバーの折りたたみ機能の実装** (3676f69)
    - [x] `frontend/src/components/layout/Sidebar.tsx` を修正し、`collapsed` 状態を管理する Zustand ストアまたはローカルステートを導入。
    - [x] 折りたたみ時にアイコンのみを表示し、ツールチップでラベルを補完する UI を実装。
- [x] **Task: Conductor - User Manual Verification 'デザイン基盤と共通コンポーネントの刷新' (Protocol in workflow.md)** [checkpoint: 2d75100]

## Phase 2: ダッシュボード画面の新規実装

- [x] **Task: ダッシュボード用バックエンド API の拡充（必要に応じて）** (2f5c3f3)
    - [x] 主要指標（S&P 500, 日経225, BTC 等）の直近データを取得するための軽量なエンドポイント `/api/market-summary` を `backend/app/main.py` に追加。
- [x] **Task: ダッシュボードページの作成** (9ce468a)
    - [x] `frontend/src/app/dashboard/page.tsx` を新規作成。
    - [x] 「クイックアクション」カード（新規シミュレーション等へのリンク）を配置。
    - [x] 「最近のシミュレーション履歴」カード（`useSimulationResults` フックを利用）を配置。
    - [x] 「主要指標」カード（`/api/market-summary` を利用）を配置。
- [x] **Task: ログイン後のリダイレクト先をダッシュボードに変更** (9ce468a)
    - [x] ルートパス (`/`) またはログイン後の遷移先を `/dashboard` に設定。
- [x] **Task: Conductor - User Manual Verification 'ダッシュボード画面の新規実装' (Protocol in workflow.md)** [checkpoint: 9ce468a]

## Phase 3: 既存画面のレイアウト調整とクリーンアップ

- [x] **Task: 効率的フロンティア画面のカード化** (306f849)
    - [x] `frontend/src/app/simulation/efficient-frontier/page.tsx` を修正し、入力フォーム、チャート、テーブルを個別のカードコンポーネントで包む。
- [x] **Task: 積立シミュレーション画面のカード化** (306f849)
    - [x] `frontend/src/app/simulation/accumulation/page.tsx` も同様にカードベースのレイアウトへ調整。
- [x] **Task: シミュレーション履歴画面の調整** (306f849)
    - [x] `frontend/src/app/simulation/history/page.tsx` をダッシュボードのデザインと一貫性のあるリスト形式に更新。
- [x] **Task: Conductor - User Manual Verification '既存画面のレイアウト調整とクリーンアップ' (Protocol in workflow.md)** [checkpoint: 306f849]

## Phase 4: 最終確認とテスト

- [x] **Task: UI コンポーネントの単体テストと E2E テストの更新** (306f849)
    - [x] サイドバーの折りたたみ動作を検証するテストを追加。
    - [x] ダッシュボードが正しく描画されることを検証するテストを追加。
- [x] **Task: 全体的なレスポンシブ動作の確認** (306f849)
    - [x] デスクトップ環境でのクリーンな表示と、モバイルでの実用的なレイアウトを確認。
- [x] **Task: Conductor - User Manual Verification '最終確認とテスト' (Protocol in workflow.md)** [checkpoint: 306f849]

## Phase: Review Fixes
- [x] Task: Apply review suggestions (592fbb3)
