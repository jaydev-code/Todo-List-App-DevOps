# System Architecture

## Overview
This project is a Progressive Web Application (PWA) built with a "DevOps-First" mindset. The separation of concerns between `app-artifact/` and `infrastructure/` allows for rapid application changes while maintaining a robust, automated delivery pipeline.

## Tech Stack
- **Frontend**: Vanilla JS, HTML5, CSS3.
- **PWA Features**: Manifest for installability, Service Worker for offline caching.
- **Infrastructure**: GitHub Actions (CI/CD), Netlify (Hosting), Bubblewrap (Android TWA).
- **Monitoring**: Sentry (Error Tracking).

## Core Logic Flow
1. User interacts with the PWA.
2. Service Worker intercepts requests for offline capability.
3. State is persisted in `localStorage` for simple data durability.
4. GitHub Actions automate the testing and deployment lifecycle.
