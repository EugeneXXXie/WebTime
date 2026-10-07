# Main-domain groups implementation plan

**Goal:** Count concurrent subdomains once per main domain, with collapsed, expandable subdomain charts.

**Architecture:** Keep hostname records for detail views and add a separate main-domain interval bucket for accurate overlap accounting. Resolve main domains offline using the bundled ICANN Public Suffix List. Preserve old browser totals and hostname records; label historical sums that may contain overlaps.

**Tech stack:** Manifest V3, vanilla JavaScript, local SVG/CSS charts, bundled tldts ESM, Node test runner and Playwright.

- [x] Add regression tests for Bilibili/Google grouping, multi-part suffixes, IP addresses, overlapping intervals, hostname changes, checkpoint recovery and backup migration. Run `node --test tests/groups.test.js` and verify failure before implementation.
- [x] Add offline domain resolution and version-3 group records in `tracking/core.js`; migrate old storage in `storage/storage.js`. Validate complete group coverage and bounded, consistent backup totals. Retain child statistics and browser union accounting.
- [x] Add collapsed group rows and child duration bars to `dashboard/app.js` and `dashboard/style.css`. Persist disclosure state during refresh; support keyboard access, child search, group/child detail routes and narrow screens. Use grouped summaries in the popup and ring.
- [x] Translate group controls and the historical overlap explanation in all eight languages. Update tracking explanations, architecture, changelog and package/manifest version to 1.2.1.
- [x] Run `npm test`, real Chrome UI/extension checks and formatting. Add Chrome regression coverage for grouping, expansion, refresh, search and import/export. Review the diff and inspect a real rendered screenshot before delivery.

Accepted detail behavior: children show their own duration; their sum can exceed the group's deduplicated duration. Google search and Gmail belong to the same group. No manual domain mapping or new permissions.
