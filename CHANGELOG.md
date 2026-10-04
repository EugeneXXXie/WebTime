# Changelog

## Unreleased

### 1.2.0

- Fix detail-page favicon sizing and centering, and hide letter placeholders while favicon images are present.
- Open website detail titles in a new tab using the current domain and HTTPS.
- Add Block Local IPs, disabled by default, with immediate IPv4/IPv6 filtering and preserved historical data.
- Refresh README screenshots with native Chrome favicons and synthetic statistics.
- Add regression coverage for address boundaries, settings persistence, live filtering, image proportions and new-tab links.

### 1.1.0

- Add eight interface languages with system-language detection, a saved manual override, localized dates/time units, and live settings synchronization across open extension pages.
- Count all open, loaded websites regardless of input inactivity or window focus.
- Deduplicate tabs per domain and preserve a separate, non-overlapping browser total.
- Remove idle threshold controls; retain lock, discarded/frozen-tab and private-window exclusions.
- Add version-2 activity buckets with automatic import/storage migration from version 1.

### Repository preparation

- Rename ScreenTime to WebTime across the extension, documentation and new backup filenames.
- Preserve existing local storage keys and version-1 backup compatibility.
- Add English/Chinese documentation, MIT license, contribution and privacy guidance.
- Add reproducible development dependencies, portable browser tests and GitHub Actions checks.

## 1.0.0 — 2026-09-30

- Initial local-only Manifest V3 tracker with Today, 7 Days, 30 Days and website detail views.
- Add popup, usage charts, browser rhythm, themes, motion preferences and JSON backups.
