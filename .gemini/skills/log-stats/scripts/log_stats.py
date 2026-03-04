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

def aggregate_skills(logs):
    """
    Aggregates skill activations from logs.
    Returns a dictionary of skill names and their activation counts.
    """
    skills = {}
    for log in logs:
        if log.get("event") == "activate_skill":
            skill_name = log.get("skill")
            if skill_name:
                skills[skill_name] = skills.get(skill_name, 0) + 1
    return skills

def aggregate_tools(logs):
    """
    Aggregates tool calls from logs.
    Returns a dictionary of tool names and their call counts.
    """
    tools = {}
    for log in logs:
        if log.get("event") == "tool_call":
            tool_name = log.get("tool")
            if tool_name:
                tools[tool_name] = tools.get(tool_name, 0) + 1
    return tools

def aggregate_errors(logs):
    """
    Aggregates errors from logs.
    Returns a dictionary of tool names and their error counts.
    """
    errors = {}
    for log in logs:
        if log.get("event") == "tool_result" and log.get("status") == "failure":
            tool_name = log.get("tool")
            if tool_name:
                errors[tool_name] = errors.get(tool_name, 0) + 1
    return errors
