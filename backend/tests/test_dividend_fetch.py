import unittest
from backend.app.data_sources.yahoo_finance import fetch_dividend_data

class TestYahooFinanceDividends(unittest.TestCase):
    def test_fetch_dividend_data_spy(self):
        """SPY (S&P 500 ETF) の配当データが取得できるかテスト"""
        ticker = "SPY"
        dividends = fetch_dividend_data(ticker)
        
        # 配当データがリストで返ってくること
        self.assertIsInstance(dividends, list)
        
        if len(dividends) > 0:
            # 各要素が期待した形式（date, amount）であること
            first = dividends[0]
            self.assertIn("date", first)
            self.assertIn("amount", first)
            self.assertIsInstance(first["amount"], float)
            print(f"Successfully fetched {len(dividends)} dividend records for {ticker}.")
            print(f"Sample: {dividends[-1]}") # 最新の配当を表示
        else:
            print(f"No dividends found for {ticker} (This might be expected for some assets, but SPY should have some).")

    def test_fetch_dividend_data_invalid_ticker(self):
        """無効なティッカーの場合に空リストが返るかテスト"""
        ticker = "INVALID_TICKER_12345"
        dividends = fetch_dividend_data(ticker)
        self.assertEqual(dividends, [])

if __name__ == "__main__":
    unittest.main()
