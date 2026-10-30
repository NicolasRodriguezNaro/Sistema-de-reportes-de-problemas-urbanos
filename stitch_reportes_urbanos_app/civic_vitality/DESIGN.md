---
name: Civic Vitality
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#41484b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#71787c'
  outline-variant: '#c1c7cb'
  surface-tint: '#3f6372'
  primary: '#00222d'
  on-primary: '#ffffff'
  primary-container: '#0f3846'
  on-primary-container: '#7ca1b2'
  inverse-primary: '#a6ccde'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#76f4e0'
  on-secondary-container: '#006f63'
  tertiary: '#2f1a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b2d00'
  on-tertiary-container: '#da8a00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2e8fa'
  primary-fixed-dim: '#a6ccde'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#264b5a'
  secondary-fixed: '#79f7e3'
  secondary-fixed-dim: '#59dbc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffddb9'
  tertiary-fixed-dim: '#ffb961'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for civic engagement and urban incident reporting. It conveys institutional trust without bureaucratic coldness, balancing governmental reliability with the warmth, speed, and approachability of a top-tier consumer product.

### Personality & Tone
- **Authoritative yet Approachable:** Uses deep maritime tones grounded in public service, balanced with vibrant, humane accent hues.
- **Empowering & Action-Oriented:** Reduces cognitive friction for stressed citizens reporting issues under direct sun or on moving public transit.
- **Transparent & Accountable:** Every interaction highlights progress, updates, and community impact through structured visual telemetry.

### Design Movement
The style blends **Modern Scandinavian Civic Minimalism** with **Tactile Functionalism**:
- High-clarity white card architecture resting on soft, cool-slate structural canvases.
- Restrained 1px border definitions paired with gentle, natural ambient drop shadows to communicate physical layer separation.
- Soft organic corners (`rounded-2xl`) that feel friendly and tactile under thumb interaction.
- Strict WCAG AAA compliance for critical information pathways and public notices.

## Colors

The palette organizes municipal information into clear functional hierarchies:

### Primary & Brand Identity
- **Primary (`#0F3846` - Deep Petroleum Teal):** Anchors core actions, navigation headers, primary buttons, and key structural iconography. Conveys civic responsibility, permanence, and calm authority.
- **Secondary (`#00A896` - Civic Mint / Teal):** Serves as positive feedback, confirmed state indicators, resolution badges, active filters, and primary callout markers.
- **Tertiary (`#F39C12` - Amber Horizon):** Reserved for in-progress states, pending administrative review, and moderate-priority flags.
- **Urgent / Danger (`#E63946` - Coral Alert):** Designated for immediate hazards, critical priority flags, blocked roads, and validation errors.

### Background & Surface Hierarchy
- **Canvas Base (`#F8FAFC`):** Soft, desaturated cool slate that prevents glare while sustaining contrast against white elevated containers.
- **Surface Elevation 01 (`#FFFFFF`):** High-purity white used for cards, bottom navigation sheets, interactive input containers, and floating modal panels.
- **Subtle Stroke (`#E2E8F0`):** Defines physical card perimeters, input field outlines, and divider rules.

### Typography Contrast
- **Text Headings / Emphasized (`#0F172A`):** Maximum contrast slate black for instant outdoor scanning.
- **Text Body / Standard (`#334155`):** Neutral dark slate for comfortable multi-line reading.
- **Text Subdued / Hints (`#64748B`):** Supporting metadata, timestamps, and secondary captions.

## Typography

The design system exclusively implements **Plus Jakarta Sans** across all typographic touchpoints. Its balanced proportions, wide apertures, and clean geometric curves offer exceptional legibility at rapid mobile glance rates, even when rendered on smaller, lower-resolution screens.

### Hierarchy Guidelines
- **Headlines:** Use tight letter spacing (`-0.01em` to `-0.02em`) with bold or extra-bold weights to anchor section beginnings without visual clutter.
- **Body:** Standard text defaults to `body-md` (14px) for list cards and descriptions, with `body-lg` (16px) reserved for long-form community reports or detailed public notices.
- **Labels & Badges:** Use `label-sm` and `label-md` with semi-bold to bold weight and slight positive tracking (`0.02em` to `0.04em`) to maintain sharp character distinction on colored pill tags.

## Layout & Spacing

A mobile-first fluid layout grid coordinates all views. Spacing is strictly based on a **4px/8px incremental cadence** to ensure predictable touch targets and vertical rhythm.

### Grid & Breakpoints
- **Mobile Handheld (320px – 599px):** 4-column fluid layout with `1rem` outer safe-area margins and `0.75rem` internal card gutters. Minimum touch target is standard at 48x48px.
- **Tablet / Expanded Mobile (600px – 1023px):** 8-column layout with `1.5rem` margins and `1rem` gutters. Report cards and map splits adapt to side-by-side split view.
- **Desktop Dashboard / Dispatcher View (1024px+):** 12-column layout capped at a maximum content width of 1280px with centered fluid distribution.

### Spacing Usage
- `space-xs (4px)`: Micro-offsets between badge icons and text; input field inner helper margins.
- `space-sm (8px)`: Gaps between chip filters, metadata badges, and form label/input stacks.
- `space-md (16px)`: Inner padding for small cards, list item gutters, and default button horizontal insets.
- `space-lg (24px)`: Primary container interior padding, bottom drawer sheet padding, and form step intervals.
- `space-xl (32px)`: Section-to-section separation and full-page header offsets.

## Elevation & Depth

Depth in this system is defined by soft, multi-layered ambient light, pairing physical cleanliness with touchable softness. Hard, harsh shadows are prohibited.

### Elevation Levels

- **Flat (Level 0):** Pure canvas tone (`#F8FAFC`). Used for general background surfaces, table headers, and sunken inputs.
- **Card Base (Level 1):** White surface (`#FFFFFF`) with a delicate 1px boundary of `#E2E8F0` and subtle diffuse shadow:
  `box-shadow: 0 1px 3px 0 rgba(15, 56, 70, 0.04), 0 1px 2px -1px rgba(15, 56, 70, 0.03);`
- **Elevated Interactive (Level 2):** Applied to active cards, dropdown popovers, and bottom sheet containers:
  `box-shadow: 0 4px 6px -1px rgba(15, 56, 70, 0.06), 0 2px 4px -2px rgba(15, 56, 70, 0.04);`
- **Floating Overlays (Level 3):** Floating Action Buttons (FAB), map markers, alert dialogs, and citizen submission drawers:
  `box-shadow: 0 10px 15px -3px rgba(15, 56, 70, 0.08), 0 4px 6px -4px rgba(15, 56, 70, 0.04);`

All shadows carry a faint tint of `#0F3846` (Deep Petroleum Teal) rather than cold black, reinforcing the civic color foundation.

## Shapes

The design system incorporates a distinct, friendly curvature that softens official public data without sacrificing architectural discipline.

### Geometry Specifications
- **Standard UI Elements (`rounded` / 0.5rem / 8px):** Checkboxes, form text inputs, small badges, and micro-toggles.
- **Action Elements & Secondary Cards (`rounded-lg` / 1rem / 16px):** Primary buttons, filter chips, secondary card modules, and map preview windows.
- **Prominent Cards & Drawers (`rounded-xl` to `rounded-2xl` / 1.5rem to 2rem / 24px):** Feed cards, citizen report cards, bottom modal sheets, camera attachment previews, and primary floating panels.
- **Pill Shape (`rounded-full` / 9999px):** Status badges (Pendiente, Solucionado), priority chips, counter indicators, and quick-call FABs.

## Components

### Buttons
- **Primary CTA:** Background `#0F3846`, text `#FFFFFF`, height 52px, radius 16px, padding `0 24px`. On tap/active, scale smoothly to `0.98` with background `#0A2630`.
- **Secondary / Civic Action:** Background `#00A896`, text `#FFFFFF`, height 52px. Used for direct submission actions ("Enviar Reporte", "Confirmar Ubicación").
- **Ghost / Tertiary:** Transparent background, text `#0F3846`, border 1.5px solid `#E2E8F0`. Focus ring in `#00A896` with 2px offset.

### Badges & Status Chips
Badges use 10% opacity tinted backgrounds paired with deep saturated text for WCAG compliance:
- **Resuelto / Solucionado:** Background `#00A8961A`, text `#007A6C`, dot indicator `#00A896`.
- **En Revisión / En Proceso:** Background `#F39C121A`, text `#B77105`, dot indicator `#F39C12`.
- **Pendiente / Reportado:** Background `#64748B1A`, text `#334155`, dot indicator `#64748B`.
- **Prioridad Alta / Urgente:** Background `#E639461A`, text `#BD1C2A`, label accompanied by warning glyph.
- **Prioridad Media:** Background `#F39C121A`, text `#B77105`.
- **Prioridad Baja:** Background `#0F384614`, text `#0F3846`.

### Cards (Incident Report Cards)
- Background `#FFFFFF`, border 1px solid `#E2E8F0`, corner radius 20px (`rounded-2xl`).
- Padding 16px. Internal layout:
  1. Top metadata line with timestamp and Category Pill on the left, Status Badge on the right.
  2. Headline in `headline-sm` (`#0F172A`).
  3. Single-line location summary with map-pin glyph in `#64748B`.
  4. Optional 3:2 aspect-ratio photographic preview with radius 12px.
  5. Bottom action strip displaying upvote counter, comment indicator, and priority tag.

### Input Fields & Tactile Forms
- Form inputs feature generous 52px height for comfortable touch-target accuracy.
- Resting state: Background `#FFFFFF`, border 1.5px solid `#E2E8F0`, corner radius 14px, text `#0F172A`.
- Active/Focused: Border 2px solid `#0F3846`, with a 4px soft outer glow tinted in `#0F384615`.
- Error state: Border 2px solid `#E63946`, helper text below in coral red.
- Media upload container: Dashed border 2px solid `#CBD5E1`, background `#F8FAFC`, icon in `#0F3846`.

### Checkboxes & Radios
- Size 22x22px with 6px border radius (checkbox) or circular (radio).
- Resting border 2px solid `#CBD5E1`.
- Checked state: Background `#0F3846`, stroke `#0F3846`, white inner checkmark.