# Testing WebTime

## Automated checks

| Command                  | Scope                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`               | Domain normalization, interval splitting, clock gaps, checkpoints, backup validation and simulated browser-event integration                             |
| `npm run test:ui`        | Browser-rendered dashboard, linked hover, responsive layouts, detail/period routes, focus preservation, themes, search, backups and confirmation dialogs |
| `npm run test:extension` | Real unpacked extension loading in an isolated browser profile, worker messaging/restart, storage, favicon/fallback, settings and popup                  |
| `npm run format:check`   | Source/document formatting                                                                                                                               |

See [CONTRIBUTING.md](CONTRIBUTING.md) for installation and browser prerequisites. The CI workflow runs unit/format checks on Windows and Linux, and browser checks on Linux. A workflow file is not proof that remote CI passed: check the repository's Actions tab after publishing.

## Local verification — 2026-09-30

The 1.1 WebTime source passed 14 core/event/localization test groups, formatting, browser UI checks and a real Chrome extension smoke test on Windows. Browser checks used system Chrome selected with `CHROME_PATH`; branded README screenshots were regenerated and inspected. No test installs into the user's everyday browser profile.

Localization checks cover all eight language catalogs and placeholders, regional locale matching, unsupported-language fallback, old-settings migration, backup validation, a Chinese system default in real Chrome, manual switching across open pages, confirmation dialogs and 390 px layouts. English UI regression tests explicitly select an English browser locale.

The separately downloaded Playwright Chromium 153 binary failed to launch on this machine with `spawn UNKNOWN`, before an extension was loaded. The cause has not been established. The default downloaded-browser path and Linux CI have not been verified successfully here; the CI workflow must receive its first remote run after publication. This does not invalidate the successful system-Chrome checks. If a downloaded browser cannot start on your machine, use `CHROME_PATH` to select a compatible installed browser and report the environment along with the launch error.

Screenshots are generated into ignored `tests/artifacts/`. Public README screenshots are curated copies in `docs/images/`, generated with `?demo` and synthetic statistics. To refresh them, run `npm run test:ui`, inspect the images, and copy `today-dark.png`, `settings-light.png` and `popup.png` to the corresponding public screenshot names. Do not copy images of real usage data.

## Open-tab accounting regression checks (1.1.0)

- Simulate 20 minutes with idle input, two windows and duplicate YouTube tabs: each distinct domain is 1,200 seconds; browser union is 1,200 seconds.
- Verify closing one duplicate retains the domain, closing the last stops it, and locking pauses all domains.
- Verify frozen/discarded/private/internal tabs are excluded, worker recovery is continuous and browser downtime is not backfilled.
- Verify midnight splitting, v1→v2 backup migration and strict v2 round trips.
- Real Chrome smoke tests use localhost and loopback hostnames, multiple background tabs and an extension page in front to verify per-domain deduplication and union totals.

## Main-domain accounting regression checks (1.2.1)

Verified on Windows with system Chrome on 2026-10-07: all 24 unit/event tests, both browser suites and formatting passed. English and Chinese grouped-chart screenshots were rendered and inspected using synthetic fixtures in an isolated extension profile. The new grouped panels were checked in all eight languages at 390 px width. Code review also identified and verified a fix for backup metadata after backward clock changes.

- Simulate 20 minutes with Bilibili and Google subdomains: each main domain counts 1,200 seconds, each child retains 1,200 seconds, and browser union remains 1,200 seconds.
- Cover multi-part ICANN suffixes, wildcard and exception rules (including `www.ck`), shared hosting, IP addresses and prototype-name hosts.
- Verify child closing/switching, midnight splitting, main-domain session continuity and worker checkpoint upgrades.
- Verify version-1/2 migration, unchanged old browser totals, labeled possible historical overlaps, version-3 round trips and rejection of missing/forged group records.
- Real Chrome opens two synthetic subdomain tabs and verifies both child clocks against one main-domain clock and browser union. UI checks cover default collapse, keyboard expansion, preserved focus/expansion after refresh, child search/detail routes, narrow screens and historical import/export.
- Backup UI regression checks export a JSON file through Settings, select that exact file, confirm replacement and compare every saved field after real MV3 import/re-export. Invalid files are rejected before confirmation and preserve existing data. A separate UI case simulates a still-running version-2 worker and verifies that page preflight validation keeps the original backup schema for the worker to migrate.

## Manual acceptance

1. Leave a 20-minute YouTube video open without keyboard input; confirm its website time continues.
2. Open another YouTube tab and GitHub. YouTube counts once, GitHub separately, browser total once.
3. Switch to another application or leave tabs in the background. Loaded websites continue counting.
4. Close one duplicate, then the final tab of a domain. That domain should stop only after the last closes.
5. Lock/unlock and sleep/wake the computer. Lock pauses tracking; long unconfirmed sleep gaps are discarded conservatively.
6. Verify browser restart, internal/private/frozen/discarded tabs, themes, keyboard navigation and backups.
7. Check Today, 7/30 Days and website details. Website shares use website-time totals; the hero and activity charts use the union.
8. Open `www.bilibili.com` and `space.bilibili.com` together. Confirm one Bilibili row; expand it to see both hostname durations. Main-domain time counts once, and child sums may overlap. Google Search and Gmail also share one main-domain clock.

The 20-minute interval is tested with a simulated clock, not claimed as a physical 20-minute viewing session. Real OS lock/sleep delivery and user-profile browser restart still require desktop acceptance. Close unused tabs: passive open pages count whether or not you are watching them.
