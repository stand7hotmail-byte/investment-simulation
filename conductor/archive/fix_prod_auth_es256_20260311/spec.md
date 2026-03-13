# Track Specification: Fix Production Authentication Error (ES256 Verification)

## Overview
本番環境（Railway/Vercel）において、認証が必要なAPIエンドポイント（`/api/simulation-results`, `/api/portfolios`, `/api/simulate/risk-parity` 等）で `401 Unauthorized` エラーが発生している問題を解決します。エラーメッセージ `Authentication failed (Algorithm: ES256)` は、バックエンドが Supabase の JWT 署名検証（ES256 アルゴリズム）に失敗していることを示しています。

## Functional Requirements
- **JWT検証ロジックの修正**: バックエンド（FastAPI）が、Supabase の `ES256` アルゴリズム（非対称鍵）を用いて JWT を正しく検証できるように実装を更新する。
- **JWKS クライアントの導入**: `PyJWKClient` 等を用いて、Supabase から提供される公開鍵（JWKS）を取得し、署名を検証する。
- **エラーハンドリングの改善**: 認証失敗時に、より詳細なデバッグ情報（アルゴリズムの不一致等）がログに出力されるようにし、本番環境でのトラブルシューティングを容易にする。

## Non-Functional Requirements
- **セキュリティ**: JWT の署名検証をスキップしてはならない。必ず公開鍵を用いた正しい検証を行う。
- **パフォーマンス**: 公開鍵の取得（JWKS）をリクエストごとに行うのではなく、キャッシュする仕組みを導入し、計算パフォーマンスを維持する。

## Acceptance Criteria
- [ ] 本番環境（Railway）で `/api/portfolios` などの認証が必要なエンドポイントが `200 OK` を返すようになる。
- [ ] バックエンドが `ES256` アルゴリズムで署名された JWT を正常に検証できる。
- [ ] 鍵の取得失敗や期限切れに対して、適切なエラーメッセージとステータスコードが返される。

## Out of Scope
- フロントエンドの認証フロー自体の変更（バックエンド側の修正に注力する）。
- Supabase の設定自体の変更（バックエンド側で対応することを前提とする）。
