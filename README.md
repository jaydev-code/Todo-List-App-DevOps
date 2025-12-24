# DevOps To-Do PWA Project

This project is a production-ready Progressive Web Application (PWA) built with a heavy focus on DevOps best practices, CI/CD automation, and mobile distribution (TWA).

## Features
- **PWA Capabilities**: Fully installable, offline support, and mobile-responsive.
- **CI/CD**: Automatic deployment to Netlify and manual Android builds via GitHub Actions.
- **Infrastructure as Code**: All configurations for hosting, Android builds, and monitoring are version-controlled.
- **Automation Scripts**: Bash scripts for versioning, health checks, and releases.
- **Monitoring**: Integration-ready with Sentry and detailed metrics documentation.

## Prerequisites
- **Node.js**: v18 or higher
- **NPM**: v9 or higher
- **Git**: For version control

## Installation
1. Clone the repository:
    git clone https://github.com/your-username/my-devops-pwa-project.git
    cd my-devops-pwa-project

2. Install dependencies:
    npm install

## Running Locally
To run the PWA locally with a dev server:
    npm start

The application will be available at `http://localhost:8080`.

## Configuration
### Environment Variables
Copy the template and fill in your values:
    cp environments/prod.env.example .env

### CI/CD Setup
To enable automatic deployments:
1. Create a [Netlify](https://www.netlify.com/) account.
2. Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` to your GitHub Repository Secrets.
3. Push to the `main` branch.

## Project Structure
- `app-artifact/`: The PWA source code (HTML, CSS, JS, Manifest, Service Worker).
- `infrastructure/`: DevOps configurations (GitHub Actions, Netlify config, Android TWA config, Scripts).
- `environments/`: Environment-specific configuration templates.
- `docs/`: Comprehensive technical documentation.

## Troubleshooting
- **Service Worker not updating**: Ensure you increment the `CACHE_NAME` in `service-worker.js` and reload the page.
- **Build Failures**: Check GitHub Action logs and ensure `npm run build` works locally.
- **PWA not installable**: Run the site through Google Lighthouse to verify Manifest and HTTPS requirements (HTTPS is handled by Netlify in production).

## License
MIT
