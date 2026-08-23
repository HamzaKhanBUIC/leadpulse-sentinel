# Product Release Roadmap: LeadPulse

---

## Release Milestones

```mermaid
gantt
    title LeadPulse Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: MVP Core (Session 01)
    Research & Wedge Selection    :done, 2026-08-24, 1d
    PRD & UX Definition           :active, 2026-08-24, 1d
    Architecture & Schemas        :2026-08-24, 1d
    Stitch UI Generation          :2026-08-24, 1d
    Core Engine & Triage UI       :2026-08-24, 2d
    Testing, Red Team & Packaging :2026-08-24, 1d
    section Phase 2: CRM Connectors (Next Session)
    Native HubSpot / ServiceTitan API :2026-09-01, 7d
    Live Twilio Carrier Webhook Trunk :2026-09-08, 5d
    section Phase 3: AI Voice Receptionist
    Voice AI Inbound Call Handling    :2026-09-15, 14d
```

---

## MVP Scope (Session 01)
- Ingestion engine with multi-channel payload normalization.
- Real-time SLA countdown and urgency classifier ($L_{\text{score}}$).
- Instant auto-rescue messaging and interactive slot picker.
- Triage Matrix UI with live status transitions and lead detail drawer.
- Financial revenue impact calculator with real-time tally.
- Simulated lead injection test harness for live demo & adversarial QA.

## Future Horizons
- **Horizon 2**: Direct 2-way sync with ServiceTitan, Jobber, and Housecall Pro.
- **Horizon 3**: Autonomous conversational voice AI agent answering inbound phone calls in real-time.
