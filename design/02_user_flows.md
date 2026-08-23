# User Flows, State Machines & UI States: LeadPulse

## 1. End-to-End Inbound Triage & Rescue Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Ingestion as Ingestion Engine (/api/v1/leads)
    participant Sentinel as Urgency & Triage Sentinel
    participant AutoRescue as Auto-Rescue Dispatcher
    participant Dashboard as Operator Triage Matrix
    actor Dispatcher as Office Dispatcher

    Customer->>Ingestion: Missed Phone Call / Web Form / LSA Event
    Ingestion->>Sentinel: Ingest & Normalize (LeadRecord)
    Sentinel->>Sentinel: Calculate Urgency (L_score) & Job Value ($)
    Sentinel->>Dashboard: Push Live Event (Countdown Clock Starts)
    Sentinel->>AutoRescue: Trigger Instant Auto-Rescue (<2s)
    AutoRescue-->>Customer: Send Personalized SMS + Interactive Slot Link
    
    alt Customer Opens Link & Self-Schedules
        Customer->>Ingestion: Selects Arrival Slot (e.g. 2:00 PM Today)
        Ingestion->>Dashboard: Status -> APPOINTMENT_BOOKED ($ Rescued)
        Dashboard->>Dispatcher: Notification Sound & Emerald Status Badge
    else Dispatcher Claims & Calls Directly
        Dispatcher->>Dashboard: Clicks [Claim & Call]
        Dashboard->>Sentinel: Status -> DISPATCHER_ENGAGED (SLA Paused)
        Dispatcher->>Customer: Voice Callback / Resolves Inbound
        Dispatcher->>Dashboard: Marks as RESCUED or LOST
    else SLA Breached Without Response
        Sentinel->>Dashboard: SLA Breached! (Crimson Alert & Audio Pulse)
        Sentinel->>Dashboard: Moves to HIGH RISK LEAKAGE Queue
    end
```

---

## 2. The 5 Mandatory UI View States

| UI State | Visual Representation | User Actions Available |
|---|---|---|
| **1. Empty State** | Clean illustration, message: *"No active lead leakage. All phone lines & forms monitored 24/7."* | `[Simulate Inbound Test Lead]`, `[View Historical Rescues]` |
| **2. Loading / Ingesting State** | Subtle skeleton shimmer with optimistic row insertion. | Queue remains interactive. |
| **3. Normal / Active State** | Triage table with active countdown timers, channel icons (Phone/Form), urgency pills, and dollar estimates. | Filter by Channel/Urgency, Search by Name/Phone, Click row for details. |
| **4. High-Alert / Breach State** | Top sticky banner pulsing red with count of leads $< 60\text{s}$ from competitor loss. Audio alert chime. | `[Emergency Claim All]`, `[Auto-Dispatch Technician]` |
| **5. Error / Offline State** | Warning banner: *"Local storage fallback active. All leads safely queued."* | `[Retry Connection]`, `[Export CSV Backup]` |
