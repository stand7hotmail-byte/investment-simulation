---
name: log-stats
description: Gemini CLIの実行ログを解析し、スキルやツールの使用統計、およびエラー発生頻度をテーブル形式で表示する。
---

# Log Analysis & Statistics

Gemini CLIの実行ログ（`dev_server.log`）を解析し、セッションごとのツール利用状況やエラー率を可視化します。

## 集計項目

- **スキル呼び出し統計**: 各スキルの起動回数。
- **ツール呼び出し統計**: 各ツールの実行回数。
- **エラー統計**: ツール実行失敗の頻度と対象。

## 使い方

1. **統計の表示**:
   プロジェクトルートで以下のコマンドを実行します。
   ```bash
   python .gemini/skills/log-stats/scripts/log_stats.py
   ```

2. **ログファイルの指定**:
   特定のログファイルを解析する場合：
   ```bash
   python .gemini/skills/log-stats/scripts/log_stats.py <path_to_log_file>
   ```

## 注意事項

- 最新のセッション（最後の起動以降）のみが解析対象となります。
- ログファイルがJSON形式（Structured Logging）であることを前提としています。
