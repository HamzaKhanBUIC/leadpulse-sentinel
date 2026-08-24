# Testing Strategy & Quality Assurance Repository

## Purpose
This directory stores test strategies, test matrices, test plans, verification reports, performance benchmarks, and Red Team penetration findings managed by the **QA/Test Agent** and **Red-Team Critic**.

---

## Directory Structure
- `01_test_strategy.md`: Testing philosophy, tier definitions, coverage targets, and test environments.
- `02_test_matrix.md`: Traceability matrix mapping PRD acceptance criteria to unit, integration, and E2E tests.
- `03_browser_test_plan.md`: Automated headless browser verification scenarios (Chrome DevTools).
- `04_adversarial_test_plan.md`: Red-team edge cases (corrupted payloads, network dropouts, clock drifts, high concurrency).
- `reports/`: Execution logs, coverage reports, test run summaries, and defect logs.

---

## Verification Rules
1. **Never Declare Complete by Compilation Alone**: Code must pass automated test suites, error injection, and browser validation.
2. **Deterministic & Isolated**: Tests must not have flaky external dependencies; mock all 3rd-party services.
3. **Traceable Defects**: Any bug identified during critique or testing must be documented in `reports/` before patch initiation.
