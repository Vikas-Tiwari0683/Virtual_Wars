# Security Policy

## Supported Versions

The latest version on the `main` branch is actively maintained and receives security updates.

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in CarbonTrace, please report it responsibly:

1. **Do not** open a public GitHub issue for security problems.
2. Email the maintainers privately, or use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) on this repository.
3. Include:
   - A description of the vulnerability and its impact
   - Steps to reproduce
   - Affected files or endpoints
   - Any suggested remediation

## Response Expectations

- We aim to acknowledge reports within **3 business days**.
- We will provide an assessment and remediation timeline within **7 business days**.
- Once a fix is released, we will credit the reporter (unless anonymity is requested).

## Scope

In scope:
- The Express backend API (`backend/`)
- The React frontend (`frontend/`)
- Authentication, authorization, and data handling

Out of scope:
- Third-party services (Firebase, Neon, Google Cloud) — report those to the respective vendor.
- Issues requiring physical access to a user's device.

## Handling of Secrets

- Environment files (`.env`, `.env.local`, `.env.production`) are never committed.
- API keys are restricted (HTTP referrer / API restrictions) and rotated if exposed.
- Database connections enforce TLS with certificate verification.
