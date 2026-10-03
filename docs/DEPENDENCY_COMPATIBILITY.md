# Dependency compatibility review

Reviewed on October 3, 2026. This is a metadata and source review, not validation of an installed Next.js 14 build. Package versions remain unchanged.

## Next step: Next.js 14 with React 18

The npm next-14 tags currently resolve Next.js and eslint-config-next to 14.2.35. Re-check the target immediately before installation.

- Next.js 14.2.35 declares React and React DOM ^18.2.0 and Node >=18.17.0. The current React 18.2.0 and Node 24 satisfy these requirements.
- eslint-config-next 14.2.35 accepts ESLint ^7.23.0 or ^8.0.0 and TypeScript >=3.3.1. The current ESLint 8.28.0 and TypeScript 5.9.3 satisfy these declared requirements.
- No peer dependency conflict was identified in the libraries below for React 18.2.0. This does not guarantee behavior after a framework upgrade.

| Package | Installed | Use | Declared React compatibility | React 19 follow-up |
| --- | --- | --- | --- | --- |
| react-windowed-select | 5.1.0 | Header search selectors | 16.8, 17, 18 | Latest queried 5.2.0 still excludes 19; resolve before adopting React 19. |
| react-select | 5.7.0 | Dependency of windowed select | 16.8, 17, 18 | Latest queried 5.10.2 includes 19, but updating it alone does not resolve the wrapper's peer range. |
| react-responsive-pagination | 1.8.1 | Main/type list pagination | 16.8, 17, 18 | Latest queried 2.14.0 includes 19; a major upgrade needs its own layout and API review. |
| @uiball/loaders | 1.2.6 | Navigation, list and search feedback | >=16.8 | Range accepts 19, but runtime behavior must be tested; latest queried 1.3.1. |
| react-icons | 4.6.0 | Header search icons | Any React version | Broad peer range alone is not proof of React 19 behavior; latest queried 5.7.0. |
| react-test-renderer | 18.2.0 | Regression test renderer | ^18.2.0 | Keep aligned with React; review the test approach before React 19. Latest queried 19.3.0 is not a drop-in upgrade while React remains 18. |
| @tanstack/react-query | 4.16.1 | No application imports found | 16.8, 17, 18 | Decide whether to remove it in a separate step; do not update an unused dependency as part of this migration. |

Tailwind 3.2.4 and daisyUI 2.43.0 do not declare React peers. Their declared PostCSS/autoprefixer requirements are satisfied by the installed tooling. Their modernization remains a separate visual validation step.

## Source review

- Application routing uses pages/, next/link and next/router. Keep the Pages Router.
- Detail pages use getStaticProps and getStaticPaths with blocking fallback; retain this behavior for the Next.js 14 step.
- No next export command, next/image, @next/font, next/server ImageResponse or experimental appDir configuration was found in application source/configuration.
- next.config.js currently enables reactStrictMode and swcMinify. Check configuration warnings during the upgrade.
- Pagination already loads only in the browser; preserve this behavior.
- The initial theme script in pages/_document.tsx and route loading events in pages/_app.tsx need explicit browser checks after upgrading.
- React Query is declared but no QueryClient, useQuery, useMutation or package imports were found in the application. No package was removed by this review.

## Migration decision and verification

Proceed in a separate commit with Next.js 14 and matching eslint-config-next while preserving React/React DOM 18.2.0 and the visual structure. Revisit React type packages within the 18.x line if the upgrade requires it; do not install latest React 19 types into a React 18 app.

Run clean npm installation, type checks, lint, the 48 regression tests, production build and production browser checks for search, pagination, filter reload, details/404, navigation feedback, dark theme refresh and responsive layout. Metadata compatibility is only the prerequisite; the installed migration must pass these checks.

Next.js 15 supports React 18 with the Pages Router, which can allow the React upgrade to remain a separate step. Confirm the target Next.js 16 package requirements before deciding the React 19 sequence. No React 19 compatibility claim is made for the current installed application.

## Sources

- Installed package.json metadata and application imports.
- Published npm metadata for the current next-14 tags and the latest library versions queried above: https://registry.npmjs.org/
- Next.js 14 migration guide: https://nextjs.org/docs/pages/guides/upgrading/version-14
- Next.js 15 React compatibility: https://nextjs.org/blog/next-15
- Next.js 16 migration guide: https://nextjs.org/docs/app/guides/upgrading/version-16
