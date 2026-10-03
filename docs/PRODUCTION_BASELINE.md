# Production baseline

Validated on October 3, 2026, on Windows with Node.js 24.19.0 and npm 10.9.4. This records the tested environment; selection of a supported Node version for the modernization remains a separate step.

## Installation and checks

- npm ci succeeded: 388 packages installed from the existing package-lock.json, which remained unchanged.
- npm test passed: 45 regression tests.
- npm run typecheck passed.
- npm run build passed, including Next.js type and lint checks, compilation, and generation of 1,355 static pages.
- npm start successfully served the production build on port 3000.
- Dependency versions were not upgraded.

npm is provided through the bundled runtime bootstrap on this machine because the npm executable is not on its default PATH. The project commands remain standard npm commands.

## Browser checks against the production server

- Initial list displayed Pokemon cards; page 2 started with Caterpie.
- Empty name/type search buttons did not navigate.
- Clicking Caterpie opened its details and stats table.
- Shiny carousel link changed the selected image anchor.
- Name search selected Pikachu with Enter and opened its details with a second Enter; button search opened Bulbasaur.
- Type search opened fire; page 2 displayed Magmar; reload preserved fire and returned to page 1.
- Changing fire to water returned to page 1 and displayed Squirtle.
- Dark mode survived reload; light mode was restored after the check.
- Direct Pikachu details loaded; an unknown Pokemon address displayed 404.
- At a 390 x 844 viewport, the filtered list displayed its header and cards without horizontal overflow; pagination reduced its visible buttons.
- No hydration warnings were observed in the production browser console during these checks.

API failure/retry, stale requests, and navigation cancellation were covered by automated mocked regression tests; network failures were not injected into the production browser. This is a focused smoke test, not exhaustive coverage of every Pokemon or screen size.

## Known limitations and follow-up work

- Building fetches the full Pokemon catalog and pre-renders every detail page. It depends on PokeAPI availability and performs many network requests.
- Next.js reported large page data for many detail pages (for example, about 279 kB for Bulbasaur). The full API response is serialized even though the UI only needs a subset. Reducing the detail payload should be a separate performance change.
- Browserslist reported outdated browser compatibility data. Updating it belongs in a separate dependency maintenance step.
- Type filtering still fetches all matching Pokemon details before displaying nine cards.
- No deployment or validation of the hosting environment was performed.
