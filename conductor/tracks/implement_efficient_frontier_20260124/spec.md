# Specification: 効率的フロンティア計算の実装

## 概要
ユーザーが選択した資産クラスの統計データ（期待リターン、ボラティリティ、相関係数）を使用して、リスクレベルごとの最大リターン、またはリターンレベルごとの最小リスクを計算し、効率的フロンティアの曲線データを提供する。

## 要件
1.  **計算ロジック:**
    - 平均分散最適化 (Mean-Variance Optimization) を使用。
    - `cvxpy` ライブラリを使用して凸最適化問題を解く。
    - 制約条件: 
        - 重みの合計 = 1.0 (Full investment)
        - 各重み >= 0 (No short selling)
    - 効率的フロンティア上の複数のポイント（例：50点）を算出。

2.  **APIエンドポイント (`POST /api/simulate/efficient-frontier`):**
    - 入力: 資産コードのリスト、ポイント数。
    - 出力: 各ポイントのリターン、リスク、およびその時の資産配分（重み）。
    - 計算時間: 1秒以内。

3.  **技術スタック:**
    - `NumPy`, `SciPy`, `cvxpy`

## データ構造
- Request: `{"assets": ["TOPIX", "SP500"], "n_points": 50}`
- Response: `{"frontier": [{"expected_return": 0.05, "volatility": 0.12, "weights": {"TOPIX": 0.6, "SP500": 0.4}}, ...], "max_sharpe": {...}}`
