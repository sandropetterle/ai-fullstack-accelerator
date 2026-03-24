# Update Guide

How to keep the project's dependencies, base images, and runtime versions current.

---

## Routine Security Checks

Run these before every release:

**Frontend:**
```bash
npm audit
npm audit fix        # auto-fix non-breaking vulnerabilities
npm audit fix --force  # fix breaking changes — review output carefully
```

**Backend:**
```bash
dotnet list package --vulnerable
dotnet list package --vulnerable --include-transitive  # check indirect dependencies too
```

If `dotnet list package --vulnerable` reports issues, update the affected package:
```bash
dotnet add backend/src/<Project> package <PackageName> --version <safe-version>
```

---

## Dependabot (Already Configured)

Dependabot is configured in `.github/dependabot.yml`. It automatically opens pull requests for:

- **npm** packages (frontend + Storybook)
- **.NET NuGet** packages (all backend projects)
- **Docker base images** — Dependabot tracks SHA digests for `FROM` lines and opens PRs when new digests are published
- **GitHub Actions** — workflow action versions (`uses: actions/checkout@v4`)

What Dependabot does NOT do:
- It does not run your tests — your CI pipeline does that on the Dependabot PR
- It does not merge PRs automatically unless you configure auto-merge
- It does not upgrade major versions by default (configurable via `version-updates` settings)

Review Dependabot PRs promptly. Stale PRs accumulate and become harder to merge as other changes land.

---

## npm Dependency Updates

**Check what's outdated:**
```bash
npm outdated
```

**Update patch and minor versions (safe):**
```bash
npm update
```

**Update a specific package to latest:**
```bash
npm install <package>@latest
```

**After any update:**
```bash
npm run build   # verify no type errors or build failures
npm test        # verify no broken tests
```

For major version upgrades (e.g., Next.js 16 → 17), read the migration guide before updating. Major upgrades often require code changes.

---

## .NET Package Updates

**Check what's outdated:**
```bash
dotnet list package --outdated
dotnet list package --outdated --include-prerelease  # include pre-release versions
```

**Update a specific package:**
```bash
dotnet add backend/src/<Project> package <PackageName>
```

**Update all packages in a project (manual approach):**
Edit the `.csproj` file's `<PackageReference>` versions, then:
```bash
dotnet restore
dotnet build
dotnet test backend/
```

---

## Docker Base Image Updates

The `Dockerfile` uses versioned base images. Dependabot tracks these and opens PRs when digests change.

To manually check for newer images:
```bash
docker pull node:20-alpine
docker pull mcr.microsoft.com/dotnet/aspnet:8.0-alpine
docker pull mcr.microsoft.com/dotnet/sdk:8.0-alpine
```

After updating a `FROM` line, rebuild and test locally:
```bash
docker build -f Dockerfile .
```

---

## Node.js Major Version Upgrade

Example: Node.js 20 → 22

1. Update the `FROM` line in `Dockerfile`:
   ```dockerfile
   # Before
   FROM node:20-alpine AS deps
   # After
   FROM node:22-alpine AS deps
   ```

2. Update `engines` in `package.json`:
   ```json
   "engines": {
     "node": ">=22"
   }
   ```

3. Update the Node.js version in `.github/workflows/` `setup-node` actions:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '22'
   ```

4. Test locally with the new Node.js version installed, then run:
   ```bash
   npm run build
   npm test
   npm run test:e2e
   ```

5. Check the Node.js release notes for any deprecated APIs or breaking changes in native modules.

---

## .NET Major Version Upgrade

Example: .NET 8 → .NET 9

1. Update `<TargetFramework>` in all `.csproj` files:
   ```xml
   <!-- Before -->
   <TargetFramework>net8.0</TargetFramework>
   <!-- After -->
   <TargetFramework>net9.0</TargetFramework>
   ```

2. Update the `FROM` lines in `Dockerfile`:
   ```dockerfile
   # Before
   FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
   FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
   # After
   FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
   FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
   ```

3. Update `.github/workflows/` if you pin a .NET version explicitly.

4. Build and test:
   ```bash
   dotnet build backend/
   dotnet test backend/
   ```

5. Review the .NET release notes for breaking changes, especially in ASP.NET Core middleware, EF Core, and JSON serialization.

---

## AI-Assisted Update Prompts

Use these prompts with Claude Code (or any AI assistant) to speed up update tasks.

**Update all minor and patch npm dependencies:**
```
Review my package.json and update all dependencies to their latest minor/patch versions.
Run npm outdated first to see what's available, then update package.json.
After updating, run npm run build and npm test to verify nothing broke.
```

**Review breaking changes before a major framework upgrade:**
```
I'm upgrading Next.js from version 16 to version 17. Review the Next.js 17 migration guide
and identify all breaking changes that affect my codebase in app/, components/, and lib/.
List each file that needs updating and what change is required.
```

**Audit and fix security vulnerabilities:**
```
Run npm audit and dotnet list package --vulnerable. For each vulnerability, explain the
severity, affected package, and recommended fix. Then apply the safe fixes automatically.
```

**Check for deprecated API usage before a runtime upgrade:**
```
I'm upgrading from .NET 8 to .NET 9. Scan backend/ for any APIs marked as obsolete in
.NET 9 and suggest the replacement for each.
```

---

## Pulling Upstream Accelerator Improvements

If your project was forked from this accelerator and you want to pull in improvements made to the upstream repo:

```bash
# Add the upstream remote (one-time setup)
git remote add upstream https://github.com/<accelerator-org>/ai-fullstack-accelerator.git

# Fetch upstream changes
git fetch upstream

# Review what changed
git log upstream/main --oneline --not HEAD

# Merge or cherry-pick selectively
git merge upstream/main              # merge everything
git cherry-pick <commit-sha>         # take a specific commit only
```

**What to watch for when merging upstream:**
- Conflicts in `lib/api/types.ts` and `lib/api/mappers.ts` — these change when the example entity evolves
- Conflicts in `backend/src/Accelerator.*/` — if you ran `rename-entity.sh`, the namespace will differ
- New migrations in `backend/src/Accelerator.Data/Migrations/` — apply these after merging
- New `.env.example` entries — check and add to your `.env.local`

If the conflict surface is large, cherry-pick specific improvements rather than doing a full merge.
