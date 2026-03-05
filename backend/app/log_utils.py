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

def aggregate_skill_usage(parsed_logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Aggregates skill activations from parsed log entries.
    Identifies 'activate_skill' tool calls and counts the occurrences of each skill name.
    """
    skill_counts = {}
    for entry in parsed_logs:
        if entry.get("type") == "tool_call" and entry.get("tool") == "activate_skill":
            args = entry.get("arguments", {})
            skill_name = args.get("name")
            if skill_name:
                skill_counts[skill_name] = skill_counts.get(skill_name, 0) + 1
    return skill_counts

def aggregate_mcp_tool_usage(parsed_logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Aggregates MCP tool calls from parsed log entries.
    Identifies 'tool_call' entries excluding built-in skill activation.
    """
    tool_counts = {}
    # activate_skill is treated separately as it triggers a skill, not just a tool.
    excluded_tools = {"activate_skill"}
    
    for entry in parsed_logs:
        if entry.get("type") == "tool_call":
            tool_name = entry.get("tool")
            if tool_name and tool_name not in excluded_tools:
                tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    return tool_counts
