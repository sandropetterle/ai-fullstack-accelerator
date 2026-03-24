# Decision Template

**Last Updated:** 2026-03-24
**Audience:** All developers and architects adding new decisions
**Purpose:** Standardized format for entries in TECHNICAL_DECISIONS_LOG.md. Copy this template for each new decision.

---

## How to Use

1. Copy the template below into `TECHNICAL_DECISIONS_LOG.md`
2. Add at the **top** of the file (newest first ordering)
3. Assign the next sequential decision number
4. Fill in all sections — do not leave sections blank

---

## Template

```markdown
## Decision N: Short Descriptive Title

**Date:** YYYY-MM-DD
**Title:** Full descriptive title
**Category:** Architecture | Frontend | Backend | Infrastructure | Security | Testing | CMS | Performance | Cost
**Status:** Active

### Context / Problem

What situation or need triggered this decision? What was wrong with the existing approach?

### Decision

What was decided and implemented? Be specific — include the chosen approach, key configuration values, and algorithm details if relevant.

### Rationale

Why this approach over alternatives? What were the decisive factors?

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Option A | Reason |
| Option B | Reason |

### Consequences

What are the trade-offs, known limitations, follow-up work required, or risks introduced?

### Files Changed

Key files affected (helps trace the decision to code):
- `path/to/file.cs` — description of change
- `path/to/component.tsx` — description of change

### Tests Added

- N backend tests (describe what they cover)
- N frontend tests (describe what they cover)
```

---

## Decision Categories

| Category | Use For |
|----------|---------|
| `Architecture` | System design, layer boundaries, API design, patterns |
| `Frontend` | Next.js patterns, component architecture, state management |
| `Backend` | ASP.NET Core patterns, service design, repository patterns |
| `Infrastructure` | Azure resources, Docker, CI/CD pipelines |
| `Security` | Auth, CORS, CSP, secrets management |
| `Testing` | Test frameworks, mocking strategies, CI quality gates |
| `CMS` | Strapi configuration, content models, ISR |
| `Performance` | Caching, optimization, benchmarking |
| `Cost` | Azure cost optimization decisions |

---

## Compaction

When a decision is superseded or archived (see `GOVERNANCE.md` Section 6), replace the full entry with:

```markdown
## Decision N: Title [ARCHIVED]
**Date:** YYYY-MM-DD | **Superseded by:** Decision M | **Archived:** YYYY-QN
See [DECISIONS_ARCHIVE.md](DECISIONS_ARCHIVE.md) for full text.
```
