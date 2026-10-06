# CogniCore - Adaptive Cognitive Training Portal

CogniCore is a cognitive assessment and training platform for the capstone
project. It combines a React/Vite interface, Phaser cognitive games, a Flask
telemetry API, Dynamic Difficulty Adjustment (DDA), and machine-learning
cognitive archetype classification.

The production architecture is:

```text
Vercel (React/Vite client)
        |
        | HTTPS + Supabase bearer token
        v
Render Web Service (Flask API)
        |
        +--> Supabase PostgreSQL
        +--> Redis (cache and rate-limiter storage)
        +--> Random Forest / Isolation Forest model files

GitHub Actions cron
        |
        +--> POST /api/model/retrain on Render
```

## Core capabilities

- Four cognitive domains:
  - Reflex & Attentional Focus
  - Spatial-Visual Memory
  - Logical-Mathematical Reasoning
  - Executive Strategy & Planning
- Phaser game modules with telemetry capture and adaptive difficulty.
- Supabase Auth integration with internal PostgreSQL user records.
- DDA using recent accuracy, reaction time, hesitation, spam-click,
  rule-shift, and path-efficiency metrics.
- Random Forest archetypes:
  - `Fast Learner`
  - `Steady Improver`
  - `High Fatigue`
- Pre-test/post-test assessment flow with deterministic user-seeded question
  sequences.
- Statistical evaluation using paired t-tests, p-values, improvement rates,
  and Cohen's d.
- XP, coins, levels, achievements, streaks, daily quests, and leaderboards.
- Redis-backed caching for high-traffic analytics and leaderboard endpoints.

## Repository structure

```text
/client                  React, Vite, Phaser, Supabase Auth client
/client/components       Dashboard, assessments, game wrappers, analytics UI
/client/games             Phaser scenes and DDA/game-mode integration
/client/utils             API client, telemetry, Supabase, icons, constants
/server                   Flask application, model service, database access
/server/routes             Auth, game, analytics, research, admin, ML routes
/server/models.py          SQLAlchemy PostgreSQL models
/server/database.py        PostgreSQL connection pool
/server/supabase_migration.sql
                          Supabase PostgreSQL schema and RLS setup
/.github/workflows         Automated ML retraining workflow
/docker-compose.yml        Local development stack
```

## Prerequisites

Install the following for local development:

- [Node.js](https://nodejs.org/) v18 or later and npm
- [Python](https://www.python.org/) 3.12
- PostgreSQL-compatible database access, normally Supabase
- Optional: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  and Docker Compose

## Environment configuration

Do not commit real credentials, service-role keys, database passwords, or cron
secrets. Use local `.env`/`.env.local` files and platform secret managers.

### Backend environment variables

Configure these in `server/.env` for local development and as Render
environment variables in production:

```dotenv
DATABASE_URL=postgresql://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<supabase-anon-key>
CORS_ORIGINS=https://<your-vercel-domain>
REDIS_URL=redis://...
CRON_SECRET=<long-random-secret>
DB_POOL_MIN=1
DB_POOL_MAX=20
```

`DATABASE_URL` must point to the Supabase PostgreSQL connection string in the
deployed environment. `SUPABASE_ANON_KEY` is used by the backend to validate
Supabase bearer tokens. `CORS_ORIGINS` should contain the exact Vercel origin
and may contain multiple comma-separated origins when required.

### Frontend environment variables

Configure this in `client/.env.local` for local development and as a Vercel
environment variable for production:

```dotenv
VITE_API_URL=http://127.0.0.1:5000
```

For the deployed client, set `VITE_API_URL` to the Render service URL, for
example:

```dotenv
VITE_API_URL=https://<your-render-service>.onrender.com
```

The frontend also requires the Supabase client configuration used by
`client/utils/supabaseClient`. Never expose a Supabase service-role key in the
frontend.

## Database setup

The production database is Supabase PostgreSQL, not SQLite.

1. Create or select a Supabase project.
2. Obtain the PostgreSQL connection string.
3. Run [`server/supabase_migration.sql`](server/supabase_migration.sql) in the
   Supabase SQL editor.
4. Apply [`supabase_performance_indexes.sql`](supabase_performance_indexes.sql)
   after the base schema is available.
5. Confirm Row Level Security policies and the application tables before
   connecting the deployed Render service.

The principal tables are:

- `users`
- `game_sessions`
- `performance_metrics`
- `cognitive_profiles`
- `cognitive_assessments`
- `archetype_history`
- `user_profiles`
- `user_inventory`
- `daily_tasks`
- `user_achievements`
- `user_streaks`

The SQL migration, SQLAlchemy models, and startup compatibility migrations
should remain synchronized when new columns are added.

## Local development

### Option A: Docker Compose

Docker Compose provides the quickest local development path:

```bash
docker compose up --build
```

Then open <http://localhost:5173/>.

The Compose configuration is intended for local development. Production uses
Supabase PostgreSQL, Render, Vercel, and externally managed Redis rather than
the local Compose services.

### Option B: Manual setup

Start the backend in one terminal:

```bash
cd server
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The Flask API runs at <http://127.0.0.1:5000/>.

Start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

The Vite client runs at <http://localhost:5173/>.

If the backend is not running on port `5000`, update `VITE_API_URL` in
`client/.env.local`.

## Important API routes

### Health and telemetry

```text
GET  /api/health
GET  /metrics
POST /api/start-session
POST /api/dda
POST /api/submit-metrics
POST /api/submit-metrics/batch
```

### Assessment and evaluation

```text
POST /api/submit-assessment
GET  /api/assessment-status/<username>
POST /api/evaluate
```

### Analytics, research, and ranking

```text
GET /api/user-analytics/<username>
GET /api/user-session-history/<username>
GET /api/session-metrics/<session_id>
GET /api/cohort-analytics
GET /api/leaderboard
GET /api/research/correlations
GET /api/research/learning-curves/<username>
```

### Machine learning operations

```text
GET  /api/model/status
GET  /api/model/clusters
POST /api/model/retrain
POST /api/admin/retrain
```

Game-session, DDA, metric-submission, assessment, and administrative routes
that modify user data require a Supabase bearer token unless the route is
explicitly intended for public research/demo access.

## Deployment

### Frontend: Vercel

1. Import the repository into Vercel.
2. Set the project root to `client` if required by the Vercel project setup.
3. Build with:

   ```text
   npm run build
   ```

4. Configure `VITE_API_URL` to the Render backend URL.
5. Configure the frontend Supabase URL and anon key variables.
6. Add the deployed Vercel origin to the backend `CORS_ORIGINS` value.

### Backend: Render

1. Create a Render Web Service for the Flask backend.
2. Set the service root directory to `server` when applicable.
3. Install dependencies from `requirements.txt`.
4. Configure the production environment variables listed above.
5. Set the service start command according to the Render deployment
   configuration, for example:

   ```text
   gunicorn app:create_app()
   ```

6. Verify:

   ```text
   GET https://<your-render-service>.onrender.com/api/health
   ```

### Database: Supabase

Supabase provides PostgreSQL storage and authentication. The Render service
uses `DATABASE_URL` for PostgreSQL queries and Supabase Auth variables for
bearer-token validation. Apply migrations through the Supabase SQL editor or a
controlled migration process; do not rely on the local SQLite files in
`server/tests/legacy/`.

### Redis

Set `REDIS_URL` on Render to enable:

- `/api/leaderboard` caching
- `/metrics` caching
- cohort/research analytics caching
- Flask-Limiter shared storage

The application falls back to in-memory caching or `memory://` behavior when
Redis is not configured, but production should use a managed Redis service.

## Automated ML retraining

[`/.github/workflows/ml-retrain-cron.yml`](.github/workflows/ml-retrain-cron.yml)
runs nightly at `03:00 UTC` and can also be started manually from GitHub
Actions. It calls:

```text
POST https://<your-render-service>.onrender.com/api/model/retrain
```

The request must authenticate with the same `CRON_SECRET` configured on Render
and in the GitHub Actions secret store. Keep the secret out of workflow source
and rotate it if it has ever been committed or exposed.

The retraining endpoint starts the pipeline in the background, serializes the
updated model artifacts, and reloads the classifier without requiring a manual
application restart.

## Validation checklist

Before a defense demonstration or production release, verify:

- Vercel can reach Render through `VITE_API_URL`.
- Render accepts the Vercel origin through `CORS_ORIGINS`.
- Supabase login returns a valid bearer token.
- Authenticated `/api/start-session` creates a PostgreSQL session.
- `/api/submit-metrics` persists telemetry.
- `/api/dda` returns updated difficulty and cognitive profile data.
- Pre-test and post-test use the same seeded question sequence.
- `/api/evaluate` returns the expected statistical results.
- Leaderboard and `/metrics` work with Redis enabled.
- GitHub Actions retraining receives a successful response from Render.
- No production secrets are present in committed source files.
