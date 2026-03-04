# Implementation Plan: Log Analysis and Statistics Display Skill

## Phase 1: Environment Setup & Log Parser Foundation
- [x] Task: Setup test environment and mock log data (a1b2c3d)
    - [ ] Create mock JSON log files representing multiple sessions and various tool calls
    - [ ] Setup Vitest/Pytest environment for the new skill logic
- [x] Task: Implement JSON log line parser (e4f5g6h)
    - [ ] Write tests for parsing individual JSON log lines (valid/invalid/malformed)
    - [ ] Implement the parser to handle structured JSON logging format
- [~] Task: Implement latest session extraction logic
    - [ ] Write tests to identify the start of the latest session in a log stream
    - [ ] Implement logic to filter logs belonging only to the most recent run
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: Aggregation Logic (TDD)
- [ ] Task: Implement Skill invocation counter
    - [ ] Write tests to count occurrences of `activate_skill` and specific skill names
    - [ ] Implement logic to aggregate skill usage from the filtered logs
- [ ] Task: Implement MCP Tool invocation counter
    - [ ] Write tests to detect and count tool calls from various MCP servers
    - [ ] Implement logic to aggregate tool usage by server and tool name
- [ ] Task: Implement Error frequency counter
    - [ ] Write tests to identify failed tool executions and capture error types
    - [ ] Implement logic to aggregate error counts and failing tool names
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Aggregation' (Protocol in workflow.md)

## Phase 3: Formatting & Skill Integration
- [ ] Task: Implement terminal table formatter
    - [ ] Write tests for generating a clean ASCII table from aggregated data
    - [ ] Implement a formatter that outputs statistics in a structured table format
- [ ] Task: Create and Integrate the `.skill` file
    - [ ] Define the skill metadata and prompt instructions in `log-stats.skill`
    - [ ] Integrate the aggregation script as the core execution logic for the skill
- [ ] Task: Final E2E Verification
    - [ ] Run the skill against a real `dev_server.log` and verify the output table
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration' (Protocol in workflow.md)
