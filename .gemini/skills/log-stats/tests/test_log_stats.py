import pytest
import json
import sys
import os

# Add scripts directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from log_stats import (
    parse_log_line,
    extract_latest_session,
    aggregate_skill_usage,
    aggregate_mcp_tool_usage,
    aggregate_error_usage,
    format_stats_table
)

def test_format_stats_table():
    title = "Skill Stats"
    headers = ["Skill Name", "Count"]
    data = {
        "skill-1": 2,
        "skill-2": 1
    }
    table = format_stats_table(title, data, headers)
    assert title in table
    assert headers[0] in table
    assert headers[1] in table
    assert "skill-1" in table
    assert "2" in table

def test_aggregate_error_usage():
    logs = [
        {"type": "tool_response", "tool": "read_file", "status": "success"},
        {"type": "tool_response", "tool": "run_shell_command", "status": "error", "error": "Command failed"},
        {"type": "tool_response", "tool": "read_file", "status": "error", "error": "File not found"},
    ]
    expected = {
        "run_shell_command": 1,
        "read_file": 1
    }
    assert aggregate_error_usage(logs) == expected

def test_aggregate_mcp_tool_usage():
    logs = [
        {"type": "tool_call", "tool": "read_file"},
        {"type": "tool_call", "tool": "grep_search"},
        {"type": "tool_call", "tool": "read_file"},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "test"}}
    ]
    expected = {
        "read_file": 2,
        "grep_search": 1
    }
    assert aggregate_mcp_tool_usage(logs) == expected

def test_aggregate_skill_usage():
    logs = [
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-1"}},
        {"type": "tool_call", "tool": "read_file"},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-2"}},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-1"}},
    ]
    expected = {
        "skill-1": 2,
        "skill-2": 1
    }
    assert aggregate_skill_usage(logs) == expected

def test_extract_latest_session():
    lines = [
        '{"message": "Other log"}',
        '{"message": "Gemini CLI started", "session_id": "1"}',
        '{"type": "tool_call", "tool": "read_file"}',
        '{"message": "Gemini CLI started", "session_id": "2"}',
        '{"type": "tool_call", "tool": "grep_search"}',
    ]
    expected = [
        {"message": "Gemini CLI started", "session_id": "2"},
        {"type": "tool_call", "tool": "grep_search"},
    ]
    assert extract_latest_session(lines) == expected

def test_parse_valid_json_line():
    line = '{"timestamp": "2026-03-04T10:00:00Z", "level": "INFO", "message": "Test"}'
    expected = {"timestamp": "2026-03-04T10:00:00Z", "level": "INFO", "message": "Test"}
    assert parse_log_line(line) == expected
