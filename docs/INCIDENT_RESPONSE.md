# Incident Response Plan

## Detection
Incidents are detected via:
- Sentry Error Alerts (Slack/Email).
- GitHub Actions Failure notifications.
- Health check script failures.

## Priority Levels
- **P1**: PWA is completely inaccessible (Status 404/500).
- **P2**: Offline mode failing, Manifest invalid.
- **P3**: UI/UX glitches, non-critical bugs.

## Resolution Steps
1. Revert to last stable commit if `main` is broken.
2. Check Netlify logs for deployment errors.
3. Run `bash infrastructure/scripts/health-check.sh` to verify service status.
4. Update `SECURITY.md` if the incident involves data exposure.
