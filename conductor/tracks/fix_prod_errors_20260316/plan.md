# Implementation Plan - Fix Production Signup and Authentication Errors

本番環境でのサインアップおよび認証に関する不具合を解消し、ゲストユーザーでも主要機能を利用可能にします。

## Phase 1: Backend Auth Policy & JWKS Robustness
バックエンドの認証ポリシーを緩和し、ネットワークエラーに対する耐性を強化します。

- [x] Task: 認証依存関係のオプション化 (571c3d8)
    - [x] `get_current_user_id` をラップし、認証ヘッダーがない場合に `None` を返す `get_optional_user_id` を実装
    - [x] `/api/simulate/risk-parity` などのエンドポイントを `get_optional_user_id` に切り替え
- [x] Task: JWKS 取得の堅牢化 (afac1a4)
    - [x] `PyJWKClient` の `request_options` に `timeout=30` を追加 (07e36e9済)
    - [x] `PyJWKClient` のラッパーをさらに改善し、例外ハンドリングを強化 (afac1a4)
- [x] Task: バックエンドの動作検証 (TDD) (3311af1)
    - [x] 認証なしで `risk-parity` などのエンドポイントが 200 を返すことを確認するテストを追加 (3311af1)
    - [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Auth Policy & JWKS Robustness' (Protocol in workflow.md) (3311af1)

## Phase 2: Frontend Signup Validation & Feedback
フロントエンドのサインアップ画面のユーザー体験を改善します。

- [ ] Task: サインアップフォームのバリデーション実装
    - [ ] パスワードが 6文字未満の場合にエラーメッセージを表示し、ボタンを無効化するロジックを追加
- [ ] Task: Supabase エラーメッセージの日本語化
    - [ ] Supabase から返されるエラー（例: `User already registered`, `Password should be at least 6 characters`）を日本語に翻訳して表示するマッピングを実装
- [ ] Task: フロントエンドの動作確認
    - [ ] 4文字のパスワードでエラーが出ることを確認
    - [ ] 正しいパスワードでサインアップが完了し、トーストメッセージが表示されることを確認
    - [ ] [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Signup Validation & Feedback' (Protocol in workflow.md)

## Phase 3: Final Verification and Deployment
全体の動作を確認し、本番環境へのデプロイを準備します。

- [ ] Task: 全テストスイートの実行
    - [ ] `pytest` (Backend) と `vitest` (Frontend) を実行
- [ ] Task: 本番環境での最終確認
    - [ ] デプロイ後、未ログイン状態でシミュレーションが動作することを確認
    - [ ] ログイン状態で認証エラーが発生しなくなったことを確認
- [ ] Task: Conductor - User Manual Verification
