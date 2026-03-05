import pytest
from app.log_utils import format_stats_table

def test_format_stats_table_valid_data():
    title = "Skill Usage"
    data = {"skill-a": 10, "skill-b": 5}
    headers = ["Skill Name", "Count"]
    
    table = format_stats_table(title, data, headers)
    
    assert "Skill Usage" in table
    assert "skill-a" in table
    assert "10" in table
    assert "skill-b" in table
    assert "5" in table
    assert "Skill Name" in table
    assert "Count" in table

def test_format_stats_table_empty_data():
    title = "Empty Stats"
    data = {}
    headers = ["Item", "Count"]
    
    table = format_stats_table(title, data, headers)
    
    assert "Empty Stats" in table
    assert "No data available" in table

def test_format_stats_table_alignment():
    title = "Alignment Test"
    data = {"long-name-item": 1, "short": 100}
    headers = ["Name", "Value"]
    
    table = format_stats_table(title, data, headers)
    lines = table.split("\n")
    # Basic check for structure (headers, separator, rows)
    assert len(lines) >= 5 
