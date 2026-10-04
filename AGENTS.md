# Repository Guidelines

## Project Structure

This is a Next.js application using the Pages Router. Routes and page-level data loading live in `pages/`; reusable UI lives in `components/`. Shared React state is in `context/`, API and localization helpers are in `lib/`, and shared TypeScript models are in `types/`. Pokémon type labels are in `data/`, static images in `public/`, and regression tests in `tests/`. Operational notes and migration references are in `docs/`.

## Setup and Commands

Use Node.js 24.x and npm 10.9.4. Run `npm ci` to install the locked dependencies, then `npm run dev` to start the local app at `http://localhost:3000`.

- `npm test` runs the Node.js test runner over `tests/*.test.cjs`.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint across the repository.
- `npm run format:check` verifies Prettier formatting; `npm run format` applies it.
- `npm run build` creates a production build; `npm start` serves that build.

Static generation and client data use PokeAPI, so the build and some app flows need network access.

## Coding Style

Write application code in strict TypeScript. Use PascalCase for React component files and component names (for example, `SearchField.tsx`), camelCase for helpers and hooks, and descriptive kebab-case names for test files. Follow `.prettierrc`: two-space indentation, single quotes, semicolons, and a 100-character print width. Tailwind classes are sorted by `prettier-plugin-tailwindcss`. Keep UI text in `lib/i18n.ts` in both Portuguese and English; Portuguese is the default. Avoid `any` and keep React hook dependencies accurate.

## Testing

Add regression cases in `tests/*.test.cjs`, using `node:test` and strict assertions. Use the existing DOM setup and Testing Library helpers for component behavior. No coverage threshold is configured. Before submitting, run tests, typecheck, lint, and build when the change affects application behavior.

## Commits and Pull Requests

Recent history uses Conventional Commit prefixes such as `feat:`, `fix:`, and `chore:`. Keep commit subjects short and action-oriented. PRs should explain the user-visible change, summarize validation commands and results, link a related issue when applicable, and include screenshots for visual changes.
