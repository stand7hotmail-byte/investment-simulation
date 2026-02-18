import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import pandas as pd
from app.data_sources.yahoo_finance import fetch_historical_data, convert_to_json_format

class TestYahooFinance(unittest.TestCase):

    @patch('yfinance.download')
    def test_fetch_historical_data_success(self, mock_yf_download):
        # Mocking yfinance.download to return a sample DataFrame
        mock_data = {
            'Adj Close': [100.0, 101.0, 102.0],
            'Open': [99.0, 100.5, 101.5],
            'High': [100.5, 101.5, 102.5],
            'Low': [98.5, 100.0, 101.0],
            'Volume': [1000, 1200, 1100]
        }
        dates = pd.to_datetime(['2023-01-01', '2023-01-08', '2023-01-15'])
        mock_df = pd.DataFrame(mock_data, index=dates)
        mock_yf_download.return_value = mock_df

        ticker = "AAPL"
        start_date = "2023-01-01"
        end_date = "2023-01-15"
        
        result = fetch_historical_data(ticker, start_date, end_date)
        
        mock_yf_download.assert_called_once_with(
            ticker,
            start=datetime.strptime(start_date, "%Y-%m-%d"),
            end=datetime.strptime(end_date, "%Y-%m-%d"),
            interval="1d",
            auto_adjust=False,
            prepost=False
        )
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]['date'], '2023-01-01')
        self.assertEqual(result[0]['price'], 100.0)
        self.assertEqual(result[2]['date'], '2023-01-15')
        self.assertEqual(result[2]['price'], 102.0)

    @patch('yfinance.download')
    def test_fetch_historical_data_no_data(self, mock_yf_download):
        mock_yf_download.return_value = pd.DataFrame() # Empty DataFrame
        
        ticker = "NONEXISTENT"
        result = fetch_historical_data(ticker)
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)

    @patch('yfinance.download')
    def test_fetch_historical_data_exception(self, mock_yf_download):
        mock_yf_download.side_effect = Exception("Network error")
        
        ticker = "AAPL"
        result = fetch_historical_data(ticker)
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)

    def test_convert_to_json_format(self):
        mock_data = {
            'Adj Close': [200.0, 201.5],
            'Open': [199.0, 201.0],
            'High': [200.5, 202.0],
            'Low': [198.0, 200.0],
            'Volume': [500, 600]
        }
        dates = pd.to_datetime(['2024-01-01', '2024-01-08'])
        mock_df = pd.DataFrame(mock_data, index=dates)

        result = convert_to_json_format(mock_df)
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['date'], '2024-01-01')
        self.assertEqual(result[0]['price'], 200.0)
        self.assertEqual(result[1]['date'], '2024-01-08')
        self.assertEqual(result[1]['price'], 201.5)

    def test_convert_to_json_format_empty_df(self):
        empty_df = pd.DataFrame()
        result = convert_to_json_format(empty_df)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)

if __name__ == '__main__':
    unittest.main()
