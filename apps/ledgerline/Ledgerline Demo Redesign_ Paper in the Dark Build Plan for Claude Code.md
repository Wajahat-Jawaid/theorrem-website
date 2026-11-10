# Ledgerline Demo Redesign: "Paper in the Dark" — A Build-Ready Plan for Claude Code

**Rebuild the demo around one cinematic moment: a bright paper invoice arrives on a near-black green stage, a scan beam reads it, its fields fly into a Xero-ready ledger card, and the money and hours saved roll up — all within 5 seconds of load, with no click needed.** The current build fails not because it is cluttered or ugly, but because it *describes* automation (a how-it-works strip, a hero card of static numbers, a "See it work" button) instead of *showing* it the instant the screen appears. Research on first impressions, attention capture and sales demos all points the same way: lead with the result, make the agent visibly work, and give every screen one peak moment.

## TL;DR

- **Direction:** Replace the light "private-bank green" with a dark, cinematic "Paper in the Dark" theme — near-black green canvas (#050B09), luminous mint signal (#4BE3A0), brass for money (#E2B65C), Bricolage Grotesque + Geist — where every document is rendered as bright paper, so the eye lands on the thing the agent is processing.
- **Hero:** On load, play a choreographed 5-second sequence (email lands → invoice unfolds → scan beam → six fields fly into a ledger card → "Posted to Xero" → counters roll to 309 of 312 / 15.6 hours / £184,920.40), then fall into a quiet ambient loop, under the headline "312 invoices arrived. You touched 3."
- **Build:** Keep the stack; add only `@number-flow/react` and optionally copy 2–3 Magic UI (v3 site, Tailwind 3) components; no WebGL/three.js. Give each of the other three screens one "peak" (decision card zoom, live-typed chase email with a simulated reply landing, VAT boxes filling from source documents), add a presenter bar with keyboard shortcuts, and gate everything behind reduced-motion.

## Key Findings (what the research says, and what it means for Ledgerline)

**1. You have a twentieth of a second, and it measures looks, not logic.** Lindgaard and colleagues (Carleton University, *Behaviour & Information Technology*, 2006) found that visual-appeal ratings after a 50 ms exposure closely matched those after 500 ms.\[1\] Careful readings of the study stress that it measured *visual appeal* only — not trust or purchase intent — and that what wins the glance is simplicity and familiarity rather than novelty.\[2\] Implication: the first frame must be compositionally simple (one dark field, one bright object, one headline) even though the next five seconds are rich. Busy dashboards lose the glance; a single luminous document on a dark stage wins it.

**2. Beauty buys forgiveness, but only early and only for small issues.** Nielsen Norman Group defines the aesthetic-usability effect as "users' tendency to perceive attractive products as more usable", and warns it masks minor problems, not large ones.\[3\] Grishin and Gillan's 2019 *Journal of Usability Studies* paper ("Exploring the Boundary Conditions of the Effect of Aesthetics on Perceived Usability") failed to show the hypothesised effect and concluded that if it exists early on, "the effect is not a strong one, and repeated experience with a system reduces it further". For a one-off pitch on a laptop, that early window is exactly where Ledgerline lives — which is why polish here has unusually high return.

**3. Motion onset is the strongest attention lever — and the easiest to misuse.** Motion and colour are preattentive features that "pop out" regardless of how many distractors are present.\[4\] A 2026 *International Journal of Human–Computer Interaction* study found dynamic stimuli capture attention faster than static ones "particularly when task-relevant, though irrelevant animation may cause distraction"; accelerated motion beat uniform and decelerated motion for initial capture; and "bottom-to-top and zoom-in transitions elicit surprise, while hard cuts predominantly evoke boredom".\[5\] Abrams and Christ (*Psychological Science*, 2003) showed that "motion per se does not automatically attract attention" but "the onset of motion does indeed attract attention", and later work found "animate" (lifelike) motion captures attention faster than inanimate motion. Implications: (a) only one thing moves at a time; (b) the moving thing must *be* the product working (the invoice being read), never decoration; (c) use zoom-in transitions for peak moments; (d) after the hero sequence, ambient motion drops to near-still so the presenter can talk.

**4. "Do the last thing first."** Peter Cohan's *Great Demo!* method — show the end result first, then peel back layers — was later echoed by Gong.io's analysis of 67,149 recorded SaaS sales demos, where winning demos "start with the conclusion, rather than end with it". The current Overview opens with a 3-step explainer; that is the *first* thing, not the last. The new hero opens on the outcome ("You touched 3") and lets the animation explain the how.

**5. Peak and end, not average.** Kahneman's peak-end research (Kahneman, Fredrickson, Schreiber & Redelmeier, 1993; Redelmeier, Katz & Kahneman, 2003) shows remembered experience is dominated by its most intense moment and its ending.\[6\]\[7\] Each screen therefore gets exactly one engineered peak, and the demo ends on the VAT screen with the biggest, calmest, most reassuring number.

**6. The pain is real and quantifiable for UK owners.** The 2026 American Express / Small Business Saturday UK SME Business Barometer (1,000 UK owners) found they spend an average of 11 hours a week on admin or finance tasks, and 54% say paperwork gets in the way of running their business.\[8\] Ledgerline's 15.6 hours saved per month should be framed against that number — the owner already *feels* it.

**7. Agent UIs that impress show the work, then ask permission.** 2025–2026 agent-UX practice converges on: a visible plan, streaming tool output (cited as the highest-value improvement by teams that shipped agents in 2025–2026), completed steps ticked while the active step pulses, confidence signals, and a clear human checkpoint.\[9\]\[10\] A CSCW 2025 companion study ("Exploring the Impact of Process Transparency on User Experience in AI Design Agents") found users "reported higher levels of trust, satisfaction, and willingness to use under high transparency conditions". In finance specifically, Ramp's Agents for AP (October 2025) "get 85% of accounting fields right the first time" and summarise vendor history before recommending approval; Ramp's Accounting Agent "surfac[es] only those that need human attention"; Digits' Accounting Agents run workflows end to end, "pausing only when human judgment is necessary".\[11\]\[12\]\[13\] Ledgerline's story is the same shape — and the UI should look like it: a reading agent, a short checklist, and a single human decision.

**8. Dark is now the premium fintech signal — but the "Linear look" is the default AI aesthetic.** Mercury runs a near-black canvas (#171721) with off-white text and a single cobalt accent reserved for the primary action, positioning it closer to luxury brands than to consumer fintech (per third-party design-system teardowns).\[14\]\[15\] At the same time, the dark-glow "Linear look" (near-black, purple glows, bento grids, thin lines) is, in BuildMVPFast's 2026 teardown, "the default output of every AI design tool, which is the whole problem" — tools such as v0, Lovable and Bolt reproduce it by default. So: go dark, but own a hue nobody in the reference set uses (green-black, not navy or violet), and make the hero object a *physical* paper document rather than a glowing abstract shape.

**9. Interactive demos are mainstream; the best are short, ungated and lead to one action.** Navattic's 2025 report (28,000+ demos) found the top 1% had 84.4% of users advance past step one and an average 2.1 minutes of engagement, and 72% of top-performing demos used no form.\[16\]\[17\] The 2026 edition reports 18% of 5,000 B2B SaaS sites now carry an interactive-demo CTA.\[18\] For Ledgerline: the whole story must fit in about 2 minutes, with one obvious next click on each screen.

## Recommended Art Direction: "Paper in the Dark"

**Rationale.** The single most arresting composition available to a bookkeeping product is a bright, real-looking document lit against darkness — maximum luminance contrast, an instantly recognisable object (every SMB owner knows what an invoice looks like), and a natural stage for the agent's "reading" to happen on. Keeping green preserves the money/trust association and the existing brand DNA, but pushing it to near-black with a luminous mint signal makes it cinematic rather than corporate. It is distinct from every reference: Stripe (multicolour light), Mercury (indigo-black), Linear (violet-black), Xero (blue), Ramp (yellow/light). Brass is reserved strictly for pounds, so money always glows the same colour. This direction directly fixes the user's complaint — the old build was "clean"; this one has drama, focus and motion with a purpose.

### Colour tokens (Tailwind `theme.extend.colors` + CSS variables)

| Token | Hex | Use |
|---|---|---|
| `ink-950` (canvas) | #050B09 | App background |
| `ink-900` (raised) | #0A1511 | Panels, nav |
| `ink-800` (card) | #10201A | Cards on canvas |
| `ink-700` (line) | #1C3229 | Hairline borders (1px) |
| `text-hi` | #ECF3EF | Primary text (never pure white) |
| `text-mid` | #9DB3A8 | Secondary text |
| `text-lo` | #5E7A6D | Labels, captions |
| `signal` (mint) | #4BE3A0 | Agent activity: scan beam, ticks, active states |
| `signal-soft` | rgba(75,227,160,0.16) | Field highlight fills |
| `brass` | #E2B65C | Money figures only (£), primary CTA |
| `brass-deep` | #B8892E | CTA pressed / brass text on paper |
| `amber` | #FFB547 | "Needs your OK" attention dots |
| `alert` | #FF6B5B | Missing paperwork, errors |
| `paper` | #FBFAF6 | Invoice/receipt/email surfaces |
| `paper-ink` | #1A1F1C | Text on paper |
| `paper-rule` | #E4E1D8 | Lines on paper |

### Background and surface effects

- **Aurora (CSS only, no WebGL):** `background: radial-gradient(60% 50% at 72% 28%, rgba(75,227,160,0.16), transparent 70%), radial-gradient(45% 40% at 18% 82%, rgba(226,182,92,0.09), transparent 70%), #050B09;` Drift the first layer's position ±3% over 18s, `ease-in-out`, infinite alternate — almost imperceptible.
- **Grain:** an inline SVG `feTurbulence` noise layer at `opacity: 0.035`, `mix-blend-mode: overlay`, fixed. Removes the flat "template" feel.
- **Stage vignette:** `radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)` over the hero only.
- **Paper shadow:** `0 40px 80px -20px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)`.
- **Card on canvas:** `bg-ink-800/80`, `border border-white/[0.06]`, inner top highlight `inset 0 1px 0 rgba(255,255,255,0.05)`.
- **Signal glow (active only):** `0 0 0 1px rgba(75,227,160,0.45), 0 0 28px rgba(75,227,160,0.22)`.
- **Glass:** only on the top nav — `bg-ink-900/70 backdrop-blur-md`. Nowhere else (cost and cliché).
- **Radii:** 6px chips, 12px cards, 20px stage panels, 2px paper documents (paper isn't rounded), 999px pills.

### Typography (all via `next/font/google`)

- **Display:** Bricolage Grotesque, weights 600 and 700, `opsz` axis on; tracking −0.035em at display sizes. Characterful, slightly editorial, not a default SaaS face.
- **UI/body:** Geist, weights 400/500/600.
- **Figures and document data:** Geist Mono 500 for invoice fields and reference numbers; money in Geist 600 with `font-variant-numeric: tabular-nums`.
- **Type scale at 1440px** (scale display ×0.82 at 1280px):
  - Display: 88px / 0.95 / 700
  - H1: 56px / 1.0 / 600
  - H2: 32px / 1.15 / 600
  - H3: 20px / 1.3 / 600 (Geist)
  - Hero counters: 64px / 1.0 / Geist 600 tabular, brass for £
  - Body: 16px / 1.55 / 400
  - Small: 14px / 1.45
  - Label: 12px / 1.3 / 500, uppercase, tracking 0.08em, `text-lo`

### Dark vs light: the verdict

Dark wins the first glance for this product because the hero object is a document: a light document on a light page has no contrast to pull the eye; on a dark stage it becomes the only bright thing on screen. Keep the *whole* app dark for continuity (switching to light screens mid-pitch reads as a different product), but render every document, email and HMRC box as paper so reading-heavy content stays dark-on-light. Contrast checks: `text-hi` on `ink-950` and `paper-ink` on `paper` both comfortably exceed WCAG AA; never put `text-lo` below 12px. One caveat: a popular 2026 developer guide asserts that roughly 47% of people have some astigmatism and find light-on-dark text harder to focus — another reason to keep long-form reading on paper surfaces.\[19\]

**Can the forest-green direction be pushed?** Yes — the problem was never the hue but the *light, flat, evenly weighted* treatment. Forest #0B3D2E survives as a mid-tone inside the aurora; it should not be a background.

### Alternate direction: "Site Office" (light, high-energy)

For a daylight pitch room or a client who dislikes dark UIs: pure white canvas #FFFFFF, ink #0B0F0D, hairlines #E7E9E6, signal green #00A86B, and a hi-vis highlighter #D9FF3D used *only* as the marker swipe over extracted fields (a deliberate nod to construction sites and highlighter pens on paper invoices). Fonts: Archivo (variable, width axis at 112–125 for display, weight 800) + Inter for UI. Surfaces: flat white with 1px rules, zero shadows except the document (which gets a hard 0 1px 0 + 0 24px 48px −24px rgba(0,0,0,0.18)). Motion: the same choreography, but the scan is a highlighter swipe (`clip-path` reveal of #D9FF3D at 70% opacity, `mix-blend-mode: multiply`). Less cinematic, more tactile; second choice because it is less arresting at first glance.

## The First 5 Seconds (Overview hero at 1440×900)

**Layout.** Full-viewport dark stage under a 56px glass nav. Left column (5/12): label "MERCER CONSTRUCTION LTD · OCTOBER", headline, three counters, one brass CTA. Right column (7/12): the stage — a narrow `InboxRail` (3 stacked email stubs) on its far left, the `PaperInvoice` at centre (tilted, perspective 1200px), and the `LedgerCard` ("Ready for Xero") on the right.

**Headline:** "312 invoices arrived. You touched 3." Sub-line (`text-mid`, 18px): "Ledgerline read, sorted and posted the rest to Xero — and drafted your VAT return."

**Timeline (all times from first paint; orchestrate with `useAnimate` sequences from motion):**

| t (ms) | What happens | Duration / easing |
|---|---|---|
| 0 | Canvas is #050B09; aurora and grain fade in | 800ms, ease-out-expo |
| 150 | Label fades up (y 8→0) | 400ms |
| 250 | Headline words rise with blur 8px→0, stagger 70ms per word | 520ms each, ease-out-expo |
| 700 | New email stub drops into top of `InboxRail` ("Brockley Builders Merchants · Invoice BBM-48211"), mint dot pulses once | spring stiffness 380, damping 30 |
| 1000 | `PaperInvoice` zooms out of the email: scale 0.86→1, rotateX 14°→4°, rotateZ −2°, opacity 0→1 | 650ms spring (stiffness 220, damping 24) |
| 1600–2800 | `ScanBeam` sweeps top→bottom: 2px mint line + 60px soft glow trail, starts with ease-in (accelerating, for capture) then constant | 1200ms, cubic-bezier(0.55,0,0.45,1) |
| 1800 / 2050 / 2300 / 2500 / 2650 / 2800 | As the beam passes each field, a mint outline draws round it (SVG stroke-dashoffset, 220ms) and a `FieldChip` detaches and flies on a curved path into the `LedgerCard`: Supplier → Date → Net £1,240.00 → VAT (20%) £248.00 → Total £1,488.00 → Category "Materials" | each flight 520ms spring (stiffness 260, damping 26); 1-frame mint flash on landing |
| 3000 | `LedgerCard` shows "Posted to Xero ✓"; one-shot border beam runs once round the card | 900ms |
| 3100–4500 | Counters roll with NumberFlow: "309 of 312 done for you" → "15.6 hours given back" → "£184,920.40 sorted" (brass), staggered 250ms | 1200ms each, spin timing ease-out |
| 4600 | CTA appears: brass button "3 need your OK →" with three amber dots that pulse once | 300ms fade + 1 pulse |
| 5000+ | Ambient loop: every 6s a smaller document (receipt, utility bill) runs the same pipeline at 2× speed, beam opacity 60%; a mono ticker under the stage reads "Reading Speedy Hire receipt… VAT £42.50 found… Filed under Plant hire" | loops pause when tab hidden or hero off-screen |

**Rules for the hero:** nothing else on screen moves during t = 1000–3000ms; no autoplay sound; the sequence plays once per session automatically and then replays on demand (Space or the "Watch it again" text link); under reduced motion, render the end state instantly (ledger card filled, counters at final values, beam hidden).

**What it communicates in five seconds:** email in → document read → numbers extracted correctly → posted to Xero → here is your time and money back → here are the only three things that need you. That *is* the 3-step strip, so delete the strip.

## Screen-by-Screen Redesign

### 1. Overview → "The Stage" + Today board

- **Above the fold:** the hero described above.
- **Below the fold (one scroll, 1440px):** a three-card row:
  - **`BeforeAfterCard`** — a split bar: "Doing it yourself: 15.6 hours of typing and filing" (long, grey, hatched) vs "With Ledgerline: 6 minutes approving 3 items" (short, mint). Bars animate width-by-`scaleX` when scrolled into view (600ms). This replaces the bar chart.
  - **`NeedsYouCard`** — the 3 approvals as paper thumbnails fanned like cards (rotate −6°, 0°, 6°); hover lifts one (y −8px, 200ms).
  - **`ChaseCard`** — 3 missing receipts shown as dashed empty slots next to bank lines, with "Chasing 3 suppliers — next email 9:00 tomorrow".
- **Replace** "What we did today" feed with **`AgentTicker`**: one live sentence at a time in Geist Mono, typed at 18ms/char, past lines fading to 40% and collapsing after 4 lines.
- **Cut:** the 3-step how-it-works strip, the forest-green hero card, the separate "See it work" button (the hero *is* the demo), the recharts bar chart.

### 2. Needs your OK → "Decision Card" (focus mode)

- **Transition in:** zoom-in, not a page cut — the chosen thumbnail scales up to fill the stage (shared `layoutId`, 450ms spring), background dims to 85%.
- **Layout:** the paper invoice centred-left (560px wide), the decision panel right (440px).
- **Wow element — evidence highlights:** the agent's question is shown with its reasoning as 2–3 short "why I'm asking" lines, each linked to a pulsing mint region on the document. Example for item 1: "**Is this for the Peckham job or the office?**" — "Delivery address is 14 Rye Lane, Peckham (site), but the order was placed by your office email." Hover a reason → the document region glows and a hairline connector draws between them (SVG path, 250ms). Keep the existing two-way field linking but restyle it as these connectors.
- **Big choices:** 2–3 full-width buttons (64px tall) with keyboard hints `1` `2` `3`; a confidence pill under the question ("I'm 92% sure it's the Peckham job").
- **Peak moment on approve:** the document shrinks and flies into a stack labelled "Xero" in the nav (520ms spring), a brass seal "Added to Xero" stamps briefly (scale 1.4→1, 180ms), the nav badge counts 3→2 with NumberFlow, and the next card slides up (bottom-to-top, the "surprise" direction). After the third: "All clear. Nothing else needs you this month." on an empty, calm stage.
- **Cut:** any secondary metadata tables; the right-hand full field list moves behind a "Show all 14 fields" disclosure.

### 3. Missing paperwork → "The Chase"

- **Layout:** three rows. Left: the bank transaction ("Speedy Hire · £510.00 · 12 Oct") as a mono bank line. Middle: a dashed paper-shaped empty slot labelled "Receipt missing". Right: the drafted email.
- **Wow element — closing the loop live:**
  1. Click "Send all 3 reminders" → each draft finishes typing out its last line (18ms/char), then folds into an envelope and flies off-screen right (400ms).
  2. 2.5s later, a "Reply from Sam at Speedy Hire — 1 attachment" notification drops in (spring).
  3. The attachment flies into the dashed slot, the slot turns to paper, a quick scan beam (600ms) runs, the VAT figure appears, and the row turns mint with "Matched to bank line ✓".
  4. The other two rows show "Sent · we'll nudge again on Thursday" — honest about what happens next.
- **Copy on each draft:** short, polite, British: "Hi Sam, could you send over the receipt for the £510.00 hire on 12 October? It's for our VAT return. Many thanks, David (sent by Ledgerline for Mercer Construction)".
- **Cut:** the static list of drafted emails with no consequence.

### 4. VAT → "The Return, Assembled" (the ending)

- **Layout:** the nine HMRC VAT return boxes as a 3×3 grid of paper tiles, with Box 5 (net VAT to pay) as a large tile spanning the right column.
- **Wow element:** on entering the screen, source documents (tiny paper thumbnails) stream from the left edge into the boxes they feed — sales invoices into Box 1/6, purchase invoices into Box 4/7 — and each box's figure rolls up with NumberFlow as they land (total sequence about 3.5s, staggered 120ms). Box 5 then resolves last, in brass, at 72px: "**£23,418.62** to pay HMRC by 7 December".
- **Readiness:** replace the bar with a ring that closes to 100% as the last box fills, then a checklist: "All 312 documents matched ✓ · 3 approvals done ✓ · 3 receipts chased (2 outstanding — covered by bank evidence) ✓".
- **End state (peak-end):** a calm, large brass CTA "Send to Xero for filing" that, when clicked, morphs into "Ready in Xero — submit through Making Tax Digital in one click". No confetti; one slow brass shimmer across the Box 5 tile (1.4s, once).
- **Cut:** any secondary charts on this screen. It should be the quietest, most certain screen in the demo.

### Global: Presenter mode (for the non-technical presenter)

- **`PresenterBar`** (bottom-centre pill, auto-hides after 2s idle): ← / → move between the 4 screens; Space replays the current screen's peak; `R` resets all demo state; `C` toggles a single-line caption at the bottom ("Ledgerline read this invoice from your inbox and posted it to Xero") so the presenter never has to explain.
- **`?autoplay=1`** runs the whole story hands-free in about 90s (hero → approve 1 item → send chases + reply lands → VAT), for trade-show loops or sending as a link.
- **Personalisation hook:** a hidden `?business=` query param swaps company name, owner first name and logo initials (e.g. an interior design studio), so the presenter can show a prospect *their* name in the hero.

## Motion and Micro-interaction Spec

**Duration tokens:** `instant 0ms` · `micro 120ms` (hovers, presses) · `small 200ms` (chips, toggles) · `medium 320ms` (cards, panels) · `large 520ms` (flights, layout) · `cinematic 1200ms` (scan beam, counters).

**Easing tokens:**
- `out-expo` cubic-bezier(0.16, 1, 0.3, 1) — all entrances
- `in-quart` cubic-bezier(0.5, 0, 0.75, 0) — exits
- `scan` cubic-bezier(0.55, 0, 0.45, 1) — scan beam
- `spring-fly` { type: "spring", stiffness: 260, damping: 26 } — field chips, document flights
- `spring-snap` { type: "spring", stiffness: 400, damping: 34 } — layout and badges

**What animates:** agent actions (reading, extracting, posting, sending), number changes, state changes (needs OK → done), screen transitions (zoom-in), hover lift on interactive cards (y −4px, shadow up).

**What must not animate:** body text after first reveal, navigation, tables, anything during the presenter's explanation after a peak, layout properties (`width`, `height`, `top`, `left` — use `transform`, `opacity`, `clip-path`, `filter` only), more than one focal motion at a time, parallax or scroll-jacking of any kind, infinite pulses (max 2 pulses, then still).

**Reduced motion (`prefers-reduced-motion: reduce`):** wrap the app in `<MotionConfig reducedMotion="user">` (motion's default is "never", so this must be set explicitly); in each choreographed component, check `useReducedMotion()` and jump to the final state;\[20\]\[21\] NumberFlow respects the OS setting by default (`respectMotionPreference` defaults to true);\[22\] the scan beam and ambient loop are not rendered at all; screen transitions become 150ms opacity fades.

## Copy Hooks (UK English, for SMB owners)

- Hero headline: **"312 invoices arrived. You touched 3."**
- Hero sub-line: "Ledgerline read, sorted and posted the rest to Xero — and drafted your VAT return."
- Time counter caption: "15.6 hours given back this month — that's two working days."
- Money counter caption: "£184,920.40 of spending sorted, matched and filed."
- Approvals CTA: "3 need your OK →" / empty state: "All clear. Nothing else needs you this month."
- Decision card: "Is this for the Peckham job or the office?" / "Looks right — add to Xero".
- Chase screen header: "We'll chase them, so you don't have to."
- Chase reply moment: "Sam at Speedy Hire just replied. Receipt matched."
- VAT header: "Your VAT return, assembled."
- VAT figure: "£23,418.62 to pay HMRC by 7 December. Ready when you are."
- Presenter's closing line (caption): "Every month, this is all you'll see."
- Pitch framing line for the presenter's voiceover: UK owners spend an average of 11 hours a week on admin and finance tasks (Amex / Small Business Saturday UK, 2026)\[8\] — "this is those hours, gone."\[8\]

## Libraries and Stack Changes

| Package | Action | Why |
|---|---|---|
| `framer-motion` → `motion` | Optional migration: `npm uninstall framer-motion && npm install motion`, import from `motion/react`.\[23\]\[24\] Pin a version (e.g. `motion@^12`) — the project shipped majors 13 (Aug 2026) and 14 (Oct 2026) in quick succession.\[25\]\[26\] Peer deps include React 18 (`^18.0.0 \|\| ^19.0.0`).\[27\] If the current framer-motion works, staying put is fine. | Same API;\[23\] `useAnimate` sequences for the hero |
| `@number-flow/react` (0.6.2) | Add | Accessible rolling digits, `Intl` formatting for £ (`format={{ style: 'currency', currency: 'GBP' }}`), `NumberFlowGroup` to sync counters, reduced-motion respected by default.\[22\] Note 0.6.0 removed `--number-flow-char-height` in favour of `line-height`.\[28\] Confirm the React 18 peer range with `npm info @number-flow/react peerDependencies`.\[29\] |
| Magic UI (copy-paste) | Optional: copy `BorderBeam` (and possibly `AnimatedBeam` for chip trails) from **v3.magicui.design** — the main site now defaults to Tailwind v4 and React 19.\[30\]\[31\] Requires a shadcn `components.json`; Tailwind 3 keyframes go in `tailwind.config`.\[32\]\[33\] | One-shot border beam on the ledger card |
| Aceternity UI | Skip, or use `Spotlight` only via the Tailwind v3 config snippet\[34\] | Most effects are the generic "AI landing page" look we are avoiding |
| `@react-three/fiber`, Lottie, WebGL gradient libraries | Do not add | Heavy runtime for no storytelling gain; CSS aurora + SVG achieves the effect |
| `recharts` | Remove if no chart remains | Bar chart is cut |
| `lucide-react` | Keep | Icons |

## Build Order (hand to Claude Code in this sequence)

1. **Tokens and fonts.** Add colour tokens, radii, shadows to `tailwind.config.ts`; load Bricolage Grotesque, Geist, Geist Mono via `next/font/google`; create `lib/motion.ts` with the duration/easing tokens; wrap `app/layout.tsx` in `<MotionConfig reducedMotion="user">`. Add `<AuroraBackground />` and `<Grain />`.
2. **Demo state.** Create `lib/demo-store.ts` (a React context or Zustand-free reducer) holding approvals, chases, VAT boxes and a `reset()`; all screens read from it so presenter `R` resets everything.
3. **Hero components.** `DemoStage`, `InboxRail`, `PaperInvoice` (HTML/CSS invoice with field refs), `ScanBeam`, `FieldChip`, `LedgerCard`, `SavingsCounters`, `AgentTicker`; orchestrate in `useHeroSequence()` with `useAnimate` and a single timeline array matching the table above.
4. **Presenter layer.** `PresenterBar`, keyboard handler (`←`, `→`, Space, `R`, `C`), `?autoplay=1` and `?business=` params.
5. **Needs your OK.** `DecisionCard`, `EvidenceHighlight`, `ReasonConnector` (SVG), `ChoiceButtons`, `XeroStackTarget`; shared `layoutId` from Overview thumbnails.
6. **Missing paperwork.** `ChaseBoard`, `BankLine`, `ReceiptSlot`, `TypewriterEmail`, `EnvelopeFlight`, `ReplyArrival` (timed 2.5s after send).
7. **VAT.** `VatBoxGrid`, `VatBoxTile`, `SourceDocStream`, `VatTotal` (Box 5), `ReadinessRing`, `FileCta`.
8. **Overview below-fold.** `BeforeAfterCard`, `NeedsYouCard`, `ChaseCard`.
9. **Reduced-motion and polish pass.** Every choreographed component renders its end state when reduced; remove all decorative motion that fails the "is this the agent working?" test.
10. **QA** (below).

## QA Checklist

- **Viewports:** 1440×900 and 1280×800 (Chrome and Safari on macOS; Chrome and Edge on Windows). Hero headline, three counters and the CTA visible without scrolling at both; nothing overlaps the stage at 1280.
- **Performance:** steady 60fps during the hero on a mid-range laptop (Chrome DevTools Performance, CPU 4× throttled must stay above ~45fps); LCP under 1.5s on local production build (`next build && next start`); CLS 0; no animation of layout properties; at most 2 elements with `filter: blur()` animating simultaneously; `backdrop-filter` only on the nav; ambient loop paused when `document.hidden` or hero not intersecting.
- **Bundle:** first-load JS for `/` under ~200KB gzipped (check `next build` output); no three.js, Lottie or chart library in the bundle.
- **Console:** zero errors and zero warnings (including hydration warnings — all motion components are client components with `"use client"`; no `Math.random()` or `Date.now()` in render).
- **Reduced motion:** with macOS "Reduce motion" on, every screen shows its final state instantly, no scan beam, no ticker typing, counters static.
- **Presenter:** ←/→/Space/R/C work on every screen; `?autoplay=1` completes the full story without input and loops cleanly; `R` restores 3 approvals, 3 chases, empty VAT boxes.
- **Content:** UK spelling and £ formatting everywhere (`en-GB`, two decimals); company and supplier names fictitious; dates consistent (October books, VAT due 7 December).
- **Five-second test:** show the first screen to someone non-technical for 5 seconds, hide it, ask "What does this product do?" — they should say some version of "it does your invoices/bookkeeping automatically". Repeat with 3 people before calling it done.

## Reference Board: What to Borrow

| Reference | Technique that creates the wow | Borrow for Ledgerline |
|---|---|---|
| Stripe homepage (stripe.com) | WebGL animated mesh gradient ("minigl"), skewed section edges;\[35\]\[36\] product animations that explain without copy; Stripe's own engineering guidance keeps most UI animations under 500ms\[37\] | Animation-as-explanation; sub-500ms UI motion; the aurora (in CSS, not WebGL) |
| Stripe Sessions 2026 (stripe.com/sessions) | Oversized light editorial headlines, one prismatic diagonal visual signature\[38\] | One signature visual (paper in the dark), huge confident headline |
| Mercury (mercury.com) | Dark canvas #171721, off-white text, one accent reserved for the single primary action, cinematic photography\[14\] | Dark-first premium signal; brass reserved for £ and the one CTA |
| Linear (linear.app) | Near-black, hairline borders, restrained glows, product always on screen\[39\] | Hairlines and restraint — but avoid the violet-glow/bento clichés |
| Ramp Agents for AP / Accounting Agent (ramp.com) | Agent codes fields, summarises vendor history, recommends approval; surfaces only exceptions\[40\]\[41\] | "Only what needs you" framing; reasoning shown before approval |
| Digits Accounting Agents (digits.com) | Agents run workflows end to end, pausing only for human judgment\[11\] | The pause-for-judgment moment as the Decision Card |
| Xero JAX (xero.com) | "AI financial superagent" (Sept 2025), works over email/WhatsApp\[42\]\[43\] | Familiar UK reference point; keep Xero as the destination, Ledgerline as the worker |
| Basis (getbasis.ai) | Long-running agents returning finished work for review\[44\]\[45\] | "Finished work, ready for review" tone on the VAT screen |
| NumberFlow (number-flow.barvian.me) | Smooth, accessible digit-roll transitions\[46\] | All counters and badges |
| Magic UI v3 (v3.magicui.design) | Border Beam, Animated Beam\[31\] | One-shot beam on the ledger card |
| Navattic State of the Interactive Product Demo 2025/2026 (navattic.com) | Benchmarks for short, ungated, CTA-led demos\[17\]\[47\] | ~2-minute story, one action per screen, `?autoplay=1` shareable link |
| *Great Demo!* (Peter Cohan) | "Do the last thing first"\[48\] | Open on the outcome, not the explainer |

## Caveats

- Many specific design-token claims about Mercury and Linear come from third-party design-system teardown sites, not the companies themselves; treat hex values as approximations and use them as inspiration, not copies.\[49\]\[50\]
- Vendor performance figures (Ramp's 85% first-time field accuracy; Digits' claims) are self-reported, based on internal data.\[12\]\[51\]\[52\]
- The 50 ms finding concerns visual appeal only, and the aesthetic-usability effect is weaker and shorter-lived than often claimed — the demo must still be *correct* and legible; polish does not rescue a confusing story.\[1\]\[53\]
- Library ecosystems are moving fast (motion shipped two majors in 2026; Magic UI and Aceternity now default to Tailwind v4).\[25\]\[30\]\[54\] Pin versions and prefer copied source over live dependencies for the demo.
- All figures in the demo (312 documents, 15.6 hours, £184,920.40, £23,418.62) are illustrative; the presenter should say so if asked, and the `?business=` personalisation should never imply real client data.
- The "hours saved" framing should not be over-claimed in the pitch: UK admin-time surveys vary widely by method and sample, so cite one named source (Amex/Small Business Saturday UK) rather than mixing figures.\[55\]\[56\]\[57\]

## Sources

1. [The Psychology of First Impressions: What Your Homepage Says in 50 Milliseconds](https://boostbery.com/insights/the-psychology-of-first-impressions-what-your-homepage-says-in-50-milliseconds/)
2. [Fifty Milliseconds: The Judgment Made Before Your Page Finishes Loading](https://iservu.com/blog/website-first-impression-50-milliseconds/)
3. [The Aesthetic-Usability Effect - NN/G](https://www.nngroup.com/articles/aesthetic-usability-effect/)
4. [Deadeye Visualization Revisited: Investigation of Preattentiveness and Applicability in Virtual Environments](https://arxiv.org/pdf/1907.04702)
5. [Full article: Unveiling the User Experience Design of Mobile Animations from the Cognitive and Emotional Perspective](https://www.tandfonline.com/doi/full/10.1080/10447318.2026.2630289)
6. [Peak, End, and Exit: Why Remembered Product Quality Diverges From Experienced Quality](https://productphilosophy.com/articles/peak-end-rule-product-experience)
7. [The Peak-End Rule: Designing Moments That Refer](https://richmsmith.com/blog/the-peak-end-rule-in-customer-experience-designing-moments-that-drive-referrals/)
8. [Small businesses spend more time on admin than growing](https://startupsmagazine.co.uk/small-businesses-spend-more-time-on-admin-than-growing-their-business)
9. [Agent UX: UI Design for AI Agents in 2026](https://fuselabcreative.com/ui-design-for-ai-agents/)
10. [Agentic UX: Frontend Design Patterns for AI Agents in 2026](https://zylos.ai/research/2026-05-28-agentic-ux-frontend-design-patterns-ai-agents/)
11. [Digits Rolls Out AI Agents for Accounting Workflows - CPA Practice Advisor](https://www.cpapracticeadvisor.com/2025/06/23/digits-rolls-out-ai-agents-for-accounting-workflows/163521/)
12. [AP just became autonomous](https://ramp.com/blog/ramp-ap-agents-announcement)
13. [Ramp Launches Accounting Agent to Automate Bookkeeping with Real-Time Close](https://www.prnewswire.com/news-releases/ramp-launches-accounting-agent-to-automate-bookkeeping-with-real-time-close-302686214.html)
14. [Mercury design system](https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e)
15. [Mercury: Cinematic Sophistication in Banking](https://blakecrosley.com/guides/design/mercury)
16. [Top Product Tour Learnings in 2025](https://www.navattic.com/blog/top-product-tour-learnings)
17. [The 6 Best Click Through Demo Software (Tested & Ranked)](https://www.navattic.com/blog/click-through-demo)
18. [State of the Interactive Product Demo 2026](https://www.navattic.com/report/state-of-the-interactive-product-demo-2026)
19. [Linear Design System, Decoded: Tailwind + shadcn](https://www.buildmvpfast.com/blog/linear-aesthetic-tokens-density-keyboard-first-ux-2026)
20. [Framer Motion Guide (2026): Layout and Reduced Motion](https://uithings.com/framer-motion)
21. [Create accessible animations in React](https://motion.dev/docs/react-accessibility)
22. [NumberFlow for React - An animated number component](https://number-flow.barvian.me/)
23. [Framer Motion React Animations: Complete Guide](https://refine.dev/blog/framer-motion/)
24. [Motion & Framer Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
25. [motion npm Package — Installation, Versions & Details](https://olio.my/npm/motion)
26. [motion - npmx](https://npmx.dev/package/motion/versions)
27. [motion](https://npm-browser.pages.dev/package/motion)
28. [Releases · barvian/number-flow · GitHub](https://github.com/barvian/number-flow/releases)
29. [Next.js 15 + React 19 - shadcn/ui](https://ui.shadcn.com/docs/react-19)
30. [Tailwind v4](https://v3.magicui.design/docs/tailwind-v4)
31. [Border Beam](https://v3.magicui.design/docs/components/border-beam)
32. [Magic UI Skill: Install and Use Animated Components](https://uichemy.com/design-skills/magic-ui/)
33. [Magic UI Skill for Claude Code & AI Agents](https://terminalskills.io/skills/magicui)
34. [Aceternity Ui (Grade A) - Claude Skill](https://www.skillsdirectory.com/skills/terminalskills-aceternity-ui)
35. [Gradient Website Design Examples That Pop](https://www.sliderrevolution.com/design/gradient-website-design/)
36. [Gradient Stripe](https://exzenter.github.io/gradient-stripe/)
37. [Connect: behind the front-end experience](https://stripe.com/blog/connect-front-end-experience)
38. [Stripe Sessions 2026 Website Design Reference](https://refto.one/stripe-sessions-2026)
39. [Linear-style website design: what makes it work · Illos.dev](https://illos.dev/guides/linear-style-design)
40. [Tech news: Ramp, Canopy both announce AI-powered bookkeeping solutions](https://www.accountingtoday.com/list/tech-news-ramp-canopy-both-announce-ai-powered-bookkeeping-solutions)
41. [Does Ramp Offer Accounts Payable Software?](https://ramp.com/blog/bill-pay-guides)
42. [The future of small business starts here, with Xero - Xero Blog](https://blog.xero.com/product-updates/jax-xerocon-2025/)
43. [Just Ask Xero JAX Ai Assistant - Upturn Accountants & Advisors](https://upturn.com.au/2025/12/01/just-ask-xero-jax-ai-assistant/)
44. [Basis Raises \$100 Million to Deploy AI Agents for Accounting Firms - CPA Practice Advisor](https://www.cpapracticeadvisor.com/2026/02/24/basis-raises-100-million-to-deploy-ai-agents-for-accounting-firms/178759/)
45. [AI accounting startup Basis raises \$100M at \$1.15B valuation from Accel, GV to automate Big Four drudgery — TFN](https://techfundingnews.com/basis-ai-accounting-100m-1-15b-unicorn/)
46. [Number Flow](https://allshadcn.com/tools/number-flow/)
47. [State of the Interactive Product Demo 2025](https://www.navattic.com/report/state-of-the-interactive-product-demo-2025)
48. [Great Demo!: How To Create And Execute... book by Peter E Cohan](https://www.thriftbooks.com/w/great-demo-how-to-create-and-execute-stunning-software-demonstrations_peter-e-cohan/315679/)
49. [Mercury Banking UI Kit: Indigo and Arcadia - Design](https://www.shadcn.io/design/mercury)
50. [Mercury Design System — Colors, Typography & Tokens](https://oh-my-design.kr/design-systems/mercury)
51. [Digits Adds AI Agents to Accounting Platform](https://www.pymnts.com/news/artificial-intelligence/2025/digits-adds-ai-agents-accounting-platform/)
52. [Ramp Launches Agents for AP to Automate Accounts Payable](https://www.prnewswire.com/news-releases/ramp-launches-agents-for-ap-to-automate-accounts-payable-302576975.html)
53. [On Aesthetics, Usability, and Technical Writing](https://richardrabil.com/2023/05/17/notes-on-further-research-into-aesthetics-and-usability-and-what-it-means-for-technical-writers/)
54. [aceternity-ui — Kortix Marketplace](https://kortix.com/marketplace/secondsky--claude-skills/aceternity-ui)
55. [SMB Administrative Overhead Statistics 2026: Time Cost, Burden by Function, and Delegation ROI](https://stealthagents.com/research/smb-administrative-overhead-statistics-2026)
56. [How Much Admin Work Can Take Over a Businessperson’s Day](https://www.adminandmore.co.uk/blog/how-much-admin-work-can-take-over-a-businesspersons-day-and-how-to-take-back-your-time)
57. [How Much Time UK Small Businesses Lose to Admin](https://www.oryxaiautomations.com/blog/how-much-time-uk-small-businesses-lose-to-admin)
