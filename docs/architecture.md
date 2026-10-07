# Architecture

WebTime is an unpacked Manifest V3 extension with no build pipeline or package-installation requirement. The offline tldts domain parser is bundled in `vendor/` with its license.

## Data flow

Browser events → serialized service-worker queue → pure interval accounting → atomic local storage. UI pages request snapshots through extension messages; only the service worker writes production statistics.

- `tracking/core.js` owns hostname normalization, ICANN main-domain resolution, local hour/day splitting, session accounting, grouped summaries and strict version-3 backup validation with version-1/2 migration.
- `background/service-worker.js` queries all normal-window tabs and OS lock state; coordinates events, settings changes and backup replacement.
- `storage/storage.js` stores totals and their checkpoint in a single key. A session-only marker prevents browser-restart backfill.
- `shared/ui.js` provides formatting, theme application, favicon fallback, tooltips and DOM-preserving refresh. Demo mode is isolated page memory.
- `shared/messages.js` contains English message keys and seven translation columns. `shared/i18n.js` resolves the saved language or the browser's preferred languages, localizes text/accessible labels without replacing controls, and retains original text for reversible language switches. Dynamic messages use named placeholders; dates and duration units use native Intl formatting. Settings default to `language: "system"` for both new and existing installations.
- `dashboard/charts.js` renders local SVG/CSS charts. Views use derived summaries, never a separate source of accounting truth.

## Persistence and recovery

A 20-second timer is an optimization, not a guarantee. A 30-second alarm and browser events also reconcile state. Gaps exceeding 45 seconds are treated as unconfirmed rather than counted blindly. The checkpoint and totals are committed together. Successful imports replace the existing dataset; imports do not merge histories.

Version 2 stores a separate `activity` bucket for the wall-clock union of website intervals. Each normalized domain is counted once even if multiple tabs are open. Domain times may overlap; global totals must not be derived by summing domains. Version-1 data is migrated by summing its historically exclusive intervals. Existing storage keys remain unchanged. Input inactivity and focus do not affect accounting. No content scripts or new permissions are needed.

Version 3 retains `domains` for per-hostname durations and adds `groups` for the union within each registrable domain. The checkpoint stores raw `hosts` alongside main `domains`, with independent session continuity. Changing a child hostname preserves the main-domain session. Summaries and the popup use groups; child detail routes use raw hostname records. Group percentages use summed group time, while the hero and browser charts still use `activity`.

Version-2 migration sums child histories and sets `legacyDaily` only on dates with multiple recorded children. Such dates are labeled because their past overlap cannot be reconstructed; browser history remains unchanged. Version-1 history was exclusive and needs no overlap label. Version-3 imports validate both tables, complete group membership and per-hour bounds against child records and browser activity. Hostname keys remain prototype safe.

The bundled parser uses ICANN rules with private suffix handling disabled, so all subdomains of shared hosting registrable domains also merge. IP and single-label hosts remain independent. The parser never fetches rules or resolves DNS at runtime.

## Privacy boundary

Never persist full tab URLs, page titles, query strings or content. Do not add content scripts, remote assets or host permissions without a reviewed requirement. All visible imported data must be escaped; all backup data must be validated before it replaces stored records.

## UI boundary

Keep derived statistics out of the tracking engine. Preserve keyboard focus during refresh, respect system reduced-motion preferences and do not write demo data to production storage. Public screenshots must use synthetic demo data only.
