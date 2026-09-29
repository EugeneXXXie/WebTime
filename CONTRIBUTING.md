# Contributing to WebTime

Bug reports, reproducible test cases, documentation improvements and small focused pull requests are welcome. English and Chinese are both welcome.

## Development

Use Node.js 22+ and npm. No build step or production dependencies are required to load the extension.

```sh
npm ci
npm test
npx playwright install chromium
npm run test:ui
npm run test:extension
npm run format:check
```

On Linux, use `npx playwright install --with-deps chromium` to install required system libraries. Browser tests default to Playwright's full Chromium binary. `CHROME_PATH` can override the executable; a recent browser supporting the `Extensions.loadUnpacked` debugging command is needed for the extension smoke test. `PLAYWRIGHT_MODULE` is an optional module-location override for existing development environments.

For example, in PowerShell with an installed Chrome:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:ui
npm run test:extension
```

Load the repository root through your browser's **Load unpacked** command. Reload the extension after code changes. Do not test lifecycle behavior with the Service Worker DevTools left open: it can affect worker suspension.

## Before opening a pull request

- Explain the problem, behavior change and tests performed.
- Keep runtime dependencies at zero; prefer browser APIs and native HTML/CSS.
- Do not introduce network requests, telemetry or new permissions without discussion.
- Add a regression test for tracking, storage or backup-validation changes.
- Preserve version-1 backup compatibility, or document and test an explicit migration.
- Check light/dark themes, keyboard focus and reduced motion for UI changes.
- Run `npm run format` and the relevant tests. Describe anything you could not test.
- Use synthetic data in screenshots and reports. Never attach personal browsing backups.

## Project boundaries

WebTime measures browser usage. Blocking websites, accounts, cloud sync, advertising and productivity scoring are outside its current scope. See [the architecture](docs/architecture.md) and [privacy policy](PRIVACY.md) before changing data collection.

By contributing, you agree that your contributions are provided under the project's [MIT license](LICENSE). Be respectful, assume good intent, and keep feedback focused on the work.
