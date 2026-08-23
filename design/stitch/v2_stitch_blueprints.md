# Stitch V2 Design System & Screen Blueprints

> **Project ID**: `projects/9489315954907035620`  
> **Design System**: `LeadPulse Command`  
> **Aesthetic Philosophy**: Linear/Stripe Tactical Minimalism & High-Contrast Mission Control  
> **Generated Screens**: 4 High-Fidelity Screens (Desktop & Mobile)  

---

## 1. Master Design System Tokens

### Colors
- **Canvas Base (`surface-base`)**: `#080C14`
- **Card Surface (`surface-container`)**: `#0F172A` with 1px `rgba(255, 255, 255, 0.08)` border & subtle luminous top highlight
- **Elevated Modals / Drawers**: `#111827` with 1px `rgba(255, 255, 255, 0.14)` border and `0 20px 50px rgba(0, 0, 0, 0.7)` backdrop shadow
- **Primary Brand / Action**: `#3B82F6` (Electric Blue) with hover illumination `#60A5FA`
- **Critical Emergency Alert**: `#FF2D55` (Deep Crimson) with active outer pulse glow (`0 0 15px rgba(255, 45, 85, 0.25)`)
- **High Urgency Warning**: `#FFB000` (Amber / Topaz)
- **Verified / Rescued / Standby**: `#10B981` (Emerald)

### Typography
- **Display & UI Chrome**: `Plus Jakarta Sans`, sans-serif (`-0.025em` tracking on headings)
- **Telemetry & Numbers**: `JetBrains Mono`, monospace (`font-variant-numeric: tabular-nums`)

### Micro-Interactions & Motion
- **Snappy Transitions**: `cubic-bezier(0.16, 1, 0.3, 1)` (150ms–200ms)
- **Active Click**: `scale(0.98)` tactile depression
- **Card Hover**: Subtle border illumination to `rgba(255, 255, 255, 0.2)`

---

## 2. Generated Screens Catalog

1. **Screen 1**: `projects/9489315954907035620/screens/7c8bd8a9bd2d4500ae58435123743ef7`
   - *Title*: Mission Control Dashboard (Desktop)
   - *Features*: Live Ingestion Telemetry, KPI Quad with SVG Sparkline Trends, Channel Filter Rail, Live Triage Radar with Circular SVG SLA Decay Clocks, and Action Toolbar.
2. **Screen 2**: `projects/9489315954907035620/screens/73b5f396434444a19b5bfb72a6bcae88`
   - *Title*: Lead Detail Inspector & Live SMS Auto-Rescue Stream (Desktop)
   - *Features*: Slide-over glass drawer, customer profile, SLA countdown ring, simulated 2-way SMS chat stream with message bubbles, immutable audit trail, and 1-click tech assignment.
3. **Screen 3**: `projects/9489315954907035620/screens/672e817cf7b34b6999bfe00c8b668087`
   - *Title*: Homeowner Mobile Emergency Arrival Window Reservation (Mobile)
   - *Features*: Clean high-trust contractor branding, emergency arrival window selection cards, property gate notes, and instant arrival confirmation pass.
4. **Screen 4**: `projects/9489315954907035620/screens/0a86d2629b3e40e0ab7775baee67bf85`
   - *Title*: Ingress Chaos Simulator & Telemetry Bench (Desktop)
   - *Features*: Emergency preset trigger cards, burst concurrency slider, custom JSON payload editor, and database purge controls.
