# Stitch Design Manifest & Generated Blueprint

> **Stitch Project ID**: `18079377964722412027`  
> **Title**: LeadPulse: Inbound Sentinel  
> **Origin**: Generated via `StitchMCP` (Model: `GEMINI_3_1_PRO`)  
> **Status**: Verified Design Foundation  

---

## 1. Generated Stitch Theme & Tokens

```yaml
name: "LeadPulse: Inbound Sentinel"
colors:
  canvas_background: "#0B0F19"
  surface_card: "#111827"
  surface_elevated: "#1F2937"
  border_subtle: "#1F2937"
  border_highlight: "#374151"
  primary_action: "#3B82F6"
  semantic_critical: "#EF4444"
  semantic_warning: "#F59E0B"
  semantic_rescued: "#10B981"
  semantic_telemetry: "#06B6D4"
  text_primary: "#F9FAFB"
  text_secondary: "#9CA3AF"
  text_muted: "#6B7280"

typography:
  ui_sans: "Inter, system-ui, sans-serif"
  data_mono: "JetBrains Mono, monospace"
  headline_md: "20px / 600 weight / 28px line-height"
  body_sm: "14px / 400 weight / 20px line-height"
  data_mono_sm: "14px / 500 weight / 16px line-height"
  label_caps: "12px / 700 weight / 16px line-height / 0.05em tracking"

layout:
  grid_unit: "4px"
  card_gap: "16px"
  table_row_height: "40px"
  audit_drawer_width: "400px"
  density: "High (15-20 rows visible above fold)"
```

---

## 2. Layout Structure & UI Composition

1. **Header & Telemetry Bar**
   - Brand logo + Live connection pulse (Emerald glowing dot)
   - Real-time simulation trigger buttons: `[+ Simulate Missed Call]`, `[+ Simulate Web Form]`, `[+ Emergency Burst]`
2. **KPI Metric Quad**
   - **Rescued Pipeline**: Large monospaced `$27,800` (Emerald accent)
   - **At-Risk Revenue**: Large monospaced `$7,200` (Amber accent)
   - **Recovery Rate**: `82.6%` (with trend pill)
   - **Median Speed to Rescue**: `4.8s` (Speed decay benchmark)
3. **Live Triage Radar Table**
   - Sticky header with sorting and search filter bar.
   - Rows featuring Channel icon, Customer & Trade, Issue Summary, Urgency pill, Job Value ($), and live countdown clock.
   - Hover-revealed action buttons (`Claim`, `Auto-Rescue`, `Inspect`).
4. **Slide-Over Incident Drawer**
   - Slips in from right (400px).
   - Vertical timeline of lead journey (Inbound event -> NLP Urgency Classifier -> Auto-SMS dispatch -> Customer opened link -> Slot confirmed).
   - Direct interactive booking slot reservation panel.
