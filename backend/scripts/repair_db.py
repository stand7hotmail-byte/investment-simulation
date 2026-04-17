import os
import sys
from sqlalchemy import text, inspect

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import get_engine

def repair_db():
    print(f"Connecting to database to check schema...")
    engine = get_engine()
    if engine is None:
        print("Error: Could not initialize database engine.")
        return
    
    # Get the actual URL for dialect checking
    url = str(engine.url)
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # 1. asset_data テーブルのチェック
        columns = [c['name'] for c in inspector.get_columns('asset_data')]
        
        if 'dividend_yield' not in columns:
            print("Adding missing column: asset_data.dividend_yield")
            conn.execute(text("ALTER TABLE asset_data ADD COLUMN dividend_yield DECIMAL(8,6)"))
        
        if 'dividend_history' not in columns:
            print("Adding missing column: asset_data.dividend_history")
            # Postgres用のJSONB型（SQLiteならJSON）
            col_type = "JSONB" if "postgresql" in url else "JSON"
            conn.execute(text(f"ALTER TABLE asset_data ADD COLUMN dividend_history {col_type}"))

        # 2. simulation_results テーブルのチェック
        sim_cols = [c['name'] for c in inspector.get_columns('simulation_results')]
        if 'user_id' not in sim_cols:
            print("Adding missing column: simulation_results.user_id")
            # Use GUID compatible type or just String for generic migration
            conn.execute(text("ALTER TABLE simulation_results ADD COLUMN user_id VARCHAR(36)"))

        # 3. affiliate_brokers テーブルのチェック
        if 'affiliate_brokers' not in inspector.get_table_names():
            print("Creating missing table: affiliate_brokers")
            # 簡易的な作成
            if "postgresql" in url:
                conn.execute(text("""
                    CREATE TABLE affiliate_brokers (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        region VARCHAR NOT NULL,
                        description JSONB NOT NULL,
                        cta_text VARCHAR,
                        affiliate_url VARCHAR NOT NULL,
                        logo_url VARCHAR,
                        is_active BOOLEAN DEFAULT TRUE,
                        priority INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            else: # SQLite
                 conn.execute(text("""
                    CREATE TABLE affiliate_brokers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        region TEXT NOT NULL,
                        description TEXT NOT NULL,
                        cta_text TEXT,
                        affiliate_url TEXT NOT NULL,
                        logo_url TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        priority INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))

        conn.commit()
        print("Database repair completed successfully.")

if __name__ == "__main__":
    repair_db()
