# Contributing

Thanks for your interest in improving the AI Fullstack Accelerator. This guide
covers project setup, the standards we follow, and how to get a change merged.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating, you agree to uphold it.

## Getting started

Prerequisites: Node.js 20+, the .NET 8 SDK, and (optionally) Docker for SQL
Server and the Strapi CMS.

```bash
git clone https://github.com/sandropetterle/ai-fullstack-accelerator.git
cd ai-fullstack-accelerator
npm ci                       # frontend dependencies
cp .env.example .env.local   # then fill in the values
dotnet restore backend       # backend dependencies
```

See [docs/GETTING_STARTED.md](../docs/GETTING_STARTED.md) for the full
walkthrough.

## Development workflow

1. Create a branch off `master`: `git checkout -b fix/short-description`.
2. Make your change, with tests.
3. Run the checks below locally.
4. Open a pull request against `master`.

`master` is protected: a PR must pass the **Test Suite** workflow before it can
be merged.

## Running the checks

Frontend (from the project root):

```bash
npm run lint
npm run test:ci      # coverage must be >= 70% (statements/branches/functions/lines)
```

Backend (from `backend/`):

```bash
dotnet build
dotnet test
```

> **Coverage gate:** any change under `app/`, `components/`, or `lib/` must keep
> frontend coverage at or above 70%. `npm run test:ci` enforces this.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(articles): add related-articles carousel
fix(e2e): stabilise firefox soft-navigation flake
docs: clarify auth setup
```

Common types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`, `build`.

## Pull request checklist

- [ ] Tests added or updated, and passing.
- [ ] Coverage >= 70% for touched frontend code.
- [ ] Lint passes.
- [ ] Docs updated when behaviour changes (see the documentation table in
      `CLAUDE.md`).
- [ ] Architectural, security, or infrastructure decisions recorded in
      `documentation/decisions/TECHNICAL_DECISIONS_LOG.md`.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/sandropetterle/ai-fullstack-accelerator/issues/new/choose).
For questions and ideas, open a
[Discussion](https://github.com/sandropetterle/ai-fullstack-accelerator/discussions).
Security issues go through the [security policy](SECURITY.md), not public issues.
