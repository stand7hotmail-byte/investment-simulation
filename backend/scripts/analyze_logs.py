import sys
import os
import argparse

# backend ディレクトリをパスに追加
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.log_utils import (
    extract_latest_session,
    aggregate_skill_usage,
    aggregate_mcp_tool_usage,
    aggregate_error_usage,
    format_stats_table
)

def main():
    parser = argparse.ArgumentParser(description="Analyze Gemini CLI logs for usage statistics.")
    parser.add_argument("log_file", nargs="?", default="dev_server.log", help="Path to the log file (default: dev_server.log)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    
    if os.path.isabs(args.log_file):
        log_path = args.log_file
    else:
        log_path = os.path.join(project_root, args.log_file)
    
    if not os.path.exists(log_path):
        print(f"Error: Log file not found at {log_path}")
        return

    lines = []
    encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'cp932']
    
    success = False
    for enc in encodings:
        try:
            with open(log_path, 'r', encoding=enc) as f:
                lines = f.readlines()
            success = True
            break
        except (UnicodeDecodeError, UnicodeError):
            continue
            
    if not success:
        print(f"Error: Could not decode log file with any of the attempted encodings: {encodings}")
        return

    latest_session_logs = extract_latest_session(lines)
    
    if not latest_session_logs:
        print("No valid logs found in the latest session.")
        return

    skill_usage = aggregate_skill_usage(latest_session_logs)
    mcp_tool_usage = aggregate_mcp_tool_usage(latest_session_logs)
    error_usage = aggregate_error_usage(latest_session_logs)

    print("\n" + "="*40)
    print("      GEMINI CLI USAGE STATISTICS      ")
    print("="*40)

    print(format_stats_table("SKILL USAGE", skill_usage, ["Skill Name", "Activations"]))
    print(format_stats_table("MCP TOOL USAGE", mcp_tool_usage, ["Tool Name", "Invocations"]))
    print(format_stats_table("ERROR FREQUENCY", error_usage, ["Tool Name", "Failures"]))

if __name__ == "__main__":
    main()
