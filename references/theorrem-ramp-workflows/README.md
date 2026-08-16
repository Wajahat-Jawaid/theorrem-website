# Theorrem five-workflow homepage section

A standalone static HTML/CSS/JS recreation of the supplied five-card reference.

## Files

- `workflows-section.html` — complete standalone preview
- `workflows-section.css` — all layout, UI scenes and animations
- `workflows-section.js` — pauses animation when cards leave the viewport
- `workflows-section-fragment.html` — integration note

## Integration

1. Copy the `<section class="tw-workflows">...</section>` block from `workflows-section.html` into `index.html`, replacing the current use-case/industry carousel.
2. Add `workflows-section.css` after the existing homepage stylesheet so its scoped `.tw-*` classes are available.
3. Add `workflows-section.js` before `</body>`.
4. Keep `document-extraction.html` and `reconciliation.html` in the same directory as `index.html`.
5. Replace the three temporary hash links when those product pages exist:
   - `#smart-approvals`
   - `#request-automation`
   - `#case-resolution`

The implementation uses only scoped HTML/CSS/vanilla JavaScript. It adds no framework, package manager or build step.
