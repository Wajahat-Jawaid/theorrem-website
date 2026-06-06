# Theorem Master v9

Hard governance reset:
- The old governance section is removed by slicing from id="governance" to the next section.
- A new isolated governance section is inserted with unique class names.
- Final CSS only targets the new unique classes.
- Heading cannot touch the viewport left because it is inside .theorem-gov-wrap.
- Cards are individual grid cards with gaps, not a table.

Replace:
- index.html
- styles.css
- script.js
