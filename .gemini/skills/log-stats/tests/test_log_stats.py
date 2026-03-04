import pytest
import json
import sys
import os

# Add scripts directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from log_stats import parse_log_line, extract_latest_session

def test_extract_latest_session():
    lines = [
        '{"message": "Other log"}',
        '{"message": "Session started", "session_id": "1"}',
        '{"event": "tool_call", "tool": "read_file"}',
        '{"message": "Session started", "session_id": "2"}',
        '{"event": "tool_call", "tool": "grep_search"}',
    ]
    expected = [
        {"message": "Session started", "session_id": "2"},
        {"event": "tool_call", "tool": "grep_search"},
    ]
    assert extract_latest_session(lines) == expected

def test_extract_latest_session_single():
    lines = [
        '{"message": "Session started", "session_id": "1"}',
        '{"event": "tool_call", "tool": "read_file"}',
    ]
    expected = [
        {"message": "Session started", "session_id": "1"},
        {"event": "tool_call", "tool": "read_file"},
    ]
    assert extract_latest_session(lines) == expected

def test_extract_latest_session_none():
    lines = [
        '{"message": "Other log"}',
    ]
    assert extract_latest_session(lines) == []

def test_parse_valid_json_line():
    line = '{"timestamp": "2026-03-04T10:00:00Z", "level": "INFO", "message": "Test"}'
    expected = {"timestamp": "2026-03-04T10:00:00Z", "level": "INFO", "message": "Test"}
    assert parse_log_line(line) == expected

def test_parse_invalid_json_line():
    line = 'invalid json'
    assert parse_log_line(line) is None

def test_parse_empty_line():
    line = ''
    assert parse_log_line(line) is None

def test_parse_malformed_json_line():
    line = '{"timestamp": "2026-03-04T10:00:00Z", "level": "INFO", "message": "Test"'
    assert parse_log_line(line) is None
