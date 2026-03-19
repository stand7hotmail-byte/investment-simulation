# Specification - Fix Production Signup and Authentication Errors

## Overview
本番環境（Railway/Vercel）で発生しているサインアップ不具合、および認証鍵（JWKS）取得のタイムアウトによる API エラーを解消する。また、ユーザー体験向上のため、シミュレーション機能の一部をゲスト（未ログイン）ユーザーに開放する。

## Problem Statements
1.  **サインアップ不全:** ユーザーが 6文字未満のパスワードでサインアップしようとすると、フロントエンドでのチェックがなく、Supabase からのエラーも適切に表示されない。
2.  **過剰な認証制限:** `/api/assets` やシミュレーション系のエンドポイントが認証必須となっているため、未ログインユーザーが資産選択やシミュレーションを行えない。
3.  **JWKS タイムアウト:** バックエンド（Railway）から Supabase への公開鍵取得がタイムアウトし、ログインユーザーのリクエストが 401 Unauthorized となる。

## Functional Requirements
### Frontend (Next.js)
1.  **パスワード・バリデーション:** サインアップフォームに「6文字以上」のチェックを追加。満たさない場合は送信ボタンを無効化し、赤い文字で警告を表示する。
2.  **エラーフィードバックの改善:** Supabase からのサインアップエラー（パスワードが短い、既に登録されている等）を検知し、適切な日本語メッセージを表示する。

### Backend (FastAPI)
1.  **認証ポリシーの変更:** 以下のエンドポイントを認証なし（ゲスト）で利用可能にする。
    *   `GET /api/assets`
    *   `GET /api/asset-classes`
    *   `POST /api/simulate/efficient-frontier`
    *   `POST /api/simulate/monte-carlo`
    *   `POST /api/simulate/risk-parity`
    *   `GET /api/market-summary`
2.  **JWKS 取得の堅牢化:**
    *   `PyJWKClient` のタイムアウト値を延長する。
    *   フェイルセーフ機能：ネットワークエラー時にキャッシュがあればそれを使い回すラッパーを導入する。
    *   サーバー起動時のプリフェッチを確実に行い、ログを記録する。

## Acceptance Criteria
- [ ] パスワード 4文字でサインアップしようとした際、フロントエンドで適切に警告が表示される。
- [ ] 未ログイン状態でも資産選択（`/api/assets` 経由）ができ、グラフが表示される。
- [ ] ログインユーザーによるリクエストで `ES256 JWKS error ... timed out` が発生しなくなる。
- [ ] 本番環境（Railway/Vercel）でシミュレーションの実行まで完遂できる。
