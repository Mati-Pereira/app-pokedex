# Repository Guidelines

## Project Structure

Single Next.js app (Pages Router). Routes and page-level data loading live in `pages/`; reusable UI in `components/`; shared React state in `context/` (currently only the language provider); API, cache and localization helpers in `lib/`; shared TypeScript models in `types/`; Pokémon type values in `data/types.json` (display labels come from `lib/i18n.ts`); static assets in `public/`; regression tests in `tests/`; operational and migration notes in `docs/`.

## Setup and Commands

Use Node.js 24.x and npm 10.9.4. Run `npm ci` to install the locked dependencies, then `npm run dev` for http://localhost:3000.

- `npm test` runs the Node.js test runner over `tests/*.test.cjs`.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint (`eslint .`; `next lint` no longer exists).
- `npm run format:check` / `npm run format` verify/apply Prettier.
- `npm run build` creates a production build; `npm start` serves it.

Run one test file or case:

```bash
node --require ./tests/ts-register.cjs --test tests/pagination.test.cjs
node --require ./tests/ts-register.cjs --test --test-name-pattern "last page" tests/pagination.test.cjs
```

CI runs typecheck, lint, test and build — `format:check` is not in CI, so run it yourself.

## Architecture and Invariants

- The build fetches the full PokeAPI catalog and pre-renders ~1,355 detail pages, so it needs network access and can take minutes. Concurrency is deliberately bounded in `next.config.js` (`experimental.cpus`, `staticGenerationMaxConcurrency`) to avoid overwhelming PokeAPI.
- Two cache layers: `lib/pokeApiCache.ts` is the client memory cache (TTL/LRU, in-flight dedupe, hard `https://pokeapi.co` origin allowlist); `lib/pokeapi.ts` writes `.next/cache/pokeapi` only during the build phase. `pokeApiFetch` is a plain fetch at runtime, and failed responses are never cached.
- Never render raw PokeAPI data: validate/normalize it first (`lib/pokemonDetails.ts`, the `normalize*`/`fetch*` helpers in `lib/usePokeApi.ts`, `lib/evolution.ts`).
- `pages/[slug].tsx` uses `fallback: false` on purpose so unknown paths never trigger runtime PokeAPI calls. Do not switch it to `fallback: true`/`blocking`.
- Pagination must stay declared as `dynamic(() => import('react-responsive-pagination'), { ssr: false })` in both `pages/index.tsx` and `pages/types.tsx`; a test asserts the declaration exists and that the browser library is not loaded on the server.
- Changing `themeScript` in `pages/_document.tsx` requires updating the CSP `'sha256-…'` hash in `next.config.js`; a test recomputes the hash and fails otherwise.
- Page size and pagination math are shared in `lib/pagination.ts`; reuse them instead of redefining `9`.

## Coding Style

Write application code in strict TypeScript. PascalCase for React component files and names (e.g. `SearchField.tsx`), camelCase for helpers/hooks, kebab-case for test files. Follow `.prettierrc` (two spaces, single quotes, semicolons, 100 columns); Tailwind classes are sorted by `prettier-plugin-tailwindcss`. Keep UI text in `lib/i18n.ts` in both Portuguese and English (Portuguese is the default). `TranslationKey` is derived from the `ptBr` table, so add every key to both `ptBr` and `en` or `npm run typecheck` fails. Avoid `any`, keep hook dependencies accurate, and keep files LF (enforced by `.gitattributes`).

## Testing

Add regression cases in `tests/*.test.cjs` using `node:test` and strict assertions. `npm test` transpiles TS/TSX on the fly (`tests/ts-register.cjs`) and sets up jsdom through `tests/setup-dom.cjs`, so no build step is needed. Component and page tests load the source with `ts.transpileModule` and override `require` to stub `next/router`, `next/link`, `next/dynamic` and similar — follow the existing loader pattern instead of importing pages directly. No coverage threshold is configured. Before submitting, run tests, typecheck, lint and format:check; run build when behavior changes.

## Commits and Pull Requests

Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`) with short, action-oriented subjects. PRs should explain the user-visible change, list the validation commands and results, link a related issue when applicable, and include screenshots for visual changes. The build needs network access, so state whether it was actually run. `docs/MODERNIZATION_GUIDELINE.md` defines the incremental upgrade workflow (one commit per step, confirm before the next).
