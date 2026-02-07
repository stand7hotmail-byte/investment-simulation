import sqlite3
import json
import os
from datetime import datetime

def inspect_db(db_path='backend/test.db'):
    if not os.path.exists(db_path):
        # Fallback for relative path
        db_path = 'test.db'
        if not os.path.exists(db_path):
            print(f"Error: Database file not found at {db_path}")
            return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get list of all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row['name'] for row in cursor.fetchall() if not row['name'].startswith('sqlite_')]

    db_content = {}

    for table in tables:
        # Get column info
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row['name'] for row in cursor.fetchall()]

        # Get all records
        cursor.execute(f"SELECT * FROM {table}")
        rows = [dict(row) for row in cursor.fetchall()]

        # Handle non-serializable objects (like Decimal if present, though sqlite rows are usually native types)
        for row in rows:
            for key, value in row.items():
                if isinstance(value, bytes):
                    row[key] = value.hex() # Convert GUID/Binary to hex string

        db_content[table] = {
            "columns": columns,
            "count": len(rows),
            "rows": rows
        }

    conn.close()

    output_file = 'db_snapshot.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(db_content, f, ensure_ascii=False, indent=2)
    
    print(f"Database inspection complete. Summary:")
    for table, info in db_content.items():
        print(f"  - {table}: {info['count']} records")
    print(f"Snapshot saved to: {output_file}")

if __name__ == "__main__":
    inspect_db()
