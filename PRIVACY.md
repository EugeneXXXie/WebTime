# Privacy

WebTime has no server, account, analytics, telemetry or cloud sync. The extension does not transmit usage records to its maintainers.

## What is stored

In `chrome.storage.local`: normalized hostnames, main-domain groups, domain-derived display names, daily/hourly durations, session counts, last activity timestamps, settings and the current accounting checkpoint. Main-domain grouping uses a bundled offline suffix list, with no DNS or network requests. Individual hostname durations are retained for expandable charts. `chrome.storage.session` holds a transient browser-session marker.

Open tabs' URLs are read to determine their hostnames. Full URLs, paths, query strings, page titles and page contents are not saved. Private/incognito tabs and non-HTTP(S) pages are excluded.

Icons are requested through the browser's own `_favicon` extension endpoint using the site's root domain. WebTime does not call a third-party favicon service or load remote scripts, fonts or images directly. The browser manages its own favicon cache.

## Permissions

| Permission | Reason                                                  |
| ---------- | ------------------------------------------------------- |
| `tabs`     | Read hostnames of open tabs                             |
| `idle`     | Pause when the system is locked (input idle is ignored) |
| `storage`  | Save statistics and settings locally                    |
| `alarms`   | Checkpoint and recover the background worker            |
| `favicon`  | Display browser-managed website icons                   |

## Your controls

Export a JSON backup, replace records using a validated backup, or clear statistics in Settings. Clearing statistics retains appearance/tracking settings and starts fresh tracking when eligible browsing resumes. Uninstalling the extension removes its browser-managed storage; exported files remain wherever you saved them. A backup contains browsing domains and timestamps: treat it as private.

Data is retained locally until cleared, replaced or removed with the extension. There is no automatic retention cutoff. It is not separately encrypted by WebTime; people or software with access to your browser profile may be able to read it.

The `?demo` preview contains synthetic data in memory and never writes it into real extension statistics. The development test suite uses isolated profiles and may download browser binaries through Playwright; those tools are not included in the runtime extension.
