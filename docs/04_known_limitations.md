# Known Limitations & Boundary Constraints

## 1. Current System Boundaries (MVP Session 01)

1. **In-Memory Event Ledger**:
   - The current event store operates in-memory with session persistence. For multi-node distributed enterprise clusters, a PostgreSQL / Redis adapter will be added in Phase 2.
2. **Telephony Carrier Gateways**:
   - The auto-rescue dispatcher generates standardized SMS payloads and logs them to the audit trail. For live SMS carrier delivery, a Twilio / Telnyx API token is mapped to the webhook emitter.
3. **Field Service Software (FSM) 2-Way Sync**:
   - In MVP Session 01, lead status changes are managed directly within the LeadPulse Triage Matrix. Direct real-time bidirectional calendar sync with ServiceTitan, Jobber, and Housecall Pro is scheduled for Phase 2.
4. **Natural Language Speech Recognition (Voice AI)**:
   - Voice calls are currently captured via missed-call webhook and followed up with interactive SMS/Chat. Live speech conversational voice AI answering will be introduced in Phase 3.
