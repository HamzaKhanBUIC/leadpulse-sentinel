# Design System & Token Architecture: LeadPulse

## 1. Aesthetic Rationale & Theme
LeadPulse uses a **tactical, high-contrast dark theme** engineered for mission-critical dispatch operations. The dark slate background (`#0B0F19`) reduces eye strain during long shifts, while luminous status accents (Emerald, Crimson, Amber, Cyan) provide immediate peripheral awareness of SLA decay.

---

## 2. Color Palette & Token Definitions

```css
:root {
  /* Surface & Background */
  --bg-canvas: #0B0F19;         /* Deep space canvas */
  --bg-surface: #111827;        /* Card & table background */
  --bg-surface-elevated: #1F2937; /* Hover / Modal background */
  --border-subtle: #374151;     /* Border stroke */
  --border-highlight: #4B5563;  /* Active border */

  /* Semantic Status & Urgency Tokens */
  --color-critical: #EF4444;    /* Crimson: Breached / <60s SLA */
  --color-critical-bg: rgba(239, 68, 68, 0.15);
  --color-warning: #F59E0B;     /* Amber: Degrading SLA */
  --color-warning-bg: rgba(245, 158, 11, 0.15);
  --color-rescued: #10B981;     /* Emerald: Rescued / Booked */
  --color-rescued-bg: rgba(16, 185, 129, 0.15);
  --color-info: #06B6D4;        /* Cyan: Active telemetry */
  --color-info-bg: rgba(6, 182, 212, 0.15);

  /* Typography Colors */
  --text-primary: #F9FAFB;      /* Crisp white header */
  --text-secondary: #9CA3AF;    /* Slate secondary text */
  --text-muted: #6B7280;        /* Muted timestamps */

  /* Spacing Grid (4px / 8px Rhythm) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography Scale */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

---

## 3. Component Hierarchy & Atomic Primitives

1. **Urgency Pill**: High-visibility pill badge with glowing dot indicator for `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
2. **Countdown Decay Badge**: Monospaced countdown timer with dynamic color shifting (Green -> Amber -> Pulsing Red).
3. **Financial Metric Card**: Metric widget displaying currency value, percentage change, and sparkline indicator.
4. **Interactive Triage Row**: Hover-reactive table row with instant 1-click action triggers (`Claim`, `Rescue`, `Resolve`).
5. **Slide-Over Detail Drawer**: Right-anchored sliding inspector displaying full audit timeline and customer metadata.
