# Project Rules: Investment Simulation App

## Language
- 日本語で回答すること。

## Backend (Python/FastAPI)
- **Data Sources**: `yfinance` 使用時は、JSON シリアライズ前に `.item()` でスカラー値に変換すること。
- **Numerical Stability**: API レスポンスを返す前に必ず `np.isnan()` と `np.isinf()` でチェックすること。
- **Database**: `config.py` の SQLite URL には絶対パスを使用すること。
- **Database (Cross-Environment)**: JSON カラムには `JSON().with_variant(JSONB, "postgresql")` を使用すること。
- **Authentication**: Supabase JWT の署名検証（`jwks.json` 経由）を省略しないこと。
- **Testing**: `setUp` メソッドでテーブルをクリア（`db.query(...).delete()`）し、テスト間のデータ干渉を防ぐこと。
- **Backward Compatibility**: `pytest` でカバーされている既存エンドポイントを勝手に削除・変更しないこと。

## Frontend (Next.js/TypeScript)
- **API Requests**: 必ず `@/lib/api.ts` の `fetchApi` を使用すること。
- **Environment Variables**: `process.env` の URL を使用する際は必ず `.trim()` すること。
- **State Management**: `zustand/persist` 使用時は `hasHydrated` フラグでハイドレーションを確認すること。
- **Charts (Plotly.js)**: カスタムクリックイベントは `onInitialized` でネイティブイベントをバインドすること。
- **Audio (Howler.js)**: ループ音源では `html5: false` に設定すること。

## Environment & Build
- **Next.js (Turbopack)**: 同一ファイル内でのシンボルの重複インポートに注意すること（ビルドエラーの原因）。
- **PowerShell (Windows)**: コマンド連結には `&&` ではなく `;` を使用すること。

# Antigravity Response Rules

## 1. トークン消費削減のための絶対原則
- 挨拶、結びの言葉、社交辞令（「承知しました」「お役に立てて嬉しいです」など）は一切禁止します。
- 修正理由や背景の長文解説は不要です。必要最小限の解説のみを箇条書きで記述してください。
- コードを変更する場合は、変更があった部分（差分）のみを出力し、変更のない周辺コードを丸ごと再出力することは絶対に避けてください。

## 2. 思考・実行プロセスの最適化
- 「Planning Mode」の際は、箇条書きで3〜4行以内の簡潔な計画を提示してください。
- コードの修正は1ステップずつ行い、一度に複数のファイルを広範囲に修正しないでください。
