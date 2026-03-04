import json
from typing import Optional, Dict, Any

def parse_log_line(line: str) -> Optional[Dict[str, Any]]:
    """
    Parses a single log line as JSON.
    Returns the parsed dictionary if valid, otherwise None.
    """
    if not line or not line.strip():
        return None
    
    try:
        return json.loads(line)
    except (json.JSONDecodeError, TypeError):
        return None
