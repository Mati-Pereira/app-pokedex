# App Pokedex

A Pokédex web app to browse Pokémon, filter by type, and inspect details such as sprites (including shiny), abilities, base stats and evolution chains.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Demo: <https://app-pokedex-ashy.vercel.app/>

## Features

- Catalog of Pokémon with pagination, served with ISR (revalidated every 6 hours).
- Search by name with a virtualized, keyboard-friendly autocomplete.
- Filter by type, persisted in the URL (`/types?type=fire`) so it survives reloads and can be shared.
- Detail pages with a front/back/shiny sprite carousel, types, abilities, base stats and a lazy-loaded evolution chain (responsive branches plus a conditions panel).
- Light/dark theme toggle that follows the system preference and persists across reloads.
- Bilingual interface: Portuguese (default) and English, persisted across reloads.
- Accessibility: keyboard navigation, ARIA live regions, visible focus styles and reduced-motion support.
- Security headers and a strict Content-Security-Policy; PokeAPI requests are validated and restricted to the API origin.

## Tech stack

| Layer                 | Technology                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| Framework             | Next.js 16.3.8 (Pages Router)                                               |
| UI                    | React 19.3.0, Tailwind CSS 4.3.3, daisyUI 5.7.47                            |
| Language              | TypeScript 5.9.3 (strict)                                                   |
| Data                  | [PokeAPI](https://pokeapi.co/)                                              |
| Search and pagination | react-select 5.10.2, react-window 2.3.3, react-responsive-pagination 2.14.0 |
| Testing               | Node.js test runner, jsdom, Testing Library                                 |

## Requirements

- Node.js **24.x** (declared in `package.json` and `.nvmrc`)
- npm **10.9.4** (locked through `packageManager`)

## Getting started

```bash
git clone https://github.com/Mati-Pereira/app-pokedex
cd app-pokedex
npm ci
npm run dev
```

The dev server runs at http://localhost:3000.

## Available scripts

| Command                                   | Description                            |
| ----------------------------------------- | -------------------------------------- |
| `npm run dev`                             | Start the development server           |
| `npm run build`                           | Create a production build              |
| `npm start`                               | Serve the production build             |
| `npm test`                                | Run the regression tests (`node:test`) |
| `npm run typecheck`                       | Type-check without emitting            |
| `npm run lint`                            | Run ESLint                             |
| `npm run format` / `npm run format:check` | Apply / verify Prettier formatting     |

Run a single test file:

```bash
node --require ./tests/ts-register.cjs --test tests/pagination.test.cjs
```

## Project structure

```
pages/        Routes and page-level data loading (catalog, details, type filter)
components/   Reusable UI (Navbar, SearchField, Grid, Pokemon, EvolutionChain, ...)
context/      Shared React state (language)
lib/          PokeAPI access, caches, validation, i18n and pagination helpers
types/        Shared TypeScript models
data/         Pokémon type values
tests/        Regression tests (node:test + jsdom + Testing Library)
docs/         Production baseline, modernization guide and dependency notes
```

## Data and network

- All Pokémon data comes from [PokeAPI](https://pokeapi.co/); there is no local database.
- `npm run build` fetches the catalog and pre-renders every detail page (~1,355 pages), so it needs network access and can take several minutes. The catalog uses ISR and revalidates every 6 hours.
- Client-side search and type lists also require PokeAPI access.
- Responses are cached in memory on the client (TTL/LRU with in-flight deduplication) and on disk in `.next/cache/pokeapi` during the build. Static generation concurrency is bounded in `next.config.js` to avoid overwhelming the API.

## Validation

Run the full suite before submitting changes:

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Current status: 93 regression tests pass, together with typecheck, lint and format checks, and the build generates all 1,355 static pages. Results and known limitations are recorded in [docs/PRODUCTION_BASELINE.md](docs/PRODUCTION_BASELINE.md).

## Deployment

The app is deployed on Vercel (see the demo link above) and reads the Node version from `engines.node`. Production responses include a strict Content-Security-Policy and other security headers configured in `next.config.js`; HSTS is added only on Vercel production.

## Documentation

- [docs/PRODUCTION_BASELINE.md](docs/PRODUCTION_BASELINE.md) — validated production behavior and limitations.
- [docs/MODERNIZATION_GUIDELINE.md](docs/MODERNIZATION_GUIDELINE.md) — incremental upgrade plan and working conventions.
- [docs/DEPENDENCY_COMPATIBILITY.md](docs/DEPENDENCY_COMPATIBILITY.md) — dependency compatibility notes.
- [AGENTS.md](AGENTS.md) — repository guidelines for AI coding agents.

## Author

- [@Mati-Pereira](https://www.github.com/Mati-Pereira)
- [Portfolio](https://portifolio-new-4q6j.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/matheus-rodrigues-pereira/)

Feedback and questions: matheus-rodrigues37@live.com

## License

[MIT](https://choosealicense.com/licenses/mit/)
