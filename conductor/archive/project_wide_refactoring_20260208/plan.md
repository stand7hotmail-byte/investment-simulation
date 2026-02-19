# Implementation Plan: Project-Wide Refactoring for Separation of Concerns

## Phase 1: Backend Refactoring (Separation of Concerns) [checkpoint: a3e5f04]
- [x] Task: Audit `backend/app` dependencies and identify logic-DB entanglement [a3e5f04]
- [x] Task: Write failing unit tests for pure calculation logic to be extracted in `simulation.py` [a3e5f04]
- [x] Task: Implement/Refactor pure calculation logic in `simulation.py` to pass tests [a3e5f04]
- [x] Task: Refactor `crud.py` and `main.py` to utilize the new decoupled calculation functions [a3e5f04]
- [x] Task: Verify backend unit test coverage meets requirement (>80%) [a3e5f04]
- [x] Task: Conductor - User Manual Verification 'Backend Refactoring' (Protocol in workflow.md) [a3e5f04]

## Phase 2: Frontend Refactoring (Custom Hooks & Component Cleanup) [checkpoint: 30fdbdb]
- [x] Task: Audit component logic in `src/components/simulation/` to identify extraction points [30fdbdb]
- [x] Task: Write failing unit tests for new custom hooks representing extracted business logic [30fdbdb]
- [x] Task: Extract logic from components into custom hooks (e.g., `useSimulationLogic.ts`) to pass tests [30fdbdb]
- [x] Task: Consolidate and refactor utility functions in `src/lib/utils.ts` with corresponding tests [30fdbdb]
- [x] Task: Verify frontend unit test coverage meets requirement (>80%) [30fdbdb]
- [x] Task: Conductor - User Manual Verification 'Frontend Refactoring' (Protocol in workflow.md) [30fdbdb]

## Phase 3: State Management & Store Refinement [checkpoint: 6ef7ebe]
- [x] Task: Audit `useSimulationStore.ts` (Zustand) and `useEfficientFrontier.ts` (React Query) for responsibility overlap [6ef7ebe]
- [x] Task: Refactor store and hooks to clearly separate UI state from server-synchronized data [6ef7ebe]
- [x] Task: Write/Update integration tests for state transitions and synchronization [6ef7ebe]
- [x] Task: Verify end-to-end flow with existing Playwright E2E tests [6ef7ebe]
- [x] Task: Conductor - User Manual Verification 'State Management Refactoring' (Protocol in workflow.md) [6ef7ebe]

## Phase 4: Final Integration & Quality Gate Verification [checkpoint: 6ef7ebe]
- [x] Task: Run comprehensive test suite (Backend Pytest + Frontend Vitest + Playwright E2E) [6ef7ebe]
- [x] Task: Perform final code review against `workflow.md` quality gates [6ef7ebe]
- [x] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md) [6ef7ebe]
