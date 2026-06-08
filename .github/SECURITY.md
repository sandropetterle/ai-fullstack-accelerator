# Security Policy

## Supported Versions

This project is a template/accelerator that you fork and adapt. Security fixes
are applied to the `master` branch only. Once you clone or generate a project
from this template, you are responsible for keeping your copy's dependencies and
configuration current.

| Version | Supported |
| ------- | --------- |
| `master` (latest) | :white_check_mark: |
| Older commits / forks | :x: |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub:

1. Open the **[Security advisories page](https://github.com/sandropetterle/ai-fullstack-accelerator/security/advisories/new)**.
2. Click **Report a vulnerability**.
3. Include a description, reproduction steps, the affected component, and impact.

If you cannot use GitHub's private reporting, email **sandropetterle@gmail.com**
with the details and `SECURITY` in the subject line.

### What to expect

- Acknowledgement within **3 business days**.
- An initial assessment and severity rating within **7 business days**.
- Coordinated disclosure once a fix is available. Reporters are credited if they
  wish to be named.

## Scope

In scope: code in this repository — frontend, backend, CMS configuration,
infrastructure templates, and CI workflows.

Out of scope: vulnerabilities in third-party dependencies (report those upstream;
Dependabot tracks them here), and issues that require a compromised developer
machine or a non-default, insecure configuration.

## Security tooling in this repo

- **Dependabot** version and security updates (`.github/dependabot.yml`).
- **Secret scanning** with push protection.
- **CI security gates** — `npm audit` (production deps) and
  `dotnet list package --vulnerable` fail the build on high-severity advisories
  (see `.github/workflows/test.yml`).
- Architecture notes: `documentation/architecture/SECURITY_OVERVIEW.md`.
