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


## v27
- Built directly from the four individually uploaded files:
  - index(2).html
  - styles(2).css
  - script(2).js
  - README(2).md
- Removed the old “For teams who need outcomes” comparison/outcomes section.
- Replaced the quality section with a cleaner Trust System layout.
- Added final color enforcement so purple highlight leaks use the current brand variable.


## v63 latest uploaded files update
- Built from the latest individually uploaded files.
- Added four pages: privacy-policy.html, terms.html, about.html, contact.html.
- Added a styled legal document layout with left-side table of contents.
- Added footer links to Privacy Policy, Terms, About us, and Contact us.
- Added a contact form using mailto:info@theorrem.com.
- Used privacy@theorrem.com in the privacy policy.
- Updated footer social links to https://www.linkedin.com/company/theorrem/.
- Increased industry/use-case slider autoplay speed from 2600ms to 2100ms.
- Replaced real-estate-specific wording with broader global workflow language.


## v64 final touches
- Fixed Theorrem logo font consistency across home, footer, and inner pages.
- Updated Contact sales / Talk to sales actions to open contact.html.
- Replaced the founder/Wajahat-specific About section with a stronger workflow/control/value section.
- Replaced mailto contact form with FormSubmit POST to info@theorrem.com.


## v65 nitpick fixes
- Restored Theorrem wordmark styling across header/footer/inner pages using the existing tech font stack instead of the bad Orbitron override.
- Vertically aligned About page step text against the numbered icons.
- Fixed remaining home CTA/contact links so Contact sales/Talk to sales open contact.html instead of mailto/email app.
- Clarified the contact form submission note.


## v66 fixes
- Restored original Theorrem wordmark styling using Bai Jamjuree instead of the failed tech font override.
- Updated integration count from 20+ to 100+.
- Fixed the final home CTA Contact sales button so it opens contact.html instead of the email app.


## v67 navigation update
- Replaced the old non-existing "Why us" nav item.
- Header now has 5 items: Solutions, Use cases, Quality, Governance, Contact.
- Added/linked `#usecases` for the use-cases section on the home page.


## v68 navigation correction
- Updated nav order to: Solutions, Quality, Use cases, Governance, Start.
- Replaced Contact nav item with Start, linked to the last home CTA section.
- Ensured final home CTA contact buttons still open contact.html, not the email app.


## v72 revert
- Reverted the last section back to the previous 3-step process layout.
- Kept the nav label as "How it works".
- Changed the anchor from #start to #how-it-works.
- Kept Contact sales links opening contact.html.


## v77 usecases-only fix
- Built directly from the user's uploaded pre-animation files.
- No page transition animation added.
- Only fixed the Use cases nav scroll position.
- Added a dedicated invisible offset anchor inside the real use-cases section.


## v78 nav scroll offset only
- Built on v77.
- No animations added.
- No layout, content, or section styling changed.
- Only added the same sticky-header scroll offset behavior to Solutions, Quality, and Governance.
