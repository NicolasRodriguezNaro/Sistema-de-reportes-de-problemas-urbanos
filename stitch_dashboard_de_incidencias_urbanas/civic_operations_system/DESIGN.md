---
name: Civic Operations System
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
  surface-tint: '#3c6474'
  primary: '#002834'
  on-primary: '#ffffff'
  primary-container: '#133e4d'
  on-primary-container: '#81a9bb'
  inverse-primary: '#a4ccdf'
  secondary: '#396474'
  on-secondary: '#ffffff'
  secondary-container: '#bae6f9'
  on-secondary-container: '#3d6878'
  tertiary: '#001f5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#00328b'
  on-tertiary-container: '#7f9fff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0e9fc'
  primary-fixed-dim: '#a4ccdf'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#234c5b'
  secondary-fixed: '#bde9fc'
  secondary-fixed-dim: '#a1cddf'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#1f4c5b'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
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
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  tabular-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is tailored for high-density municipal operations, public infrastructure management, and urban incident triage. Its personality is strictly institutional, objective, calm, and authoritative, delivering clarity under pressure. It provides municipal dispatchers, operators, and public administrators with a reliable instrument that minimizes cognitive load while reviewing high volumes of geo-tagged incidents, citizen reports, and maintenance workflows.

The design movement is **Modern Institutionalism / Functional Modern**:
- **Utilitarian Discipline:** Dense, information-rich views prioritizing screen efficiency and legible tabular presentation over ornamental whitespace.
- **Architectural Contrast:** A deep petroleum foundation (#133E4D) anchors the structural navigation, delivering institutional authority, contrasted against cool, ice-tinted surfaces (#F1F5F9) for extended monitoring comfort.
- **Functional Semantics:** Chromatic energy is reserved strictly for operational status, severity indicators, and urgency hierarchies—avoiding decorative color distractions.

## Colors

The palette establishes an unmistakable hierarchy between structural navigation, content workspace, and real-time operational states.

### Core Structure
- **Primary Canvas / Background:** `#F8FAFC` (Cool ice white), with secondary workspace panels using `#F1F5F9`.
- **Card & Surface Background:** `#FFFFFF` (Pure pristine white) with `#E2E8F0` hairline separation lines.
- **Structural Identity:** 
  - Primary Slate/Petrol: `#133E4D` (Main brand color, primary headers, active interactive states).
  - Deep Navy/Base: `#0E2A34` (Sidebar navigation background, top bar root, high-contrast typography).
  - Petrol Mid: `#1B4958` (Selected states, table active rows, structural secondary elements).

### Operational State Matrix
States utilize paired high-contrast foregrounds and tinted background fills:
- **Critical / High Priority:** Crimson `#DC2626` over `#FEE2E2` tint. Border token: `#FCA5A5`.
- **In Progress / Medium Priority:** Warm Amber `#D97706` over `#FEF3C7` tint. Border token: `#FCD34D`.
- **Resolved / Low Priority:** Emerald Green `#059669` over `#D1FAE5` tint. Border token: `#6EE7B7`.
- **Received / New Incident:** Cobalt Blue `#2563EB` over `#DBEAFE` tint. Border token: `#93C5FD`.

### Neutral & Typography Tones
- **Text Primary:** `#0F172A` (Slate 900) for headers, values, and critical cell data.
- **Text Secondary:** `#475569` (Slate 600) for metadata, labels, and secondary context.
- **Text Muted:** `#94A3B8` (Slate 400) for placeholders and disabled states.
- **Subtle Dividers:** `#E2E8F0` (Hairline structural lines) and `#CBD5E1` for hover states.

## Typography

The type system relies on **Inter** with native OpenType tabular figures (`font-variant-numeric: tabular-nums`) enabled across all data-dense views to ensure vertical alignment of numbers, IDs, and timestamps.

- **Weight Discipline:** Restrict styling primarily to Regular (400) for body narrative, Medium (500) for dense table cells and values, and Semi-Bold (600) for labels, card headings, and table column titles. Bold (700) is reserved for status badges, critical KPIs, and top-tier page titles.
- **Micro-Copy Precision:** Micro-labels, incident badges, and severity tags utilize uppercase tracking (`letter-spacing: 0.04em`) with reduced font sizes (11px–12px) to optimize spatial density.

## Layout & Spacing

The layout is architected around a fluid, data-dense operations workstation model:

- **Desktop Framework:** A persistent 260px collapsible command sidebar (#0E2A34) paired with a 12-column dynamic grid layout inside the operational viewport. Desktop gutters are calibrated to 1.25rem (20px), balancing modular card separation with compact scan-paths.
- **Density Standard:** Spacing within operational components uses a strict 4px grid. Table row height is constrained to 44px (default) or 36px (compact view mode), optimizing the number of visible incidents without scrolling.
- **Breakpoint Adjustments:**
  - **Desktop (≥ 1280px):** Multi-column split views (Incident Data Table 8 cols + Detail & Geo-Map Panel 4 cols).
  - **Tablet (768px – 1279px):** Sidebar collapses to an icon-rail (64px); 8-column layout with inspector moving into a slide-over drawer.
  - **Mobile (< 768px):** Single-column stacked cards; drawer inspector becomes a full-screen modal; margin contracts to 1rem.

## Elevation & Depth

Visual hierarchy employs **low-contrast borders accompanied by micro-ambient shadows**, ensuring data clarity without visual weight.

- **Level 0 (Workspace Canvas):** Flat `#F8FAFC` or `#F1F5F9` surfaces. No shadows or borders.
- **Level 1 (Data Cards & Table Containers):** Pure `#FFFFFF` surface with a crisp 1px border (`#E2E8F0`) and an ambient micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Interactive Floating Elements, Dropdowns, Popovers):** Raised `#FFFFFF` surface with a 1px border (`#CBD5E1`) and directional shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Dialogs, Urgent Incident Alert Drawers):** High-level overlay with `0 20px 25px -5px rgba(14, 42, 52, 0.15), 0 8px 10px -6px rgba(14, 42, 52, 0.1)`. Tinted softly with the petroleum root hue.
- **Focus Elevation:** Focused fields and active selections omit heavy drop shadows in favor of a crisp 2px primary glow: `0 0 0 3px rgba(19, 62, 77, 0.15)`.

## Shapes

The design system maintains a **Soft (Level 1)** geometric aesthetic. Incisive, controlled radii reinforce precision and institutional discipline.

- **Cards, Panels, and Table Headers:** 0.25rem (4px) to 0.375rem (6px) rounded corners.
- **Input Controls and Action Buttons:** 0.25rem (4px) radius for structured, utilitarian feel.
- **Status & Priority Badges:** Controlled rounded pills (`9999px`) or soft rects (4px) to make them instantly scannable among dense tabular rows.
- **Dividers:** 1px hairline horizontal and vertical strokes with zero border radii.

## Components

### Buttons
- **Primary:** Deep petroleum solid fill (`#133E4D`), white text (`#FFFFFF`), 4px radius, medium font weight. Hover state deepens to `#0E2A34`. Height: 36px (dense) or 40px (standard).
- **Secondary:** White surface (`#FFFFFF`), slate border (`#CBD5E1`), dark text (`#133E4D`). Hover applies `#F8FAFC` background with `#1B4958` border.
- **Destructive:** Crimson fill (`#DC2626`) or ghost crimson hover over light red background (`#FEE2E2`).

### Status Badges & Priority Chips
Badges use 11px uppercase bold typography with high-contrast pill styling:
- **Received / New:** Fill `#DBEAFE`, text `#1D4ED8`, border `#93C5FD`.
- **In Progress / Medium:** Fill `#FEF3C7`, text `#B45309`, border `#FCD34D`.
- **Resolved / Low:** Fill `#D1FAE5`, text `#047857`, border `#6EE7B7`.
- **Critical / High:** Fill `#FEE2E2`, text `#B91C1C`, border `#FCA5A5`. Includes a pulsing 6px indicator dot for immediate identification.

### Incident Data Tables
- **Header:** Sticky `#F8FAFC` row, uppercase 12px Slate-600 labels, bottom border `#CBD5E1`.
- **Rows:** Alternating subtle row color or pure white with `#E2E8F0` row dividers. Row height set to 40px. Hover transitions row background to `#F1F5F9`.
- **Columns:** Fixed widths for IDs (`#INC-XXXX`), incident priority badges, date-time (ISO format, tabular figures), category chips, and fast-action trigger menus.

### Input Fields & Search Filters
- **Base Style:** 36px height, white background, `#CBD5E1` border, 4px corner radius, 13px text.
- **Focus State:** Border changes to `#133E4D` with a subtle 3px petroleum ring (`rgba(19, 62, 77, 0.15)`).
- **Global Search:** Prominent filter bar combining district dropdown, incident category, and text search with immediate keyboard shortcut cues (`Ctrl+K` / `⌘K`).

### Incident Detail Cards & Inspection Drawers
- Multi-compartment white cards with subtle grey section dividers.
- Visual map preview container with coordinates, reverse-geocoded address bar, and audit trail timeline with timestamped status changes.

### Metric KPI Tiles
- White container, subtle border, top accent strip mapped to primary petroleum or status color.
- Large numeric figure in 24px Semi-Bold, accompanying percentage change pill, and compact 32px sparkline or micro-bar graph.