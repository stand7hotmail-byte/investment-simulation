# Behavioral Specification: Missing Endpoints Restoration

**ID:** SPEC-008
**Track:** fix_endpoints_stability_20260417

## Context
フロントエンドの機能拡充に伴い、既存のバックエンドに未実装のシミュレーション結果管理機能とカスタムポートフォリオ計算機能が必要となった。
また、過去の修正（SPEC-006）により変更されたデータベース接続方式を、すべての関連スクリプトに適用し、システム全体の安定性を確保する必要がある。

## Requirements

### 1. Custom Portfolio Simulation
- **ID:** SPEC-008-01
- **Pre-conditions:** 指定された資産コードが `asset_data` テーブルに存在すること。
- **Inputs:** 資産コードのリストとそれぞれのウェイト（比率）。
- **Outputs:** ポートフォリオ全体の期待リターンとボラティリティ。
- **Constraints:** ウェイトの合計が 1.0 にならない場合、自動的に正規化して計算すること。

### 2. Simulation Results Persistence
- **ID:** SPEC-008-02
- **Pre-conditions:** ユーザーが認証されていること（ゲストの場合は固定UUIDを使用）。
- **Inputs:** シミュレーションタイプ、パラメータ、計算結果。
- **Outputs:** データベースへの保存成功、および保存されたデータの取得・削除が可能であること。

### 3. Database Connection Uniformity
- **ID:** SPEC-008-03
- **Constraint:** モジュールトップレベルでの `engine` または `SessionLocal` のインスタンス化を禁止する。必ず `get_engine()` および `get_session_local()` を通じて動的に取得すること。
- **Scope:** メンテナンススクリプト、データ収集スクリプト、およびテストコード。

### 4. Log Analysis Reliability
- **ID:** SPEC-008-04
- **Requirement:** `log_utils.py` は、CLIの実行ログを解析するための基本的な関数群（パース、集計、テーブル出力）を提供し続けること。

## Pass/Fail Criteria
- `pytest` ですべての統合テストが通過すること。
- `backend/tests/test_new_endpoints.py` により、新規エンドポイントの正常系・異常系が検証されていること。
- `backend/check_db.py` がエラーなく実行できること。
