---
name: Yantra Lab Command
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
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#5c0008'
  on-tertiary: '#ffffff'
  tertiary-container: '#860011'
  on-tertiary-container: '#ff8a83'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono-data:
    fontFamily: Courier Prime
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  control-height: 48px
---

## Brand & Style

This design system is engineered for high-stakes operational environments where clarity, speed of recognition, and reliability are paramount. The brand personality is **authoritative, vigilant, and precise**, designed to support security personnel and field managers who require an interface that stays out of the way while surfacing critical data points instantly.

The visual style is **Corporate Modern with a Utilitarian edge**. It prioritizes high-contrast ratios to ensure readability in diverse lighting conditions, from bright outdoor sunlight to low-light command centers. The interface avoids unnecessary decorative elements, favoring a structured, "mission-control" aesthetic that instills confidence in the software's stability.

**Key Principles:**
- **Information Density:** Optimized for quick scanning of lists and map data without feeling cluttered.
- **Visual Hierarchy:** Critical alerts and status changes utilize high-chroma accents against a clean, neutral backdrop.
- **Operational Trust:** Every interaction is grounded in a rigid grid, signifying a systematic and predictable user experience.

## Colors

The palette is anchored by **Security Blue**, a deep, dependable navy that provides a strong professional foundation. The functional colors—**Success Green** and **Alert Red**—are used strictly for status indicators (e.g., "On-Duty", "Breach Detected") to ensure they retain their psychological urgency.

- **Primary (Security Blue):** Used for navigation headers, primary action buttons, and active states.
- **Success (Green):** Indicates safe status, completed tasks, and successful "Punch-In" events.
- **Alert (Red):** Reserved for high-priority notifications, missed checkpoints, and emergency SOS triggers.
- **Neutral (Slate):** Used for typography, borders, and secondary icons to provide a balanced, calm background for the more vibrant functional colors.
- **Backgrounds:** A tiered system of cool greys (`#F8FAFC` to `#F1F5F9`) separates the map layer from control panels and sidebars.

## Typography

**Inter** is utilized across all levels for its exceptional legibility and neutral, technical character. The type scale is tight and efficient, maximizing the amount of information visible on screen.

For timestamps, coordinates, and ID numbers, a monospaced font may be used as an auxiliary style to prevent character jumping during real-time data updates. Labels use uppercase styling and increased tracking for clear categorization of data fields. Headlines are bold and tight-tracked to feel sturdy and impactful.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop dashboards and a **single-column fluid layout** for mobile field views. The system relies on a **4px base unit** to ensure all elements align perfectly, reflecting the precision required in security operations.

- **Map View:** Usually occupies the full background or a large central pane with "floating" control cards on the margins.
- **Sidebars:** Fixed-width (280px) left navigation for rapid switching between Map, Tasks, and Personnel.
- **Density:** High-density lists (12px vertical padding) are preferred for task management, while attendance controls (Punch In/Out) use larger touch targets (min 48px height) for ease of use in the field.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a clear functional hierarchy.

- **Level 0 (Background):** Slate-50 surface for the main application backdrop.
- **Level 1 (Cards/Panels):** Pure white surfaces with a 1px border (`#E2E8F0`) and a very soft, tight shadow (4px blur, 5% opacity). This level is used for task lists and settings.
- **Level 2 (Floating Controls):** Used for map overlays and modal dialogs. These utilize a more pronounced shadow (12px blur, 10% opacity) to signify they are "above" the operational data.
- **Interactive States:** Buttons use a subtle inner-glow on hover to feel tactile and responsive.

## Shapes

The shape language is **Soft/Structured**. A 4px (`0.25rem`) corner radius is the standard for cards and inputs, providing a modern look without sacrificing the serious, "industrial" feel of the application. 

- **Standard Elements:** 4px radius (Buttons, Input Fields, Cards).
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Map Markers:** Teardrop or circular shapes with high-contrast borders for visibility against satellite imagery.

## Components

### Attendance Controls
The "Punch In/Out" component is a high-visibility toggle or large primary button. It must change color state significantly: **Security Blue** for "Off Duty" and **Success Green** for "On Duty," accompanied by a clear timestamp.

### Status Cards
Cards representing field personnel or sites include a "Live" indicator (pulsing dot) and a progress bar for task completion. Use the **label-lg** typography for headers to ensure quick identification.

### Map Elements
Markers should be color-coded by status (Green = Active, Red = Alert, Grey = Offline). Clustered markers show a digit and use a neutral border to remain legible over complex map tiles.

### Task Lists
Items utilize a checkbox on the left, followed by the task title and a priority tag. High-priority tasks are flagged with a subtle red left-border accent.

### Detailed Calendar Dashboard
A multi-column grid showing shift rotations. Use a "Heatmap" style for coverage density, where darker shades of Blue indicate higher personnel presence. The current time indicator is a horizontal red line across the schedule.

### Inputs & Fields
Input fields use a 1px Slate-200 border that thickens to 2px Security Blue on focus. Error states use Alert Red for both the border and a helper text caption below the field.