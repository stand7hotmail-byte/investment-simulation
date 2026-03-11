# Track Specification: Fix Production Runtime Errors and Improve Stability

## Overview
本番環境での全般的な調査により特定された、フロントエンドの潜在的なランタイムエラー（JSのクラッシュ）のリスクを解消し、バックエンドの計算ロジックにおける不安定な挙動（共分散計算の警告）を修正します。これにより、予期せぬデータ欠落や異常値が発生した場合でも、アプリケーションがクラッシュせず適切に動作するようにします。

## Functional Requirements
- **フロントエンドの堅牢化 (Frontend Guarding)**:
    - `DashboardPage`: シミュレーション履歴の日付（`created_at`）が不正な形式の場合でも `RangeError` でクラッシュしないようにガードを追加。
    - `EfficientFrontierChart`: 資産データが空、あるいは計算結果が不完全な場合に `reduce` 関数がクラッシュするのを防ぐ安全な処理を実装。
    - `AccumulationPage`: APIからのレスポンスに `history` データが含まれていない場合、グラフ描画時に `TypeError` を投げないようにオプショナルチェイニング等で保護。
    - `Sparkline`: データが極端に少ない、あるいは空の場合に SVG 描画でエラーにならないようにロジックを強化。
- **バックエンド計算ロジックの修正 (Backend Stability)**:
    - `simulation.py`: 資産間の過去データの重なりが不十分な場合（自由度不足）に、共分散行列の計算でゼロ除算や `NaN` が発生するのを防ぐチェックを追加。

## Non-Functional Requirements
- **信頼性**: ユーザーの操作によって画面が真っ白になる（クラッシュする）ケースを排除する。
- **保守性**: 非Null表明（`!`）の使用を減らし、TypeScript の型安全性を活かした実装に置き換える。

## Acceptance Criteria
- [ ] すべてのフロントエンド修正箇所において、データが空または Null の場合でもランタイムエラーが発生しない。
- [ ] バックエンドのテスト実行時に `RuntimeWarning: Degrees of freedom <= 0` などの致命的な警告が出なくなる、あるいは適切にハンドリングされる。
- [ ] 本番環境の `Efficient Frontier` および `Accumulation Sim` ページが、エッジケース（資産選択直後など）でも安定して動作する。

## Out of Scope
- 今回の調査で確認された `401 Unauthorized` エラーの解消（これは認証環境自体の設定やログイン情報の不備によるものであり、本トラックの「実行時エラー修正」の範囲外とする）。
- 大規模なリファクタリング。
