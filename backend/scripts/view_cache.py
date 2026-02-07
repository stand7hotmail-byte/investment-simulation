import sqlite3
import json
import os
import sys

def view_cache(filter_type=None):
    db_path = 'backend/test.db'
    if not os.path.exists(db_path):
        db_path = 'test.db'
        if not os.path.exists(db_path):
            print("Error: test.db not found.")
            return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT simulation_type, parameters, results, created_at FROM simulation_results"
    if filter_type:
        query += f" WHERE simulation_type = '{filter_type}'"
    
    query += " ORDER BY created_at DESC"

    cursor.execute(query)
    rows = cursor.fetchall()

    print(f"\n--- Simulation Cache ({len(rows)} entries) ---\n")
    
    for i, row in enumerate(rows):
        params = json.loads(row['parameters'])
        # Simplified display
        assets = params.get('assets', [])
        print(f"[{i+1}] Type: {row['simulation_type']} | Created: {row['created_at']}")
        print(f"    Assets: {', '.join(assets)}")
        
        # Optionally show full JSON for the latest entry
        if i == 0:
            print("    Latest Entry Detail (Result Preview):")
            res = json.loads(row['results'])
            if 'weights' in res:
                print(f"    Weights: {res['weights']}")
        print("-" * 40)

    conn.close()

if __name__ == "__main__":
    t = sys.argv[1] if len(sys.argv) > 1 else None
    view_cache(t)
