# MVP Product Requirement Document (PRD): LeadPulse

## 1. Scope & MVP Boundary Definition

| Feature Module | In Scope (MVP Session 01) | Out of Scope (Future Roadmap) |
|---|---|---|
| **Ingestion Engine** | Webhook listener for missed calls, web forms, after-hours leads, and manual simulation injector. | Native 2-way SIP PBX hardware integration, live telecom carrier trunking. |
| **Triage & Decay Engine** | Sub-second SLA countdown timers, urgency classifier ($L_{\text{score}}$: Critical, High, Medium, Low), value estimation. | Multi-language translation, voice biometrics. |
| **Instant Auto-Rescue** | Automated interactive SMS/Web messaging simulation, booking link dispatch, instant response state machine. | Native SMS carrier shortcodes (Twilio simulated via local dispatch bus). |
| **Triage Matrix UI** | Real-time live queue, countdown decay clocks, 1-click status transitions, lead detail inspector, rep assignment. | Complex 50-technician route optimization GPS mapping. |
| **Financial Rescue Ledger** | Real-time dollar metrics (Rescued Pipeline, At-Risk Revenue, Lost Revenue, Avg Response Time). | QuickBooks / NetSuite general ledger accounting sync. |

---

## 2. Core Functional Specifications

### Module 1: Omni-Channel Inbound Ingestion (`/api/v1/leads/ingest`)
- **Supported Channels**:
  - `MISSED_CALL`: Inbound phone call terminated without answer (caller ID, timestamp, ring duration).
  - `WEB_FORM`: Website contact or quote request (name, phone, email, service category, problem description).
  - `AFTER_HOURS`: Inquiries received outside business hours (6:00 PM – 8:00 AM).
  - `DIRECT_WEBHOOK`: Generic JSON payload for Zapier / Make / Lead aggregators.
- **Normalization**: Every incoming event is normalized into a unified `LeadRecord` schema with UUID, standard timestamps, sanitized phone numbers (E.164), and initial `NEW_UNTOUCHED` status.

### Module 2: Autonomous Urgency Scoring & Financial Estimation
- **Urgency Scoring ($L_{\text{score}}$)**:
  - `CRITICAL` ($L_{\text{score}} = 90-100$): Keywords = *burst, flood, no heat, freezing, gas, smoke, storm, emergency*. SLA: 60 seconds.
  - `HIGH` ($L_{\text{score}} = 70-89$): Keywords = *leak, AC down, electrical outage, broken toilet, backed up*. SLA: 3 minutes.
  - `MEDIUM` ($L_{\text{score}} = 40-69$): Keywords = *maintenance, inspection, quote, installation estimate*. SLA: 15 minutes.
  - `LOW` ($L_{\text{score}} = 0-39$): General queries, marketing inquiries. SLA: 60 minutes.
- **Value Estimation**: Automatically estimates job dollar value based on service category and detected job scale (e.g. HVAC Replacement = \$7,500; Emergency Drain Clearing = \$450; AC Tune-Up = \$180).

### Module 3: Instant Auto-Rescue Engine
- **Trigger**: Fired automatically within $< 2\text{ seconds}$ of lead ingestion.
- **Auto-Rescue Payload**:
  - Personalized text: *"Hi [Name], this is Dave's HVAC & Plumbing. We saw we just missed your call about [Issue]. We have emergency technicians on call right now. Tap here to confirm your address or hold an immediate arrival window: [Link]"*
- **Interactive Booking Link**: Generates a self-service interactive appointment/callback slot picker.

### Module 4: Live Triage Matrix Dashboard
- **Visual Decay Clocks**: Color-coded countdown timer for each lead:
  - Green: $> 75\%$ of SLA remaining.
  - Amber: $25\% - 75\%$ of SLA remaining.
  - Red / Pulsing: $< 25\%$ of SLA remaining or SLA breached.
- **1-Click Triage Actions**: `Claim Lead`, `Reassign Rep`, `Trigger Emergency Call`, `Mark Rescued`, `Mark Lost`.
- **Lead Detail Drawer**: Chronological timeline of events (Missed Call -> Auto-SMS Sent -> Customer Opened Link -> Customer Selected Slot).

### Module 5: Financial Revenue Rescued Ledger
- **Live KPIs**:
  - Total Inbound Leads & Leakage Rate (%)
  - Total Pipeline Value at Risk (\$)
  - Total Pipeline Value Rescued (\$)
  - Median Time to First Contact (Seconds)
  - Recovery Conversion Rate (%)

---

## 3. Non-Functional Requirements (NFRs)
- **Performance**: Ingestion-to-triage latency $< 50\text{ms}$; dashboard state update latency $< 100\text{ms}$.
- **Resilience**: Zero data loss on concurrent lead bursts; offline resilient state with SQLite/in-memory local persistence.
- **Zero External Secret Barrier**: Fully testable and demonstrable 100% locally with zero external API key requirements.
