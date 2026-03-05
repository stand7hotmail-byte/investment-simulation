import os
import re
import sys

def scan_auth_issues(dir_path):
    issues = []
    
    # 繝√ぉ繝け繝代ち繝ｼ繝ｳ
    patterns = {
        "ES256_BYPASS": (r"verify_signature":\s*False", "Critical: ES256 signature verification is explicitly disabled."),
        "HARDCODED_SECRET": (r"JWT_SECRET\s*=\s*['"][^'"]+['"]", "High: Potential hardcoded JWT secret found."),
        "INSECURE_DECODE": (r"jwt\.decode\(.*options=.*"verify_signature":\s*False", "Critical: Insecure JWT decoding without signature verification."),
        "UNVERIFIED_HEADER": (r"jwt\.get_unverified_header", "Low: Usage of unverified headers. Ensure subsequent signature verification.")
    }

    for root, _, files in os.walk(dir_path):
        if "node_modules" in root or ".next" in root or "__pycache__" in root:
            continue
            
        for file in files:
            if not file.endswith(".py") and not file.endswith(".ts") and not file.endswith(".tsx"):
                continue
                
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    for key, (pattern, desc) in patterns.items():
                        if re.search(pattern, content):
                            matches = re.finditer(pattern, content)
                            for match in matches:
                                line_no = content.count('
', 0, match.start()) + 1
                                issues.append(f"{desc}
  File: {file_path}:{line_no}")
            except Exception:
                continue
                
    return issues

if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    results = scan_auth_issues(target_dir)
    if results:
        print("
".join(results))
        sys.exit(1)
    else:
        print("No auth security issues found.")
        sys.exit(0)
