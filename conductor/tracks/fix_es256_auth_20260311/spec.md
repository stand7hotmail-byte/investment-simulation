# Track Specification: Fix ES256 Authentication Error

## Overview
本番環境（Railway/Vercel）において、認証が必要なエンドポイント（`/api/simulation-results`, `/api/portfolios`, `/api/simulate/risk-parity` 等）で `401 Unauthorized` エラーが発生している問題を解決します。エラーメッセージ `Authentication failed (Algorithm: ES256)` から、Supabase の JWT 署名検証（ES256）が正しく行われていないことが原因と考えられます。

## Functional Requirements
- **JWKS の取得とキャッシュ**: バックエンド（FastAPI）が Supabase の `jwks.json` を適切に取得し、パフォーマンスのためにキャッシュする仕組みを構築・確認する。
- **ES256 署名検証の実装**: `PyJWKClient` 等を用いて、Supabase から取得した公開鍵で ES256 署名を正しく検証する。
- **認証ミドルウェアの修正**: 認証が必要なすべてのルートで、提供された JWT が ES256 アルゴリズムで正しく検証されるようにミドルウェアまたは依存関係を修正する。

## Non-Functional Requirements
- **セキュリティ**: 署名検証をスキップしてはならない。必ず公開鍵（JWKS）を用いた検証を行う。
- **堅牢性**: Supabase の鍵ローテーションやネットワークエラーによる `jwks.json` 取得失敗に備え、適切なエラーハンドリングを実装する。

## Acceptance Criteria
- [ ] 本番環境（Railway）で `/api/simulation-results` などの認証が必要なエンドポイントが 200 OK を返すようになる。
- [ ] ES256 アルゴリズムを使用する JWT トークンの署名検証が、公開鍵（JWKS）を用いて正常に行われる。
- [ ] `jwks.json` の取得に失敗した場合や、鍵のローテーションに対応するためのエラーハンドリングが適切に実装されている。

## Out of Scope
- フロントエンドの認証ロジックの大幅な変更（バックエンド側の修正で解決することを前提とする）。
- Supabase プロジェクト設定自体の変更。
