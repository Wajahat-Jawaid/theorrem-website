---
name: theorrem-feature-pages
description: Build, extend, or polish Theorrem feature marketing and demo pages such as document extraction, customer support, and account reconciliation. Use for page structure, shared brand styling, typography, spacing, product mockups, native workflow animation, responsiveness, or visual QA in the Theorrem website repository.
---

# Build Theorrem feature pages

## Start from the site, not from memory

1. Read the repository `AGENTS.md` completely.
2. Inspect `document-extraction.html`, `styles.css`, `script.js`, and the closest existing feature page before editing.
3. Treat the current rendered website and final effective CSS rules as the source of truth. Later rules in `styles.css` may supersede historical experiments.
4. Reuse the existing header, footer, logo, buttons, reveal behavior, tokens, and interaction patterns. Do not recreate near-duplicates.
5. Give every feature page a unique body class and scope page-specific rules beneath it. Do not change shared selectors merely to repair one page.

## Preserve the visual system

- Keep the experience light, clean, premium, editorial, and product-led.
- Use Inter for interface and marketing copy. Reuse the existing Bai Jamjuree wordmark; do not restyle the logo.
- Use the live CSS variables. The current brand family is `--brand: #005BE2`, `--brand-hover: #0049B8`, `--brand-soft: #EFF6FF`, `--brand-soft-2: #DBEAFE`, with `--brand-rgb: 0, 91, 226`.
- Use `--text: #0d1227` for headings and important values, `--muted: #747b8d` for body copy, `--muted2: #9aa1b2` for tertiary copy, and `--line`/`--line2` for quiet boundaries.
- Never introduce purple as a second brand accent. Use semantic green, yellow, or red only for genuine success, warning, or error states.
- Prefer white and `#f5f8ff`/`--brand-soft` backgrounds, 1px borders, and subtle separation. Avoid excessive gradients, shadows, floating cards, glass effects, and large corner radii.
- Keep marketing content outside product screenshots visually calm. Let the product workflow be the detailed visual focus.

## Use the established layout rhythm

- Use one centered desktop rail: `width: min(1080px, calc(100% - 48px)); margin-inline: auto`.
- At `760px` and below, use `width: calc(100% - 28px)`.
- Use the shared `--section-space` token for normal section padding and inter-section rhythm. It currently resolves to `68px` on both desktop and mobile; do not introduce page-local spacing values unless the composition explicitly requires an exception.
- Align headings, copy, product frames, tables, and CTAs to the same rail. Do not invent slightly different container widths section by section.
- Keep centered heading groups near `760px` wide, their supporting copy near `680px`, and use about `44px` between a heading group and its content (`32px` on mobile).
- Prefer generous whitespace and a few strong sections over dense card grids. Product sections should be screenshot-driven and editorial.

## Apply the type scale consistently

- Feature-page section headings: `42px / 1.16`, weight `700`, letter-spacing around `-.055em`; use `34px / 1.16` on mobile.
- Section labels: `12px / 1.4`, weight `700`, letter-spacing `.1em`, uppercase when appropriate, colored `var(--brand)`.
- Supporting section copy: normally `16px / 1.65`, colored `var(--muted)`.
- Editorial statements may use `21–24px` with about `1.5` line-height; do not make ordinary descriptions this large.
- Product-panel headings: roughly `22–30px`; product UI labels and rows: roughly `12–14px` with comfortable line-height.
- Use strong negative tracking only for large headings. Keep small UI text readable.
- Preserve the approved hero of an existing page unless the user explicitly requests a hero change. For new pages, derive hero scale and spacing from the current feature-page hero rather than the older generic `.hero` rules.
- Keep line lengths intentional. Remove forced `<br>` elements on narrow screens when they create awkward wrapping.

## Build believable product visuals

- Make every screenshot or mockup explain a real workflow with original Theorrem content, realistic records, statuses, values, and destinations.
- Prefer native HTML/CSS/JS product scenes and animations over embedded competitor recordings.
- Keep the marketing journey separate from any interactive product demo.
- Use flat product surfaces: usually an `8px` radius, quiet 1px borders, and little or no shadow. Avoid generic dashboard mosaics and decorative cards without narrative purpose.
- Animate a short, understandable sequence: intake, reasoning or matching, exception handling, approval, and destination. Keep motion restrained and support `prefers-reduced-motion`.
- Ensure controls are either functional, clearly part of a non-interactive visual with appropriate semantics, or absent. Never leave dead marketing buttons.
- Use competitors only for structural inspiration. Do not copy their branding, copy, recordings, or interface content.

## Make responsiveness part of the design

- Check desktop, tablet, and mobile layouts; do not rely on desktop shrinking.
- Collapse multi-column editorial and product layouts before they become cramped. Common transitions are three columns to two near `1100px`, then one near `760px`.
- On mobile, remove fixed heights that clip content, eliminate transforms that cause overflow, stack navigation/content/visual regions, and reduce panel padding to about `22–26px`.
- Preserve readable product UI. Recompose or selectively simplify dense mockups instead of scaling them to illegibility.
- Check horizontal overflow, sticky header behavior, mobile navigation, focus states, and touch target sizes.

## Avoid the mistakes corrected in earlier iterations

- Do not use inconsistent margins or multiple content rails.
- Do not hard-code a new blue or legacy purple when a token exists.
- Do not make every heading hero-sized, overly bold, or tightly packed.
- Do not use low-contrast gray for headings or dark gray for secondary copy inconsistently.
- Do not center every section on mobile; editorial copy usually reads better left-aligned.
- Do not compensate for weak hierarchy with gradients, heavy shadows, oversized rounded cards, or excessive badges.
- Do not append broad `!important` overrides as a default strategy. Add a coherent, page-scoped block and remove obsolete rules when safely in scope.
- Do not break the approved hero, shared navigation, footer, or other pages while styling a new feature page.

## Verify before completion

1. Run the site locally and inspect the page at representative desktop, tablet, and mobile widths.
2. Exercise every navigation item, tab, animation, and CTA on the page.
3. Check the browser console and resolve all errors and missing assets.
4. Run the repository's production build or deployment-equivalent validation. If the site has no build script, run the available syntax and local-browser checks and state that clearly.
5. Run `git diff --check` and review the final diff for accidental global changes.
6. Compare against `document-extraction.html` for brand continuity, not identical feature-specific composition.
