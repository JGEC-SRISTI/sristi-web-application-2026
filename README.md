# SRISTI 2K26

Official web application for **SRISTI 2K26**, the technical fest of Jalpaiguri Government Engineering College.

Live website: [https://sristi.tech](https://sristi.tech)

## Project structure

- `frontend/` — React, TypeScript, and Vite web application
- `supabase/` — Database configuration, migrations, seed data, and SQL tests
- `docs/` — Backend API contract and administration documentation
- `scripts/` — Development and maintenance scripts
- `.github/workflows/` — GitHub Actions workflows for frontend deployment and database checks

## Requirements

- Node.js 22 or later
- npm
- Access to the project's Supabase instance for features that use the backend

## Run the frontend locally

1. Clone the repository and enter the frontend directory:

   ```bash
   git clone https://github.com/JGEC-SRISTI/sristi-web-application-2026.git
   cd sristi-web-application-2026/frontend
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Create a local environment file by copying the example:

   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env.local

   # macOS / Linux
   cp .env.example .env.local
   ```

4. Edit `frontend/.env.local` and add the correct values for your development environment:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   VITE_GA_MEASUREMENT_ID=
   ```

   Get the Supabase URL and anon/publishable key from the project's Supabase settings. The Google Analytics measurement ID is optional; leave it blank to disable analytics locally. Never put a Supabase service-role key or other server secret in a `VITE_` variable or commit `.env.local`.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open the local URL printed by Vite, usually `http://localhost:5173`.

## Frontend commands

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Type-check and create the production build in `frontend/dist/` |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Serve the production build locally after building |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes for backend features | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes for backend features | Public browser anon/publishable key; access must be protected by database policies |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID; analytics is disabled when blank |
| `VITE_BASE_PATH` | Set by the deploy workflow | Vite base path used for GitHub Pages |

For production, configure the corresponding values in the repository's **Settings → Secrets and variables → Actions**. The deployment workflow reads `VITE_SUPABASE_URL` and `VITE_GA_MEASUREMENT_ID` as repository variables and `VITE_SUPABASE_ANON_KEY` as a repository secret. GitHub Pages derives the base path during the build.

## Branches, pull requests, and deployment

1. Start new work from the latest `main` branch and create a descriptive feature branch.
2. Commit and push your feature branch; do not push feature work directly to `main`.
3. Open a pull request from the feature branch into `main` and review the changes and checks.
4. After approval, merge the pull request into `main`.
5. A push to `main` starts the **Deploy frontend to GitHub Pages** workflow. Follow it in the repository's **Actions** tab; the site updates after the deployment succeeds.

The deployment workflow builds the frontend and publishes it to GitHub Pages, including a fallback file for client-side routes. The production site uses the custom domain `https://sristi.tech`.

## Documentation

- [Backend API contract](docs/backend-api-contract.md)
- [Admin bootstrap guide](docs/admin-bootstrap.md)
