# Known dependency advisories

Advisories that `npm audit` reports for this repository but that are intentionally not
remediated, with the reasoning and the conditions that would change the decision.

## braces — stack-exhaustion denial of service (CVE-2026-93687)

| Field    | Value                                                                    |
| -------- | ------------------------------------------------------------------------ |
| Advisory | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) |
| Package  | `braces`                                                                 |
| Affected | `<= 3.0.3`                                                               |
| Patched  | none published                                                           |
| Severity | high (CVSS 4.0 8.7, EPSS 0.74%)                                          |
| Scope    | dev only                                                                 |
| Reviewed | 2026-10-06                                                               |

`braces` through 3.0.3 lacks depth guards in its recursive AST walkers, so a deeply nested
brace pattern can exhaust the call stack and terminate the Node.js process with an
uncaught `RangeError`.

### Dependency path

```
@next/eslint-plugin-next@16.3.8 (devDependency)
└── fast-glob@3.3.1
    └── micromatch@4.0.8
        └── braces@3.0.3
```

### Why it is accepted

- **Dev only.** The chain is pulled in by `@next/eslint-plugin-next`, which runs ESLint. It
  is not part of the production bundle or the server runtime.
- **No fix exists.** `braces` 3.0.3 is the latest published version and is still inside the
  affected range; the advisory lists no patched version.
- **Not attacker-controlled.** Exploitation requires control over the glob pattern passed
  to `braces`. Here the patterns come from the ESLint configuration and the `eslint .`
  invocation, not from user input.
- **`npm audit fix --force` is rejected.** It proposes downgrading
  `@next/eslint-plugin-next` from 16.3.8 to 14.2.35, a breaking change that would not even
  remove `braces`, since every `micromatch` 4.x release depends on it.

### Revisit when

- `braces` publishes a version above 3.0.3, or
- `fast-glob` or `micromatch` stop depending on `braces`, or
- the advisory gains a patched version.

Re-check with:

```bash
npm audit
npm ls braces micromatch fast-glob @next/eslint-plugin-next
```

`npm audit` is not part of CI, so no automated ignore list is configured; this document is
the record of the accepted risk.
