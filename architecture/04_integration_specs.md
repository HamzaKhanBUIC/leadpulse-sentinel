# Integration Specifications & Webhook Harness

## 1. Webhook Adapter Ingestion Contracts

### A. Missed Call Webhook (CallRail / Twilio / Grasshopper format)
- **Method**: `POST /api/v1/leads/ingest`
- **Headers**: `Content-Type: application/json`
- **Payload Example**:
```json
{
  "source_system": "TWILIO_VOICE",
  "event_type": "call.missed",
  "caller": "+15558901234",
  "called_number": "+18005550199",
  "call_duration": 0,
  "ring_duration": 22,
  "caller_city": "Austin",
  "caller_state": "TX"
}
```

### B. Web Form Ingress (WordPress / Webflow / Squarespace / HTML Form)
- **Method**: `POST /api/v1/leads/ingest`
- **Payload Example**:
```json
{
  "source_system": "WEB_QUOTE_FORM",
  "name": "Maria Gonzales",
  "phone": "555-789-0123",
  "email": "maria@example.com",
  "service": "HVAC",
  "message": "AC stopped blowing cold air this afternoon. House is 85 degrees."
}
```

---

## 2. Mock CRM & Emitter Test Harness
To enable 100% autonomous testing with zero external API key requirements:
- An internal simulation emitter (`src/core/simulator/leadEmitter.ts`) provides realistic synthetic inbound events.
- Emitted events test burst conditions (10+ concurrent calls), clock drift, after-hours transitions, and corrupted payloads.
