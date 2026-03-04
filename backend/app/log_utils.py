import json
from typing import Optional, Dict, Any, List

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

def extract_latest_session(logs: List[str]) -> List[Dict[str, Any]]:
    """
    Extracts log entries belonging to the latest session.
    A session start is identified by the message 'Gemini CLI started'.
    If no start marker is found, returns all valid logs.
    """
    parsed_logs = []
    for line in logs:
        parsed = parse_log_line(line)
        if parsed:
            parsed_logs.append(parsed)
            
    if not parsed_logs:
        return []
        
    # Find the index of the last 'Gemini CLI started' message
    start_index = 0
    for i in range(len(parsed_logs) - 1, -1, -1):
        if parsed_logs[i].get("message") == "Gemini CLI started":
            start_index = i
            break
            
    return parsed_logs[start_index:]
