---
name: Clinical Prestige
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fe'
  on-surface: '#131b2f'
  on-surface-variant: '#444654'
  inverse-surface: '#283045'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2c51d7'
  primary: '#00258b'
  on-primary: '#ffffff'
  primary-container: '#0037c1'
  on-primary-container: '#a4b4ff'
  inverse-primary: '#b8c3ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe8f1a'
  on-secondary-container: '#633300'
  tertiary: '#113b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b5400'
  on-tertiary-container: '#5ed029'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001355'
  on-primary-fixed-variant: '#0035bc'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#88fd54'
  tertiary-fixed-dim: '#6de039'
  on-tertiary-fixed: '#062100'
  on-tertiary-fixed-variant: '#1a5200'
  background: '#faf8ff'
  on-background: '#131b2f'
  surface-variant: '#dae2fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an authoritative, reliable, and deeply empathetic digital presence tailored for high-tier healthcare ecosystems. It bridges clinical clinical precision with warm, accessible modern utility.

### Target Audience & Persona
- **Patients & Families:** Requiring immediate clarity, calm reassurance, and frictionless accessibility during moments of physical and emotional vulnerability.
- **Healthcare Providers:** Clinicians, specialists, and care teams demanding dense, legible data displays, rapid navigation, and uncompromised hierarchy to support critical decision-making.

### Aesthetic Paradigm
- **Modern Clinical Minimalist:** Rooted in structured clarity, deliberate whitespace, and calibrated color anchors. 
- **High-Trust Visual Language:** Pure cobalt foundations evoke medical authority, tempered by warm amber highlights for urgency and lively green for therapeutic reassurance.
- **Tactile Soft Precision:** Crisp boundaries, subtle translucent depth, and softly rounded corners prevent clinical interfaces from feeling sterile or intimidating.

## Colors

The palette is engineered around high-contrast medical usability and systematic hierarchy. 

### Foundation Palette
- **Primary (`#0037c1` - Cobalt / Sapphire Medical Blue):** Primary navigation, key interactive triggers, dominant headers, and brand anchors.
  - `--blue-50`: `#f0fbff` (Subtle selection washes, active item backgrounds)
  - `--blue-100`: `#eaeffa` (Muted badges, container fills)
  - `--blue-200`: `#acc0f3` (Light active outlines)
  - `--blue-300`: `#769dea` (Border accents, secondary icons)
  - `--blue-400`: `#306de4` (Hover states for primary elements)
  - `--blue-500`: `#1250dc` (Primary actions, key focus rings)
  - `--blue-600`: `#0037c1` (Base brand blue token)
  - `--blue-700`: `#002c9a` (Active & pressed interactions)
  - `--blue-800`: `#002174` (Deep brand accents)
  - `--blue-900`: `#00164d` (High-contrast surface elements)
- **Secondary (`#fa8c16` - Vibrant Amber):** Timely calls-to-action, triage priority markers, notifications, and pending statuses.
- **Tertiary (`#52c41a` - Fresh Clinical Green):** Affirmations, health confirmations, active schedule indicators, and successful outcomes.
- **Neutral (`#20283d` - Deep Navy Slate):** Anchors high-readability text and primary outlines, preventing harsh black contrasts.
  - `--gray-100`: `#f6f7f9` (Canvas and background base)
  - `--gray-200`: `#e4e8ed` (Card borders, dividers)
  - `--gray-300`: `#d9dfe5` (Muted borders, inactive outlines)
  - `--gray-700`: `#4a4f63` (Tertiary body and secondary labels)
  - `--gray-800`: `#2f364a` (Subheadings, primary body text)
  - `--gray-900`: `#20283d` (Display titles, high-emphasis text)

### Diagnostic Gradients
- `--gradient-blue-1`: `linear-gradient(315deg, #1250dc 0%, #306de4 100%)` (Hero banners, primary CTA blocks)
- `--gradient-blue-2`: `linear-gradient(315deg, #306de4 0%, #769dea 100%)` (Feature callouts, metric displays)

### Functional Feedback States
- **Success:** `#52c41a` (Border/Icon), `#039855` (Accessible text contrast)
- **Warning:** `#fa8c16` (Border/Icon), `#f79009` (Accessible text contrast)
- **Error:** `#f04438` (Border/Icon), `#d92d20` (Accessible text contrast)

## Typography

Inter serves as the single universal typeface across all functional surfaces, chosen for its neutral precision, tall x-height, and superior distinction of critical numeric and clinical data.

### Typographic Principles
- **Numerical Distinction:** Tabular figures (`font-variant-numeric: tabular-nums`) must be activated for vitals, appointment timestamps, and medical dosage metrics.
- **Micro-Scale Legibility:** Compact labels (`label-sm`, `body-sm`) employ slight letter-spacing adjustments to preserve legibility on low-resolution clinical displays and mobile screens.
- **Hierarchy Mapping:**
  - `display-lg` / `headline-lg`: Reserved for medical landing pages, dashboard summaries, and high-level health milestones.
  - `headline-md` / `headline-sm`: Diagnostic card groups, patient chart sections, and modal dialog titles.
  - `body-lg` / `body-md`: Patient notes, diagnostic results, and consultation records.
  - `label-*`: Button controls, badges, data tags, and table metadata.

## Layout & Spacing

A structured 8-point baseline grid provides rhythmic consistency across dense medical interfaces and patient consumer flows alike.

### Grid & Breakpoints
- **Desktop (1200px+):** 12-column layout, `margin: 2rem`, `gutter: 1.5rem`. Maximum content container constrained to `1280px` for optimal body line length.
- **Tablet (768px - 1199px):** 8-column layout, `margin: 1.5rem`, `gutter: 1rem`. Sidebars collapse to responsive overlay drawers.
- **Mobile (< 768px):** 4-column layout, `margin-sm: 1rem`, `gutter-sm: 1rem`. Card arrays stack vertically into single-column flows.

### Spacing Application
- `space-xs` (4px): Micro gaps between icons and associated labels, internal tag padding.
- `space-sm` (8px): Gaps between list items, tight form field pairings.
- `space-md` (16px): Internal padding for cards, standard component margins, button spacing.
- `space-lg` (24px): Structural padding for modal containers, vertical spacing between card groups.
- `space-xl` (40px): Section breaks, clinical dashboard module boundaries.

## Elevation & Depth

Visual hierarchy uses deeply diffused, layered shadows with subtle cool-tinted ambiance rather than stark black drops.

### Shadow Structure
- **Level 0 (Flat):** Surface flush with canvas (`--gray-100`). Border: `1px solid var(--gray-200)`. Used for inactive panels and inset clinical charts.
- **Level 1 (Subtle / `--shadow-sm`):** `box-shadow: 0 1px 3px rgba(32, 40, 61, 0.05), 0 1px 2px rgba(32, 40, 61, 0.03)`. Used for base cards, appointment list items, and standard form controls.
- **Level 2 (Elevated / `--shadow-md`):** `box-shadow: 0 4px 8px -2px rgba(32, 40, 61, 0.06), 0 2px 4px -2px rgba(32, 40, 61, 0.04)`. Used for interactive hover states, active patient summary tiles, and dropdown menus.
- **Level 3 (Floating / `--shadow-lg`):** `box-shadow: 0 12px 24px -4px rgba(0, 55, 193, 0.08), 0 4px 8px -2px rgba(32, 40, 61, 0.04)`. Blue-tinted depth applied to popovers, modals, and emergency triage overlays.

### Surface Treatment
Surfaces utilize pure white (`#ffffff`) atop canvas gray (`--gray-100`), framed by hairline borders (`--gray-200`) to guarantee contrast under glare and varied lighting conditions.

## Shapes

The interface embraces a balanced curvature model (`0.5rem` / `8px` default radius) that balances approachable human care with clinical order.

### Radius Scale
- **Small (`0.25rem` / 4px):** Form input check-boxes, micro badges, and inline status dots.
- **Base (`0.5rem` / 8px):** Standard buttons, text fields, notification toasts, and standard cards.
- **Large (`1rem` / 16px):** Featured clinic cards, patient diagnostic modules, and dialog modals.
- **Extra Large (`1.5rem` / 24px):** Bottom action sheets on mobile and prominent hero promo cards.
- **Full / Pill (`9999px`):** Triage tags, status pills, category chips, and floating action triggers.

## Components

### Buttons
- **Primary:** Background `--blue-600` (or `--gradient-blue-1`), label `#ffffff`, border none, radius `0.5rem`. Hover: `--blue-500` with `--shadow-md`. Active: `--blue-700`.
- **Secondary / Subtle:** Background `--blue-50`, label `--blue-600`, border `1px solid var(--blue-200)`. Hover: `--blue-100`.
- **Destructive:** Background `#f04438`, label `#ffffff`. Hover: `#d92d20`.
- **Amber Action:** Background `--secondary` (`#fa8c16`), label `#ffffff`. For instant booking and urgent triage workflows.

### Chips & Badges
- **Status Badges:** Height `24px`, padding `0 8px`, border radius `9999px`, typography `label-sm`.
  - Confirmed/Normal: Background `#f6ffed`, border `1px solid #b7eb8f`, text `#039855`.
  - Pending/Attention: Background `#fff7e6`, border `1px solid #ffd591`, text `#fa8c16`.
  - Urgent/Critical: Background `#fff1f0`, border `1px solid #ffa39e`, text `#d92d20`.
- **Filter Chips:** Height `32px`, radius `9999px`, background `#ffffff`, border `1px solid var(--gray-300)`. Active: Background `--blue-50`, border `--blue-600`, text `--blue-600`.

### Form Inputs
- **Text Fields:** Height `44px`, radius `0.5rem`, background `#ffffff`, border `1px solid var(--gray-300)`, padding `0 12px`, typography `body-md`. Focus: Border `2px solid var(--blue-500)`, box-shadow `0 0 0 3px rgba(18, 80, 220, 0.15)`.
- **Checkboxes & Radios:** Size `18px`, radius `4px` (checkbox) or `50%` (radio), border `1.5px solid var(--gray-300)`. Checked: Background `--blue-600`, border `--blue-600` with white glyph.

### Cards
- **Base Patient/Doctor Card:** Background `#ffffff`, border `1px solid var(--gray-200)`, radius `1rem`, padding `1.5rem`, shadow `--shadow-sm`. Transitions smoothly to `--shadow-md` on pointer interaction.
- **Vital Metric Card:** Top indicator accent bar (3px height) color-coded by metric status (Cobalt Blue for blood pressure, Green for heart rate, Amber for temperature alerts).

### Lists & Tables
- **Clinical Data Rows:** Alternating row highlight with transparent hover using `--blue-50`. Border bottom `1px solid var(--gray-200)`. Padding `12px 16px` for high-density scanability.