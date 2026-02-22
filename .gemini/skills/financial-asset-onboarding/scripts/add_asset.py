import sys
import os
import ast

def add_asset_to_seed(ticker, name, asset_class, expected_return=0.05, volatility=0.15):
    seed_file = "backend/app/seed_assets.py"
    if not os.path.exists(seed_file):
        print(f"Error: {seed_file} not found.")
        return False

    with open(seed_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find the assets list start and end
    start_line = -1
    for i, line in enumerate(lines):
        if line.strip().startswith("assets = ["):
            start_line = i
            break
    
    if start_line == -1:
        print("Error: Could not find assets list in seed_assets.py")
        return False

    # Check if ticker already exists
    if any(ticker in line for line in lines):
        print(f"Info: {ticker} already appears to be in the list.")
        return True

    # Find the end of the list (the first ']' that is not inside a dictionary)
    # Simple approach: look for the ']' at the same indentation level as 'assets = ['
    # or just before the closing ']'
    end_line = -1
    for i in range(start_line, len(lines)):
        if lines[i].strip() == "]":
            end_line = i
            break
    
    if end_line == -1:
        print("Error: Could not find end of assets list")
        return False

    new_entry = f'            {{"asset_code": "{ticker}", "name": "{name}", "asset_class": "{asset_class}", "expected_return": {expected_return}, "volatility": {volatility}}},
'
    lines.insert(end_line, new_entry)

    with open(seed_file, "w", encoding="utf-8") as f:
        f.writelines(lines)
    
    print(f"Success: Added {ticker} to seed_assets.py")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python add_asset.py <ticker> <name> <class> [return] [volatility]")
        sys.exit(1)
    
    ticker = sys.argv[1]
    name = sys.argv[2]
    asset_class = sys.argv[3]
    ret = float(sys.argv[4]) if len(sys.argv) > 4 else 0.05
    vol = float(sys.argv[5]) if len(sys.argv) > 5 else 0.15
    
    add_asset_to_seed(ticker, name, asset_class, ret, vol)
