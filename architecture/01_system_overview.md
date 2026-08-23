# System Architecture Blueprint: LeadPulse

## 1. High-Level Modular Topology

LeadPulse is engineered with a **Decoupled Layered Architecture**, separating raw external ingress from core triage algorithms, event dispatch, and UI presentation:

```mermaid
graph TD
    subgraph Ingress [1. Omni-Channel Ingress Layer]
        W1[Missed Call Webhook] --> INGEST[/api/v1/leads/ingest]
        W2[Web Form Ingest] --> INGEST
        W3[After-Hours Stream] --> INGEST
        SIM[Demo Simulator] --> INGEST
    end

    subgraph Core [2. Core Sentinel Engine]
        INGEST --> NORM[Data Normalizer & Sanitizer]
        NORM --> URG[Urgency Classifier & L_score Engine]
        URG --> VAL[Financial Valuation Model]
        VAL --> STATE[(Lead Ledger & Event Store)]
        VAL --> RESCUE[Auto-Rescue Dispatcher]
    end

    subgraph Dispatch [3. Dispatch & Recovery Layer]
        RESCUE --> SMS[Instant SMS / Chat Generator]
        RESCUE --> SLOT[Interactive Slot Token Generator]
    end

    subgraph Presentation [4. Presentation & Triage Matrix]
        STATE --> API[/api/v1/leads & /api/v1/metrics]
        API --> UI[React + Vite Triage Dashboard]
        UI --> ACT[/api/v1/leads/:id/actions]
        ACT --> STATE
    end
```

---

## 2. Subsystem Boundaries & Responsibilities

1. **Ingress & Normalization Adapter (`src/adapters/ingress/`)**
   - Ingests heterogeneous payloads (phone calls, web forms, raw webhooks).
   - Validates inputs against strict Zod schemas and normalizes into standard `LeadRecord`.

2. **Urgency & Financial Valuation Engine (`src/core/sentinel/`)**
   - Computes $L_{\text{score}}$ ($0–100$) and assigns SLA deadlines ($60\text{s}–60\text{min}$).
   - Assigns estimated job dollar values based on service categories and problem keywords.

3. **Auto-Rescue Engine (`src/core/rescue/`)**
   - Automatically executes personalized response generation within $< 2\text{s}$.
   - Generates signed, tamper-proof slot selection URLs for instant customer self-booking.

4. **Event Store & Financial Metrics Calculator (`src/core/ledger/`)**
   - Maintains immutable audit trail of all status transitions (`AuditTrail`).
   - Calculates real-time financial KPIs (Rescued Pipeline, At-Risk Pipeline, Leakage Rate, Median Response Latency).

5. **Client Presentation UI (`src/client/`)**
   - High-density triage radar with real-time countdown clocks.
   - Lead detail inspector drawer and 1-click action buttons.
