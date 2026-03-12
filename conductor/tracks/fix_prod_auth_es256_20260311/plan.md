# Implementation Plan - Fix Production Authentication Error (ES256 Verification)

本番環境で発生している `401 Unauthorized (ES256)` エラーを解決するため、バックエンドの JWT 検証ロジックを修正し、Supabase の公開鍵（JWKS）を正しく使用するようにします。

## Phase 1: 調査と環境構築 (Setup & Investigation) [checkpoint: 358bb4d]
現在の実装を確認し、テスト可能な環境を整えます。

- [x] Task: 認証ミドルウェアの現状分析 358bb4d
- [x] Task: ローカル再現テストの作成 (Red Phase) 358bb4d
- [x] Task: Conductor - User Manual Verification 'Phase 1: 調査と環境構築' (Protocol in workflow.md)

## Phase 2: ES256 署名検証の実装 (Implementation)
JWKS クライアントを導入し、検証ロジックを修正します。

- [x] Task: PyJWKClient の導入と設定 02b38f4
- [x] Task: 署名検証ロジックの修正 (Green Phase) 02b38f4
- [x] Task: 詳細なエラーログの実装 02b38f4
- [x] Task: Conductor - User Manual Verification 'Phase 2: ES256 署名検証の実装' (Protocol in workflow.md)

## Phase 3: 検証と最終確認 (Verification & Cleanup)
修正が正しく機能し、副作用がないことを確認します。

- [x] Task: ユニットテストによる検証 (Green Phase)
    - Phase 1 で作成したテストがパスすることを確認する。
- [x] Task: カバレッジの確認
    - `pytest --cov` を実行し、認証関連モジュールのカバレッジが 80% 以上であることを確認する。
- [x] Task: 最終統合テスト
    - 既存の認証（HS256等）が壊れていないことを含め、全バックエンドテストを実行する。
- [x] Task: Conductor - User Manual Verification 'Phase 3: 検証と最終確認' (Protocol in workflow.md)
