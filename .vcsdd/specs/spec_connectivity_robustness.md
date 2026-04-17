# Behavioral Specification: Connectivity & Auth Robustness

**ID:** SPEC-009
**Track:** fix_auth_connectivity_20260417

## Context
フロントエンドにおいて `TypeError: Failed to fetch` が発生し、認証（signUp/signIn）が失敗する問題が報告された。
これは、環境変数（特に `NEXT_PUBLIC_SUPABASE_URL`）に不要な空白が含まれていることや、ネットワークの不安定さが原因である可能性が高い。
プロジェクトのガイドラインに従い、すべての環境変数を安全に処理し、接続の堅牢性を高める必要がある。

## Requirements
- `frontend/src/lib/supabase.ts` において、`process.env.NEXT_PUBLIC_SUPABASE_URL` および `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` を使用する際、必ず `.trim()` を行い、不要な空白を除去すること。
- 環境変数が未定義の場合のフォールバック処理を維持しつつ、不正なURL形式による実行時エラーを防止すること。

## Verification Criteria
- 修正後、フロントエンドをビルドし、環境変数の末尾にスペースがあっても Supabase クライアントが正しく初期化されること。
- `signUp` / `signIn` のリクエストが `TypeError: Failed to fetch` で即座に失敗せず、ネットワーク層まで到達すること。
