# Security Policy

## Supported Versions
We currently support security updates for the `main` branch.

## Reporting a Vulnerability
Please do not open a public issue. Email security-reports@example.com instead.

## Android Signing
The `keystore.jks` file must NEVER be committed to the repository. It is stored in GitHub Secrets as a Base64 string and decoded during the build process.

## Content Security Policy
Strict CSP headers are enforced via `netlify.toml`.
