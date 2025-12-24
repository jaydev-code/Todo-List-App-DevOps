# Analytics and Metrics Strategy

## Tracking Tools
- **Google Analytics (G-Tag)**: For user behavior tracking.
- **Sentry**: For error reporting and performance monitoring (Web Vitals).

## Key Metrics (DORA)
1. **Deployment Frequency**: Measured via GitHub Actions runs.
2. **Lead Time for Changes**: From commit to production deploy.
3. **Change Failure Rate**: Percentage of deployments causing incidents.
4. **Time to Restore Service**: Average recovery time from Sentry alerts.

## Implementation
Insert the following script in `index.html` for basic GA tracking:
    <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ID"></script>
