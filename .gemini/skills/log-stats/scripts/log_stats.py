import json

def parse_log_line(line):
    """
    Parses a single JSON log line.
    Returns the parsed dictionary or None if the line is invalid or empty.
    """
    if not line.strip():
        return None
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        return None

def extract_latest_session(lines):
    """
    Extracts logs belonging to the latest session.
    A session start is marked by message: "Session started".
    Returns a list of parsed log dictionaries.
    """
    parsed_logs = []
    for line in lines:
        parsed = parse_log_line(line)
        if parsed:
            parsed_logs.append(parsed)
    
    # Find the index of the last "Session started" message
    latest_start_index = -1
    for i in range(len(parsed_logs) - 1, -1, -1):
        if parsed_logs[i].get("message") == "Session started":
            latest_start_index = i
            break
    
    if latest_start_index == -1:
        return []
    
    return parsed_logs[latest_start_index:]
