import yfinance as yf
from datetime import datetime, timedelta

def fetch_historical_data(ticker: str, start_date: str = None, end_date: str = None) -> list[dict]:
    """
    Fetches historical data for a given ticker from Yahoo Finance.

    Args:
        ticker (str): The stock ticker symbol (e.g., "AAPL", "SPY").
        start_date (str, optional): Start date in "YYYY-MM-DD" format. Defaults to 20 years ago.
        end_date (str, optional): End date in "YYYY-MM-DD" format. Defaults to today.

    Returns:
        list[dict]: A list of dictionaries, each containing 'date' and 'price'.
                    Example: [{"date": "YYYY-MM-DD", "price": 100.0}, ...]
    """
    if end_date is None:
        end_date_dt = datetime.now()
    else:
        end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")

    if start_date is None:
        start_date_dt = end_date_dt - timedelta(days=365 * 20)  # Default to 20 years ago
    else:
        start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")

    # Fetch data
    try:
        data = yf.download(ticker, start=start_date_dt, end=end_date_dt, interval="1d", auto_adjust=False, prepost=False) # Using daily interval and explicit settings
        if data.empty:
            return []

        # Convert to list of dicts with 'date' and 'price'
        historical_prices = []
        for index, row in data.iterrows():
            historical_prices.append({
                "date": index.strftime("%Y-%m-%d"),
                "price": round(row['Adj Close'].item(), 2)  # Use .item() to get the scalar value from the Series
            })
        return historical_prices
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return []

def convert_to_json_format(data_df) -> list[dict]:
    """
    Converts a pandas DataFrame of historical data into the desired JSONB format.
    Assumes DataFrame has 'Date' and 'Adj Close' columns.

    Args:
        data_df (pd.DataFrame): DataFrame with historical data.

    Returns:
        list[dict]: A list of dictionaries, each containing 'date' and 'price'.
    """
    if data_df.empty:
        return []
    
    historical_prices = []
    for index, row in data_df.iterrows():
        historical_prices.append({
            "date": index.strftime("%Y-%m-%d"),
            "price": round(row['Adj Close'], 2)
        })
    return historical_prices

if __name__ == '__main__':
    # Example usage:
    # This part should not be used in production directly, but for testing the function
    aapl_data = fetch_historical_data("AAPL", start_date="2000-01-01")
    if aapl_data:
        print(f"Fetched {len(aapl_data)} records for AAPL. First 5: {aapl_data[:5]}")
    else:
        print("No data fetched for AAPL.")

    gld_data = fetch_historical_data("GLD", start_date="2000-01-01")
    if gld_data:
        print(f"Fetched {len(gld_data)} records for GLD. First 5: {gld_data[:5]}")
    else:
        print("No data fetched for GLD.")
