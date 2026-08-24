# LeadPulse Sentinel — Master Design System Specification (V3)

> **Architectural Standard**: Tactical Obsidian & High-Density Mission Control  
> **Inspiration**: Linear, Stripe Telemetry, Raycast Command Interface, Apple Industrial Design  
> **Design Rules**: Strict 4px/8px rhythm, content-first visual hierarchy, zero decorative clutter.

---

## 1. Design Principles & Anti-Slop Policy

1. **Content-First Hierarchy**: Every pixel, component, and spacing decision directly serves the dispatcher's split-second emergency decision making.
2. **Zero AI Slop**:
   - ❌ No arbitrary purple/violet gradient soup.
   - ❌ No decorative bento boxes without operational purpose.
   - ❌ No fake pulsing pills above headlines.
   - ❌ No over-nested rounded cards (cards inside cards inside cards).
   - ❌ No pure black backgrounds (`#000000`) or harsh unblended borders.
3. **Information Density with Breathing Room**: High tabular data density using monospace numerals paired with comfortable 16px/24px structural gutters.

---

## 2. Color System & Optical Layering

### Semantic Color Tokens

```css
:root {
  /* Surface Layers (Optical Depth without blur bloat) */
  --surface-base: #080C14;           /* Canvas background (Tactical Obsidian) */
  --surface-container: #0F172A;      /* Primary glass card surface */
  --surface-elevated: #111827;       /* Floating popovers, drawers, modals */
  --surface-highlight: #1E293B;      /* Active selection, row hover state */
  --surface-submerged: #06090F;      /* Inset inputs, dark telemetry wells */

  /* Translucent Luminous Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(255, 255, 255, 0.16);
  --border-glow: rgba(59, 130, 246, 0.35);

  /* Tactical Functional Accents */
  --accent-primary: #3B82F6;         /* Electric Blue — Sentinel primary */
  --accent-critical: #FF2D55;        /* Crimson Glow — L-Score >= 80 & SLA < 60s */
  --accent-warning: #F59E0B;         /* Amber/Topaz — High urgency / decaying SLA */
  --accent-success: #10B981;         /* Emerald — Rescued / Confirmed / 99.99% */
  --accent-telemetry: #06B6D4;       /* Cyan — Sub-second latency & speed */

  /* Text & Typography */
  --text-primary: #F8FAFC;          /* High-contrast crisp white */
  --text-secondary: #94A3B8;        /* Muted slate (4.8:1 contrast) */
  --text-tertiary: #64748B;         /* Subordinate captions & labels */
  --text-brand: #60A5FA;            /* Blue link / interactive text */
}
```

---

## 3. Typography System

| Style Token | Font Family | Size | Weight | Line Height | Letter Spacing | Use Case |
|---|---|---|---|---|---|---|
| `display-lg` | Plus Jakarta Sans | 32px | 800 Bold | 40px | `-0.03em` | Primary Hero Headlines |
| `heading-lg` | Plus Jakarta Sans | 22px | 700 Bold | 28px | `-0.02em` | Section Titles, Modal Headers |
| `heading-md` | Plus Jakarta Sans | 16px | 600 Semi | 24px | `-0.015em` | Card Headers, Customer Names |
| `body-md` | Plus Jakarta Sans | 13px | 400 Reg | 20px | `0em` | Inbound Inquiry Descriptions |
| `data-mono` | JetBrains Mono | 13px | 600 Semi | 18px | `+0.01em` | Dollar Values, Phone Numbers, SLAs |
| `label-caps` | JetBrains Mono | 10px | 700 Bold | 14px | `+0.08em` | Uppercase Category Badges, Channels |

---

## 4. Spacing Scale & Geometry

* **Unit Base**: 4px
* **Spacing Scale**:
  - `space-xs`: 4px
  - `space-sm`: 8px
  - `space-md`: 12px
  - `space-lg`: 16px
  - `space-xl`: 24px
  - `space-2xl`: 32px
  - `space-3xl`: 48px
* **Corner Radius**:
  - `radius-sm`: 4px (Checkboxes, micro tags)
  - `radius-md`: 8px (Action buttons, dropdown items)
  - `radius-lg`: 12px (Interactive cards, input boxes)
  - `radius-xl`: 16px (KPI containers, slide-over modals)
  - `radius-full`: 9999px (Pills, circular gauges)

---

## 5. Motion & Micro-Interactions

* **Tactile Press**: `active:scale-[0.98]` on buttons and clickable rows.
* **Transition Easing**: `180ms cubic-bezier(0.2, 0, 0, 1)`.
* **SLA Gauge Decay**: Smooth CSS `stroke-dashoffset` transition (`duration-1000 ease-linear`).
* **Slide-Over Drawer**: Spring slide from right (`translate-x-0` with `backdrop-blur-md`).
