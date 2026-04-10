import sqlite3
import os

def check():
    db_path = 'backend/test.db'
    if not os.path.exists(db_path):
        print("DB not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # どんなテーブルがあるか
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables in {db_path}: {tables}")
    
    for table in tables:
        try:
            cursor.execute(f"SELECT count(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Table {table}: {count} records")
        except:
            print(f"Error reading {table}")
            
    conn.close()

if __name__ == "__main__":
    check()
