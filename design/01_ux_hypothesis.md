# UX Hypothesis & Interaction Model: LeadPulse

## 1. The Core UX Hypothesis

> **Hypothesis**: In a fast-paced trade contractor office, every extra click, modal layer, or second of visual ambiguity causes lead leakage. If dispatchers and technicians are presented with a **high-density, radar-style triage queue** that visually encodes urgency via countdown decay clocks and allows **1-click resolution**, operator response latency will decrease from 45+ minutes to **under 30 seconds**.

---

## 2. Interaction Design Principles

### Principle 1: Glancibility Over Decorative Spacing
- Dispatchers are busy answering phones and talking to technicians. 
- The UI must display lead channel, customer name, issue summary, urgency rating, estimated job dollar value, and remaining SLA time in a single row without horizontal scrolling.

### Principle 2: Visual Urgency Encoding
- Visual signals are grounded in color psychology:
  - **Crimson / Pulsing Red**: Immediate danger of leakage ($< 25\%$ SLA or breached).
  - **Amber**: Degrading lead ($25\% - 75\%$ SLA).
  - **Emerald Green**: Freshly rescued or safe SLA ($> 75\%$).

### Principle 3: Zero-Friction Actionability
- 1-click actions directly in the queue (`Claim & Dial`, `Auto-Rescue Resend`, `Confirm Slot`).
- Detailed timeline inspection slides out in a non-disruptive side drawer rather than navigating away to a separate page.
