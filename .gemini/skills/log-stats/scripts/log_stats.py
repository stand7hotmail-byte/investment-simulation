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

def format_table(title, headers, data):
    """
    Formats a dictionary as an ASCII table.
    """
    if not data:
        return f"\n### {title}\nNo data to display.\n"
    
    # Calculate column widths
    col1_width = max(len(headers[0]), max((len(str(k)) for k in data.keys()), default=0))
    col2_width = max(len(headers[1]), max((len(str(v)) for v in data.values()), default=0))
    
    # Build the table
    lines = []
    lines.append(f"\n### {title}")
    
    separator = f"+-{'-' * col1_width}-+-{'-' * col2_width}-+"
    header_row = f"| {headers[0]:<{col1_width}} | {headers[1]:<{col2_width}} |"
    
    lines.append(separator)
    lines.append(header_row)
    lines.append(separator)
    
    for key, value in sorted(data.items(), key=lambda x: x[1], reverse=True):
        row = f"| {str(key):<{col1_width}} | {str(value):<{col2_width}} |"
        lines.append(row)
    
    lines.append(separator)
    return "\n".join(lines)

def main(log_file_path):
    """
    Main entry point for log analysis.
    """
    if not os.path.exists(log_file_path):
        print(f"Error: Log file not found at {log_file_path}")
        return
    
    with open(log_file_path, 'r') as f:
        lines = f.readlines()
    
    logs = extract_latest_session(lines)
    if not logs:
        print("No session data found in the log file.")
        return
    
    # Aggregations
    skills = aggregate_skills(logs)
    tools = aggregate_tools(logs)
    errors = aggregate_errors(logs)
    
    # Output tables
    print(format_table("Skill Invocation Statistics", ["Skill Name", "Count"], skills))
    print(format_table("Tool Invocation Statistics", ["Tool Name", "Count"], tools))
    print(format_table("Error Frequency Statistics", ["Tool Name", "Count"], errors))

if __name__ == "__main__":
    import sys
    import os
    
    path = "dev_server.log"
    if len(sys.argv) > 1:
        path = sys.argv[1]
    
    main(path)
