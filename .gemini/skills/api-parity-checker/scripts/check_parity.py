import os
import re
import sys

def extract_backend_routes(backend_dir):
    routes = set()
    pattern = r'@app\.(get|post|put|delete)\("([^"]+)"'
    for root, _, files in os.walk(backend_dir):
        for file in files:
            if file == "main.py":
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    matches = re.findall(pattern, f.read())
                    for method, path in matches:
                        # Normalize path by removing path params
                        norm_path = re.sub(r'\{[^}]+\}', '*', path)
                        routes.add(f"{method.upper()} {norm_path}")
    return routes

def extract_frontend_requests(frontend_dir):
    requests = set()
    # Matches fetchApi("/path" or fetchApi(`/path`
    pattern = r'fetchApi(?:<[^>]*>)?\((?:["']|`)([^"'`]+)(?:["']|`)'
    for root, _, files in os.walk(frontend_dir):
        if "node_modules" in root or ".next" in root: continue
        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx"):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = re.findall(pattern, content)
                    for path in matches:
                        # Extract method from the same block if possible, default to GET for now
                        # Simple heuristic: look for 'method: "POST"' nearby
                        norm_path = re.sub(r'\$\{([^}]+)\}', '*', path)
                        requests.add(norm_path)
    return requests

def check_parity(backend_dir, frontend_dir):
    be_routes = extract_backend_routes(backend_dir)
    fe_paths = extract_frontend_requests(frontend_dir)
    
    # Check if FE paths exist in BE routes (ignoring methods for simple check)
    be_paths_only = {r.split(' ')[1] for r in be_routes}
    
    missing = []
    for fe_path in fe_paths:
        if fe_path not in be_paths_only:
            missing.append(fe_path)
            
    return missing

if __name__ == "__main__":
    be = "backend/app"
    fe = "frontend/src"
    missing = check_parity(be, fe)
    if missing:
        print("Backend endpoints missing for the following frontend requests:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)
    else:
        print("API Parity Check Passed: All frontend requests match backend routes.")
        sys.exit(0)
