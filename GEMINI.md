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
