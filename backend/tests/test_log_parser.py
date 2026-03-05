import pytest
import json
from app.log_utils import parse_log_line

def test_parse_valid_json_line():
    line = '{"timestamp": "2026-03-04T12:00:00Z", "level": "info", "message": "test message"}'
    result = parse_log_line(line)
    assert result["level"] == "info"
    assert result["message"] == "test message"

def test_parse_invalid_json_line():
    line = 'invalid json'
    result = parse_log_line(line)
    assert result is None

def test_parse_malformed_json_line():
    line = '{"timestamp": "2026-03-04T12:00:00Z", "level": "info", "message": "incomplete'
    result = parse_log_line(line)
    assert result is None

def test_parse_empty_line():
    line = ''
    result = parse_log_line(line)
    assert result is None

def test_extract_latest_session_single_session():
    from app.log_utils import extract_latest_session
    logs = [
        '{"timestamp": "2026-03-04T12:00:00Z", "message": "Gemini CLI started"}',
        '{"timestamp": "2026-03-04T12:01:00Z", "message": "doing work"}'
    ]
    result = extract_latest_session(logs)
    assert len(result) == 2
    assert result[0]["message"] == "Gemini CLI started"

def test_extract_latest_session_multiple_sessions():
    from app.log_utils import extract_latest_session
    logs = [
        '{"timestamp": "2026-03-04T11:00:00Z", "message": "Gemini CLI started"}',
        '{"timestamp": "2026-03-04T11:01:00Z", "message": "old session data"}',
        '{"timestamp": "2026-03-04T12:00:00Z", "message": "Gemini CLI started"}',
        '{"timestamp": "2026-03-04T12:01:00Z", "message": "new session data"}'
    ]
    result = extract_latest_session(logs)
    assert len(result) == 2
    assert result[0]["message"] == "Gemini CLI started"
    assert result[1]["message"] == "new session data"

def test_extract_latest_session_no_start_marker():
    from app.log_utils import extract_latest_session
    logs = [
        '{"timestamp": "2026-03-04T12:01:00Z", "message": "new session data"}'
    ]
    result = extract_latest_session(logs)
    assert len(result) == 1
    assert result[0]["message"] == "new session data"

def test_extract_latest_session_empty_logs():
    from app.log_utils import extract_latest_session
    result = extract_latest_session([])
    assert result == []

def test_aggregate_skill_usage():
    from app.log_utils import aggregate_skill_usage
    logs = [
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-a"}},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-b"}},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-a"}},
        {"type": "tool_call", "tool": "other_tool", "arguments": {}}
    ]
    result = aggregate_skill_usage(logs)
    assert result["skill-a"] == 2
    assert result["skill-b"] == 1
    assert "other_tool" not in result

def test_aggregate_skill_usage_empty():
    from app.log_utils import aggregate_skill_usage
    assert aggregate_skill_usage([]) == {}

def test_aggregate_mcp_tool_usage():
    from app.log_utils import aggregate_mcp_tool_usage
    logs = [
        {"type": "tool_call", "tool": "google_search", "arguments": {"query": "test"}},
        {"type": "tool_call", "tool": "google_search", "arguments": {"query": "test2"}},
        {"type": "tool_call", "tool": "read_file", "arguments": {"file_path": "a.txt"}},
        {"type": "tool_call", "tool": "activate_skill", "arguments": {"name": "skill-a"}}
    ]
    result = aggregate_mcp_tool_usage(logs)
    assert result["google_search"] == 2
    assert result["read_file"] == 1
    assert "activate_skill" not in result

def test_aggregate_mcp_tool_usage_empty():
    from app.log_utils import aggregate_mcp_tool_usage
    assert aggregate_mcp_tool_usage([]) == {}
