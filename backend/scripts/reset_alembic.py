import os
from sqlalchemy import text
import sys

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import get_engine

def reset_alembic():
    print(f"Connecting to database to reset alembic_version...")
    
    engine = get_engine()
    if engine is None:
        print("Error: Could not initialize database engine.")
        return

    try:
        with engine.connect() as conn:
            # alembic_version テーブルを削除して不整合を解消
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
            conn.commit()
            print("Successfully dropped alembic_version table.")
    except Exception as e:
        print(f"Error resetting alembic: {e}")

if __name__ == "__main__":
    reset_alembic()
