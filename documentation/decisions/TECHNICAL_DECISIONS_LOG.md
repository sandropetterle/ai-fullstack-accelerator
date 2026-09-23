# Technical Decisions Log — AI Fullstack Accelerator

**Last Updated:** 2026-09-23
**Audience:** Solutions Architects, Senior Developers
**Purpose:** Append-only log of architectural, security, infrastructure, performance, and technology decisions made during accelerator construction and by teams using it.

> **14 active decisions | 0 archived**
>
> Add new entries at the **top** (newest first). See [DECISION_TEMPLATE.md](DECISION_TEMPLATE.md) for the entry format and [GOVERNANCE.md](../GOVERNANCE.md) Section 6 for the compaction process.

---

## Decision 14: Strapi CMS is an optional, bring-your-own integration

**Date:** 2026-09-23
**Title:** Descope Strapi from "ships in this repo" to "optional integration you scaffold yourself"; keep the Dockerfile, the frontend client, and the compose profile
**Category:** CMS / Documentation
**Status:** Active

### Context / Problem

An audit of the committed tree found `cms/` contains only `Dockerfile` and `.dockerignore` — there is no Strapi application source (no `package.json`, no `src/`). Despite this, README.md, CLAUDE.md, and `documentation/cms-components/COMPONENT_INDEX.md` described Strapi 5 as something the accelerator "ships," including paths like `cms/src/api/` and `cms/src/components/` that don't exist in the repo. `cms/Dockerfile` cannot build against the committed tree: there is no `package.json`, so `RUN npm run build` fails. Separately, Decision 10's "Files Changed" and "Verified" sections state `cms/Dockerfile` was updated to `node:24-alpine` and that "Docker builds of the root and `cms/` Dockerfiles" were verified — that claim cannot be true of the committed tree.

### Decision

- **Descope Strapi in the docs, not in the code.** Reworded every "Strapi ships/is included" claim in README.md (tagline, tech table, project-structure tree) and CLAUDE.md (Project Overview, Tech Stack) to state plainly that the CMS is optional and bring-your-own, and that `cms/` currently holds only a Dockerfile. Added a "Optional: Strapi CMS" section to README.md covering the scaffold command (`npx create-strapi@latest cms`), the env vars it needs, and how `lib/cms/client.ts` behaves with no CMS configured (`CmsUnavailableError` is caught by callers, which fall back to hardcoded content — the frontend runs without it).
- **Annotated `documentation/cms-components/COMPONENT_INDEX.md`** with a note that the `cms/src/api/` / `cms/src/components/` paths it references exist only after scaffolding; left the schema/content-type documentation itself untouched, since it remains the correct target shape to (re)create.
- **Removed the npm Dependabot entry for `/cms`** (`.github/dependabot.yml`) — there is no `package.json` for it to read, so the entry could only ever error or no-op. Kept the docker Dependabot entry for `/cms`, since `cms/Dockerfile` is a real, committed file Dependabot can scan.
- **Left `cms/Dockerfile`, `docker-compose.yml`'s `cms` profile, `lib/cms/`, and `.github/workflows/cms-container-deploy.yml` unchanged.** None of these claim Strapi is committed; they are exactly the "bring your own, and here's the scaffolding to plug it into" surface this decision keeps. `cms-container-deploy.yml` triggers on `push` to `cms/**` but every job is gated on `vars.AZURE_DEPLOY_ENABLED == 'true'` (Decision 10), so it is a no-op by default even though it would fail to build `cms/` without a scaffolded app.
- **Added an "Update (2026-09-23)" note to Decision 10** below, correcting its `cms/Dockerfile` build-verification claim without rewriting the original text, per this log's append-only discipline (`GOVERNANCE.md` Section 6).

### Known Limitation: EF Core migrations are SQLite-generated

Restating and tracking what Decision 8's Consequences already flagged: the single EF Core migrations set in `backend/src/Accelerator.Data/Migrations` was generated against the SQLite provider and does not apply cleanly to SQL Server (`PendingModelChangesWarning` on EF 10; `InvalidCastException` on Guid columns previously on EF 8). SQL Server needs its own provider-specific migrations assembly, which does not exist yet. **Tracking issue: [#87](https://github.com/sandropetterle/ai-fullstack-accelerator/issues/87).**

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Remove the CMS integration entirely (`cms/`, `lib/cms/`, the compose profile, the deploy workflow) | Strapi is a stated differentiator of the accelerator (see Decision 3); the Dockerfile, client, and profile are already correct scaffolding for a bring-your-own app — deleting them loses real, reusable work over a documentation problem |
| Scaffold an actual Strapi app into `cms/` and commit it | Turns a ~1000-file generated app into permanently-tracked source the accelerator would then have to keep updated (Strapi's own releases, security patches) on top of everything else in this repo; users who don't want the CMS still pay the checkout/clone cost; out of scope for a docs-accuracy fix |

### Consequences

- README.md, CLAUDE.md, and `documentation/cms-components/COMPONENT_INDEX.md` no longer claim a Strapi app is committed; a reader who runs `docker compose --profile cms up -d` without first scaffolding `cms/` will now find that expectation set correctly by the docs instead of discovering it from a failed build.
- Dependabot no longer carries a dead npm entry for `/cms`; add one back (with a `strapi` group, matching the removed entry) once a Strapi app is scaffolded into the repo or into a fork.
- The SQL Server migrations gap remains unresolved code work, now tracked in issue #87 instead of only mentioned in a Decision 8 consequence.
- Anyone scaffolding Strapi into `cms/` should re-add the removed npm Dependabot block and re-verify `cms/Dockerfile` actually builds against the scaffolded app (Decision 10's claim to have done so cannot be relied on — see its Update note below).

### Files Changed

- `README.md` — reworded Strapi-ships claims (tagline, tech table, project-structure tree); added "Optional: Strapi CMS" section
- `CLAUDE.md` — Project Overview and Tech Stack CMS line marked optional/bring-your-own
- `documentation/cms-components/COMPONENT_INDEX.md` — added scaffold-first note at top
- `.github/dependabot.yml` — removed npm `/cms` entry; kept docker `/cms` entry
- `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` — this entry; "Update (2026-09-23)" note on Decision 10; header count

---

## Decision 13: Release-readiness dependency baseline for v1.0.0

**Date:** 2026-09-23
**Title:** Reconcile the decision log with the dependency state actually shipping for v1.0.0 — isomorphic-dompurify 4.x, the `flatted`/`serialize-javascript` overrides, the remaining accepted dev-only audit findings, and the master-CI concurrency fix
**Category:** Security / Infrastructure
**Status:** Active

### Context / Problem

A pre-release pass found the log had drifted from `package.json`/CI reality in three places: (1) Decision 10 still described `isomorphic-dompurify` as `^3.23.0` with Dependabot PR #75 open, but PR #75 merged 2026-09-23 and `package.json` has carried `^4.3.0` since; (2) `package.json` `overrides` carries `flatted` and `serialize-javascript` entries with no decision recording why; (3) Decisions 6 and 7 accepted/deferred advisories (postcss/next bundled-postcss risk; esbuild) that later PRs (#68, #84) already resolved, but nothing said so. Separately, a `workflow_dispatch` run on `master` cancelled the concurrent push run via `test.yml`'s `cancel-in-progress: true`, turning the README CI badge red for a run that never actually failed.

### Decision

- **isomorphic-dompurify 4.x confirmed adopted.** PR #75 (`3.23.0` -> `4.3.0`) merged 2026-09-23, superseding the "left open for separate review" note in Decision 10 and the `~3.19.0`/Node-floor caveat in Decision 7. `package.json` now reads `"isomorphic-dompurify": "^4.3.0"`. See "Update (2026-09-23)" notes added to Decisions 6, 7, and 10 below rather than rewriting their original reasoning.
- **`overrides.flatted` (`>=3.4.0`) and `overrides.serialize-javascript` (`>=7.0.3`) — reason recorded.** Both were added together with `ajv` in `33f3464` (2026-03-24), the commit that created `package.json`, before Decision 1 existed. `flatted >=3.4.0` targets GHSA-25h7-pfq9-p65f (`parse()` recursion DoS, <3.4.0); it resolves to 3.4.2 via `flat-cache`. `serialize-javascript >=7.0.3` targets GHSA-5c6j-r48x-rmvq (RCE, <=7.0.2); no package in today's lockfile depends on it, so the override is currently inert. Neither ever raised a Dependabot alert (105 alerts, all states checked). Kept as cheap insurance.
- **Remaining full-audit findings — accepted, dev-only.** `npx -y npm@10 audit --package-lock-only` (full, including dev): 12 vulnerabilities (6 low, 6 high), 0 in `npm audit --omit=dev --package-lock-only` (production). All 12 are in two dev-only chains already tracked in Decisions 6/7 and unresolved upstream:
  - `elliptic` / `browserify-sign` / `create-ecdh` / `crypto-browserify` / `node-polyfill-webpack-plugin` via `@storybook/nextjs` (no patched `elliptic` exists).
  - `extract-zip` (path traversal, GHSA-jmr9-qjv8-65gv / GHSA-7pqw-9j4j-h8q3) via `@puppeteer/browsers` -> `puppeteer-core` -> `lighthouse` -> `@lhci/cli`/`@lhci/utils` (fix requires `@lhci/cli` to ship on `lighthouse` >=13, not yet released).

  No new overrides or downgrades applied — an `npm audit fix --force` would still pull `@storybook/nextjs` back to 7.0.14 and `@lhci/cli` to 0.12.0, both regressions. **Review trigger:** re-evaluate when upstream fixes land in `@lhci/cli` or `@storybook/nextjs`, or at each minor release, whichever comes first.
- **`test.yml` concurrency — master push runs are never self-cancelled.** Changed `cancel-in-progress: true` to `cancel-in-progress: ${{ github.ref != 'refs/heads/master' }}` (group unchanged: `test-${{ github.ref }}`). PR branches keep auto-cancel-on-new-push behavior; `master`'s push-triggered run (the one the README badge reads) is no longer cancelled when a `workflow_dispatch` starts on the same ref. (A group still holds only one pending run, so a third queued run can replace a second one that is still waiting; runs already in progress are left alone.)

### Rationale

Same principle as every prior security decision in this log: what's actually shipping in `package.json`/the lockfile is the source of truth, and the log exists to explain *why* it looks that way — a log that says something different from `package.json` is worse than no log, because it actively misleads the next reviewer. Recording the `flatted`/`serialize-javascript` overrides after the fact (rather than pretending they were never there) keeps the log's append-only, no-rewritten-history discipline intact per `GOVERNANCE.md` Section 6. The `test.yml` fix is a one-line, zero-risk correction: it only removes cancellation for the one ref whose result is externally visible.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Silently edit Decisions 6/7/10 in place to reflect current state | Violates the append-only/no-rewritten-history log discipline; a reader auditing history would lose the original reasoning that was correct at the time |
| Drop `cancel-in-progress` entirely (always `false`) | Loses the useful auto-cancel-on-superseding-push behavior for PR branches, which saves CI minutes on rapid-iteration pushes |
| Remove the `flatted`/`serialize-javascript` overrides since no tracked alert justifies them | `flatted` still resolves to a patched 3.4.2; `serialize-javascript` is inert today but would guard a future transitive re-entry. Removing either saves nothing, and both floors are non-breaking for their consumers |

### Consequences

- The decision log's "current state" statements about `isomorphic-dompurify`, the full audit, and CI concurrency now match `package.json`/`package-lock.json`/`test.yml` as of 2026-09-23.
- Future `flatted`/`serialize-javascript` version bumps in the dependency chain should keep these overrides' lower bounds in mind if the override is ever removed (check no CVE has been reintroduced below `3.4.0` / `7.0.3` respectively).
- The `elliptic` and `extract-zip` chains remain the only known outstanding audit debt for v1.0.0, both dev-only and both blocked on upstream releases, not on anything actionable in this repo.
- Verified: `package.json` (`isomorphic-dompurify: ^4.3.0`, `overrides.flatted`/`overrides.serialize-javascript` present), `gh pr view 75` (merged 2026-09-23), `gh api .../dependabot/alerts --paginate` (105 alerts, none for `flatted`/`serialize-javascript`), `git log -S flatted -- package.json` / `git log -S serialize-javascript -- package.json` (both introduced in `33f3464`), `npx -y npm@10 audit --package-lock-only` (12: 6 low, 6 high, all dev-only), `npx -y npm@10 audit --package-lock-only --omit=dev` (0), lockfile grep confirms only `esbuild@0.28.2` resolved (no other esbuild version present).

### Files Changed

- `.github/workflows/test.yml` — `concurrency.cancel-in-progress` scoped to non-`master` refs
- `.gitignore` — `*.stackdump` added
- `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` — this entry; "Update (2026-09-23)" notes on Decisions 6, 7, 10; header count

---

## Decision 12: Add .dockerignore to all build contexts

**Date:** 2026-09-23
**Title:** Add a `.dockerignore` to each Docker build context (repo root, `backend/`, `cms/`) to keep secrets and local artefacts out of images
**Category:** Security / Infrastructure
**Status:** Active

### Context / Problem

None of the three Docker build contexts (root — frontend, `backend/`, `cms/`) had a `.dockerignore`. Every `docker build` therefore sent its entire directory tree to the BuildKit daemon as build context, including `.git`, `node_modules`, `.next`, test artefacts (`coverage`, `playwright-report`, `test-results`, `storybook-static`, `e2e/.auth`), editor/tooling directories (`.claude`, `.vscode`, `.idea`), `*.log` files, and — most importantly — any local `.env`/`.env.*` files a developer might have sitting in the working tree. None of this is needed by the Dockerfiles (each Dockerfile's `COPY` lines only ever touch `package.json`/`package-lock.json`, the `.csproj` files, or the full source tree that legitimately belongs in the image), so it was pure risk and wasted transfer time with no offsetting benefit.

### Decision

Added a `.dockerignore` at each build context root:

- **`/.dockerignore`** (frontend, build context = repo root): excludes `.git`, `.claude`, `.vscode`, `.idea`, `*.log`, `node_modules`, `.next`, `storybook-static`, `coverage`, `playwright-report`, `test-results`, `e2e/.auth`, `.env`/`.env.*` (with `!.env.example` kept, since nothing in the image needs secrets but the example file is harmless), the unrelated `backend/` and `cms/` app trees (plus an explicit `backend/**/bin` / `backend/**/obj` rule), and `docs/`/`documentation/` (not needed at runtime).
- **`backend/.dockerignore`** (build context = `backend/`, confirmed via `.github/workflows/backend-container-deploy.yml`'s `working-directory: ./backend` + `docker build .`): excludes `.git`, `.claude`, `.vscode`, `.idea`, `*.log`, `**/bin`, `**/obj`, local secrets and per-environment config that `dotnet publish` would otherwise copy into `/app` via the Dockerfile's `COPY . .` (`**/appsettings.Development.json`, `**/appsettings.Local.json`, `**/appsettings.Production.json`, `**/secrets.json`) and local SQLite database files (`**/*.db`, `**/*.db-shm`, `**/*.db-wal`), `tests/` (not needed for `dotnet publish`), `.env`/`.env.*` (`!.env.example` kept), and `docs/`/`documentation/`. None of these appsettings/secrets/db files are committed to the repo (confirmed via `git ls-files backend | grep -i appsettings` — no matches; they're already `.gitignore`d), so excluding them from the build context is purely defense-in-depth against a developer's local working tree.
- **`cms/.dockerignore`** (build context = `cms/`, confirmed via `docker-compose.yml`'s `context: ./cms` and `.github/workflows/cms-container-deploy.yml`'s `working-directory: ./cms`): excludes `.git`, `.claude`, `.vscode`, `.idea`, `*.log`, `node_modules`, `.tmp`, `build`, `dist`, `.env`/`.env.*` (`!.env.example` kept), and `docs`/`documentation`. (Note: the `cms/` directory in this repo currently tracks only `Dockerfile` — the Strapi app source is scaffolded locally/by users — so this file is forward-looking protection for when that source exists.)

Each Dockerfile's `COPY` lines were re-checked against the exclusion list to confirm nothing required for the build is excluded.

### Rationale

`.dockerignore` is the standard, zero-cost way to keep secrets and build noise out of both the build context sent to the daemon and, transitively, any intermediate layer that does a broad `COPY . .`. It also meaningfully shrinks the context payload, which matters for CI build time and for anyone building locally over a slow connection.

### Verification

`docker build` was run for both the frontend (root) and backend (`backend/`) contexts, once without any `.dockerignore` (baseline) and once with the new files, using `DOCKER_BUILDKIT=1 docker build --progress=plain`. BuildKit's "transferring context" line before/after:

| Context | Before | After | Reduction |
|---|---|---|---|
| Frontend (root) | 2.14 MB | 14.33 kB | ~99.3% |
| Backend (`backend/`) | 234.18 kB | 4.37 kB | ~98.1% |

Final image sizes were unchanged (345 MB frontend, 380 MB backend) — expected, since both Dockerfiles are already multi-stage and only copy specific published/standalone artefacts into the final stage; `.dockerignore` only affects what's sent as build context, not what ends up in the image. Note the backend context reduction is modest in absolute terms in this fresh checkout because there was no local `bin/`/`obj/` present to exclude — the protection matters most when building from a developer machine that has already run `dotnet build` locally.

The frontend "after" image was smoke-tested: `docker run --rm -d -p 3999:3000 ... frontend-after`, then polled with `curl` until it returned `HTTP 200` (it did, on the fifth attempt a few seconds after start — normal Next.js cold-start), confirming the image still runs correctly with the new `.dockerignore` in place. `cms/` was not build-tested since its Strapi application source isn't present in this checkout (only `Dockerfile` is tracked); its `.dockerignore` was reasoned through against the Dockerfile's `COPY` lines instead.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| One shared `.dockerignore` at repo root covering all three contexts | Docker only honors a `.dockerignore` at the root of the build context being used; `backend/` and `cms/` builds run with those directories as context, so a root-only file would not apply to them |
| Skip `cms/.dockerignore` since no Strapi source is checked in yet | The Dockerfile and `docker-compose.yml` reference `cms/` as a real build context that users/CI will populate; leaving it unprotected until then just defers the same risk |

### Consequences

- Local `.env`/`.env.*` files (except `.env.example`) can no longer accidentally leak into any of the three images via an unfiltered `COPY . .`.
- Faster `docker build` invocations (smaller context upload), most noticeable in CI and on slower connections.
- Anyone adding a new top-level file/directory to the frontend, backend, or CMS trees that the Docker image *does* need should check it isn't caught by one of the new exclusion rules.

### Files Changed

- `.dockerignore` — new (frontend / root build context)
- `backend/.dockerignore` — new
- `cms/.dockerignore` — new

---

## Decision 11: Adopt lucide-react 1.x and TypeScript 6; defer TypeScript 7; build and type-check in CI

**Date:** 2026-09-23
**Title:** Take Dependabot's lucide-react 1.x major (with a hand-ported replacement for the `Github` icon it removed) and TypeScript's latest 6.0.x release (within typescript-eslint's <6.1.0 peer range), defer TypeScript 7 until typescript-eslint supports it, and add `tsc --noEmit` + `next build` to CI so a class of breakage like this is caught automatically going forward.
**Category:** Technology
**Status:** Active

### Context / Problem

Two Dependabot PRs were queued: #72 bumps `lucide-react` 0.577.0 -> 1.47.0, and #73 bumps `typescript` to 7.0.2. Neither is a safe blind merge. lucide-react 1.x removed all brand icons from the core package, including `Github`, which is imported in `app/about/page.tsx`, `components/home/CTASection.tsx`, and `components/layout/Footer.tsx` — a straight merge would crash the site footer (rendered on every page) at runtime. TypeScript 7.0.2 is also not mergeable as-is: `typescript-eslint`'s peer range (`>=4.8.4 <6.1.0` as of `typescript-eslint@8.70.1`) does not accept TypeScript 7, so `npm run lint` would break. Neither problem would have been caught by CI as it stood: the Frontend Tests job runs `lint` and `jest` but never `tsc --noEmit` or `next build`, so a removed export or a broken JSX usage compiles into `npm test` passing green while the app itself would fail to type-check or, worse, crash at runtime.

### Decision

- **lucide-react -> ^1.47.0.** Added `components/icons/GithubIcon.tsx`: a small `forwardRef` component that inline-renders the exact `<svg>`/`<path>` markup lucide-react 0.577.0 shipped for the `github` icon (paths extracted from that version's package before upgrading), replicating lucide's own prop defaults (`size=24`, `strokeWidth=2`, `color="currentColor"`, `absoluteStrokeWidth`, auto `aria-hidden` when no accessible name is given) and typed with lucide's `LucideProps`. Exported both as default and as a named `GithubIcon` export. The three affected files now `import { GithubIcon as Github } from '@/components/icons/GithubIcon'` instead of importing `Github` from `lucide-react`, so no JSX changed. Grepped all 37 `from 'lucide-react'` import sites and ran `tsc --noEmit` after the bump — `Github` was the only icon lucide-react 1.x removed that this codebase used.
- **typescript -> ^6.0.3** (latest 6.0.x; 6.1+ is outside typescript-eslint's `<6.1.0` peer ceiling and was not taken). `npm install` re-resolved `typescript-eslint`/`@typescript-eslint/parser` (transitive via `eslint-config-next`'s `typescript-eslint: ^8.46.0`) to `8.70.1`, whose peer range (`>=4.8.4 <6.1.0`) accepts 6.0.3 without any `--legacy-peer-deps` or override. `npm run lint` and `npx tsc --noEmit` both pass clean.
- **TypeScript 7 deferred.** Added an `ignore` entry for `typescript` with `versions: [">=7.0.0"]` to the root npm block in `.github/dependabot.yml`, with a comment explaining the typescript-eslint peer-range blocker, so Dependabot stops proposing it until typescript-eslint catches up.
- **CI gap closed.** `.github/workflows/test.yml` Frontend Tests job gained a `Type check` step (`npx tsc --noEmit`) and a `Build` step (`npm run build`) immediately after `Lint`. The `Build` step reuses the same env vars as the E2E job's frontend build step (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_TIMEOUT`, `AUTH_SECRET` with the same non-secret E2E fallback, `AUTH_TRUST_HOST`) since Auth.js v5's `auth()` call in server components fails `next build` without `AUTH_SECRET`; no backend is running in this job, which is fine — `next build`'s static-generation fetch failures for `/articles` are logged but non-fatal (verified locally, exit code 0).
- **Test coverage:** added `components/icons/__tests__/GithubIcon.test.tsx` (renders an `<svg>`, forwards `className`, respects `size`, defaults to `aria-hidden` and honors an explicit `aria-label`) so the new component doesn't drop overall coverage.

### Rationale

Dependabot's job is to open the PR, not to verify it's safe to merge blind — that verification is exactly what a human/agent review is for, and skipping it here would have shipped a broken footer with a passing CI badge. Hand-porting the one icon lucide-react 1.x dropped is far cheaper than pinning to an abandoned 0.x line or pulling in a second icon package just for one glyph, and keeping the same `Github` import name means zero JSX churn. Taking TypeScript 6.0.x now (rather than staying on 5.9) gets the current-generation compiler's diagnostics and performance improvements without the typescript-eslint breakage that 7.x would cause. Adding `tsc --noEmit` and `next build` to CI is the structural fix: it converts "would have crashed in production" into "fails in the PR," which is the whole point of this exercise.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Merge Dependabot #72 as-is | Removes `Github` from lucide-react's export surface; crashes the footer on every page render, undetected by current CI (no `tsc`/`build` step) |
| Merge Dependabot #73 as-is (TypeScript 7.0.2) | `typescript-eslint`'s peer range excludes TypeScript 7; `npm run lint` fails immediately |
| Add a second icon package (e.g. `simple-icons`) just for the GitHub glyph | Extra dependency and bundle weight for one icon; a ~30-line local component is simpler and has no third-party surface to track |
| Stay on lucide-react 0.x indefinitely | 0.x is the pre-1.0 line; deferring the major forever accumulates drift against upstream fixes to the ~35 icons in use |
| Stay on TypeScript 5.9 | No blocker to moving to the latest 5.x-line-compatible 6.0.x release; deferring gains nothing since 6.0.x is already typescript-eslint-safe |

### Consequences

- Any future lucide-react major that removes another icon this codebase uses will now be caught by the new `tsc --noEmit` CI step (missing export -> type error) before merge, not discovered at runtime.
- `GithubIcon.tsx` is now a maintenance surface: if lucide-react ever re-adds `Github` (unlikely — brand icons are being kept out of core deliberately) or the project wants a different icon source, this file is the single place to update.
- Dependabot will stop proposing TypeScript >=7.0.0 until the ignore rule is removed; revisit once `typescript-eslint` publishes a release with a peer range covering TypeScript 7 (watch `typescript-eslint`'s release notes / its GitHub milestone for TS 7 support).
- CI runtime increases by roughly the cost of one `tsc --noEmit` pass and one `next build` per Frontend Tests run.
- Verified: `npm run lint` (0 errors, 10 pre-existing warnings, unrelated to this change), `npx tsc --noEmit` (clean), `npm run test:ci` (396/396 tests passed; coverage 74.97% stmt / 78.75% branch / 70.81% fn / 75.2% line, all ≥70%), `npm run build` (exit 0), `npm run build-storybook` (exit 0), `npx -y npm@10 audit` on this branch vs. on `master` (both: 13 vulnerabilities — 7 low, 6 high — no regression).

### Files Changed

- `package.json`, `package-lock.json` — `lucide-react` -> `^1.47.0`, `typescript` -> `^6.0.3` (transitively re-resolves `typescript-eslint`/`@typescript-eslint/parser` to `8.70.1`)
- `components/icons/GithubIcon.tsx` — new file, hand-ported replacement for lucide-react's removed `Github` icon
- `components/icons/__tests__/GithubIcon.test.tsx` — new unit tests
- `app/about/page.tsx`, `components/home/CTASection.tsx`, `components/layout/Footer.tsx` — import `Github` from the new local component instead of `lucide-react`
- `.github/workflows/test.yml` — Frontend Tests job: new `Type check` and `Build` steps after `Lint`
- `.github/dependabot.yml` — root npm block: new `ignore` entry for `typescript` `versions: [">=7.0.0"]`

## Decision 10: Standardise on Node.js 24 LTS and gate deploy workflows

**Date:** 2026-09-22
**Title:** Move CI/Docker off Node 20 (EOL, removed from hosted runners 2026-09-16) onto Node 24 LTS, and fix deploy workflows that silently never ran
**Category:** Infrastructure
**Status:** Active

### Context / Problem

Node 20 reached end-of-life and was removed from GitHub-hosted runner images on 2026-09-16, so every workflow pinned to `node-version: '20'` (and every `node:20-alpine` Dockerfile stage) was running on borrowed time. Separately, the three `*-container-deploy.yml` workflows trigger on `push: branches: [main]`, but the repository's default branch is `master` — they had never once run on a normal push, only via manual `workflow_dispatch`. Bundled into the same PR because it touches the same workflow files: two CI hygiene gaps (missing `CODECOV_TOKEN`, `e2e/.auth/*.png` screenshots silently dropped by the hidden-file filter) and Dependabot config that let 5 stale github-actions PRs sit queued behind the ecosystem's default 5-PR limit.

### Decision

- **Node 24 everywhere:** root `Dockerfile` and `cms/Dockerfile` -> `node:24-alpine` (digest-pinned via `docker buildx imagetools inspect`); `node-version: '20'` -> `'24'` in `test.yml` (frontend-tests, e2e-tests) and `frontend-container-deploy.yml` (run-tests, lhci, chromatic); `package.json` `engines.node` -> `">=24.15.0"` (new field); new `.nvmrc` (`24.15`). Docs updated: `.github/CONTRIBUTING.md` ("Node.js 24.15+"), `docs/UPDATE_GUIDE.md` (its worked example now shows a 24 -> 26 upgrade).
- **isomorphic-dompurify:** loosened `~3.19.0` -> `^3.23.0` (still within the 3.x line, not the 4.x major). This is *not* a Node-floor-neutral bump: 3.20 already moved the dependency chain to jsdom 30 / undici 8, which requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — so `engines.node`/`.nvmrc` above were raised to `24.15.0`/`24.15` specifically to satisfy this, not just "Node 24". Dependabot PR #75 separately bumps to `4.3.0` (a semver-major that the project's own release notes admit should have been a major given this same Node-floor change), which is a materially different change; left open for separate review rather than duplicated here. Verification note: local `npm test`/`npm run build` ran on Node 24.13.0 (below the 24.15 floor — non-fatal `EBADENGINE` warnings only), while the Docker image and CI's `setup-node '24'` resolve to Node 24.21.x, which satisfies it.

  **Update (2026-09-23):** superseded by Decision 13. PR #75 merged, `package.json` now carries `isomorphic-dompurify ^4.3.0`.
- **extract-zip (2 Dependabot alerts, dev-only via `@lhci/cli` -> `lighthouse` -> `puppeteer-core`):** re-checked under Node 24. `@lhci/cli` latest on the registry is still `0.15.1` (unchanged) and pins `lighthouse` to the exact version `12.6.1`, which pins `puppeteer-core ^24.10.0` (the last line still using `extract-zip` to unpack downloaded Chrome archives). Standalone `lighthouse@latest` (13.5.0) has moved to `puppeteer-core ^25.9.0` (Node >=22.12, satisfied by Node 24) which drops `extract-zip`, but `@lhci/cli` has not picked up a lighthouse 13 release. Forcing it via an `overrides` entry would jump `@lhci/cli`'s internal lighthouse dependency across a major version with no verification that `@lhci/cli`'s CLI/API usage still works against it. **Not applied** — remains an accepted dev-only risk (see Decision 7); revisit when `@lhci/cli` ships a release built on lighthouse >=13.
- **Deploy workflow trigger fix:** `push.branches` changed from `[main]` to `[master]` in all three `*-container-deploy.yml` files (they already had `workflow_dispatch`). To keep this safe for forks/template users who haven't provisioned Azure, every Azure-touching job (`build-and-push`, `deploy`, `healthcheck`, `tag-latest`, `rollback`) is now gated with `if: vars.AZURE_DEPLOY_ENABLED == 'true'` (combined with the existing `success()`/`failure()` conditions where present). In `frontend-container-deploy.yml`, the same gate was also added to `lhci` and `chromatic` (they don't touch Azure, but once the trigger runs on every `master` push they'd otherwise fail with no `lighthouserc`/Chromatic project configured); `deploy` already `needs: [build-and-push, lhci, chromatic]`, so with the variable unset every job in the chain is skipped as a unit. Unset or `false`, these jobs are **skipped** (neutral), not failed. Documented as a new "Deploy Gate" section in `.github/REPO_VARIABLES.md`.
- **CI hygiene bundled in:** added `token: ${{ secrets.CODECOV_TOKEN }}` to both `codecov-action` steps in `test.yml` (secret does not currently exist in the repo — see Consequences); added `include-hidden-files: true` to the `e2e/.auth/*.png` screenshot upload step (the directory is dot-prefixed and was silently excluded by the default hidden-file filter).
- **Dependabot config:** `docker` ecosystem entries for `/` and `/cms` now `ignore` semver-major updates to the `node` image (new LTS majors are adopted deliberately, as in this decision); added an `npm-minor-patch` group (`update-types: [minor, patch]`) as the last/catch-all group in both npm directories, after the existing named groups (storybook/testing/types, strapi) so those keep first-match priority; added a `github-actions` group so action bumps land as one PR instead of one-per-action (this is also what was silently capping the queue at 5 PRs). NuGet config left untouched.

### Rationale

Node 20 removal from hosted runners makes this non-optional; Node 24 is the current LTS (Active LTS since 2025-10, Maintenance from 2026-10, EOL 2028-04). Gating deploy on a repo variable rather than deleting/disabling the workflows keeps them functional for the primary repo (once `AZURE_DEPLOY_ENABLED=true` is set) while making the accelerator safe to fork/template — a design goal already established by the "Production" GitHub environment gate on `deploy`.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Jump isomorphic-dompurify straight to `^4` (matching PR #75) | Out of scope for this PR per the task brief; PR #75 already covers it and should be reviewed on its own, not silently duplicated. **Update (2026-09-23):** PR #75 merged the same day; see Decision 13. |
| Force `overrides.lighthouse` to `^13` to clear extract-zip now | `@lhci/cli` 0.15.1 was built and tested against lighthouse 12's API; a major-version override with no upstream release backing it is exactly the kind of "apply only if non-breaking" case that isn't verifiable without deep testing of `@lhci/cli` internals |
| Delete/disable the deploy workflows instead of gating them | They are correct and needed once Azure is provisioned; gating preserves them for the primary deployment while keeping forks green |
| Leave deploy workflows targeting `main` | They would continue to silently never run on push, defeating their purpose |

### Consequences

- **User action required:** create the `CODECOV_TOKEN` secret (`gh secret list` shows none exists) or coverage uploads keep failing silently (`fail_ci_if_error: false` already masks this). Set the `AZURE_DEPLOY_ENABLED` repository variable to `true` (plus the existing Azure secrets/variables in `REPO_VARIABLES.md`) to turn deploys back on for the primary repo.
- Revisit the isomorphic-dompurify `^4` major and the extract-zip/`@lhci/cli` chain together — both were deferred for the same "no verified-safe path yet" reason, and Node 24 now satisfies the Node-floor requirement for both if/when upstream catches up.
- Follow-up: PR #75 (isomorphic-dompurify -> 4.3.0) needs its own review; it is not superseded by this change.
- **Update (2026-09-23):** PR #75 merged (isomorphic-dompurify -> `^4.3.0`); the extract-zip/`@lhci/cli` chain remains open and unresolved upstream — see Decision 13.
- Verified: `node -v` (24.x locally), `npx -y npm@10 ci`, `npm audit --omit=dev --audit-level=high`, `npm run test:ci`, `npm run build`, `npm run build-storybook`, `npm run lint`, Docker builds of the root and `cms/` Dockerfiles, and YAML-parsed every workflow plus `dependabot.yml`.

  **Update (2026-09-23):** the "Docker builds of ... the `cms/` Dockerfile" verification claim above cannot be true from the committed tree — `cms/` has never carried a Strapi app, only `Dockerfile` and `.dockerignore`, so the image cannot build from the committed tree (no `package.json` for `npm run build`). How that verification was run is unknown. See Decision 14, which descopes Strapi to an optional, bring-your-own integration in the docs.

### Files Changed

- `Dockerfile`, `cms/Dockerfile` — `node:24-alpine` (digest-pinned)
- `.github/workflows/test.yml` — `node-version: '24'` (x2), `CODECOV_TOKEN` (x2), `include-hidden-files: true`
- `.github/workflows/frontend-container-deploy.yml`, `backend-container-deploy.yml`, `cms-container-deploy.yml` — `node-version: '24'` (frontend only), trigger branch `master`, `AZURE_DEPLOY_ENABLED` gate on Azure-touching jobs plus `lhci`/`chromatic` in `frontend-container-deploy.yml`
- `package.json` — `engines.node`, `isomorphic-dompurify`
- `.nvmrc` — new file
- `.github/CONTRIBUTING.md`, `docs/UPDATE_GUIDE.md`, `.github/REPO_VARIABLES.md` — Node 24 mentions, Deploy Gate section
- `.github/dependabot.yml` — docker `node` major ignore, `npm-minor-patch` groups, `github-actions` group

---

## Decision 9: Migrate ESLint to Flat Config for Next.js 16; scope the `ajv` override

**Date:** 2026-09-22
**Title:** Replace legacy `.eslintrc.json` + `next lint` with `eslint.config.mjs` + `eslint .`; run lint in CI
**Category:** Testing
**Status:** Active

### Context / Problem

Next.js 16 removed `next lint` entirely, so `npm run lint` (which called it) failed on master. The repo's ESLint config was still the legacy `.eslintrc.json` format. No CI job ran lint, so this had gone unnoticed.

### Decision

- Replaced `.eslintrc.json` with `eslint.config.mjs`, built from `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` (the flat-config exports Next.js 16 documents), plus the existing `eslint-plugin-security` rule overrides carried over verbatim.
- Changed the `lint` script from `next lint` to `eslint .`, with `globalIgnores` covering Next's defaults (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) plus project-specific build/output dirs (`node_modules`, `coverage`, `storybook-static`, `playwright-report`, `test-results`, `backend`, `cms`).
- Added a `Lint` step (`npm run lint`) to the `frontend-tests` job in `.github/workflows/test.yml`, right after `npm ci`.
- Scoped the pre-existing blanket `"ajv": "^8.8.2"` `package.json` override: added nested overrides so `eslint` and `@eslint/eslintrc` keep resolving their own `ajv ^6.14.0` dependency, while every other consumer (schema-utils, ajv-formats, etc.) still gets the forced `^8.8.2+`.
- Fixed the real lint errors the flat config's stricter rule set surfaced (see below); left pre-existing warnings (unused vars, `exhaustive-deps`, unsafe-regex, `no-location-assign-relative-destination`) as warnings, matching prior severity.

### Rationale

The Next.js docs (`/docs/app/api-reference/config/eslint`) prescribe exactly this `eslint.config.mjs` shape as the v16 replacement for `next lint`; no codemod was needed since the config was small enough to hand-migrate. `eslint` stayed on the current major (9.x) — Dependabot is configured to ignore ESLint v10 bumps, so following that same policy here keeps the two in sync.

The blanket `ajv` override (present since the repository's initial commit, with no recorded reason in git history) turned out to be fundamentally incompatible with any ESLint version: both `eslint` and `@eslint/eslintrc` hard-depend on `ajv ^6.14.0` for their internal JSON-schema config validation, and `ajv` 8.x removed the `missingRefs` option those packages call internally (`TypeError: Cannot set properties of undefined (setting 'defaultMeta')` / `Cannot find module 'ajv/lib/refs/json-schema-draft-04.json'`). Forcing `ajv` globally to 8.x therefore broke ESLint outright regardless of flat vs. legacy config — this had simply never been caught because lint was never run. Scoping the override per-parent-package (`npm overrides` supports this) keeps the original security intent (non-ESLint consumers still get the patched `ajv`) without breaking ESLint.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `npx @eslint/migrate-config .eslintrc.json` auto-generated `FlatCompat` shim | Keeps the legacy plugin-resolution layer (`@eslint/eslintrc`'s `FlatCompat`) as a permanent dependency instead of adopting the native flat exports Next.js now documents; more code to maintain for no benefit given how small this config already was |
| Downgrade the `ajv` override version instead of scoping it | Tried `8.17.1` and `8.12.0` first — both still ship the newer internal API `eslint`/`@eslint/eslintrc` don't call the way their bundled `ajv ^6` expects; the incompatibility is a major-version API mismatch, not a patch-level regression, so no 8.x version fixes it |
| Remove the `ajv` override entirely | Would silently re-expose the transitive `ajv` vulnerability in webpack/schema-utils consumers that the override was added to patch |

### Consequences

- `npm run lint` now runs and gates CI (`frontend-tests` job); a future lint regression will fail PRs instead of going unnoticed.
- The `ajv` override is now two entries instead of one; anyone touching it in future dependency work needs to keep the `eslint` / `@eslint/eslintrc` nested overrides in sync with whatever `ajv` major those packages require.
- `react-hooks` (bundled via `eslint-config-next` 16) added a new `set-state-in-effect` rule; the five legitimate browser-API hydration/debounce call sites it flagged got a scoped `eslint-disable-next-line` with a comment, not a project-wide rule disable.

### Files Changed

- `eslint.config.mjs` — new flat config (replaces `.eslintrc.json`, which was deleted)
- `package.json` — `lint` script -> `eslint .`; scoped `ajv` overrides for `eslint` / `@eslint/eslintrc`
- `.github/workflows/test.yml` — added `Lint` step to `frontend-tests`
- `components/providers/ThemeProvider.tsx`, `hooks/useRecentlyViewed.ts`, `hooks/useSavedSearches.ts`, `hooks/useSearchSuggestions.ts` — scoped `react-hooks/set-state-in-effect` disables on browser-API hydration/debounce `setState` calls
- `app/articles/error.tsx` — escaped unescaped apostrophes (`react/no-unescaped-entities`)
- `jest.setup.ts` — replaced `as any` with `as unknown as typeof IntersectionObserver`/`ResizeObserver`
- `tailwind.config.ts`, `__tests__/accessibility/article-form.a11y.test.tsx`, `components/articles/__tests__/ArticleForm.test.tsx` — scoped `no-require-imports` disables where `require()` is structurally necessary
- 9 test files' `jest.mock('next/link', ...)` factories — named the returned mock component (`function MockLink(...)`) instead of an anonymous arrow, satisfying `react/display-name`

### Tests Added

- None (lint-only change); existing Jest suite (`npm run test:ci`) and `tsc --noEmit` re-verified green after the migration.

---

## Decision 8: Upgrade Backend to .NET 10 LTS

**Date:** 2026-09-22
**Title:** Migrate backend from .NET 8 / EF Core 8 to .NET 10 / EF Core 10 (LTS to LTS)
**Category:** Technology
**Status:** Active

### Context / Problem

The backend targeted .NET 8 (LTS, support ends November 2026). Six Dependabot PRs had piled up (#9 runtime image 10.0-alpine, #44 Swashbuckle 10.2.3, #52 SDK image 9.0, #59/#60 Microsoft.* and EF Core 8.0.30 servicing, #61 xunit.runner.visualstudio 4.0.0). They were mutually inconsistent: runtime image 10.0 with an SDK image 9.0 and packages still on 8.0.x. `dependabot.yml` ignores `Microsoft.*` major bumps, so the framework move had to be done by hand.

### Decision

Move every backend project to `net10.0` in one PR, superseding the six Dependabot PRs:

- All Microsoft.* packages -> 10.0.12 (EF Core, JwtBearer, Mvc.Testing, HealthChecks.EFCore, Caching); Asp.Versioning 8.1.1 -> 10.2.1; Swashbuckle 10.2.3; Microsoft.NET.Test.Sdk 18.10.1; xunit.runner.visualstudio 4.0.0; coverlet.collector 10.0.1; FluentAssertions 8.11.0.
- Docker: `sdk:10.0` build / `aspnet:10.0-alpine` runtime (digest-pinned); CI `setup-dotnet` -> `10.0.x`.
- Code: `ArticleEndpointsTests` also removes `IDbContextOptionsConfiguration<ApplicationDbContext>` when swapping in the InMemory provider. EF Core 9 moved provider configuration into that service, and without the removal SQLite and InMemory are both registered. `Program.cs` adds `.AddMvc()` to the API-versioning builder (Asp.Versioning 10.2 analyzer AV0013).
- Kept: Application Insights SDK 2.23.0 (3.x is an OpenTelemetry rewrite, a separate decision), FluentValidation.AspNetCore 11.3.1, xunit v2, Moq.
- No new EF migration: `has-pending-model-changes` reports no model changes on SQLite, and the EF 8 snapshot is compatible.

### Rationale

.NET 10 is the current LTS (supported to November 2028), so going LTS to LTS skips .NET 9 STS. One coordinated PR avoids the half-migrated states the Dependabot PRs would have created. The `Microsoft.*` semver-major ignore stays in place so .NET 11 (STS) is not auto-proposed.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Merge the Dependabot PRs individually | Mixed 8.0 packages / 9.0 SDK / 10.0 runtime images; #59/#60 also add a stray EF Design reference to Infrastructure |
| Stop at .NET 9 | STS release, already near end of support; a second migration would follow within months |
| Stay on Asp.Versioning 8.1.1 | Works on net10, but 10.x is the line aligned with .NET 10 LTS and brings analyzers that catch misconfiguration at build time |
| Suppress `PendingModelChangesWarning` for SQL Server | Hides the real issue: the SQLite-generated migrations never applied cleanly to SQL Server (see Consequences) |

### Consequences

- Runtime image grows because EF Core 10's SQLite native assets ship for all RIDs; the Dockerfile uses `COPY --chown` to avoid duplicating the publish layer. A RID-specific publish is a possible follow-up.
- Pre-existing, not introduced here: the single migrations set is SQLite-typed. Applying it to SQL Server failed on EF 8 (`InvalidCastException` Guid->string); on EF 10 it fails earlier with `PendingModelChangesWarning`. SQL Server needs its own provider-specific migrations assembly. Tracked as a follow-up.
- Developers need the .NET 10 SDK and `dotnet-ef` 10.x (`dotnet tool update -g dotnet-ef --version 10.0.12`).
- Verified: build 0 warnings; 109/109 tests with coverage; vulnerability audit clean; `dotnet ef database update` on SQLite; API smoke (health, articles, versioned routes, swagger); Docker build and run on `aspnet:10.0-alpine`.

### Files Changed

- `backend/src/*/*.csproj`, `backend/tests/*/*.csproj` — `net10.0` + package versions
- `backend/tests/Accelerator.Api.Tests/IntegrationTests/ArticleEndpointsTests.cs` — EF 9+ provider swap
- `backend/src/Accelerator.Api/Program.cs` — `.AddMvc()` on API versioning
- `backend/Dockerfile` — .NET 10 base images, `COPY --chown`
- `.github/workflows/test.yml`, `.github/workflows/backend-container-deploy.yml` — `10.0.x`
- `.github/dependabot.yml` — group exclude-patterns; Docker major-version ignores for dotnet images
- README.md, CLAUDE.md, docs/, documentation/architecture/, .github/CONTRIBUTING.md, .github/ISSUE_TEMPLATE/bug_report.yml, app/about/page.tsx — version references

---

## Decision 7: Security Bump of next 16.3 + next-auth beta.32; Accept extract-zip

**Date:** 2026-09-22
**Title:** Clear all production advisories via direct/in-range bumps; accept the unpatchable Lighthouse CI chain
**Category:** Security
**Status:** Active

### Context / Problem

Dependabot reported 70 open npm advisories (5 critical, 35 high), and the production audit gate (`npm audit --omit=dev --audit-level=high`) was red. The criticals were in `next` (unauthenticated RCE in the Image Optimization API and on Windows-hosted servers; fixed only in 16.3.3+, with no 16.2.x backport) and in `next-auth` / `@auth/core` (an Auth.js config error made `auth()` return a truthy error object, so `if (!session)` guards failed open; plus an email-normalizer homoglyph bypass). Twelve open Dependabot PRs each addressed one slice of this.

### Decision

Fold the twelve Dependabot PRs (#12, #49, #53, #54, #56, #57, #58, #62, #63, #64, #65, #66) into one lockfile regeneration:

- **`next` → `^16.3.6`** (plus `eslint-config-next` → `^16.3.6`): minor bump is required for the criticals. 16.3.6 pins `postcss 8.5.23` and `sharp ^0.35.4`, which **resolves the bundled-postcss risk accepted in Decision 6**.
- **`next-auth` → `^5.0.0-beta.32`** (pins `@auth/core 0.41.3`): one beta step. The upstream diff was reviewed in full: `auth()` now returns `null` on a server-config error (fail closed), OAuth check cookies are bound to their provider, `getToken()` no longer throws on malformed Bearer headers, and emails are NFKC-normalized. No application code changes: our `if (!session) redirect('/login')` guards now fail closed instead of crashing. The only removed module (`next-auth/providers/oauth-types`) is not imported.
- **`isomorphic-dompurify` → `~3.19.0`** (tilde, not caret): 3.20–3.23 silently raised the Node floor to 22 via jsdom 30. 3.19.0 is the last Node-20 line and pulls `dompurify 3.4.15`.
- **`postcss` (top-level) → `^8.5.28`**.
- **Transitive fixes via targeted `npm update`** (undici, nanoid, dompurify, baseline-browser-mapping, js-yaml, fast-uri, brace-expansion, ip-address, browserslist, postcss-selector-parser, @humanfs/node, @babel/core, ws, qs, image-size). All are in-range, so **no new `overrides`**. A blanket `npm audit fix` was avoided because it also moves Storybook core to 10.6.0 (out-of-scope storybook group).
- **Accept — `extract-zip` chain** (2 HIGH, dev-only: `@lhci/cli` → `lighthouse` → `puppeteer-core` → `@puppeteer/browsers` → `extract-zip`): no patched `extract-zip` exists; the only escape (`@puppeteer/browsers` 3.x / `puppeteer-core` 25) requires Node ≥ 22.12, and CI runs Node 20. Used only to unpack Chrome archives downloaded from Google's CDN in CI; never shipped.
- **Defer — `esbuild` 0.27.x** (1 LOW, dev-only): fix needs Storybook ≥ 10.5, handled with the storybook group update.

Result: production audit gate **0 vulnerabilities**; Dependabot 70 → 3 open (extract-zip ×2 accepted, esbuild ×1 deferred); full `npm audit` 13 (7 low, 6 high), all dev-only.

**Update (2026-09-23):** esbuild deferral resolved — PR #84 bumped `esbuild` to `0.28.2`; lockfile confirmed to resolve only that version tree-wide (no other esbuild version present). The `isomorphic-dompurify ~3.19.0` pin was superseded by Decision 10 (`^3.23.0`) and then PR #75 (`^4.3.0`). The `extract-zip` acceptance remains open (still blocked on `@lhci/cli` shipping on `lighthouse` >=13); see Decision 13 for the current full-audit tally (12: 6 low, 6 high, all dev-only, 0 in production).

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Stay on `next` 16.2.x (16.2.12) | Criticals GHSA-2xp9-vwfh-vxw4 / GHSA-p293-qw3h-jr36 are only patched in 16.3.3+ |
| `isomorphic-dompurify` 4.x or `^3.19.0` | Requires / can drift to Node ≥ 22 (jsdom 30); CI is Node 20 |
| Blanket `npm audit fix` | Bumps Storybook core to 10.6.0 while addons stay 10.3.3; out of scope |
| Override `@puppeteer/browsers` → 3.x | Major API change and Node ≥ 22.12 requirement |
| Merge the 12 Dependabot PRs individually | Each regenerates the lockfile with conflicting overlaps; one npm-10 regeneration is reviewable and CI-safe |

### Consequences

- Revisit `extract-zip` acceptance when CI moves to Node 22 (then `@lhci/cli`/`puppeteer` can move to a modern-tar based `@puppeteer/browsers`).
- Remove the `~` pin on `isomorphic-dompurify` (→ `^4`) in the same Node 22 phase.
- Sign-ins in flight during the deploy may fail once with an InvalidCheck error (check cookies minted before the upgrade lack the provider binding); users retry.
- The E2E job still needs `AUTH_ENTRA_ISSUER`: with a config error, beta.32 returns `null` for every request, including the injected test session.
- Verified: `npm ci` (npm 10 + 11 dry-run), prod audit gate, `npm run test:ci` (≥ 70% coverage), `npm run build`, `npm run build-storybook`, Playwright E2E.

### Files Changed

- `package.json` — `next`, `next-auth`, `isomorphic-dompurify`, `eslint-config-next`, `postcss`
- `package-lock.json` — regenerated under npm 10

---

## Decision 6: npm `overrides` for Dev-Tool Transitive Vulnerabilities

**Date:** 2026-06-08
**Title:** Pin patched transitive deps via `overrides`; accept unfixable dev-only advisories
**Category:** Security
**Status:** Active

### Context / Problem

Dependabot reported ~24 open npm advisories, all transitive in `package-lock.json`. After a non-breaking `npm audit fix` (PR #37) cleared the production-facing ones, 13 remained. None are fixable by `npm audit fix` without a breaking downgrade: `npm audit fix --force` wanted to drag `@lhci/cli` back to `0.1.0` and `@storybook/nextjs` to `7.0.14`, wrecking the dev toolchain. The remaining advisories are entirely in dev tooling (Lighthouse CI, Storybook) or framework-internal, and the production audit gate (`npm audit --omit=dev --audit-level=high`) was already passing.

### Decision

Resolve what is safely fixable with `package.json` `overrides` (pin the *transitive* dep to its patched version without downgrading the parent), and formally accept the rest:

- **Override `tmp` → `^0.2.6`** (resolves to 0.2.7): clears the only HIGH advisory plus the `external-editor` / `inquirer` cascade. Consumers (`@lhci/cli`, `external-editor`) used `tmp.fileSync()`-style APIs that are stable across the 0.0.x→0.2.x jump.
- **Override `uuid` → `^11.1.1`**: clears the `uuid` advisory and `@lhci/cli`. Only consumer is `@lhci/cli`, which imports via `require('uuid').v4()` (the namespace entry, still present in v11), not the deep `uuid/v4` path removed in v7+.
- **Accept (no action) — `elliptic` cluster** (6 LOW: `elliptic`, `browserify-sign`, `create-ecdh`, `crypto-browserify`, `node-polyfill-webpack-plugin`, `@storybook/nextjs`): `elliptic` has **no patched version published**; the whole chain is dev-only (Storybook's webpack node-polyfills) and never ships to production.
- **Accept (no action) — `postcss` / `next`** (2 MODERATE): the vulnerable `postcss` is bundled inside `next`; the only `npm audit` fix is downgrading Next.js to 9.x. Not worth a framework downgrade for a moderate advisory; the top-level `postcss` is already patched (8.5.15).

Result: audit dropped 13 → 8 (0 high, 2 moderate, 6 low); production audit gate stays green.

**Update (2026-09-23):** superseded in part by Decision 7 (2026-09-22), which bumped `next` to `^16.3.6` and resolved the bundled-postcss risk accepted here as part of clearing the production audit gate's critical advisories.

> **Lockfile tooling note:** CI runs Node 20 (npm 10). npm 11 (Node 22/24) resolves the `@emnapi` WASM-runtime optional-dependency subtree differently and produces a lockfile CI's `npm ci` rejects (EUSAGE). Regenerate the lockfile with `npx npm@10 install` and verify `npx npm@10 ci --dry-run` exits 0.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `npm audit fix --force` | Downgrades `@lhci/cli`→0.1.0 and `@storybook/nextjs`→7.0.14 — breaks the dev toolchain |
| Downgrade Next.js to fix bundled `postcss` | Breaking change to the production framework for a moderate, framework-internal advisory |
| Dismiss all 13 alerts in the GitHub UI | Loses the genuinely-fixable `tmp` (HIGH) and `uuid` fixes; hides them from re-evaluation |
| Override `elliptic` | No patched version exists — nothing safe to pin to |

### Consequences

- `tmp` and `uuid` are force-resolved tree-wide; future bumps of `@lhci/cli` should re-check the overrides are still needed.
- The 6 `elliptic`-cluster + 2 `postcss`/`next` advisories remain visible in Dependabot as accepted dev-only/framework-internal risk; revisit when upstreams publish fixes (or Storybook drops the polyfill chain / Next bumps its bundled postcss).
- Verified: `npm ci` (npm 10 + 11), `npm run test:ci`, `npm run build`, `npm run build-storybook`, and `lhci healthcheck` all green with the overrides.

### Files Changed

- `package.json` — added `tmp` and `uuid` to `overrides`
- `package-lock.json` — regenerated under npm 10

---

## Decision 5: SQLite for Development, SQL Server for Production

**Date:** 2026-03-24
**Title:** Split database provider — SQLite dev, SQL Server prod
**Category:** Infrastructure
**Status:** Active

### Context / Problem

The accelerator needs to work out-of-the-box with zero cloud infrastructure for local development, while being ready for production-grade Azure SQL without code changes.

### Decision

EF Core provider is selected at runtime based on the `ConnectionStrings__DefaultConnection` environment variable:
- **Unset or empty** → `UseSqlite` with a local `accelerator.db` file
- **Non-empty** → `UseSqlServer` with the supplied connection string

SQLite file is created automatically on first `dotnet ef database update`.

### Rationale

SQLite requires zero installation, runs in-process, and creates its database file on first run — the ideal zero-friction experience for anyone cloning the accelerator. The EF Core abstraction means the switch to SQL Server requires only a connection string; no C# changes.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Always SQL Server (via Docker) | Requires Docker Desktop running; adds ~2 minutes to first-run setup |
| Always SQLite (no SQL Server) | Production-grade apps need a real SQL server; SQLite has concurrency limitations |
| PostgreSQL with Npgsql | Azure SQL is the natural fit for Azure Container Apps; keeps infrastructure cohesive |

### Consequences

- Developers never need Docker for the backend
- EF Core InMemory provider is used in tests (not SQLite) to keep tests fast and side-effect-free
- Production migrations must be run manually — not auto-applied on startup

### Files Changed

- `backend/src/Accelerator.Api/Program.cs` — provider selection logic
- `backend/src/Accelerator.Data/ApplicationDbContext.cs` — seed data

### Tests Added

- Repository integration tests use EF Core InMemory provider (not SQLite)

---

## Decision 4: Namespace "Accelerator"

**Date:** 2026-03-24
**Title:** Use "Accelerator" as the C# namespace and project name prefix
**Category:** Architecture
**Status:** Active

### Context / Problem

The accelerator is extracted from a domain-specific project. All C# namespaces, project names, and solution file references needed a generic name that reads well, conveys purpose, and is easily replaced by users running the rename script.

### Decision

All C# projects use the `Accelerator` namespace prefix:
- `Accelerator.Api`, `Accelerator.Core`, `Accelerator.Data`, `Accelerator.Infrastructure`
- Test projects: `Accelerator.Core.Tests`, `Accelerator.Data.Tests`, `Accelerator.Api.Tests`
- Solution file: `Accelerator.sln`

### Rationale

"Accelerator" is generic, professional, and directly communicates the purpose of the codebase. It is short enough to type but distinctive enough that find-and-replace via `scripts/rename-entity.sh` won't produce false positives.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `MyApp` | Too generic; reads poorly in code |
| `Template` | Implies it won't be compiled or run; misleading |
| Keep original project name | Would expose the source project in the public repo |

### Consequences

- Users running `scripts/rename-entity.sh --project-name "YourProject"` will replace all `Accelerator` references
- The rename script must handle both namespace references and file/folder names

### Files Changed

- All `backend/src/` and `backend/tests/` C# project files
- `Accelerator.sln`

### Tests Added

- No tests specifically for naming; all 109 existing tests verify the namespace compiles correctly

---

## Decision 3: CMS Isolated Behind Docker Profile

**Date:** 2026-03-24
**Title:** Strapi CMS only starts with explicit `--profile cms` Docker flag
**Category:** CMS
**Status:** Active

### Context / Problem

The CMS (Strapi 5 + MySQL) adds ~1 GB RAM overhead and is optional for most users of the accelerator. Including it in the default `docker compose up` would penalize all developers who don't need it and create a confusing startup experience.

### Decision

Strapi and MySQL services in `docker-compose.yml` are assigned `profiles: ["cms"]`. They only start when explicitly requested:

```bash
docker compose --profile cms up -d   # Start with CMS
docker compose up -d                  # Start without CMS (default)
```

The frontend falls back to hardcoded defaults when Strapi is unavailable (`CmsUnavailableError` handling in `lib/cms/client.ts`).

### Rationale

Docker Compose profiles are the idiomatic mechanism for optional service groups. Zero startup cost for the common case; explicit opt-in for CMS work. The fallback system means CMS absence never breaks the application.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Separate `docker-compose.cms.yml` | Requires `-f` flag; non-standard; harder to discover |
| Always include CMS | 1 GB RAM overhead; MySQL startup time; confusing for non-CMS work |
| Remove CMS entirely | CMS is a key differentiator of the accelerator |

### Consequences

- Developers must remember to add `--profile cms` when working on CMS content
- The fallback system adds complexity to each CMS-dependent frontend component
- CMS removal guide (`docs/CMS_REMOVAL_GUIDE.md`) documents how to strip CMS entirely

### Files Changed

- `docker-compose.yml` — `profiles: ["cms"]` on MySQL and Strapi services
- `lib/cms/client.ts` — `CmsUnavailableError` handling
- All CMS-dependent page components — fallback content

### Tests Added

- Frontend tests mock the CMS client to test both success and `CmsUnavailableError` paths

---

## Decision 2: PaginatedResponse.Items as Generic Field Name

**Date:** 2026-03-24
**Title:** Use `items` (not an entity-specific name) for the paginated results array
**Category:** Architecture
**Status:** Active

### Context / Problem

The backend `PaginatedResponse<T>` DTO originally had a domain-specific field name for the results array. When users rename the example entity (Article → Product, etc.), the field name would also need renaming — or the API and frontend would go out of sync.

### Decision

The paginated response DTO uses the generic field name `items` on both the backend C# DTO and the frontend TypeScript type:

```csharp
// C#
public record PaginatedResponse<T>(
    IEnumerable<T> Items, int TotalCount, int CurrentPage, int PageSize, int TotalPages);
```

```typescript
// TypeScript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number; currentPage: number; pageSize: number; totalPages: number;
}
```

### Rationale

`items` is entity-agnostic. After running `scripts/rename-entity.sh`, the API contract remains stable — no consumer needs to know or update the field name. This is the single most important field to genericize because it crosses the API boundary.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `articles` / `products` (entity-specific) | Breaks on entity rename; requires API versioning or migration |
| `data` | Too ambiguous; common source of confusion with response envelopes |
| `results` | Acceptable, but `items` is the most common convention in paginated APIs |

### Consequences

- All list endpoints return `{ items: [...], ... }` — consistent regardless of entity type
- `lib/api/types.ts` uses `PaginatedResponse<ArticleListItem>` with `items` field
- Frontend components access `response.items` — survives entity renames untouched

### Files Changed

- `backend/src/Accelerator.Api/DTOs/PaginatedResponse.cs`
- `lib/api/types.ts`
- All frontend components consuming paginated results

### Tests Added

- Backend: serialization tests confirm field is named `items` in JSON output
- Frontend: API client tests assert `response.items` is correctly mapped

---

## Decision 1: "Article" as Example Domain Entity

**Date:** 2026-03-24
**Title:** Use Article as the example CRUD entity throughout the accelerator
**Category:** Architecture
**Status:** Active

### Context / Problem

The accelerator needs exactly one example entity that demonstrates every operation type (list, detail, create, update, delete, vote, search, filter, pagination, related items). The entity name appears in URLs, code, tests, and documentation — it must read naturally in all contexts.

### Decision

`Article` is the example entity with these fields: `Title`, `Slug`, `ShortDescription`, `FullContent`, `Category` (enum), `Author`, `Status`, `IsFeatured`, `IsTrending`, `VoteCount`, `Tags` (many-to-many), `CreatedDate`, `UpdatedDate`.

Routes: `/articles`, `/articles/[slug]`, `/articles/new`, `/articles/[slug]/edit`.

Users replace `Article` with their domain entity via `scripts/rename-entity.sh --entity-name "Product"`.

### Rationale

Articles map to a wide range of real-world domains (blog posts, knowledge base entries, documentation, product listings with descriptions). The slug-based URL (`/articles/my-article-title`) is immediately recognizable. The entity is rich enough to demonstrate all CRUD operations, voting, tags, categories, status management, and search — without requiring domain-specific business logic.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `Product` | E-commerce specific; pricing/inventory fields confuse the generic demo |
| `Post` | Too blog-specific; "post" doesn't read well in all contexts |
| `Item` | Too abstract; doesn't communicate anything about the entity's shape |
| `Todo` | Classic demo entity but too trivial — doesn't cover all operation types |

### Consequences

- All code, tests, and documentation refer to "Article" until `rename-entity.sh` is run
- 6 seed articles and 18 tags are pre-loaded for an immediate working demo
- The rename script must handle singular/plural and PascalCase/camelCase/kebab-case variants

### Files Changed

- All backend entity, service, repository, controller, and test files
- All frontend page, component, type, and test files
- All documentation examples

### Tests Added

- 109 backend tests (all using Article entity)
- 391 frontend tests (all using Article entity)
