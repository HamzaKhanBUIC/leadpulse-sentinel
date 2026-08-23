# User Stories & Gherkin Acceptance Criteria

---

## Epic 1: Inbound Lead Ingestion & Normalization

### Story 1.1: Missed Call Ingestion
**As an** HVAC contractor  
**I want** incoming missed calls from my phone provider/webhook to be captured instantly  
**So that** no caller is lost into a voicemail black hole.

- **Scenario 1: Successful Missed Call Capture**
  - **Given** the LeadPulse ingestion endpoint is active
  - **When** a webhook payload is received with `channel: "MISSED_CALL"`, `caller_phone: "+15550192834"`, and `duration_seconds: 18`
  - **Then** a new `LeadRecord` is created with status `NEW_UNTOUCHED`
  - **And** the lead appears on the Live Triage Matrix within $< 100\text{ms}$.

- **Scenario 2: Malformed Webhook Handling**
  - **Given** the ingestion endpoint is active
  - **When** a payload with missing phone number or corrupted JSON is received
  - **Then** the server responds with HTTP 400 Bad Request
  - **And** a structured error log is recorded without crashing the server.

---

## Epic 2: Autonomous Urgency Scoring & Financial Valuation

### Story 2.1: Emergency Leakage Detection
**As a** dispatcher  
**I want** high-urgency keywords (e.g. "burst pipe", "flooding", "no AC heatwave") to be automatically scored as `CRITICAL`  
**So that** high-ticket emergency leads are prioritized above routine quote requests.

- **Scenario 1: Critical Urgency Classification**
  - **Given** an inbound web form with message: *"Basement is flooding right now from burst water heater"*
  - **When** the lead passes through the Urgency Classifier
  - **Then** the lead urgency is set to `CRITICAL` ($L_{\text{score}} \ge 90$)
  - **And** the SLA countdown timer is initialized to 60 seconds
  - **And** estimated job value is calculated as $\ge \$1,800$.

- **Scenario 2: Low-Urgency General Quote**
  - **Given** an inquiry with message: *"Looking for a quote on annual AC filter maintenance next month"*
  - **When** the lead passes through the Urgency Classifier
  - **Then** urgency is set to `LOW` ($L_{\text{score}} \le 35$)
  - **And** the SLA countdown is set to 60 minutes.

---

## Epic 3: Instant Auto-Rescue Engine

### Story 3.1: Automated Rescue SMS Dispatch
**As a** business owner  
**I want** an instant SMS sent to every missed caller within 5 seconds  
**So that** the customer knows we are active and does not call a competitor.

- **Scenario 1: Auto-Rescue SMS Generation**
  - **Given** an unhandled missed call or web inquiry
  - **When** the lead enters the system
  - **Then** an Auto-Rescue message is generated with a unique interactive slot booking link
  - **And** the lead status transitions from `NEW_UNTOUCHED` to `RESCUE_SENT`
  - **And** an audit event `AUTO_RESCUE_DISPATCHED` is appended to the lead history.

---

## Epic 4: Mission Control Triage Matrix & Actions

### Story 4.1: Real-Time SLA Decay Visualization
**As a** dispatcher  
**I want** to see live countdown timers for all active leads  
**So that** I know exactly which customer will leak if not handled immediately.

- **Scenario 1: Countdown Clock Progression**
  - **Given** a lead in `RESCUE_SENT` status with a 180-second SLA
  - **When** time elapses
  - **Then** the remaining seconds decrement in real-time on the UI
  - **And** the badge color transitions from Green to Amber ($< 50\%$ remaining) and Red/Pulsing ($< 25\%$ remaining).

- **Scenario 2: 1-Click Lead Reassignment & Resolution**
  - **Given** an active lead in the triage queue
  - **When** the dispatcher clicks `Claim & Call` or `Mark Rescued`
  - **Then** the lead status updates to `RESCUED`
  - **And** the countdown stops
  - **And** the lead's estimated value is credited to "Total Pipeline Rescued".

---

## Epic 5: Financial Revenue Rescued Ledger

### Story 5.1: Revenue Impact Analytics
**As a** contractor owner  
**I want** to see the total dollar value of rescued leads versus leaked leads  
**So that** I have unambiguous proof of ROI.

- **Scenario 1: Financial KPI Calculation**
  - **Given** 10 total leads processed (4 Rescued totaling \$14,500, 2 Lost totaling \$3,200, 4 Active totaling \$8,000)
  - **When** the dashboard renders
  - **Then** "Rescued Revenue" displays \$14,500
  - **And** "Revenue at Risk" displays \$8,000
  - **And** "Recovery Rate" displays $66.7\%$ (4 rescued / 6 resolved).
