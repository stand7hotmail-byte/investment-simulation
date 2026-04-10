import sqlite3
import os

def check():
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'test.db')
    if not os.path.exists(db_path):
        db_path = 'backend/test.db'
    
    print(f"Checking DB: {os.path.abspath(db_path)}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables: {tables}")
    
    if 'asset_data' in tables:
        cursor.execute("SELECT asset_code, name, json_array_length(historical_prices) FROM asset_data")
        assets = cursor.fetchall()
        for a in assets:
            print(f"Asset: {a[0]} ({a[1]}), Historical points: {a[2]}")
    else:
        print("Table 'asset_data' not found!")
    
    conn.close()

if __name__ == "__main__":
    check()
