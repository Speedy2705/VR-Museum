# UI audit — Batch 9

Date: 2026-07-25  
Reference: `ui.png` (Figma-derived composite)

## Method and scope

The reference composite was inspected at original resolution and compared with
the page/component tree for the home hero, collections, marketplace, checkout,
upload, sign-in, sign-up, and asset states. A live browser capture was planned,
but the local-server capture command was explicitly skipped at the user's
request. The findings below therefore combine the visual reference with the
actual rendered classes, assets, breakpoints, and component states rather than
claiming pixel-diff measurements.

## Screen-by-screen deltas

| Screen | Reference behavior | Delta found | Decision / resolution |
| --- | --- | --- | --- |
| Home hero | Full-bleed dark gallery, centered italic display heading, paired CTAs | Structure, imagery, proportions, and typography already closely match | Keep; no speculative redesign |
| Collections index | Material chips above a two-column collection grid | Chips existed and worked, but could overflow at narrow widths; no empty filtered state | Must-fix: horizontal chip scrolling and themed empty state added |
| Collection detail | Hero back trail followed by information strip and four-up artifacts | Back control was a single link, not a semantic location trail | Must-fix: semantic breadcrumb added |
| Artifact detail | Two-column object/detail view with collection return context | Single back link did not expose hierarchy | Must-fix: Collections → Collection → Artifact breadcrumb added |
| Marketplace | Hero, featured row, All/Free/Paid controls, result grid, price-oriented browsing | Price filtering existed; price sorting and empty-filter UI were absent | Must-fix: Featured/price ascending/price descending sort and empty state added |
| Marketplace detail | Two-column product panel with return context and purchase CTA | Single return link instead of breadcrumb | Must-fix: semantic breadcrumb added |
| Checkout | Restrained cream form, order summary, pending purchase CTA | Layout matches; pending and inline server errors were completed in Batch 8 | Keep |
| Upload | Dark image hero, three-step progress, large cream form | Visual stepper matched, but completed steps were not keyboard controls | Must-fix: completed/current steps are keyboard-accessible buttons |
| Sign-in / sign-up | Cream form panel beside dark gallery artwork | Layout and content hierarchy closely match; metadata was generic | Must-fix: route metadata added |
| Assets / empty states | Typographic empty-cart treatment reused across sparse account states | Empty purchased/uploaded tabs had no designed empty presentation | Must-fix: matching illustrated/typographic empty states added |
| Navbar search | Search iconography appears in the compact navigation | No functional artifact search control | Must-fix: expandable search wired to `/api/artifacts?query=` |
| Wishlist/save | No consistent heart/bookmark affordance appears across the reference cards/details | No implementation present | Deferred intentionally: reference does not justify the feature |

## Responsive audit

- `CategoryStrip`: reduced mobile gutters and card gaps to prevent three-column
  thumbnails from being cropped.
- `ArtifactGrid`: reduced mobile gutters while retaining 1/2/4-column behavior.
- `MarketplaceGrid`: filters and sort now stack cleanly; chip controls scroll
  horizontally rather than forcing viewport overflow.
- `CollectionsGrid`: material chips use the same narrow-screen overflow pattern.
- Remaining desktop art direction uses the existing image aspect ratios and
  `object-cover`, matching the reference's deliberate editorial crops.

## Accessibility and content audit

- Added a consistent high-visibility gold `:focus-visible` ring.
- Added semantic breadcrumbs with `aria-current="page"`.
- The VR modal now has dialog semantics, labelled title, Escape dismissal,
  focus containment, scroll locking, and focus restoration.
- Upload progress steps expose the current step and allow keyboard return to
  completed steps; future steps remain disabled to preserve validation.
- Existing meaningful image alt text was retained. Decorative icons remain
  hidden or embedded in already-labelled controls.
- Cream/ink primary text combinations provide strong contrast. Low-emphasis
  stone text remains reserved for secondary labels at readable sizes; no new
  low-contrast text treatment was introduced.

## Metadata audit

- Added a global title template, canonical metadata base, description, and
  Open Graph defaults.
- Added static metadata for collections, marketplace, cart, checkout, upload,
  assets, about, sign-in, and sign-up.
- Added data-derived title, description, and Open Graph images for collection,
  artifact, and marketplace detail routes.

## Final prioritization

Must-fix and completed: functional design filters/sort, empty states, navbar
search, responsive overflow, breadcrumbs, route metadata, keyboard focus,
modal focus management, and wizard step navigation.

Deferred: wishlist/save because it is not consistently present in `ui.png`;
pixel-level screenshot diffing because the requested local live-capture command
was skipped. No additional visual scope was added.
