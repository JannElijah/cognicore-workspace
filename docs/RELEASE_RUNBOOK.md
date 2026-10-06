# CogniCore release runbook

## 1. Pre-release checks

1. Run the client build and tests:
   ```powershell
   cd client
   npm test -- --runInBand
   npm run build
   ```
2. Run the backend syntax and health checks:
   ```powershell
   cd server
   python -m py_compile app.py routes\*.py train_model.py
   python -m pytest tests\test_api.py::test_health -q
   ```
3. Confirm the working tree is clean except for intentional release changes.
4. Confirm the Supabase migration has been applied to the target project.

## 2. Required production configuration

### Vercel

- `VITE_API_URL` must be the HTTPS URL of the Render API service.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be configured.
- Do not use a localhost URL in a production Vercel environment.
- Redeploy after changing the variable because Vite embeds it at build time.

### Render

- `DATABASE_URL` must point to the Supabase PostgreSQL database.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be configured.
- `REDIS_URL` should point to the production Redis instance.
- `CRON_SECRET` must be a newly generated value after any exposure.
- CORS must include the deployed Vercel origin.

### GitHub Actions

- Configure the repository secret `CRON_SECRET` with the same value as Render.
- The nightly workflow calls `POST /api/model/retrain` using `X-Cron-Secret`.
- Never place the secret directly in workflow YAML or logs.

## 3. Smoke test after deployment

1. Open `https://<render-service>/api/health`.
2. Expect HTTP `200` and:
   ```json
   {
     "status": "ok",
     "dependencies": {
       "database": "ok",
       "redis": "ok"
     }
   }
   ```
3. Open the Vercel frontend and verify login, assessment submission, one game session,
   telemetry submission, leaderboard loading, and analytics loading.
4. Trigger the GitHub Actions retraining workflow manually and confirm:
   - the request succeeds with HTTP `202`;
   - `/api/model/status` eventually returns `last_retrain_metrics`;
   - the workflow log does not contain the secret.

## 4. Rollback

- Revert the Vercel deployment to the previous deployment.
- Revert the Render service to the previous deploy.
- Do not roll back the database unless the migration is explicitly backward-compatible
  and a database backup has been verified.
- If retraining produces a bad model, restore the prior files from
  `server/model_versions/<artifact_version>/` and restart Render.

## 5. Post-release evidence

Record the deployment URLs, commit SHA, migration status, health response, smoke-test
result, and retraining workflow run URL in the capstone release notes.
