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
