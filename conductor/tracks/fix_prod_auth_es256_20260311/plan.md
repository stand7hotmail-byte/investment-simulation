# Implementation Plan - Fix Production Authentication Error (ES256 Verification)

本番環境で発生している `401 Unauthorized (ES256)` エラーを解決するため、バックエンドの JWT 検証ロジックを修正し、Supabase の公開鍵（JWKS）を正しく使用するようにします。

## Phase 1: 調査と環境構築 (Setup & Investigation)
現在の実装を確認し、テスト可能な環境を整えます。

- [ ] Task: 認証ミドルウェアの現状分析
    - `backend/app/main.py` または関連する認証ロジックを確認し、現在のアルゴリズムと鍵の取得方法を特定する。
- [ ] Task: ローカル再現テストの作成 (Red Phase)
    - ES256 で署名されたモック JWT を用いて、現在の実装が検証に失敗することを確認するテストを作成する。
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 調査と環境構築' (Protocol in workflow.md)

## Phase 2: ES256 署名検証の実装 (Implementation)
JWKS クライアントを導入し、検証ロジックを修正します。

- [ ] Task: PyJWKClient の導入と設定
    - `PyJWT` の `PyJWKClient` を使用して、Supabase の JWKS エンドポイントから公開鍵を取得するロジックを実装する。
- [ ] Task: 署名検証ロジックの修正 (Green Phase)
    - `ES256` アルゴリズムを明示的に指定し、取得した公開鍵でデコードするように修正する。
    - 鍵のキャッシュメカニズムを有効にする。
- [ ] Task: 詳細なエラーログの実装
    - 認証失敗時に、アルゴリズムや鍵の不一致などの原因をログ出力するようにし、本番環境でのデバッグを容易にする。
- [ ] Task: Conductor - User Manual Verification 'Phase 2: ES256 署名検証の実装' (Protocol in workflow.md)

## Phase 3: 検証と最終確認 (Verification & Cleanup)
修正が正しく機能し、副作用がないことを確認します。

- [ ] Task: ユニットテストによる検証 (Green Phase)
    - Phase 1 で作成したテストがパスすることを確認する。
- [ ] Task: カバレッジの確認
    - `pytest --cov` を実行し、認証関連モジュールのカバレッジが 80% 以上であることを確認する。
- [ ] Task: 最終統合テスト
    - 既存の認証（HS256等）が壊れていないことを含め、全バックエンドテストを実行する。
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 検証と最終確認' (Protocol in workflow.md)
