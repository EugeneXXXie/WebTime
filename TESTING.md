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

## Manual acceptance

1. Leave a 20-minute YouTube video open without keyboard input; confirm its website time continues.
2. Open another YouTube tab and GitHub. YouTube counts once, GitHub separately, browser total once.
3. Switch to another application or leave tabs in the background. Loaded websites continue counting.
4. Close one duplicate, then the final tab of a domain. That domain should stop only after the last closes.
5. Lock/unlock and sleep/wake the computer. Lock pauses tracking; long unconfirmed sleep gaps are discarded conservatively.
6. Verify browser restart, internal/private/frozen/discarded tabs, themes, keyboard navigation and backups.
7. Check Today, 7/30 Days and website details. Website shares use website-time totals; the hero and activity charts use the union.

The 20-minute interval is tested with a simulated clock, not claimed as a physical 20-minute viewing session. Real OS lock/sleep delivery and user-profile browser restart still require desktop acceptance. Close unused tabs: passive open pages count whether or not you are watching them.
