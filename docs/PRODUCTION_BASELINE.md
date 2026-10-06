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

## Next.js 14 migration verification

Validated on October 3, 2026, using Node 24.19.0, npm 10.9.4 and TypeScript 5.9.3.

- Next.js / eslint-config-next: 13.0.4 to 14.2.35.
- ESLint: 8.28.0 to 8.57.1, required by the resolved typescript-eslint packages (ESLint >=8.57). Initial peer warnings were resolved; the final npm dependency tree check exited successfully.
- React / React DOM remain 18.2.0; other direct application dependencies retain their installed versions.
- npm ci passed with the updated lockfile; 485 packages installed. npm synchronized framework/lint transitive dependencies and pruned historical lock entries not required by package.json. No direct package was removed.
- Type checks, 48 regression tests, lint and production build passed. The build generated 1,355 static pages; next start successfully served the result.
- No changes to application source, routing, styles or next.config.js were necessary.
- Production browser checks passed: empty search buttons, list page 2, card-to-details navigation, six-row stats table, shiny image anchor, name selection/submission with Enter, type submission with the button, filtered page 2, filter reload returning to page 1, switching fire to water, dark mode retained on refresh, direct details, and an unknown Pokemon 404.
- At 390 x 844, both filtered list and Bulbasaur details had matching available/content widths of 375 px and no horizontal page overflow. The normal desktop view also retained the existing layout.
- No warnings/errors were observed in the production browser console during these checks. API failure/cancellation behaviors remain verified with mocked regression tests rather than injected production network failures.
- The known large detail payload warnings remain. npm also reports deprecation warnings for ESLint 8 and some tooling dependencies. Next.js 14 and ESLint 8 are intermediate migration steps; continue the planned framework/lint upgrades separately.
- No deployment, push or hosted runtime validation was performed.

## Next.js 15 migration

Environment: Node 24.19.0, npm 10.9.4 and TypeScript 5.9.3, checked on October 3, 2026.

- Next.js and eslint-config-next were upgraded from 14.2.35 to 15.5.27. React / React DOM remain at 18.2.0, with existing React types and Pages Router.
- npm ci passed with 464 packages installed; npm ls --all passed without peer dependency conflicts. Type checks, 48 regression tests and lint passed.
- Removed swcMinify from next.config.js because Next.js 15 no longer accepts that option; framework minification remains enabled by default.
- Two initial builds compiled successfully but failed during static generation with PokeAPI connection timeouts. A standalone API request succeeded. To reduce concurrent external requests, static generation uses two workers and one page per worker (experimental.cpus and staticGenerationMaxConcurrency). This preserves the full set of pre-rendered pages and can increase build time. These experimental settings need review during the Next.js 16 step; they cannot guarantee availability of the external API.
- next lint still works in this version but reports its deprecation. Migration to the ESLint CLI remains a separate step before Next.js 16.
- Existing large detail payload warnings remain; reducing serialized API data is a separate performance change.

References: [Next.js 15 and React 18 Pages Router support](https://nextjs.org/blog/next-15), [static generation concurrency options](https://nextjs.org/docs/app/api-reference/config/next-config-js/staticGeneration).

### Final production verification

- The build with bounded concurrency passed and generated all 1,355 static pages. Detail generation took approximately 340 seconds on this machine; build duration depends on the API and environment. The production server started successfully.
- Production browser checks passed: empty searches, list page 2, card navigation to Caterpie, six-row stats table, shiny image anchor, Pikachu name selection/submission with Enter, fire type submission with the button, filtered page 2, and reload preserving fire while resetting to page 1.
- Saved dark mode remained applied after reload; the original light mode was restored afterward. Direct Bulbasaur details loaded and an unknown Pokemon address displayed 404.
- At a 390 x 844 viewport, both the filtered list and Bulbasaur details measured 375 px available/content width, without horizontal page overflow. The temporary viewport override was reset afterward.
- No warning/error entries were observed in the production browser console before the intentional 404 check. API failure and cancellation remain covered by mocked regression tests, rather than production fault injection.
- No application components or styles were changed. No deployment, push or hosted runtime verification was performed.

## Current baseline: Next.js 16, React 19 and Tailwind 4

Recorded on October 5, 2026. This entry describes the installed dependency baseline and the automated checks run on this machine; it is not a new browser validation.

- Installed from `package.json` / `package-lock.json`: Next.js 16.3.8, React and React DOM 19.3.0, TypeScript 5.9.3, `@types/node` 24.19.1, Tailwind CSS 4.3.3 and daisyUI 5.7.47. The Pages Router is retained.
- Automated checks passing: `npm test` (93 regression tests), `npm run typecheck`, `npm run lint` and `npm run format:check`.
- `npm run format:check` failed on Windows because the checkout used CRLF while Prettier requires LF. `.gitattributes` now normalizes tracked text files to LF and the repository was reformatted with Prettier.
- `npm run build` passed with Next.js 16.3.8 (Turbopack): TypeScript finished, the production bundle compiled, and all 1,355 static pages were generated using 2 workers with `staticGenerationMaxConcurrency: 1`. Detail generation took about 10 seconds because the PokeAPI disk cache was already populated.
- Production HTTP smoke test against `npm start` on http://localhost:3000: `/` returned 200 (34,557 bytes), `/bulbasaur` returned 200 (26,513 bytes), `/types?type=fire` returned 200 (16,756 bytes) and an unknown Pokemon path returned 404. This is an HTTP smoke test, not the full browser flow list from the earlier sections.
