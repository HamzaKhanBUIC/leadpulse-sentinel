# Design & UI/UX Pipeline

## Purpose
This directory houses all UX research, user journey hypotheses, Stitch screen generations, design system tokens, and visual specifications.

---

## The Mandatory 10-Step Design Pipeline

```
Research
   ↓
UX hypothesis
   ↓
Design Agent
   ↓
Stitch
   ↓
Design reference / screens
   ↓
Frontend implementation
   ↓
Browser
   ↓
Visual QA
   ↓
Critique
   ↓
Revision
```

---

## Directory Structure
- `01_ux_hypothesis.md`: Operator mental models, cognitive friction analysis, and state transitions.
- `02_user_flows.md`: Complete sequence diagrams and happy/unhappy path flows.
- `03_design_system.md`: Typography, color palette, spacing grid, component primitives, and contrast ratios.
- `stitch/`: Stitch project manifests, generated screen structures, and prompt iterations.
- `assets/`: Exported blueprints, screenshots, and visual reference diagrams.

---

## Tooling Integration
- **StitchMCP**: `create_project`, `generate_screen_from_text`, `generate_variants`, `get_screen`.
- **chrome-devtools-mcp**: `new_page`, `navigate_page`, `list_console_messages`, `take_screenshot`, `resize_page`.
