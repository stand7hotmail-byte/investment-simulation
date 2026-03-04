# Implementation Plan: Log Analysis and Statistics Display Skill

## Phase 1: Environment Setup & Log Parser Foundation [checkpoint: a3546f7]
- [x] Task: Setup test environment and mock log data (a1b2c3d)
    - [ ] Create mock JSON log files representing multiple sessions and various tool calls
    - [ ] Setup Vitest/Pytest environment for the new skill logic
- [x] Task: Implement JSON log line parser (e4f5g6h)
    - [ ] Write tests for parsing individual JSON log lines (valid/invalid/malformed)
    - [ ] Implement the parser to handle structured JSON logging format
- [x] Task: Implement latest session extraction logic (301e9b7)
    - [ ] Write tests to identify the start of the latest session in a log stream
    - [ ] Implement logic to filter logs belonging only to the most recent run
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)


## Phase 2: Aggregation Logic (TDD) [checkpoint: 9b7ae6d]
- [x] Task: Implement Skill invocation counter (a5b6c7d)
    - [ ] Write tests to count occurrences of `activate_skill` and specific skill names
    - [ ] Implement logic to aggregate skill usage from the filtered logs
- [x] Task: Implement MCP Tool invocation counter (b6c7d8e)
    - [ ] Write tests to detect and count tool calls from various MCP servers
    - [ ] Implement logic to aggregate tool usage by server and tool name
- [x] Task: Implement Error frequency counter (c7d8e9f)
    - [ ] Write tests to identify failed tool executions and capture error types
    - [ ] Implement logic to aggregate error counts and failing tool names
- [x] Task: Conductor - User Manual Verification 'Phase 2: Aggregation' (Protocol in workflow.md)

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
