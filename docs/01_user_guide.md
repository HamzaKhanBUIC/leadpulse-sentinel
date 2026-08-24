# LeadPulse User & Operator Guide

## 1. Overview
LeadPulse is an **Autonomous Inbound Sentinel & Instant Recovery Engine** designed specifically for HVAC, plumbing, electrical, and roofing contractors. It monitors all incoming missed calls, web forms, and after-hours inquiries, autonomously triages their urgency, and instantly sends interactive auto-rescue text messages to prospective customers before they call a competitor.

---

## 2. Dispatcher Workflow & UI Walkthrough

### 1. The KPI Quad (Top of Dashboard)
- **Pipeline Rescued**: Dollar value of all leads that were successfully saved and scheduled.
- **Active at Risk**: Current dollar volume of leads whose SLA countdown is actively decaying.
- **Recovery Rate (%)**: Percentage of inbound inquiries rescued from competitor loss.
- **Speed to Rescue**: Real-time response speed (target: $< 60\text{ seconds}$).

### 2. The Live Triage Radar Table
- **Urgency Indicator**: Color-coded score ($0–100$) identifying emergency situations (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **SLA Countdown Timer**: Real-time clock showing seconds remaining before the prospect is likely to call a competitor.
- **Quick Action Buttons**:
  - `✓ Rescue`: Mark the lead as successfully rescued and update the financial ledger.
  - `✗ Lost`: Mark the lead as lost if the customer hired another contractor.
  - `Inspect`: Open the full chronological event drawer.

### 3. Customer Self-Service Booking Portal
- When a customer misses a call, LeadPulse sends an SMS: *"Hi [Name], we noticed we just missed your call. Tap here to hold an immediate arrival window..."*
- Tapping the link opens the self-service portal where the homeowner can reserve an emergency arrival slot without waiting on phone tag.
