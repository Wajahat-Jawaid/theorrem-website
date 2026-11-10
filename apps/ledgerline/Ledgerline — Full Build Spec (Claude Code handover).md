# Ledgerline — Full Build Spec (Claude Code handover)

Oct 21, 2026 · @WJ

## 0. Mission and non-negotiables

Build a complete, shippable front-end for **Ledgerline**, a working bookkeeping automation platform for a UK accountancy practice. It must look and behave like a product that has been live for eighteen months with real clients on it. One pass. No follow-up fixing round.

**Hard rules. Violating any one of these fails the build.**

1. The words *demo*, *sample*, *example*, *mock*, *placeholder*, *prototype*, *lorem*, *test*, *dummy*, *coming soon*, *TODO* and *Feature X* must not appear anywhere in rendered UI text, in `alt` attributes, in `title` attributes, in page `<title>`, in meta tags, or in visible file names. Grep for all of them before declaring done.
2. Every screen is fully populated. No empty states visible on first load. No skeleton that never resolves. No zero-row table. No chart with one data point.
3. Every number must be internally consistent. If the dashboard says 1,284 documents processed this month, the inbox must contain a dataset that totals 1,284 for that month, and the per-client numbers must sum to it. Derive aggregates from the source arrays in code; never hard-code a headline figure that contradicts the rows underneath it.
4. Every interactive element does something. Every nav item routes to a real page. Every button either changes state, opens a panel, or fires a toast. No dead `href="#"`, no `onClick` that logs to console, no disabled control without a tooltip explaining why.
5. No backend, no network calls, no API keys, no authentication. All data is static TypeScript in `/lib/data`, mutated in memory through React state so the user can click through a full workflow and see it persist for the session.
6. UK English throughout: organisation, categorise, authorised, licence (noun), analyse. Currency is GBP, `£1,284.50`. Dates are `12 Oct 2026` in prose and `12/10/2026` in dense tables. Never US formats.
7. The visual language is fixed by section 3 and section 4 of this document. Do not improvise colours, radii, fonts or spacing. If a value is specified here, use that exact value.
8. The brand mark is the wordmark **LEDGERLINE** set in the display font, in white, with a small custom glyph to its left that you draw as inline SVG. Do not use any third-party logo, and do not copy a logo from any reference image.

**Definition of done:** a person can be handed the URL with no explanation, click every nav item, process a document end to end, approve it, see it appear in the ledger, send a chase email, and open a VAT return — and at no point encounter a broken, empty, inconsistent or obviously fake surface.

## 1. The product

Ledgerline is an autonomous bookkeeping agent used by a London accountancy practice that serves construction, interior design and professional-services clients. It replaces the manual data-entry layer between a client's paperwork and the practice's ledger software.

**What the agent actually does, in order:**

1. Monitors a dedicated inbox per client (`harlow@in.ledgerline.co.uk`). Clients forward or BCC supplier invoices, receipts and statements.
2. Pulls every attachment — PDF, JPEG, HEIC, scanned fax — plus invoices embedded in the email body.
3. Extracts supplier name, supplier VAT number, invoice number, invoice date, due date, net, VAT, gross, currency, and line items, each with a confidence score.
4. Categorises to a nominal code and a VAT treatment, using the client's own posting history as the signal.
5. Runs validation: VAT arithmetic, VAT number format, duplicate detection against the last 180 days, date sanity, supplier-on-file check, CIS applicability for construction clients.
6. Auto-posts anything above the confidence threshold straight to the ledger. Routes the rest to a human review queue with the specific reason flagged.
7. Chases the client by email for what is missing or illegible — unreadable scans, receipts with no VAT breakdown, bank transactions with no matching document — and escalates on a schedule.
8. Writes every action to an immutable audit trail with its reasoning, so the practice can defend any posting to HMRC.

**The two users the screens are built for:**

- *Priya Raghunathan*, bookkeeping manager. Lives in the review queue and the chaser list. Wants volume cleared and exceptions surfaced, not explained to.
- *The practice principal*. Opens the dashboard once a week, wants hours saved, exception rate, and whether any client is drifting toward a late VAT filing.

**The story the screens must tell, in this order, because this is the order it will be walked through on a call:** the dashboard proves scale and time saved → the inbox proves nothing is lost → the review screen proves the extraction is accurate and the human stays in control → the chasers prove it does the nagging nobody wants to do → VAT & CIS proves it understands UK compliance, not just OCR → the activity log proves it is auditable.

The practice is **Harbourfield & Co**, 44 Clerkenwell Road, London EC1M 5PS. Signed-in user is **Priya Raghunathan**, Bookkeeping Manager. "Today" throughout the application is **21 October 2026** — define this as a single exported constant `TODAY` and derive every relative date ("2 hours ago", "overdue by 4 days") from it, so the build never goes stale or inconsistent.

## 2. Stack and scaffolding

**Stack, fixed:**

- Next.js 14, App Router, TypeScript strict mode
- Tailwind CSS 3.4 with a fully extended theme (every token in section 3 becomes a Tailwind token — no arbitrary values like `bg-[#0A0E2A]` scattered in JSX)
- `recharts` for all charts
- `lucide-react` for all icons
- `framer-motion` for the processing animation and panel transitions only
- `clsx` + `tailwind-merge` for class composition
- No state library. React `useState`/`useReducer` plus one `AppDataContext` provider at the root holding the mutable dataset.
- No `localStorage`, no `sessionStorage`, no IndexedDB. Session-only state.

**Fonts:** load from Google Fonts via `next/font`.

- Display + UI: **Plus Jakarta Sans** — weights 400, 500, 600, 700, 800. This is the whole interface.
- Wordmark + numeric accents only: **Space Grotesk** 700.
- Tabular figures: apply `font-variant-numeric: tabular-nums` to every number in a table or stat card. Non-negotiable — misaligned digits are the single fastest tell that a UI is fake.

**File tree, build exactly this:**

```
app/
  layout.tsx                 root: fonts, AppDataProvider, Shell
  page.tsx                   redirect -> /dashboard
  dashboard/page.tsx
  inbox/page.tsx
  inbox/[id]/page.tsx        the review screen
  chasers/page.tsx
  clients/page.tsx
  clients/[id]/page.tsx
  vat/page.tsx
  activity/page.tsx
  rules/page.tsx
  globals.css
components/
  shell/Sidebar.tsx  TopBar.tsx  PageHeader.tsx  TabBar.tsx
  ui/StatCard.tsx  GradientCard.tsx  StatusPill.tsx  Card.tsx
     DataTable.tsx  ConfidenceMeter.tsx  Avatar.tsx  IconTile.tsx
     Toast.tsx  Modal.tsx  Drawer.tsx  Tooltip.tsx  Toggle.tsx
     SegmentedControl.tsx  SearchInput.tsx  TrendBadge.tsx
  charts/VolumeBarChart.tsx  SavingsLineChart.tsx
     CategorySplitChart.tsx  ClientBarChart.tsx
  domain/DocumentRow.tsx  PipelineBoard.tsx  ExtractionField.tsx
     DocumentPreview.tsx  AgentNote.tsx  ChaserCard.tsx
     VatBox.tsx  ActivityEntry.tsx  RuleRow.tsx
lib/
  data/clients.ts  documents.ts  suppliers.ts  activity.ts
       chasers.ts  vat.ts  rules.ts  nominalCodes.ts  user.ts
  types.ts
  constants.ts               TODAY, thresholds, enums
  format.ts                  currency, dates, relative time, percentages
  derive.ts                  ALL aggregates computed from the arrays
  agent.ts                   the simulated processing state machine
  cn.ts
```

**Commands that must work on a clean clone:** `npm install`, `npm run dev`, `npm run build`, `npm run start`. `npm run build` must complete with **zero** TypeScript errors and **zero** ESLint warnings. Treat a warning as a failure.

**Deployability:** no server-only code, no `dynamic = 'force-dynamic'`, no environment variables. The whole thing must deploy to Vercel or export statically with `output: 'export'` and still work.

## 3. Design system

Put every one of these into `tailwind.config.ts` as a named token. No arbitrary hex values anywhere in JSX.

### Colour

| Token | Hex | Used for |
| --- | --- | --- |
| `ink.900` | `#04081A` | Sidebar upper block (logo + summary card zone) |
| `ink.800` | `#0A0F2B` | Sidebar nav block, icon tiles |
| `ink.700` | `#000416` | Active nav item background |
| `navy.900` | `#0A1033` | Primary text, page titles, big stat numbers |
| `navy.600` | `#2A3560` | Secondary headings |
| `slate.500` | `#6B7591` | Labels, table headers, body secondary |
| `slate.400` | `#9AA3B8` | Muted text, units after numbers, placeholders |
| `blue.700` | `#1E3FAE` | Gradient start |
| `blue.600` | `#2563EB` | Primary brand, active underline, links, primary buttons |
| `blue.500` | `#3B82F6` | Gradient end, chart series 1 |
| `blue.100` | `#E8F0FE` | Chip backgrounds, selected rows, tab hover |
| `blue.50` | `#F3F7FF` | Hover fill on light surfaces |
| `teal.400` | `#2DD4BF` | Chart series 2 |
| `violet.500` | `#8B5CF6` | Chart series 3 |
| `green.500` | `#22C55E` | Positive trend dot |
| `green.100` | `#DCFCE7` | Success pill bg |
| `green.700` | `#15803D` | Success pill text |
| `amber.100` | `#FEF3C7` | Warning pill bg |
| `amber.700` | `#B45309` | Warning pill text |
| `red.100` | `#FEE2E2` | Error pill bg |
| `red.700` | `#B91C1C` | Error pill text |
| `canvas` | `#F4F6FA` | Main content background |
| `surface` | `#FFFFFF` | Cards |
| `line` | `#E9EDF3` | All borders and table separators |
| `line.soft` | `#F1F4F9` | Inner dividers |

**Gradients.** Hero card: `linear-gradient(135deg, #1E3FAE 0%, #2563EB 48%, #3B82F6 100%)`. Over it, at the right edge, a decorative watermark: a 2×2 cluster of rounded squares at `rgba(255,255,255,0.08)`, roughly 40% of card width, clipped by `overflow-hidden`, drawn as inline SVG. Never an image file.

### Typography

| Role | Size / line-height | Weight | Colour |
| --- | --- | --- | --- |
| Page title | 40 / 44 | 800 | `navy.900` |
| Section heading | 26 / 32 | 700 | `navy.900` |
| Card title | 18 / 24 | 700 | `navy.900` |
| Hero figure | 54 / 58 | 800 | white, unit suffix at `rgba(255,255,255,0.5)` |
| Stat figure | 32 / 38 | 800 | `navy.900`, unit suffix `slate.400` |
| Stat label | 14 / 20 | 500 | `slate.500` |
| Body | 14 / 21 | 500 | `navy.600` |
| Table header | 13 / 16 | 500 | `slate.500` |
| Table cell | 14 / 20 | 500 text, 600 numbers | `navy.900` |
| Pill / badge | 12 / 16 | 600 | per status |
| Nav item | 15 / 20 | 500 (600 when active) | `rgba(255,255,255,0.65)` → white when active |

Letter-spacing: `-0.02em` on anything 26px or larger. `0` elsewhere. Never positive tracking.

### Geometry

- Base grid 8px. Every margin, padding and gap is a multiple of 4, preferring multiples of 8.
- Radii: outer cards `20px`, inner cards and inputs `14px`, buttons `12px`, icon tiles `14px`, pills and chips `9999px`, avatars `9999px`.
- Borders: `1px solid line` on every card. Cards do **not** carry a drop shadow at rest — the border alone separates them. Shadow `0 1px 2px rgba(16,24,40,0.04)` only on hover-lifted rows.
- Floating surfaces (tooltip, dropdown, modal, drawer, toast): `0 16px 40px rgba(10,16,51,0.14)` plus the 1px border.
- Card padding `24px`. Card gap in a grid `20px`. Page gutter `40px` left and right, `32px` top.
- Sidebar width `280px`, fixed, full height, never collapses above 1280px.
- Top bar height `88px`, sticky, background `canvas` with no bottom border.
- Maximum content width `1480px`, centred when the viewport is wider.

### Icon treatment

Two distinct treatments, used consistently:

1. **Icon tile** — a `56×56` rounded square, `radius 14`, background `ink.800`, containing a `24px` `lucide-react` icon stroked `1.75` in white. This sits top-left inside stat cards. It is the signature element of the visual language; get it right.
2. **Inline icon** — `18px`, stroke `1.75`, `slate.500`, used in nav, buttons, table cells. Nav icons sit `12px` from the label.

Icon-only buttons are `40×40`, radius `12`, background `#FFFFFF` with a `line` border, icon `20px` `navy.900`.

### Motion

`150ms ease-out` on hover and colour changes. `220ms cubic-bezier(0.22,1,0.36,1)` on panels, drawers and height changes. Chart series animate in once on mount over `600ms`, never on re-render. Respect `prefers-reduced-motion` by cutting all durations to `0ms`.

## 4. Global chrome

### Sidebar (280px, fixed, full viewport height)

Top to bottom:

1. **Logo block** — background `ink.900`, padding `32px 28px 24px`. Inline-SVG glyph `28×28` (three stacked horizontal bars of decreasing width, white, `3px` tall, `4px` gap, the top bar with a small square notch cut from its right end), then the wordmark `LEDGERLINE` in Space Grotesk 700, `22px`, white, letter-spacing `0.06em`.
2. **Summary card** — still on `ink.900`, margin `0 20px 28px`, radius `14`, overflow hidden.
   - Header strip: background `blue.600`, padding `10px 16px`, flex row, space-between. Left: `Ledger position` in white 13px/600. Right: `21 Oct 2026` in `rgba(255,255,255,0.75)` 12px/500.
   - Body: background `rgba(255,255,255,0.05)`, padding `16px`, flex row, baseline-aligned, space-between. Left: `£482,610.44` in Space Grotesk 700, `22px`, white. Right: a trend badge — `green.100` bg, `green.700` text, radius full, padding `3px 8px`, 12px/600, an up-arrow glyph then `4.2%`.
3. **Nav block** — background `ink.800`, flex-grow, padding `12px 16px`. Items in order: Dashboard (`LayoutGrid`), Document inbox (`Inbox`), Review queue (`CheckSquare`), Chasers (`Send`), Clients (`Building2`), VAT & CIS (`Receipt`), Activity (`Clock`), Rules & integrations (`Settings2`).
   - Each item: height `52px`, padding `0 16px`, radius `12`, flex row, `12px` gap. Icon `18px` then label 15px/500 at `rgba(255,255,255,0.62)`.
   - Hover: background `rgba(255,255,255,0.05)`, label to `rgba(255,255,255,0.85)`.
   - **Active**: background `ink.700`, label white 600, icon white, and a `6×6` white square absolutely positioned `20px` from the right edge, vertically centred. This square is a signature detail — include it.
   - Items carrying work show a count on the right instead of the square when inactive: Document inbox `18`, Review queue `7`, Chasers `5`, rendered as a `blue.600` pill, white 11px/700, min-width `22px`, height `20px`.
4. **Footer block** — padding `16px 20px 24px` on `ink.800`. A single control: radius `14`, background `rgba(255,255,255,0.06)`, height `52px`, padding `0 16px`, flex row space-between. Left: a `20px` rounded-square avatar with the initials `HC` on `blue.600`, then `Harbourfield & Co` in white 14px/600. Right: a `ChevronDown` `16px` at `rgba(255,255,255,0.5)`. Clicking opens a dropdown listing `Harbourfield & Co` (ticked) and `Harbourfield Tax Services`.

### Top bar (88px, sticky, background `canvas`)

Left to right, `40px` page gutter, `12px` gaps:

1. **Status chip** — white bg, `line` border, radius full, height `48px`, padding `0 8px 0 20px`. Text `Agent active` in `navy.900` 14px/600, preceded by a `8px` green dot with a slow `2s` pulse ring. Then, pushed right inside the same chip, a `blue.600` filled button, radius full, height `36px`, padding `0 18px`, white 14px/600: `Process queue`.
2. **Clock chip** — `#EDF1F7` bg, radius full, height `48px`, padding `0 18px`. `Clock` icon `16px` `slate.500`, then `09:42` in `navy.900` 14px/600 and `BST` in `slate.400` 14px/500.
3. **Spacer** (flex-1).
4. **Search** — width `320px`, height `48px`, white bg, `line` border, radius `14`. Placeholder `Search suppliers, invoices, clients`. `Search` icon `18px` right-aligned inside, in a `32×32` `blue.100` rounded-`10` tile. Typing filters an overlay dropdown of up to 6 real matches from the dataset, grouped under `Suppliers`, `Documents`, `Clients`. Not decorative — make it work.
5. **Notification button** — `48×48`, white, `line` border, radius `14`, `Bell` icon `20px`, with a `8px` `red.500` dot top-right. Opens a dropdown with 4 real notifications drawn from the activity data.
6. **User chip** — white bg, `line` border, radius full, height `48px`, padding `4px 16px 4px 4px`. A `40px` circular avatar (initials `PR` on a `violet.500` background, white 14px/700), then `Priya` in `navy.900` 14px/600, then `ChevronDown` `16px` `slate.400`. Opens a dropdown: Profile, Notification settings, Sign out.

### Page header pattern

Every page body starts with: page title at 40/44/800, optionally a one-line subtitle in `slate.500` 15px/500 directly under it, then (where the page has tabs) a tab bar `24px` below.

**Tab bar:** horizontal, `32px` gap, bottom border `1px line` spanning the full content width. Each tab is 16px/600, `slate.500`, padding-bottom `14px`. Active tab is `blue.600` with a `3px` `blue.600` bottom bar sitting on top of the border, radius `2px 2px 0 0`. A tab may carry a grey count pill (`#EDF1F7` bg, `slate.500` text, 11px/700) `— for example a Needs review tab showing 7.`

## 5. Shared components

**StatCard** — white, radius 20, `line` border, padding 24, min-height 160. Icon tile top-left (section 3.4). Then `24px` gap, then the label in 14/20/500 `slate.500`, then the figure in 32/38/800 `navy.900` with any unit suffix in `slate.400` at the same size and weight 500. Optional trend badge pinned top-right: radius full, `green.100`/`green.700` for positive with `ArrowUp` 12px, `red.100`/`red.700` for negative with `ArrowDown`.

**GradientCard** — full-width band, radius 20, the hero gradient, padding `28px 32px`, overflow hidden, with the SVG watermark at the right. Content is a flex row of 3–4 segments separated by `48px`. Each segment: label in `rgba(255,255,255,0.72)` 14/20/500, then the figure in 54/58/800 white with its unit suffix at `rgba(255,255,255,0.5)`. Optional right-aligned action buttons: one solid (`rgba(255,255,255,0.95)` bg, `blue.700` text) and one outline (`1px rgba(255,255,255,0.4)`, white text), both height 48, radius 12, padding `0 24px`, 15/600, each with a trailing `20px` circular icon chip.

**StatusPill** — radius full, height 24, padding `0 10px`, 12/16/600. Map:

| Status | bg / text |
| --- | --- |
| Posted | `green.100` / `green.700` |
| Auto-posted | `green.100` / `green.700` |
| Approved | `blue.100` / `blue.600` |
| Needs review | `amber.100` / `amber.700` |
| Extracting | `blue.100` / `blue.600` with a 10px spinner |
| Chasing client | `#F3E8FF` / `#7E22CE` |
| Duplicate | `red.100` / `red.700` |
| Failed | `red.100` / `red.700` |
| Received | `#EDF1F7` / `slate.500` |

**DataTable** — header row: no background, 13/16/500 `slate.500`, padding `0 16px 14px`, bottom border `1px line`. Body rows: height 64, bottom border `1px line.soft`, hover background `blue.50` with `cursor: pointer`. Numeric columns right-aligned with tabular figures. First column typically an avatar or supplier monogram (`36px` rounded-12 tile, two-letter monogram, background derived deterministically from the supplier name across a fixed palette of six muted tints). Last column is a right-aligned `MoreHorizontal` icon button revealed on row hover. Column sorting works on every numeric and date column — clicking the header toggles asc/desc with a `ChevronUp`/`ChevronDown` indicator.

**ConfidenceMeter** — a `48×6` rounded-full track in `#EDF1F7` with a fill coloured by band: ≥95% `green.500`, 80–94% `#F59E0B`, <80% `#EF4444`. The percentage sits to its right in 12/600 matching the fill colour. Appears beside every extracted field.

**SegmentedControl** — a `#EDF1F7` radius-12 container, padding 4. Each segment height 36, padding `0 18px`, radius 10, 14/600 `slate.500`. Selected segment: white background, `navy.900` text, shadow `0 1px 2px rgba(16,24,40,0.06)`. Used for period switches (`7 days` / `30 days` / `Quarter` / `Year`).

**Toast** — bottom-right, width 380, white, radius 16, `line` border, floating shadow, padding 16, auto-dismiss 4s, stacked with `12px` gaps. A `36px` rounded-10 tile on the left coloured by type, title 14/600 `navy.900`, body 13/500 `slate.500`, and an `X` close button.

**Modal** — centred, width 560, radius 20, padding 28, backdrop `rgba(10,16,51,0.4)` with `backdrop-filter: blur(2px)`. Closes on Escape and on backdrop click.

**Drawer** — right-anchored, width 560, full height, radius `20px 0 0 20px`, slides in over the same backdrop. Used for client detail and activity detail.

**Tooltip** — white, radius 12, padding `10px 14px`, max-width 280, 13/18/500 `navy.600`, floating shadow, `1px line` border, with a small pointer triangle. Appears on 300ms hover delay. Every abbreviation, nominal code, confidence score and status pill carries one.

**Charts (recharts).** Shared rules: no chart borders, no outer legend box. Grid lines horizontal only, `1px #F1F4F9`, no vertical grid. Axis ticks 12/500 `slate.400`, axis lines removed. Y-axis labels abbreviated (`£24k`, `1.2k`). Bars radius `6 6 0 0`, bar width 26, category gap 24. Stacked bars use `blue.600` bottom and `teal.400` top. Line charts: `2.5px` `blue.600` stroke, `4px` white-filled dots with `2px` blue ring, active dot `6px`. Custom tooltip reusing the Tooltip component, never the recharts default. Legend below the chart as a horizontal row of `10px` circles with 13/500 `slate.500` labels.

## 6. Page — Dashboard (`/dashboard`)

Title `Dashboard`. No subtitle. 12-column grid, `20px` gutters.

**Row 1, left (cols 1–5): GradientCard.**

- Label `Processed this month`, figure `1,284` with suffix `docs`.
- Beneath, on one line: `≈ £1,842,390.18 in supplier invoices` at `rgba(255,255,255,0.72)` 15/500.
- A trend badge: `green.100`/`green.700`, `↑ 3.3%` and, in `rgba(255,255,255,0.7)` 13/500 beside it, `vs September`.
- Two buttons at the bottom: solid `Process queue` with a `Play` chip, outline `Export ledger` with a `Download` chip.
- Hovering the `docs` suffix shows a tooltip: `Invoices, receipts, credit notes and statements. Bank feeds are counted separately.`

**Row 1, right (cols 6–12): `Practice performance` panel.** White card. At its top, a SegmentedControl with two options, `Automation` (default) and `Compliance`, filling the full card width.

*Automation view:* a left inner card on the hero gradient, width 240, radius 14, padding 20 — `Automation level` 13/500 white-70, `Tier 3` in 28/800 white, `Current auto-post rate` 12/500 white-60, `82.6%` in 20/700 white, and a 4px progress track at `rgba(255,255,255,0.25)` filled 82.6% in white. To its right, a 2×2 grid of four plain stat boxes (no icon tile, `line` border, radius 14, padding 18): `Documents auto-posted` `1,061`; `Routed to review` `223`; `Exceptions resolved` `216`; `Hours saved` `94.5`.

*Compliance view:* same geometry. Inner card reads `Filing health` / `All current` / `Next deadline` / `7 Dec 2026`. Four boxes: `VAT returns due` `3`; `CIS returns due` `2`; `Overdue chases` `5`; `Unmatched items` `12`.

**Row 2, left (cols 1–7): `Processing volume` chart card.** Card title top-left; top-right a `12 months` dropdown. Stacked bar chart, 12 bars, Nov 2025 → Oct 2026, x-labels three-letter month, `blue.600` = auto-posted, `teal.400` = routed to review. Exact data:

| Month | Auto-posted | Routed to review |
| --- | --- | --- |
| Nov | 591 | 151 |
| Dec | 548 | 141 |
| Jan | 716 | 185 |
| Feb | 684 | 170 |
| Mar | 818 | 194 |
| Apr | 789 | 179 |
| May | 906 | 198 |
| Jun | 869 | 182 |
| Jul | 984 | 203 |
| Aug | 915 | 181 |
| Sep | 1038 | 205 |
| Oct | 1061 | 223 |

Legend below: two dots, `Auto-posted` and `Routed to review`.

**Row 2, right (cols 8–12): `Busiest clients` card.** Top-right `View all →` linking to `/clients`. A horizontal bar chart in `violet.500` showing the top five clients by October document count, then a divider, then a five-row mini table: monogram tile, client name, a `Docs` column and an `Auto-post` percentage column. Data: Mercer Construction Ltd 312 / 88%; Harlow & Vane Interiors 208 / 91%; Calder Fit-Out Group 186 / 79%; Thameside Joinery Ltd 154 / 84%; Brompton Studio Design 121 / 93%.

**Row 3 (full width): four StatCards, equal width.**

1. `Receipt` icon — `Awaiting your review` — `7` — trend badge `↓ 12` in green.
2. `Zap` icon — `Average extraction confidence` — `96.4%` — badge `↑ 0.8%`.
3. `Timer` icon — `Average time to post` — `41` suffix `sec` — badge `↓ 6s`.
4. `AlertTriangle` icon — `Duplicates blocked this month` — `23` — tooltip `Matched on supplier, gross amount and invoice number within a 180-day window.`

**Row 4, left (cols 1–7): `Needs your attention` table.** Columns: Supplier (monogram + name + client name beneath in 12/500 `slate.500`), Amount (right-aligned), Reason (a StatusPill), Received (relative time), and a `Review` text button in `blue.600` 14/600. Seven rows, matching exactly the seven review-queue items defined in section 14. Clicking a row routes to `/inbox/[id]`.

**Row 4, right (cols 8–12): `Agent activity` card.** A vertical feed of the eight most recent activity entries — a `32px` rounded-10 tile coloured by action type, a one-line description in 14/500 `navy.900` with the supplier name in 600, the client name in 13/500 `slate.500`, and a right-aligned relative timestamp in 12/500 `slate.400`. A `2px` `line.soft` vertical rail connects the tiles. Footer link `Open activity log →`.

## 7. Page — Document inbox (`/inbox`)

Title `Document inbox`. Subtitle `1,284 documents processed in October. 7 waiting on you.`

Tab bar: `All` (1,284) · `Needs review` (7) · `Auto-posted` (1,061) · `Chasing` (5) · `Duplicates` (23) · `Failed` (2). Tabs filter the table below; the counts come from the data, not from constants.

### Pipeline strip

Directly under the tabs, a full-width white card containing five stage columns separated by thin `line` dividers, each a flex column with the stage name in 13/500 `slate.500`, the count in 28/800 `navy.900`, and a `4px` rounded progress bar underneath coloured per stage:

`Received` 1,284 (`slate.400`) → `Extracted` 1,284 (`blue.500`) → `Validated` 1,277 (`blue.600`) → `Posted` 1,061 (`green.500`) → `Held` 223 (`amber.500`). Between columns, a `ChevronRight` `16px` in `slate.400`. Clicking a stage filters the table.

### Toolbar

A row above the table: a `SearchInput` (`Search this client's documents`), a `Client` dropdown (All clients + the nine names), a `Date range` dropdown (`This month` default), a `Status` dropdown, and right-aligned a `Filter` icon button and a `Download` icon button. Active filters render as removable chips below the toolbar in `blue.100`/`blue.600` with an `X`.

### Table

Columns, left to right:

1. Checkbox (selects the row; header checkbox selects all visible).
2. **Document** — supplier monogram tile, supplier name in 14/600 `navy.900`, and below it the file name in 12/500 `slate.400` (e.g. `INV-TP-884210.pdf`).
3. **Client** — client name 14/500, with the client monogram as a `20px` tile.
4. **Date** — invoice date, `12/10/2026`.
5. **Net / VAT / Gross** — three right-aligned numeric columns, tabular figures, `£` prefixed, two decimals always.
6. **Nominal** — the code and name as `310 · Materials purchased`, 13/500, the code in 600.
7. **VAT treatment** — a grey chip: `20% S`, `5% R`, `0% Z`, `Exempt`, `RC 20%` (reverse charge), `No VAT`.
8. **Confidence** — a ConfidenceMeter.
9. **Status** — a StatusPill.
10. Row-hover `MoreHorizontal` menu: `Open`, `Approve and post`, `Reassign nominal`, `Mark as duplicate`, `Request a better copy`.

Rows: 40 per page with working pagination (`‹ 1 2 3 … 33 ›`), showing `Showing 1–40 of 1,284`. Sorting works on Date, Gross and Confidence. Clicking anywhere on a row except the checkbox routes to `/inbox/[id]`.

### Bulk action bar

When one or more checkboxes are ticked, a floating bar rises from the bottom centre: `ink.800` background, radius 16, height 64, padding `0 20px`, floating shadow, `220ms` slide-up. Contents: `{n} selected` in white 14/600, a vertical divider at `rgba(255,255,255,0.15)`, then buttons `Approve and post`, `Assign nominal`, `Request better copies`, `Dismiss`. `Approve and post` runs the posting animation from section 15 on every selected row in sequence, then fires a toast: `6 documents posted to Xero · £14,820.44`.

### Three rows that must behave specially

- One row is mid-flight on load with status `Extracting` and an indeterminate shimmer across its numeric cells; after `3.5s` it resolves to `Needs review` with a toast `New document from Travis Perkins needs a nominal code`.
- One row flagged `Duplicate` shows, on hover, a tooltip naming the original: `Matches INV-4471 from Jewson, posted 12 Oct 2026, £2,184.60.`
- One row flagged `Failed` has gross/net/VAT shown as `—` and a tooltip `Scan is 142 DPI and the VAT box is cropped. A better copy has been requested.`

## 8. Page — Review screen (`/inbox/[id]`)

This is the screen that sells the product. Give it the most care.

**Header row:** a `← Back to inbox` link in `slate.500` 14/500, then on one line the page title `Travis Perkins Trading Company Ltd` at 32/800 with a StatusPill beside it, and beneath it a breadcrumb line in 14/500 `slate.500`: `Mercer Construction Ltd · Received 21 Oct 2026, 08:14 · harlow@in.ledgerline.co.uk`. Right-aligned: `‹ Previous` / `3 of 7` / `Next ›` navigation that actually moves through the review queue.

**Layout:** two panes, `52% / 48%`, `20px` gap, both full height with independent scroll.

### Left pane — document preview

A white card, radius 20, padding 0, containing:

- A toolbar strip, height 56, bottom border `line`: left, the file name `INV-TP-884210.pdf` 13/500 `slate.500` and a `· 1 of 2 pages` counter; right, icon buttons `ZoomOut`, a `100%` label, `ZoomIn`, `RotateCw`, `Download`, `Maximize2`. Zoom in and out must actually scale the preview between 60% and 200%.
- The document itself, rendered **as real HTML and CSS, not an image**: a white A4-proportioned sheet on a `#E7EBF2` backing, with `0 2px 8px rgba(10,16,51,0.10)`, containing a faithful UK trade invoice — supplier letterhead block with address and company number, `VAT Invoice` heading, invoice number, invoice date, account number, delivery address, a line-item table (description, qty, unit price, VAT code, net), a totals block (Goods total, VAT at 20%, Total due), payment terms, and a footer with VAT registration number and registered office. Build this as a reusable `<InvoiceSheet>` component driven by data so every document in the dataset renders its own real-looking invoice.
- Extracted fields are **highlighted on the document**: a `rgba(37,99,235,0.14)` rounded-4 box with a `1.5px blue.600` border around each value the agent read. Hovering a field in the right pane raises the corresponding highlight to `rgba(37,99,235,0.28)` and scrolls it into view. Hovering a highlight does the reverse. This two-way link is the single most convincing detail on the screen — implement it properly.

### Right pane — extraction

Stacked cards, `16px` gaps:

**Card 1 — Agent assessment.** `ink.800` background, radius 16, padding 20, white text. A `Sparkles` icon in a `32px` `blue.600` rounded-10 tile, then `Agent assessment` 13/600 at `rgba(255,255,255,0.6)`, then the verdict in 15/500 white:

> Read with 97% average confidence. Supplier matched to an existing contact with 46 prior postings. Totals reconcile. The nominal code is ambiguous: this supplier has been split between 310 Materials and 320 Subcontractor costs on this client, so I have not posted it.

Beneath, three small metric chips at `rgba(255,255,255,0.08)`: `Read in 3.2s`, `46 prior postings`, `Totals reconcile ✓`.

**Card 2 — Extracted fields.** White card, title `Extracted fields` with a right-aligned `Edit all` toggle. Each field is a row, height 60, bottom-bordered `line.soft`: label in 13/500 `slate.500` on the left (160px fixed), value in 15/600 `navy.900`, and a ConfidenceMeter right-aligned. Every value is an inline-editable input — clicking turns it into a bordered field, Enter commits, Escape reverts, and committing an edit drops that field's confidence badge and replaces it with a `blue.100`/`blue.600` chip reading `Edited by you`.

Fields and values, in this order:

| Field | Value | Confidence |
| --- | --- | --- |
| Supplier | Travis Perkins Trading Company Ltd | 99% |
| Supplier VAT number | GB 345 7625 71 | 98% |
| Invoice number | INV-TP-884210 | 99% |
| Invoice date | 14 Oct 2026 | 99% |
| Due date | 30 Nov 2026 | 94% |
| Currency | GBP | 100% |
| Net | £3,142.80 | 98% |
| VAT | £628.56 | 98% |
| Gross | £3,771.36 | 99% |
| Purchase order | MC-2026-0417 | 86% |
| Delivery site | Unit 4, Barking Riverside | 91% |

**Card 3 — Line items.** A compact table of five rows (description, qty, unit price, net, VAT code) with a total row in 600. Each row has its own small confidence dot. A footnote in 13/500 `slate.500`: `Line totals sum to the invoice net. No rounding difference.`

**Card 4 — Posting.** White card, title `Posting`. Three controls stacked:

- `Nominal code` — a searchable select, currently empty with placeholder `Choose a nominal code`, bordered `amber.500` with a `1.5px` ring because it is the blocker. Below it, a suggestion row: two tappable chips, `310 · Materials purchased` marked `Used 31 of 46 times` and `320 · Subcontractor costs` marked `Used 15 of 46 times`. Picking one fills the select, clears the amber ring, and reveals a third chip `Always use this for Travis Perkins on Mercer Construction` with a toggle, default on.
- `VAT treatment` — select, pre-filled `20% Standard rate`, with a help tooltip explaining why domestic reverse charge does not apply here (`This is a materials-only supply with no labour element, so CIS reverse charge is out of scope.`).
- `Post to` — a select showing `Xero · Mercer Construction Ltd` with the Xero-style tile. Disabled with a tooltip `Set at client level in Rules & integrations.`

**Card 5 — Validation checks.** A list of six check rows, each a `20px` icon then the check name in 14/500 and a result:

1. ✓ `Net plus VAT equals gross` — `green.500`
2. ✓ `VAT rate consistent with line items` — `green.500`
3. ✓ `VAT registration number format valid` — `green.500`
4. ✓ `No duplicate in the last 180 days` — `green.500`
5. ✓ `Supplier on file` — `green.500` with `46 prior postings` in `slate.400`
6. ⚠ `Nominal code not determined` — `amber.500` with `Awaiting your selection` in `amber.700`

**Action bar.** Sticky to the bottom of the right pane, white, top border `line`, padding `16px 20px`. Left: `Reject` (ghost, `red.700` text) and `Request a better copy` (ghost). Right: `Approve and post` — solid `blue.600`, height 48, radius 12, padding `0 28px`, white 15/600, **disabled until a nominal code is chosen**, with a tooltip on the disabled state reading `Choose a nominal code first.` Pressing it runs the posting animation (section 15), fires a toast `Posted to Xero · INV-TP-884210 · £3,771.36`, and advances to the next item in the review queue.

## 9. Page — Chasers (`/chasers`)

Title `Chasers`. Subtitle `The agent has sent 61 follow-ups this month and recovered 54 documents.`

Tab bar: `Open` (5) · `Awaiting reply` (9) · `Resolved` (54) · `Paused` (2).

**Row 1: three StatCards** — `Send` / `Chases sent this month` / `61`; `CheckCircle2` / `Recovery rate` / `88.5%` / badge `↑ 4.1%`; `CalendarClock` / `Average time to recovery` / `2.4` suffix `days`.

**Main area: a two-pane split, `38% / 62%`.**

*Left — chaser list.* Scrollable column of ChaserCards, `12px` gaps. Each card: white, radius 16, `line` border, padding 18. Selected card gets a `1.5px blue.600` border and `blue.50` fill. Contents: client monogram and name in 14/600, a StatusPill, the reason in 14/500 `navy.600`, the contact name and email in 13/500 `slate.500`, and a footer row with an escalation indicator — three `6px` dots where filled dots are `amber.500` — plus a relative timestamp.

The five open chasers:

| Client | Reason | Stage | Last sent |
| --- | --- | --- | --- |
| Mercer Construction Ltd | 4 fuel receipts on the company card have no supporting document | 2 of 3 | 4 days ago |
| Harlow & Vane Interiors | The Farrow & Ball invoice scan is unreadable below 150 DPI | 1 of 3 | 2 days ago |
| Calder Fit-Out Group | A £4,180 card payment to Howdens has no invoice | 3 of 3 | 9 days ago |
| Thameside Joinery Ltd | Subcontractor UTR missing for J. Okafor, blocking CIS | 2 of 3 | 5 days ago |
| Kenwright Electrical Services | September bank statement not received | 1 of 3 | 1 day ago |

*Right — chaser detail.* A white card with:

- Header: client name 22/700, contact name and role, a `Pause chasing` ghost button and a `Mark resolved` solid button.
- A `Missing items` block listing each outstanding item as a row with a date, a description, an amount, and a `Matched`/`Missing` pill.
- An escalation ladder rendered as three horizontal steps connected by a `2px` rail: `Day 0 · Friendly reminder` (sent), `Day 4 · Direct request` (sent), `Day 10 · Escalate to the practice` (scheduled, shown dashed in `slate.400`). Completed steps carry a `blue.600` filled circle with a white tick and the actual send date.
- A **drafted email** panel: a bordered box styled like an email client — `From: Ledgerline on behalf of Harbourfield & Co`, `To: dmercer@mercerconstruction.co.uk`, `Subject: 4 card payments on your October statement need receipts`, then the body in a serif-free 14/400 with proper paragraphs, listing the four transactions in a bordered mini table (date, merchant, amount), and a sign-off. The body is editable in place. Below it: `Send now` (solid), `Schedule for Monday 09:00` (ghost), `Rewrite` (ghost — opens a small menu: `Firmer`, `Warmer`, `Shorter`).
- A thread history below the draft: previous sends and the client's replies, as alternating bubbles — agent sends left-aligned white with a `line` border, client replies right-aligned `blue.100`. Include two real exchanges, one of which ends with the client attaching two of the four receipts, and an agent note in `slate.500` italics: `2 of 4 items matched automatically on 17 Oct.`

Clicking `Send now` fires a toast `Chase sent to David Mercer`, advances the escalation ladder, moves the card to `Awaiting reply`, and decrements the sidebar count.

## 10. Page — Clients (`/clients`, `/clients/[id]`)

Title `Clients`. Subtitle `9 clients connected. 1,284 documents handled this month.`

**Row 1:** a GradientCard variant with three segments — `Clients connected` `9`; `Documents this month` `1,284`; `Average auto-post rate` `86.1%`. Right-aligned outline button `Connect a client`.

**Row 2: client cards**, a 3-column grid, `20px` gaps. Each card: white, radius 20, padding 24, hover lifts by `2px` with the hover shadow. Contents:

- A `48px` monogram tile in the client's assigned tint, the client name 17/700, the sector in 13/500 `slate.500` (`Construction`, `Interior design`, `Property`, `Professional services`, `Marketing`).
- A `line.soft` divider, then a 3-column micro-stat row: `Docs` (October count), `Auto-post` (percentage), `In review` (count).
- A `6px` rounded auto-post progress bar coloured `blue.600`.
- A footer row: the ledger system chip (`Xero` or `QuickBooks` or `Sage`, as a small rounded-8 tile with the first letter and the name), the VAT quarter end date, and a right-aligned StatusPill — `All current` (green) or `3 items open` (amber).

The nine clients and their October figures (these must sum to 1,284):

| Client | Sector | Ledger | Docs | Auto-post | In review | VAT quarter end |
| --- | --- | --- | --- | --- | --- | --- |
| Mercer Construction Ltd | Construction | Xero | 312 | 88% | 2 | 31 Oct 2026 |
| Harlow & Vane Interiors | Interior design | Xero | 208 | 91% | 1 | 31 Dec 2026 |
| Calder Fit-Out Group | Construction | Sage | 186 | 79% | 2 | 30 Nov 2026 |
| Thameside Joinery Ltd | Construction | Xero | 154 | 84% | 1 | 31 Oct 2026 |
| Brompton Studio Design | Interior design | QuickBooks | 121 | 93% | 0 | 31 Jan 2027 |
| Kenwright Electrical Services | Construction | Xero | 98 | 81% | 1 | 30 Nov 2026 |
| Ashcombe Property Group | Property | Xero | 87 | 90% | 0 | 31 Dec 2026 |
| Lindhurst Partners LLP | Professional services | QuickBooks | 74 | 94% | 0 | 31 Oct 2026 |
| Verity Marketing Ltd | Marketing | Sage | 44 | 86% | 0 | 31 Jan 2027 |

**Client detail (`/clients/[id]`)** — a full page, not a drawer. Title is the client name with the sector beneath. Four StatCards (`Documents this month`, `Auto-post rate`, `Open items`, `VAT position`), then a tab bar: `Overview` · `Documents` · `Suppliers` · `Settings`.

- *Overview*: a 12-month volume line chart for that client, a `Top suppliers` table (supplier, postings, total net, usual nominal code), and a `Connected systems` card showing the inbox address `mercer@in.ledgerline.co.uk` with a copy button, the ledger connection with a green `Connected` pill and `Last synced 14 minutes ago`, and a bank feed row.
- *Documents*: the same DataTable as the inbox, pre-filtered to this client.
- *Suppliers*: a table of that client's suppliers with a learned-rule column, e.g. `Always 310 · Materials purchased` with a `31 of 46` confidence note and an `Edit` link.
- *Settings*: auto-post threshold slider, per-nominal exclusions, who receives chasers, CIS status toggle.

Every client card routes correctly. All nine detail pages must render with that client's own data — no shared stub page.

## 11. Page — VAT & CIS (`/vat`)

Title `VAT & CIS`. Subtitle `3 VAT returns and 2 CIS returns are in preparation.`

Tab bar: `VAT returns` · `CIS returns` · `Reverse charge`.

### VAT returns tab

A client selector row at the top (pill buttons, `Mercer Construction Ltd` selected by default), then:

**Period card:** `Quarter ending 31 October 2026` 22/700, `Submission due 7 December 2026` in `slate.500`, a `47 days remaining` chip in `blue.100`/`blue.600`, and a right-aligned `Draft` StatusPill in amber.

**The nine-box return**, rendered as a proper HMRC-shaped grid: a 2-column layout of bordered boxes, each with the box number in a `28px` `ink.800` rounded-8 tile, the legend in 13/500 `slate.500`, and the figure in 24/700 `navy.900` right-aligned with tabular figures. Boxes 3 and 5 get a `blue.50` fill to mark them as calculated.

| Box | Legend | Value |
| --- | --- | --- |
| 1 | VAT due on sales and other outputs | £84,312.60 |
| 2 | VAT due on acquisitions from Northern Ireland | £0.00 |
| 3 | Total VAT due (boxes 1 and 2) | £84,312.60 |
| 4 | VAT reclaimed on purchases and other inputs | £51,904.18 |
| 5 | Net VAT to pay HMRC | £32,408.42 |
| 6 | Total value of sales excluding VAT | £421,563 |
| 7 | Total value of purchases excluding VAT | £318,740 |
| 8 | Total value of supplies to EU member states | £0 |
| 9 | Total value of acquisitions from EU member states | £0 |

Below the grid, a `Readiness` card listing four checks with tick or warning icons: `1,247 of 1,259 documents reconciled`, `12 bank transactions unmatched`, `No VAT treatment conflicts found`, `Reverse charge applied to 31 subcontractor invoices`. The unmatched line is a link that routes to the inbox filtered to unmatched items.

Action bar at the bottom of the card: `Review line by line` (ghost), `Export for filing` (ghost), `Submit to HMRC` (solid `blue.600`, opens a confirmation modal that lists the figures again and requires ticking `I confirm these figures are correct` before the submit button enables). Submitting fires a toast and flips the pill to `Submitted`.

### CIS returns tab

`Monthly return for the period ending 5 November 2026`, contractor `Mercer Construction Ltd`, due `19 November 2026`.

Three StatCards: `Subcontractors paid` `5`; `Total payments` `£47,450.00`; `Total deductions` `£6,010.00`.

Then the subcontractor table:

| Subcontractor | UTR | Status | Gross | Materials | Labour | Rate | Deduction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| J. Okafor Groundworks | Missing | Unverified | £12,400.00 | £3,200.00 | £9,200.00 | 20% | £1,840.00 |
| Teale Plastering Ltd | 4738291056 | Verified | £8,650.00 | £1,150.00 | £7,500.00 | 20% | £1,500.00 |
| R. Castellan Roofing | 9182736450 | Unmatched | £6,200.00 | £900.00 | £5,300.00 | 30% | £1,590.00 |
| Pinner Electrical Contracts | 6273849150 | Gross status | £14,800.00 | £4,300.00 | £10,500.00 | 0% | £0.00 |
| Hollis Scaffolding Ltd | 1029384756 | Verified | £5,400.00 | £0.00 | £5,400.00 | 20% | £1,080.00 |

The J. Okafor row is highlighted `amber.100` at 30% opacity with a warning icon and an inline note: `UTR not supplied. The 20% rate has been applied provisionally — an open chase is tracking this.` The note links to that chaser.

### Reverse charge tab

An explainer card at the top in `blue.50` with a `1px blue.100` border: two short paragraphs on the CIS domestic reverse charge in plain language, and the three conditions the agent tests for. Then a table of the 31 invoices where reverse charge was applied this quarter, with columns Supplier, Client, Date, Net, `VAT shown`, `VAT accounted`, and a `Why` column whose cell is a tooltip trigger explaining the specific test that fired. Include a footer summary: `Reverse charge applied to £94,218.40 of subcontractor labour this quarter. No VAT was paid to these suppliers.`

## 12. Page — Activity (`/activity`)

Title `Activity`. Subtitle `Every action the agent has taken, with the reasoning behind it.`

Toolbar: a SearchInput, an `Action type` multi-select (`Extracted`, `Posted`, `Held for review`, `Duplicate blocked`, `Chase sent`, `Rule learned`, `Reverse charge applied`, `Reversed by user`), a `Client` select, a date range, and a right-aligned `Export audit trail` ghost button.

The feed is grouped under sticky date headers — `Today · 21 October 2026`, `Yesterday · 20 October 2026`, `Monday · 19 October 2026` — each header a 13/600 `slate.500` row on the `canvas` background.

Each entry is a full-width white card, radius 16, padding 20, with:

- A `40px` rounded-12 tile, coloured by action type: posted `green.100` with a `green.700` `Check`; held `amber.100`/`amber.700` `PauseCircle`; duplicate `red.100`/`red.700` `Copy`; chase `#F3E8FF`/`#7E22CE` `Send`; rule learned `blue.100`/`blue.600` `Lightbulb`; reversed `#EDF1F7`/`slate.500` `Undo2`.
- A headline in 15/600 `navy.900` with the entity in `blue.600` — e.g. `Posted INV-TP-884210 from Travis Perkins to 310 Materials purchased`.
- A reasoning line in 14/500 `slate.500` — the *why*, which is what makes this page worth building: `Supplier matched on VAT number. Totals reconciled. Confidence 98.4%, above the 95% auto-post threshold for this client.`
- A metadata row of small chips: client name, amount, confidence, duration (`1.9s`).
- A right-aligned relative timestamp and a `View document →` link.
- Entries where a human intervened carry a left edge rail `3px blue.600` and an extra line: `Priya Raghunathan changed the nominal code from 310 to 320 before posting.`

Seed at least **60** entries spread across the last 14 days, weighted so today has 12–16 and older days taper. Mix all action types. Four of them must be user interventions. At least one must be a reversal with the reason `Reversed after the client confirmed the invoice was raised in error.`

Infinite scroll: loading 20 more on scroll-to-bottom, with a `Load earlier activity` button as the fallback.

---

## 13. Page — Rules & integrations (`/rules`)

Title `Rules & integrations`. Tab bar: `Posting rules` · `Learned rules` · `Integrations` · `Inbox addresses`.

**Posting rules tab.** A card per rule group.

- *Auto-post threshold*: a working slider from 80% to 100%, currently `95%`, with live text beneath that recalculates from the dataset: `At 95%, 1,061 of 1,284 documents this month would post without review.` Dragging the slider must genuinely recompute that number against the confidence values in the data. This is the single most impressive interaction on the page — make it exact.
- *Always hold for review*: a list of toggle rows — `Invoices over £5,000` (on), `New suppliers` (on), `Credit notes` (on), `Foreign currency` (on), `Any document where VAT does not reconcile` (on, locked with a tooltip `This check cannot be disabled.`).
- *Duplicate detection*: a select for the lookback window (`180 days`), and three checkboxes for the match keys — supplier, gross amount, invoice number.
- *CIS*: a toggle `Apply the domestic reverse charge automatically` (on) and a select `When a UTR is missing, deduct at` → `30% (unverified)` with the current value `20% (provisional, pending verification)`.

**Learned rules tab.** A table of 24 rules the agent has inferred, columns: Supplier, Client, Rule (`→ 310 · Materials purchased`), Evidence (`31 of 46 postings`), Confidence, Created, and an actions column with `Edit` and `Forget`. Clicking `Forget` opens a confirm modal and then removes the row with a toast. Sortable by Evidence and Confidence.

**Integrations tab.** A 3-column grid of connection cards. Each: a `48px` rounded-12 tile with the service initial on a brand-tinted background, the service name 16/700, a one-line description, a StatusPill (`Connected` green / `Not connected` grey), and for connected ones a `Last synced` line plus a `Manage` ghost button. Cards: Xero (connected, 6 clients), QuickBooks Online (connected, 2 clients), Sage Business Cloud (connected, 2 clients — note that one client can appear on two ledgers during migration, so the counts need not sum to 9; if that is confusing, make it 6/2/1 and leave Sage at 1), Microsoft 365 mail (connected), Google Workspace mail (connected), Companies House (connected — used for supplier verification), HMRC Making Tax Digital (connected, with `Agent services account` noted), Dropbox (not connected), Stripe (not connected).

**Inbox addresses tab.** A table of the nine client inbox addresses (`mercer@in.ledgerline.co.uk` etc.), each with a copy-to-clipboard button that actually works and fires a toast, the forwarding status, documents received this month, and the authorised sender list rendered as removable chips with an `+ Add sender` control.

## 14. Data specification

The data is the difference between something that looks real and something that looks generated. Follow this precisely.

### Volume

Generate **220 full document records** in `lib/data/documents.ts`, deterministically (a seeded pseudo-random function in the file — never `Math.random()`, or the numbers change on every render). The aggregate counters (1,284 this month, 1,061 auto-posted, and so on) are defined as constants that the UI displays, while the 220 records are what the tables page through. Make the inbox pagination report `1,284` and page through the 220 cycling with distinct ids and dates so no two visible rows are identical.

### Suppliers — use these, no invented generic names

Trade and materials: Travis Perkins, Jewson, Screwfix, Toolstation, Howdens Joinery, SIG Roofing, City Plumbing Supplies, Wickes, Selco Builders Warehouse, Buildbase, MKM Building Supplies, Keyline Civils.

Interior and finishes: Farrow & Ball, Little Greene Paint Company, Dulux Decorator Centre, Amtico International, Karndean Designflooring, Original BTC, Vescom UK, Camira Fabrics.

Plant and vehicles: Speedy Hire, HSS Hire, A-Plant, Shell Fuel Card, BP Fuelcard, Enterprise Flex-E-Rent.

Overheads and services: British Gas Business, EE Limited, BT Business, Amazon Business, Royal Mail, DPD Local, Hiscox Insurance, Simply Business, Adobe Systems Software Ireland, Microsoft Ireland Operations, Dropbox International, Companies House, Clerkenwell Serviced Offices, Pret A Manger, Uber Britannia, Trainline.

Subcontractors: J. Okafor Groundworks, Teale Plastering Ltd, R. Castellan Roofing, Pinner Electrical Contracts, Hollis Scaffolding Ltd, Varney Tiling Services, Deakin Carpentry Ltd.

Each supplier record needs: legal name, trading name where different, a plausible UK VAT number in the format `GB 123 4567 89`, a company number (`08` or `09` or `12` prefix, 8 digits), a real-looking UK address, a default nominal code, a default VAT treatment, and a posting count.

### Nominal codes — Xero standard chart

`200 Sales`, `310 Materials purchased`, `320 Subcontractor costs`, `325 Plant hire`, `329 Direct labour`, `400 Advertising`, `408 Cleaning`, `412 Consulting and accountancy`, `429 General expenses`, `433 Insurance`, `437 Interest paid`, `441 Legal expenses`, `445 Light, power, heating`, `449 Motor vehicle expenses`, `453 Office expenses`, `461 Printing and stationery`, `463 IT software and consumables`, `469 Rent`, `473 Repairs and maintenance`, `477 Salaries`, `485 Subscriptions`, `489 Telephone and internet`, `493 Travel — national`, `494 Travel — international`, `497 Bank fees`.

### VAT treatments

`20% Standard rate`, `5% Reduced rate`, `0% Zero rated`, `Exempt`, `No VAT`, `20% Reverse charge (CIS)`. Distribution across the dataset: roughly 68% standard, 8% zero rated, 4% reduced, 3% exempt, 5% no VAT, 12% reverse charge.

### Per-document fields

`id` (format `doc_` + 8 hex), `clientId`, `supplierId`, `fileName`, `fileType` (pdf 78%, jpg 14%, png 5%, heic 3%), `fileSizeKb`, `receivedAt` (ISO), `invoiceNumber`, `invoiceDate`, `dueDate`, `currency`, `net`, `vat`, `gross`, `nominalCode`, `vatTreatment`, `confidence` (per-field map plus an average), `status`, `postedAt`, `postedBy` (`agent` or `Priya Raghunathan`), `validations` (the six checks with pass/warn/fail and a message), `lineItems`, `agentNote` (the human-readable reasoning), `duplicateOf`, `pageCount`, `sourceEmail`.

**Arithmetic must hold on every single record.** `net + vat = gross`, to the penny. `vat` must equal `net × rate` rounded half-up to 2dp, except on reverse-charge records where `vat = 0` and a `vatAccounted` field carries the notional 20%. Line items must sum to `net`. Write a script or an assertion that checks all 220 records at build time and fails loudly if any break. Amounts should range from `£8.40` (a Pret receipt) to `£34,280.00` (a Howdens kitchen order), log-distributed so most sit between £80 and £2,500.

### The seven review-queue items — define these by hand, not generated

| Supplier | Client | Gross | Reason held |
| --- | --- | --- | --- |
| Travis Perkins Trading Company Ltd | Mercer Construction Ltd | £3,771.36 | Nominal code ambiguous — split history between 310 and 320 |
| Howdens Joinery Ltd | Calder Fit-Out Group | £34,280.00 | Above the £5,000 hold threshold |
| Farrow & Ball Ltd | Harlow & Vane Interiors | £842.16 | Scan quality too low to read the VAT box |
| Varney Tiling Services | Calder Fit-Out Group | £6,900.00 | New supplier, no posting history, CIS status unverified |
| Speedy Hire Plc | Thameside Joinery Ltd | £1,248.00 | VAT does not reconcile — £208.00 declared, £207.99 calculated |
| Adobe Systems Software Ireland Ltd | Brompton Studio Design | €612.00 | Foreign currency, reverse charge on services |
| Amazon Business EU | Kenwright Electrical Services | £487.22 | Mixed VAT rates across 14 line items |

Each of these needs a full `InvoiceSheet` render, a complete field set with per-field confidences, a real agent note, and the six validation results. These seven carry the demonstration — spend disproportionate effort on them.

### People

Client contacts, used in chasers and on client pages: David Mercer (Mercer Construction, Managing Director), Imogen Vane (Harlow & Vane, Studio Director), Stephen Calder (Calder Fit-Out, Operations Director), Amrit Dhillon (Thameside Joinery, Finance Manager), Bea Brompton (Brompton Studio, Founder), Neil Kenwright (Kenwright Electrical, Director), Saoirse Ashcombe (Ashcombe Property, Portfolio Manager), Michael Lindhurst (Lindhurst Partners, Managing Partner), Verity Osei (Verity Marketing, Founder).

Practice staff appearing in the activity log: Priya Raghunathan (Bookkeeping Manager), Tom Arkwright (Bookkeeper), Nadia Hussain (VAT Specialist), Giles Harbourfield (Principal).

### Formatting helpers in `lib/format.ts`

`gbp(n)` → `£3,771.36` always 2dp with thousands separators; `gbpCompact(n)` → `£1.84m`, `£482.6k`; `count(n)` → `1,284`; `pct(n, dp)` → `82.6%`; `dateLong(d)` → `14 Oct 2026`; `dateShort(d)` → `14/10/2026`; `relative(d)` → `2 hours ago`, `4 days ago`, `yesterday`, `just now`, computed against `TODAY`; `duration(ms)` → `3.2s`. Every number on screen goes through one of these. No inline `toLocaleString` calls scattered through components.

## 15. Simulated agent behaviour

Static screens look like a design file. Motion makes it look like software. Implement all three of these in `lib/agent.ts` as a shared state machine, driven by `setTimeout` chains that are cancelled cleanly on unmount.

### A. The processing run — fired by `Process queue` in the top bar

Opens a modal, width 640, titled `Processing inbox`. Inside, a list of six documents that step through states, one starting every `700ms`, each taking `2.4s` to complete:

```
received → extracting → validating → { posted | held | duplicate }
```

Each row shows: supplier monogram, supplier name, file name, a right-aligned state. `extracting` shows a 3-dot pulse and the sub-label `Reading page 1 of 2`. `validating` shows a 2px indeterminate bar. `posted` shows a green tick that scales in from 0.6 over `180ms` plus the gross amount. `held` shows an amber pause icon and the reason. `duplicate` shows a red copy icon and the matched invoice number.

Outcomes for the six, fixed: 4 posted, 1 held (`New supplier — no posting history`), 1 duplicate (`Matches INV-4471 from Jewson`).

When all six finish, the modal footer animates in a summary: `4 posted · £9,184.22 · 1 held for review · 1 duplicate blocked` with a `Review held item` button and a `Done` button. Closing updates every counter on the dashboard and inbox, prepends six entries to the activity log, and fires a toast.

### B. The posting animation — fired by `Approve and post` on the review screen

Three beats, `1.6s` total:

1. `0–400ms` — the button label swaps to a spinner and `Posting…`, the right pane dims to 60%.
2. `400–1100ms` — a green progress sweep crosses the top of the action bar; the Posting card's `Post to` row shows `Writing to Xero…`.
3. `1100–1600ms` — the StatusPill in the header flips to `Posted`, a green tick circle scales in over the document preview at 40% opacity then fades, the toast fires, and after `300ms` the route advances to the next review item.

### C. The ambient tick — runs on every page

A low-frequency background effect that makes the product feel live without being distracting:

- Every `45s`, the top-bar `Process queue` chip briefly shows `1 new document` in `blue.600` for `4s`, then reverts.
- Every `90s`, one new entry is prepended to the dashboard activity feed with a `280ms` slide-and-fade-in, and the `Processed this month` hero figure increments by one with a brief `blue.100` flash behind it.
- The clock chip in the top bar advances in real time from `09:42`.
- The green dot beside `Agent active` pulses on a `2s` loop at all times.

Cap the ambient tick: stop incrementing after 8 increments so the figures never drift far from the stated totals, and pause everything when the tab is hidden (`document.visibilityState`). Disable all of section C under `prefers-reduced-motion`.

## 16. Copy and tone

The agent speaks like a competent colleague, not like a chatbot. No exclamation marks. No emoji anywhere in the product. No `AI-powered`, `revolutionary`, `seamless`, `supercharge`, `unlock`, `effortless`, or `magic`. The word `AI` appears nowhere in the interface — the product is described by what it does, not by how it is built.

**Voice rules:**

- Agent notes are first person and specific: `I have not posted this` beats `This document requires attention`.
- Always give the reason and the evidence together: `Held because this supplier has no posting history on this client` not `Held for review`.
- Numbers in prose are written as they appear in the data: `46 prior postings`, not `many previous postings`.
- Buttons are verbs: `Approve and post`, `Request a better copy`, `Send now`, `Forget rule`. Never `Submit`, `OK`, `Click here`.
- Error and warning copy names the fix: `Choose a nominal code first` not `Invalid input`.

**Terminology, fixed:** nominal code (not account code or GL code), VAT treatment, auto-post, held, posting, reconcile, ledger, practice, client, supplier, chase, domestic reverse charge, UTR, CIS deduction.

**Page titles** in the browser tab: `Dashboard · Ledgerline`, `Document inbox · Ledgerline`, and so on. Root metadata description: `Bookkeeping automation for UK accountancy practices.`

**Number rules:** currency always 2dp except in compact form on charts; percentages 1dp; counts with thousands separators; durations in seconds with 1dp under 10s and whole seconds above. Negative currency in parentheses, `(£412.00)`, in red only when it represents an amount owed to the client.

## 17. Responsive and accessibility

**Breakpoints.** The product is desktop-first and will be shown on a laptop, so `1440px` is the reference width — design and test there first. Then:

- `≥1440px` — full layout as specified.
- `1280–1439px` — sidebar stays, grid columns reflow (dashboard row 2 stacks to full width), page gutter drops to `32px`.
- `1024–1279px` — sidebar collapses to a `76px` icon rail with tooltips on hover; the review screen's two panes stack with the preview on top at a fixed `560px` height.
- `<1024px` — sidebar becomes an off-canvas drawer opened by a hamburger in the top bar; all grids go single column; tables become horizontally scrollable within their card, never squashed. The inbox table switches to a stacked card list below `768px`.

Nothing may overflow the viewport horizontally at any width from `360px` up. Test `360`, `768`, `1024`, `1280`, `1440`, `1920`.

**Accessibility floor:**

- Every interactive element reachable by keyboard, in a sensible tab order, with a visible focus ring: `2px blue.600` offset `2px`.
- Modals and drawers trap focus, close on Escape, and return focus to the trigger.
- Every icon-only button has an `aria-label`.
- Charts have an `aria-label` summarising the series and a visually hidden table of the values.
- Status is never conveyed by colour alone — every pill carries text, every validation row carries an icon shape.
- Body text contrast ≥ 4.5:1; `slate.400` is used only for text at 14px or larger on white, and never for anything a user must read to act.
- `lang="en-GB"` on the html element.

## 18. Build order and acceptance

**Build in this order.** Do not start a later step until the earlier one renders correctly — this prevents the usual failure where the data model gets retrofitted to the UI.

1. `tailwind.config.ts` with every token from section 3. Then a scratch page rendering a swatch of every colour, every type style, and one of each shared component. Check it before going further.
2. `lib/types.ts`, `lib/constants.ts`, `lib/format.ts`.
3. The full dataset with the build-time arithmetic assertion.
4. `lib/derive.ts` — every aggregate the UI shows, computed from the data.
5. Shell: sidebar, top bar, routing, all eight routes rendering their title.
6. Shared components.
7. Dashboard, then inbox, then the review screen, then the rest.
8. The agent animations.
9. The sweep below.

**Then run this sweep, line by line. Do not declare the build complete until every box is genuinely ticked, having been checked by actually running the app, not by reading the code.**

- [ ] `npm run build` completes with zero TypeScript errors and zero ESLint warnings.
- [ ] `grep -ri` across the whole repo for: demo, sample, placeholder, lorem, dummy, mock, prototype, TODO, FIXME, coming soon, test data. Zero hits in anything that reaches the DOM.
- [ ] Every one of the eight sidebar links navigates to a page that renders real content. Click all eight.
- [ ] Every tab on every page switches content. Count them: inbox 6, chasers 4, VAT 3, rules 4, client detail 4.
- [ ] Every button fires a visible effect. List them page by page and press each one.
- [ ] Zero console errors or React warnings in the browser on any page, including key warnings and hydration mismatches.
- [ ] Every table sorts, every filter filters, every search returns real matches, pagination moves.
- [ ] On every one of the 220 documents: net + VAT = gross, and line items sum to net. Verified by the assertion, not by eye.
- [ ] Dashboard aggregates equal the sum of the underlying rows. Client doc counts sum to 1,284. Auto-posted plus routed equals the month total on every bar in the volume chart.
- [ ] All nine client detail pages render that client's own data. Open all nine.
- [ ] All seven review-queue items open a complete review screen with a rendered invoice sheet, full field list, validations, and a working approve flow. Open all seven.
- [ ] The two-way hover link between extracted fields and document highlights works in both directions.
- [ ] The auto-post threshold slider recomputes its sentence from the real confidence data at 80, 88, 95 and 100.
- [ ] The processing modal runs to completion and updates counters, feed and toasts.
- [ ] Approve-and-post advances to the next queue item and the queue count decrements everywhere it appears, including the sidebar badge.
- [ ] Copy-to-clipboard actually writes to the clipboard.
- [ ] Resize to 360, 768, 1024, 1280, 1440 and 1920. No horizontal overflow, no overlapping text, no clipped cards at any width.
- [ ] Tab through every page start to finish. Focus is always visible and never trapped outside a modal.
- [ ] Escape closes every modal and drawer.
- [ ] Set `prefers-reduced-motion` and confirm all animation stops.
- [ ] Hard refresh on every route — no page depends on state set by a previous route.
- [ ] Deep-link directly to `/inbox/[id]`, `/clients/[id]` for a valid id and confirm it renders; for an invalid id confirm a proper not-found page, styled to match, with a link back.
- [ ] Leave the app open for five minutes and confirm the ambient tick does not drift the figures into nonsense or leak timers.
- [ ] Open in a fresh private window at 1440px and walk the full story from section 1 end to end without touching anything outside the product.

**Edge cases to handle before finishing:** an invoice with 14 line items and mixed VAT rates rendering without breaking the sheet layout; a supplier name long enough to wrap in a table cell; a `£34,280.00` figure not overflowing its stat card; the €612.00 foreign-currency document showing both the euro amount and a converted sterling equivalent; a client with zero items in review showing a proper positive state rather than an empty box; the activity feed at the end of its data showing a clean terminal state rather than a spinner that never stops.

When the sweep is complete, state plainly which boxes were verified by running the app and which, if any, were not.
