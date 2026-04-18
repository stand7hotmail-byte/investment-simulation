# Behavioral Specification: Connectivity & Auth Robustness

**ID:** SPEC-009
**Track:** fix_auth_connectivity_20260417

## Context
フロントエンドにおいて `TypeError: Failed to fetch` が発生し、認証（signUp/signIn）が失敗する問題が報告された。
これは、環境変数（特に `NEXT_PUBLIC_SUPABASE_URL`）に不要な空白が含まれていることや、ネットワークの不安定さが原因である可能性が高い。
プロジェクトのガイドラインに従い、すべての環境変数を安全に処理し、接続の堅牢性を高める必要がある。

## Requirements
- `frontend/src/lib/supabase.ts` において、`process.env.NEXT_PUBLIC_SUPABASE_URL` および `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` を使用する際、必ず `.trim()` を行い、不要な空白を除去すること。
- **[NEW]** 本番環境において環境変数が未定義、またはプレースホルダの状態である場合、コンソールに警告（秘密情報は伏せる）を出力し、開発者がデバッグしやすくすること。
- **[NEW]** URLが有効な形式であることを検証し、不正なURLによる `Failed to fetch` を未然に防ぐこと。

## Verification Criteria
- 修正後、フロントエンドをビルドし、環境変数の末尾にスペースがあっても Supabase クライアントが正しく初期化されること。
- `signUp` / `signIn` のリクエストが `TypeError: Failed to fetch` で即座に失敗せず、ネットワーク層まで到達すること。
