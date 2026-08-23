# API Contracts & REST Endpoint Specifications

All endpoints use JSON payloads and follow RESTful HTTP status code semantics.

---

## 1. Ingestion Endpoint: `POST /api/v1/leads/ingest`
Ingests an incoming phone call, web form, or external webhook.

- **Request Body**:
```json
{
  "channel": "MISSED_CALL",
  "trade": "PLUMBING",
  "customer_name": "John Miller",
  "customer_phone": "+15552345678",
  "customer_email": "john@example.com",
  "customer_address": "452 Maple Ave, Dallas TX",
  "raw_inquiry_text": "Water heater leaking all over basement, need someone fast"
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "lead": {
    "id": "lead_9f8b2c1a",
    "status": "AUTO_RESCUE_SENT",
    "urgency_tier": "CRITICAL",
    "l_score": 95,
    "sla_seconds_total": 60,
    "sla_expires_at": "2026-08-24T03:01:00Z",
    "estimated_job_value_usd": 1850,
    "rescue_payload": {
      "message_body": "Hi John, we noticed we just missed your call about your water heater leak. Tap here to grab an emergency arrival window: http://localhost:5173/book/lead_9f8b2c1a"
    }
  }
}
```

---

## 2. Queue & Triage Query: `GET /api/v1/leads`
Lists leads with optional filters.

- **Query Parameters**:
  - `status` (optional): `ACTIVE` | `RESCUED` | `LOST` | `ALL`
  - `urgency` (optional): `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
  - `trade` (optional): `HVAC` | `PLUMBING` | `ELECTRICAL`
- **Response (200 OK)**:
```json
{
  "leads": [ ...LeadRecord[] ],
  "total_count": 14,
  "server_timestamp": "2026-08-24T03:00:15Z"
}
```

---

## 3. Triage Action Endpoint: `POST /api/v1/leads/:id/action`
Executes operator actions on a lead.

- **Request Body**:
```json
{
  "action": "CLAIM_AND_ENGAGE" | "MARK_RESCUED" | "MARK_LOST" | "MANUAL_REASSIGN" | "TRIGGER_AUTO_RESCUE",
  "dispatcher_name": "Sarah",
  "notes": "Spoke to customer, dispatching tech Mike for 2 PM"
}
```
- **Response (200 OK)**: Returns updated `LeadRecord`.

---

## 4. Self-Service Booking Endpoint: `POST /api/v1/leads/:id/book`
Executed when customer selects an appointment slot.

- **Request Body**:
```json
{
  "slot_id": "slot_today_1400",
  "start_time": "2026-08-24T14:00:00Z",
  "end_time": "2026-08-24T16:00:00Z",
  "customer_notes": "Gate code is 1234"
}
```
- **Response (200 OK)**: Transitions lead to `APPOINTMENT_BOOKED` and adds revenue to `pipeline_value_rescued_usd`.

---

## 5. Metrics & Ledger Endpoint: `GET /api/v1/metrics`
Returns real-time financial telemetry.

- **Response (200 OK)**:
```json
{
  "total_inbound_leads": 28,
  "active_leads_count": 5,
  "rescued_leads_count": 19,
  "lost_leads_count": 4,
  "leakage_rate_pct": 14.3,
  "recovery_rate_pct": 82.6,
  "pipeline_value_total_usd": 38400,
  "pipeline_value_at_risk_usd": 7200,
  "pipeline_value_rescued_usd": 27800,
  "pipeline_value_lost_usd": 3400,
  "median_speed_to_rescue_seconds": 4.8
}
```

---

## 6. Simulation Ingestion Endpoint: `POST /api/v1/simulate/burst`
Generates simulated realistic lead traffic for demonstrations and stress tests.

- **Request Body**: `{ "count": 5, "mix": "REALISTIC" | "HIGH_EMERGENCY" | "AFTER_HOURS" }`
