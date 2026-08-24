# LeadPulse Developer & Engineering Guide

## 1. Quickstart & Running Locally

LeadPulse runs as a **zero-dependency, standalone full-stack application** on Node.js 20+:

```powershell
# 1. Start the server (serves both API & Frontend UI)
node src/server/index.js

# 2. Open in your browser
http://localhost:3001
```

---

## 2. Running Automated Tests

Run the complete multi-tier automated test suite:

```powershell
node --test tests/standalone_runner.js
```

All 14 automated tests run in $< 350\text{ms}$ across 6 suites:
- Suite 1: Urgency Classifier & NLP Triage Engine
- Suite 2: Financial Valuation Model
- Suite 3: AutoRescue Dispatcher Engine
- Suite 4: End-to-End Leakage Recovery Scenario
- Suite 5: Full Native REST API Endpoints
- Suite 6: Adversarial Chaos & High-Concurrency Edge Cases

---

## 3. Directory Layout & Architecture

```
src/
├── types/index.ts                    # Canonical TypeScript schemas & interfaces
├── core/
│   ├── sentinel/urgencyClassifier.js # NLP keyword triage & L_score engine
│   ├── sentinel/valuationModel.js    # Job dollar estimation algorithms
│   ├── rescue/autoRescueDispatcher.js# Automated response & booking link generator
│   ├── ledger/eventStore.js          # In-memory event ledger & KPI calculator
│   └── simulator/leadEmitter.js      # Synthetic test lead generator
├── adapters/
│   └── ingress/leadNormalizer.js     # Webhook ingress parser & validator
└── server/
    ├── nativeServer.js               # Standalone HTTP REST & Web UI server
    └── index.js                      # Application server entrypoint
```
