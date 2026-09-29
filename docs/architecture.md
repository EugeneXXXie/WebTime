# Architecture

WebTime is an unpacked Manifest V3 extension with no build pipeline and no runtime dependencies.

## Data flow

Browser events → serialized service-worker queue → pure interval accounting → atomic local storage. UI pages request snapshots through extension messages; only the service worker writes production statistics.

- `tracking/core.js` owns hostname normalization, local hour/day splitting, session accounting, summaries and strict version-1 backup validation.
- `background/service-worker.js` queries focus, active tab and idle state; coordinates events, settings changes and backup replacement.
- `storage/storage.js` stores totals and their checkpoint in a single key. A session-only marker prevents browser-restart backfill.
- `shared/ui.js` provides formatting, theme application, favicon fallback, tooltips and DOM-preserving refresh. Demo mode is isolated page memory.
- `dashboard/charts.js` renders local SVG/CSS charts. Views use derived summaries, never a separate source of accounting truth.

## Persistence and recovery

A 20-second timer is an optimization, not a guarantee. A 30-second alarm and browser events also reconcile state. Gaps exceeding 45 seconds are treated as unconfirmed rather than counted blindly. The checkpoint and totals are committed together. Successful imports replace the existing dataset; imports do not merge histories.

The version-1 format retains the same shape as the original ScreenTime release. The WebTime rename changes UI branding and export filenames, not storage keys or backup versions.

## Privacy boundary

Never persist full tab URLs, page titles, query strings or content. Do not add content scripts, remote assets or host permissions without a reviewed requirement. All visible imported data must be escaped; all backup data must be validated before it replaces stored records.

## UI boundary

Keep derived statistics out of the tracking engine. Preserve keyboard focus during refresh, respect system reduced-motion preferences and do not write demo data to production storage. Public screenshots must use synthetic demo data only.
