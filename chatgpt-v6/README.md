# Theorem site — v22

Updates in this build:
- Reconnected the full site color to one theme block.
- Added a working hero text switch animation.
- Replaced the old simple mark with a more custom Theorem wordmark/mark.

## Change theme color
Open `styles.css` and edit only this final block near the bottom:

```css
:root{
  --brand: #005BE2;
  --brand-rgb: 0, 91, 226;
  --brand-hover: #0049B8;
  --brand-soft: #EFF6FF;
  --brand-soft-2: #DBEAFE;
}
```

When changing `--brand`, also update `--brand-rgb` to the same color in RGB form because shadows and transparent backgrounds use it.

## Hero animation
The rotating text is controlled in `script.js` under:

```js
// v22: hero text switch animation
```

Update the `phrases` array to test different copy.

## v23 playbook section changes
- Replaced “Agent playbooks we can build first” with clearer wording: “Workflow automations we can build first”.
- Removed per-card links such as “Talk to sales” / “Learn more”.
- Reduced use-case card heading sizes slightly.
- Removed Pakistan-specific sample text: DHA / PKR / Karachi.
- The brand color is still controlled from the `THEOREM COLOR CONTROL` block in `styles.css`.


## v24 use-case section update
- Applied changes on the latest uploaded files only.
- Replaced the weak/local real-estate-first example with more global, high-pain business workflows.
- Removed Pakistan-specific identity from the visible examples.
- Current six use cases: Marketing, Sales Pipeline, Support, Operations, Commerce, Compliance.


## v24.3
- Removed the “For teams who need outcomes, not another platform” comparison section.
- Left the rest of the page unchanged.
