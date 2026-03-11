# Implementation Plan - Fix ES256 Authentication Error

本番環境での ES256 認証エラーを解決するため、バックエンドの JWT 検証ロジックを修正し、Supabase の公開鍵（JWKS）を正しく使用するようにします。

## Phase 1: 調査と再現環境の構築
本番環境のエラー原因を特定し、ローカルで再現可能なテストケースを作成します。

- [ ] Task: 認証ミドルウェアの現状コード分析
    - [ ] `backend/app/main.py` または関連する認証依存関係のコードを確認する
    - [ ] 現在の署名検証アルゴリズムと鍵の取得方法を特定する
- [ ] Task: 再現テストの作成 (Red Phase)
    - [ ] `backend/tests/test_auth_es256.py` を新規作成する
    - [ ] ES256 で署名されたモック JWT を用いて、現在の実装が 401 を返すことを確認する
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 調査と再現環境の構築' (Protocol in workflow.md)

## Phase 2: ES256 署名検証の実装と修正
JWKS を用いた正しい署名検証ロジックを実装します。

- [ ] Task: JWKS クライアントの実装 (Green Phase)
    - [ ] `PyJWKClient` を使用して Supabase の JWKS エンドポイントから公開鍵を取得するロジックを追加する
    - [ ] 取得した鍵をキャッシュする仕組みを導入する
- [ ] Task: 認証ロジックの修正
    - [ ] ES256 アルゴリズムを明示的に指定し、取得した公開鍵でデコードするように修正する
    - [ ] 鍵の取得失敗や期限切れに対するエラーハンドリングを追加する
- [ ] Task: テストによる検証 (Green Phase)
    - [ ] Phase 1 で作成した再現テストがパスすることを確認する
    - [ ] 既存の認証テスト（HS256等があればそれも含む）が壊れていないことを確認する
- [ ] Task: Conductor - User Manual Verification 'Phase 2: ES256 署名検証の実装と修正' (Protocol in workflow.md)

## Phase 3: 本番環境への適用準備と最終確認
修正内容を整理し、デプロイに向けた準備を行います。

- [ ] Task: コードクリーンアップとカバレッジ確認
    - [ ] 未使用のコードやデバッグログを削除する
    - [ ] `pytest --cov` を実行し、新規コードのカバレッジが 80% 以上であることを確認する
- [ ] Task: 最終統合テスト
    - [ ] 全てのバックエンドテストを実行し、リグレッションがないことを確認する
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 本番環境への適用準備と最終確認' (Protocol in workflow.md)
