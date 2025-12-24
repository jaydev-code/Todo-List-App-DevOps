# Operational Playbook

## Adding a New Feature
1. Create a feature branch.
2. Implement changes in `app-artifact/`.
3. Run `npm test` locally.
4. Merge to `main` to trigger staging/prod deployment.

## Updating Android App
1. Modify `infrastructure/android/twa-config.json`.
2. Trigger the "Build Android (TWA)" workflow in GitHub Actions.
3. Download the generated AAB and upload to Play Store Console.

## Rotating Secrets
1. Go to GitHub Repository Settings > Secrets.
2. Update `NETLIFY_AUTH_TOKEN` or `SENTRY_DSN`.
