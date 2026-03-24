# Diagram Index

**Last Updated:** 2026-03-24
**Audience:** All contributors
**Purpose:** Documents the complete set of Mermaid diagrams for the accelerator — where each diagram lives and the conventions used to create them.

---

## Overview

All diagrams use **Mermaid** format (renders natively in GitHub) and are embedded directly in their target architecture documents. There are 14 diagrams total.

---

## Placeholder Convention

When adding a diagram placeholder in a document, use:

```markdown
<!-- DIAGRAM: Architecture Overview -->
> 📐 *Diagram planned — see [DIAGRAM_INDEX.md](../diagrams/DIAGRAM_INDEX.md)*
```

---

## All Diagrams

### Architecture Diagrams

| Diagram | Target Document | Format |
|---------|----------------|--------|
| System Architecture Overview | [documentation/architecture/SYSTEM_OVERVIEW.md](../architecture/SYSTEM_OVERVIEW.md) | Mermaid flowchart TD |
| Clean Architecture Layers | [documentation/architecture/BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md) | Mermaid flowchart TD |
| Frontend Component Tree | [documentation/architecture/FRONTEND_ARCHITECTURE.md](../architecture/FRONTEND_ARCHITECTURE.md) | Mermaid flowchart TD |
| CMS ISR Revalidation Flow | [documentation/architecture/CMS_ARCHITECTURE.md](../architecture/CMS_ARCHITECTURE.md) | Mermaid sequence |
| CMS Component Dependency Map | [documentation/cms-components/COMPONENT_INDEX.md](../cms-components/COMPONENT_INDEX.md) | Mermaid flowchart TD |

### Infrastructure Diagram

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Azure Infrastructure | [deployment/CONTAINER_APPS_GUIDE.md](../../deployment/CONTAINER_APPS_GUIDE.md) | Mermaid flowchart TD |

### Sequence Diagrams

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Authentication Flow | [documentation/architecture/SECURITY_OVERVIEW.md](../architecture/SECURITY_OVERVIEW.md) | Mermaid sequence |
| Article Vote Flow | [documentation/architecture/BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md) | Mermaid sequence |

### Entity Relationship Diagram

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Database Schema (ERD) | [documentation/architecture/DATA_MODEL.md](../architecture/DATA_MODEL.md) | Mermaid erDiagram |

### User Journey Diagrams

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Browse and Vote | Planned | Mermaid journey |
| Create Article | Planned | Mermaid journey |

### State Diagrams

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Article Lifecycle | [documentation/architecture/BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md) | Mermaid stateDiagram-v2 |
| Authentication States | [documentation/architecture/SECURITY_OVERVIEW.md](../architecture/SECURITY_OVERVIEW.md) | Mermaid stateDiagram-v2 |

### Class Diagram

| Diagram | Target Document | Format |
|---------|----------------|--------|
| Backend Domain Model | [documentation/architecture/BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md) | Mermaid classDiagram |

---

## Mermaid Conventions

**Color palette (consistent across all diagrams):**

| Color | Usage | Fill / Stroke |
|-------|-------|---------------|
| Blue | Next.js · API layer · Server Components | `#DBEAFE / #2563EB` |
| Green | ASP.NET Core · Core domain layer | `#D1FAE5 / #059669` |
| Amber | Databases · Data/persistence layer | `#FEF3C7 / #D97706` |
| Purple | Strapi CMS · OIDC Providers | `#EDE9FE / #7C3AED` |
| Sky | Azure Platform services | `#E0F2FE / #0284C7` |
| Gray | CI/CD · Infrastructure | `#F3F4F6 / #374151` |
| Teal | Layout components | `#CCFBF1 / #0D9488` |
| Pink | Client Components | `#FCE7F3 / #DB2777` |

**Other conventions:**
- Line breaks in node labels: use `<br/>` not `\n`
- Sequence diagram theme: `%%{init: {'theme': 'base', 'themeVariables': {...}}}%%`
- Subgraph direction: `direction LR` or `direction TB` to override the outer flow
- Placeholder nodes: `stroke-dasharray:5 5` classDef

See [Mermaid documentation](https://mermaid.js.org) for full syntax reference.
