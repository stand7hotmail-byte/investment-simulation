import os
import re
import sys

def check_db_best_practices(models_file):
    issues = []
    try:
        with open(models_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Check for JSONB usage without variant
            if "JSONB" in content and "with_variant" not in content:
                issues.append("Warning: JSONB used without with_variant. This will break SQLite tests.")
            
            # Check for GUID usage
            if "GUID" not in content:
                issues.append("Suggestion: Consider using a custom GUID type for cross-DB UUID support.")
                
            # Check for standard Column imports
            if "from sqlalchemy import" in content and "JSON" not in content and "JSONB" in content:
                issues.append("Warning: Importing JSONB directly from dialects instead of using with_variant.")

    except FileNotFoundError:
        return ["Error: models.py not found."]
        
    return issues

if __name__ == "__main__":
    target = "backend/app/models.py"
    problems = check_db_best_practices(target)
    if problems:
        print("
".join(problems))
        sys.exit(1)
    else:
        print("Database Model Best Practices Check Passed.")
        sys.exit(0)
