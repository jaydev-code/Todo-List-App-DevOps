# CI/CD Pipeline Documentation

## Workflow: Web Deployment
- **Trigger**: Push to `main` branch.
- **Steps**:
    1. Linting & Testing.
    2. Build (Copying artifacts to `dist/`).
    3. Deploy to Netlify via `nwtgck/actions-netlify`.

## Workflow: Android TWA Build
- **Trigger**: Manual `workflow_dispatch`.
- **Steps**:
    1. Install Bubblewrap CLI.
    2. Generate Android project using `twa-config.json`.
    3. Compile to AAB/APK.

## Workflow: Production Release
- **Trigger**: New Tag creation (e.g., `v1.0.1`).
- **Steps**:
    1. Create GitHub Release with auto-generated notes.
