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

The WebTime source passed 8 core/event test groups, formatting, browser UI checks and a real Chrome extension smoke test on Windows. Browser checks used system Chrome selected with `CHROME_PATH`; branded README screenshots were regenerated and inspected. No test installs into the user's everyday browser profile.

The separately downloaded Playwright Chromium 153 binary failed to launch on this machine with `spawn UNKNOWN`, before an extension was loaded. The cause has not been established. The default downloaded-browser path and Linux CI have not been verified successfully here; the CI workflow must receive its first remote run after publication. This does not invalidate the successful system-Chrome checks. If a downloaded browser cannot start on your machine, use `CHROME_PATH` to select a compatible installed browser and report the environment along with the launch error.

Screenshots are generated into ignored `tests/artifacts/`. Public README screenshots are curated copies in `docs/images/`, generated with `?demo` and synthetic statistics. To refresh them, run `npm run test:ui`, inspect the images, and copy `today-dark.png`, `settings-light.png` and `popup.png` to the corresponding public screenshot names. Do not copy images of real usage data.

## Manual acceptance

Automated event mocks are not a substitute for testing OS focus and idle delivery on real hardware. Before a release:

1. Use YouTube actively for five minutes; compare with a stopwatch. Passive viewing pauses after the configured idle threshold.
2. Switch to GitHub, then switch to another Windows/macOS/Linux application. Only the focused browser should accumulate time.
3. Wait past the idle threshold, then resume input. Verify paused/live state and new session behavior.
4. Switch between two browser windows and several same-domain URLs. Confirm no double counting and correct normalization.
5. Visit an internal browser page. Confirm no website time is added.
6. Restart the browser and verify history survives without counting the closed interval. Test worker termination separately, with DevTools closed during normal observation.
7. Check actual favicons and unavailable-icon fallback; dark/light/system themes; keyboard navigation; full/reduced/off motion.
8. Export a synthetic dataset, import it, reject an invalid backup, cancel clearing, then confirm clearing. Never use private backups in public reports.
9. Check Today, 7 Days, 30 Days, website search/sort/detail and a realtime update. Confirm the core Today sections fit 1920×1080 and smaller windows do not overflow horizontally.

Real five-minute YouTube use, operating-system app switching, prolonged idle, physical sleep and user-profile browser restart have **not** been claimed as manually exercised by the automated suite. Sleep, abnormal termination, quota limits and clock changes have documented conservative accounting limits in the README.
