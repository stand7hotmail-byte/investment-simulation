# Implementation Plan: Log Analysis and Statistics Display Skill

## Phase 1: Environment Setup & Log Parser Foundation [checkpoint: aeaa789]
- [x] Task: Setup test environment and mock log data (a1b2c3d)
    - [ ] Create mock JSON log files representing multiple sessions and various tool calls
    - [ ] Setup Vitest/Pytest environment for the new skill logic
- [x] Task: Implement JSON log line parser (123f25a)
    - [ ] Write tests for parsing individual JSON log lines (valid/invalid/malformed)
    - [ ] Implement the parser to handle structured JSON logging format
- [x] Task: Implement latest session extraction logic (614743d)
    - [ ] Write tests to identify the start of the latest session in a log stream
    - [ ] Implement logic to filter logs belonging only to the most recent run
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: Aggregation Logic (TDD) [checkpoint: 09ec5ea]
- [x] Task: Implement Skill invocation counter (43f15cf)
    - [ ] Write tests to count occurrences of `activate_skill` and specific skill names
    - [ ] Implement logic to aggregate skill usage from the filtered logs
- [x] Task: Implement MCP Tool invocation counter (b283399)
    - [ ] Write tests to detect and count tool calls from various MCP servers
    - [ ] Implement logic to aggregate tool usage by server and tool name
- [x] Task: Implement Error frequency counter (09ec5ea)
    - [ ] Write tests to identify failed tool executions and capture error types
    - [ ] Implement logic to aggregate error counts and failing tool names
- [x] Task: Conductor - User Manual Verification 'Phase 2: Aggregation' (Protocol in workflow.md)

## Phase 3: Formatting & Skill Integration [checkpoint: da9831a]
- [x] Task: Implement terminal table formatter (d79914d)
    - [ ] Write tests for generating a clean ASCII table from aggregated data
    - [ ] Implement a formatter that outputs statistics in a structured table format
- [x] Task: Create and Integrate the `.skill` file (da9831a)
    - [ ] Define the skill metadata and prompt instructions in `log-stats.skill`
    - [ ] Integrate the aggregation script as the core execution logic for the skill
- [x] Task: Final E2E Verification (e2e_pass)
    - [ ] Run the skill against a real `dev_server.log` and verify the output table
- [x] Task: Conductor - User Manual Verification 'Phase 3: Integration' (Protocol in workflow.md)
