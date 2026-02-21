import unittest
from unittest.mock import patch, MagicMock
import asyncio
import os

from app.models import AssetData
from app.database import Base, engine, SessionLocal
from scripts.collect_historical_data import collect_historical_data

class TestCollectHistoricalData(unittest.TestCase):

    def setUp(self):
        # Set up a test database in-memory
        self.engine = engine
        self.SessionLocal = SessionLocal
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()

        # Clear existing assets to ensure a clean state for the test
        self.db.query(AssetData).delete()
        self.db.commit()

        # Add some dummy asset data for testing
        dummy_assets = [
            AssetData(asset_code="TEST1", name="Test Asset 1", asset_class="Stock", expected_return=0.05, volatility=0.10),
            AssetData(asset_code="TEST2", name="Test Asset 2", asset_class="Bond", expected_return=0.03, volatility=0.05)
        ]
        self.db.add_all(dummy_assets)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    @patch('scripts.collect_historical_data.SessionLocal')
    @patch('scripts.collect_historical_data.fetch_historical_data')
    def test_collect_historical_data_script(self, mock_fetch_historical_data, mock_session_local):
        # Mock SessionLocal to return our test db session
        mock_session_local.return_value = self.db
        
        # Mock fetch_historical_data to return some sample data
        mock_fetch_historical_data.return_value = [
            {"date": "2023-01-01", "price": 100.0},
            {"date": "2023-01-08", "price": 101.0}
        ]

        # Run the async function
        asyncio.run(collect_historical_data())

        # Verify that fetch_historical_data was called for each asset
        self.assertEqual(mock_fetch_historical_data.call_count, 2)
        mock_fetch_historical_data.assert_any_call(
            "TEST1",
            start_date=unittest.mock.ANY,  # Don't care about exact date for this mock
            end_date=unittest.mock.ANY
        )
        mock_fetch_historical_data.assert_any_call(
            "TEST2",
            start_date=unittest.mock.ANY,
            end_date=unittest.mock.ANY
        )

        # Verify that the historical_prices were updated in the database
        updated_asset1 = self.db.query(AssetData).filter(AssetData.asset_code == "TEST1").first()
        updated_asset2 = self.db.query(AssetData).filter(AssetData.asset_code == "TEST2").first()

        self.assertIsNotNone(updated_asset1.historical_prices)
        self.assertIsInstance(updated_asset1.historical_prices, list)
        self.assertEqual(len(updated_asset1.historical_prices), 2)
        self.assertIsNotNone(updated_asset2.historical_prices)
        self.assertIsInstance(updated_asset2.historical_prices, list)
        self.assertEqual(len(updated_asset2.historical_prices), 2)

if __name__ == '__main__':
    unittest.main()
