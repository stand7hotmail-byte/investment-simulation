# Specification: Missing Endpoints & Stability

## Goal
フロントエンドが必要とするすべてのAPIエンドポイントがバックエンドに存在し、正常に動作することを保証する。
また、メンテナンス用スクリプトやテストが現在のデータベース設計と互換性を持つことを保証する。

## Behavioral Requirements
- `POST /api/simulate/custom-portfolio` がリクエストされた際、指定された資産と比率に基づいてポートフォリオの統計（期待リターン、ボラティリティ）を計算して返すこと。
- `GET /api/simulation-results` がリクエストされた際、ログインユーザーの保存済みシミュレーション結果のリストを返すこと。
- `POST /api/simulation-results` がリクエストされた際、シミュレーション結果をデータベースに保存できること。
- `GET /api/simulation-results/{result_id}` がリクエストされた際、特定のシミュレーション結果を取得できること。
- `DELETE /api/simulation-results/{result_id}` がリクエストされた際、特定のシミュレーション結果を削除できること。
- 全てのデータベース接続スクリプトが `SPEC-006` の「モジュールレベルでのエンジン初期化禁止」ルールに従っていること。
- ログ解析ユーティリティが正しく機能し、統計情報を抽出できること。
