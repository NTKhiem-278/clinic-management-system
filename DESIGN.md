# Design Brief

## Direction

Lâm Sàng — a calm, instrument-precise clinic management system for Vietnamese multi-specialty practices.

## Tone

Clinical calm: restrained, high-density, and legible — an instrument panel for people handling patient records all day.

## Differentiation

Every record card carries a status-keyed 3px "chart stripe" on its left edge, echoing a physical patient-file tab.

## Color Palette

| Token      | OKLCH        | Role                              |
| ---------- | ------------ | --------------------------------- |
| background | 0.982 0.006 200 | warm clinical off-white canvas |
| foreground | 0.19 0.02 220   | primary text, near-charcoal    |
| card       | 1 0.003 200     | elevated record surfaces       |
| primary    | 0.44 0.09 205   | deep teal-cyan, actions & nav  |
| accent     | 0.62 0.17 32    | warm coral, urgency & alerts   |
| muted      | 0.945 0.01 205  | secondary fills, table stripes |

## Typography

- Display: Space Grotesk — headings, page titles, KPI numbers
- Body: Figtree — tables, forms, labels (strong Vietnamese diacritics)
- Mono: JetBrains Mono — patient IDs, prescription codes, dosages
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Layered surfaces: canvas `bg-background`, cards `bg-card` with `shadow-subtle`, modals `shadow-elevated-lg`; depth comes from 1px borders, not heavy blur.

## Structural Zones

| Zone    | Background      | Border     | Notes                                        |
| ------- | --------------- | ---------- | -------------------------------------------- |
| Header  | `bg-card`       | `border-b` | sticky top bar, role badge + user menu       |
| Sidebar | `bg-sidebar`    | `border-r` | role-filtered nav, active item `bg-sidebar-accent` |
| Content | `bg-background` | —          | alternating `bg-muted/30` sections, dense tables |
| Footer  | `bg-muted/40`   | `border-t` | compact, muted meta text                     |

## Spacing & Rhythm

Section gaps `space-y-6 md:space-y-8`; card padding `p-4 md:p-6`; dense table rows `py-3`; micro-spacing `gap-2` in toolbars and badges.

## Component Patterns

- Buttons: `rounded-md`, primary `bg-primary text-primary-foreground`, hover `brightness-110`; destructive coral-red for cancel/lock
- Cards: `rounded-lg bg-card border shadow-subtle` with left chart stripe by status
- Badges: pill `rounded-full text-xs font-medium`; status colors — pending warning, confirmed primary, done success, cancelled muted, overdue destructive

## Motion

- Entrance: `animate-fade-in` 0.35s on page/panel mount
- Hover: `transition-smooth` color + shadow lift on cards and buttons
- Decorative: `animate-pulse-soft` on low-stock / expiring-medicine warnings only

## Constraints

- Vietnamese UI copy throughout; all labels, statuses, and empty states in Vietnamese
- Token-only styling — no raw hex, rgb, or arbitrary color classes in components
- Status is always conveyed by text + color, never color alone (accessibility)
- Dense, data-first layouts; no decorative imagery inside the app shell

## Signature Detail

The chart stripe — a 3px status-colored left rule on every record card, turning lists of patients, appointments, and prescriptions into scannable file tabs.
