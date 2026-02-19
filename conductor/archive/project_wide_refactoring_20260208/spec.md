# Track Specification: Project-Wide Refactoring for Separation of Concerns

## Overview
プロジェクト全体の可読性とメンテナンス性を向上させるため、バックエンド、フロントエンド、状態管理、および共通ユーティリティを対象とした包括的なリファクタリングを実施します。特に「関心の分離」を徹底し、ロジック、UI、データ操作、計算処理の責務を明確に分離することを目指します。

## Objectives
- **可読性とメンテナンス性の向上**: コードの構造を整理し、将来の機能追加や修正を容易にする。
- **関心の分離 (Separation of Concerns)**:
    - バックエンド: データベース操作 (CRUD)、ビジネスロジック (Simulation)、API定義 (Main/Routes) の分離。
    - フロントエンド: プレゼンテーションコンポーネント (UI) とロジック (Hooks/Store) の分離。
    - 状態管理: UI状態 (Zustand) とサーバーデータ同期 (React Query) の責務を再定義。

## Scope
### 1. Backend (Python/FastAPI)
- `app/` 配下の構造見直し: `models.py`, `schemas.py`, `crud.py`, `simulation.py` 間の依存関係を整理。
- 計算ロジックをピュアな関数として抽出し、副作用（DB操作など）を分離。
- エラーハンドリングの一貫性確保。

### 2. Frontend (TypeScript/Next.js)
- UIコンポーネント内のビジネスロジックをカスタムフック (`src/hooks/`) へ移動。
- `Zustand` ストアの責務を限定し、React Query で管理すべきサーバー同期状態と分離。
- 共通ユーティリティ (`src/lib/utils.ts`) の整理。

### 3. State Management & Hooks
- `useSimulationStore` と `useEfficientFrontier` 等のフック間の重複ロジックの排除。
- 非同期処理のフローを整理。

## Functional Requirements
- 既存の機能（効率的フロンティア計算、シミュレーション、ポートフォリオ管理等）がリファクタリング後も正しく動作すること。
- APIのエンドポイントやリクエスト/レスポンス形式を（必要がない限り）変更しない。

## Non-Functional Requirements
- **テストカバレッジの維持**: 既存のテストがすべてパスし、リファクタリングによってテストが書きやすい構造になること。
- **型安全性の向上**: 曖昧な型定義を排除し、厳密な型付けを行う。

## Acceptance Criteria
- [ ] バックエンドの計算ロジックがDB操作から完全に独立している。
- [ ] フロントエンドの主要コンポーネントから複雑なロジックが排除され、カスタムフック化されている。
- [ ] 既存の全ユニットテストおよびE2Eテストがパスする。
- [ ] `conductor/workflow.md` の品質基準（カバレッジ >80% 等）を満たしている。

## Out of Scope
- 新機能の追加。
- データベーススキーマの抜本的な変更（マイグレーションを伴う大規模な変更）。
- UIデザインの大幅な変更。
