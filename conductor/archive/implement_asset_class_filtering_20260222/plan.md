# アセットクラス別フィルタリング機能の実装計画

## 1. 目的

ユーザーがアセットクラスに基づいて資産をフィルタリングし、シミュレーションに利用できる機能を実現することで、投資分析の柔軟性と利便性を向上させる。

## 2. フェーズ

### Phase 1: アセットクラスの取得とフロントエンドでの選択UI実装

#### タスク

- [x] **Task 1.1: バックエンドで利用可能なアセットクラスの一覧を取得するAPIエンドポイントの追加** (ebea176)
    - `backend/app/crud.py` に、ユニークなアセットクラスのリストを取得する関数を追加。
    - `backend/app/schemas.py` に、アセットクラスのリストを返すためのスキーマを追加。
    - `backend/app/main.py` に、上記CRUD関数とスキーマを利用した `/api/asset-classes` エンドポイントを追加。
- [x] **Task 1.2: フロントエンドでアセットクラスのリストを取得するフックの作成** (ebea176)
    - `frontend/src/hooks/useAssetClasses.ts` を新規作成し、`react-query` を利用して `/api/asset-classes` エンドポイントからアセットクラスのリストを取得する。
- [x] **Task 1.3: アセットクラス選択UIの統合** (ebea176)
    - `frontend/src/store/useSimulationStore.ts` に、選択されたアセットクラスの状態を管理する `selectedAssetClasses` およびその操作用アクションを追加。
    - `frontend/src/components/simulation/AssetSelector.tsx` に、`useAssetClasses` から取得したリストを元に、アセットクラス選択UI（例: チェックボックスグループ）を実装。
    - UIからの選択と`useSimulationStore`の`selectedAssetClasses`を連携させる。

### Phase 2: 資産フィルタリングロジックの実装

#### タスク

- [x] **Task 2.1: `useAssets` フックにフィルタリングロジックを追加** (ebea176)
    - `frontend/src/hooks/useAssets.ts` を修正し、`useSimulationStore` から `selectedAssetClasses` を取得。
    - 取得した `selectedAssetClasses` に基づいて、APIから取得した全資産データをフィルタリングするロジックを実装。
    - フィルタリングが適用された資産リストを返すようにする。
- [x] **Task 2.2: フィルタリングUIのリセット機能の追加** (ebea176)
    - `frontend/src/components/simulation/AssetSelector.tsx` に、選択されたアセットクラスをすべてクリアするボタンまたはメカニズムを追加し、`useSimulationStore` のアクションを呼び出す。
- [x] **Task 2.3: フィルタリングされた資産の表示とフィードバック** (ebea176)
    - `frontend/src/components/simulation/AssetSelector.tsx` で、フィルタリングによって表示される資産が0になった場合にユーザーに通知するUI要素を追加。

### Phase 3: テストと調整

#### タスク

- [x] **Task 3.1: バックエンドAPIの単体テスト** (ebea176)
    - `backend/tests/test_assets.py` または新規ファイルに、`/api/asset-classes` エンドポイントのテストを追加。
- [x] **Task 3.2: フロントエンドコンポーネントの単体テスト** (ebea176)
    - `frontend/src/components/simulation/AssetSelector.test.tsx` を修正し、アセットクラスフィルタリングUIの動作を検証するテストを追加。
    - `frontend/src/hooks/useAssetClasses.test.tsx` を新規作成し、フックの動作を検証。
- [x] **Task 3.3: E2Eテスト (オプション)** (ebea176)
    - `frontend/e2e/simulation.test.ts` に、アセットクラスフィルタリングがシミュレーションに正しく適用されることを検証するE2Eテストを追加。
- [x] **Task 3.4: パフォーマンスとUI/UXの最終確認** (ebea176)
    - フィルタリング操作がスムーズであるか、UIが直感的であるかを確認。

## 3. Review Fixes

### Phase: Review Fixes
- [x] Task: Apply review suggestions (bee1f87)
