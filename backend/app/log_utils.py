import logging
import sys
import os
import json
from typing import Optional, Dict, Any, List

def setup_logging(name: str = "app"):
    """
    Configures a unified logger for the application.
    In production, this could be configured to send logs to a centralized system.
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if setup_logging is called multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger

# Create a default logger instance
logger = setup_logging()

# --- LOG ANALYSIS UTILITIES ---

def parse_log_line(line: str) -> Optional[Dict[str, Any]]:
    """Parses a single log line as JSON."""
    if not line or not line.strip():
        return None
    try:
        return json.loads(line)
    except (json.JSONDecodeError, TypeError):
        return None

def extract_latest_session(logs: List[str]) -> List[Dict[str, Any]]:
    """Extracts log entries belonging to the latest session."""
    parsed_logs = []
    for line in logs:
        parsed = parse_log_line(line)
        if parsed:
            parsed_logs.append(parsed)
    if not parsed_logs:
        return []
    start_index = 0
    for i in range(len(parsed_logs) - 1, -1, -1):
        if parsed_logs[i].get("message") == "Gemini CLI started":
            start_index = i
            break
    return parsed_logs[start_index:]

def aggregate_skill_usage(parsed_logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Aggregates skill activations."""
    skill_counts = {}
    for entry in parsed_logs:
        if entry.get("type") == "tool_call" and entry.get("tool") == "activate_skill":
            skill_name = entry.get("arguments", {}).get("name")
            if skill_name:
                skill_counts[skill_name] = skill_counts.get(skill_name, 0) + 1
    return skill_counts

def aggregate_mcp_tool_usage(parsed_logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Aggregates MCP tool calls."""
    tool_counts = {}
    excluded_tools = {"activate_skill"}
    for entry in parsed_logs:
        if entry.get("type") == "tool_call":
            tool_name = entry.get("tool")
            if tool_name and tool_name not in excluded_tools:
                tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    return tool_counts

def aggregate_error_usage(parsed_logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Aggregates tool execution errors."""
    error_counts = {}
    for entry in parsed_logs:
        if entry.get("type") == "tool_response" and entry.get("status") == "error":
            tool_name = entry.get("tool")
            if tool_name:
                error_counts[tool_name] = error_counts.get(tool_name, 0) + 1
    return error_counts

def format_stats_table(title: str, data: Dict[str, int], headers: List[str]) -> str:
    """Formats usage statistics into an ASCII table."""
    if not data:
        return f"\n=== {title} ===\nNo data available.\n"
    sorted_items = sorted(data.items(), key=lambda x: x[1], reverse=True)
    col1_width = max(len(headers[0]), max(len(str(k)) for k in data.keys()) if data else 0) + 2
    col2_width = max(len(headers[1]), max(len(str(v)) for v in data.values()) if data else 0) + 2
    lines = [f"\n=== {title} ==="]
    header_row = f"{headers[0]:<{col1_width}}| {headers[1]:<{col2_width}}"
    lines.extend([header_row, "-" * len(header_row)])
    for name, count in sorted_items:
        lines.append(f"{str(name):<{col1_width}}| {str(count):<{col2_width}}")
    return "\n".join(lines) + "\n"
