from app.database import get_engine
from sqlalchemy import text
import os

def main():
    engine = get_engine()
    if engine is None:
        print("Error: Could not initialize database engine.")
        exit(1)

    print(f"Current Working Directory: {os.getcwd()}")
    print(f"Database URL: {engine.url}")

    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT count(*) FROM asset_data")).scalar()
            print(f"Asset count in asset_data: {res}")

            assets = conn.execute(text("SELECT asset_code FROM asset_data LIMIT 5")).fetchall()
            print(f"First 5 assets: {[a[0] for a in assets]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

