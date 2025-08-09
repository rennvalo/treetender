## SQLite + Docker migration (added)
This branch includes a lightweight Express backend (`/backend_sqlite`) that uses **SQLite** for storage
and serves the built frontend from `/dist`. Key files added:

- `backend_sqlite/server.js` — express server + sqlite initialization
- `backend_sqlite/db/init_sqlite.sql` — simplified SQLite schema and seed data
- `Dockerfile` — multi-stage build: builds frontend, installs backend deps, runs Node server
- `docker-compose.yml` — convenience for local development

**Notes & limitations**
- The original project used Supabase/Postgres features (enums, RECORD, triggers). Those were simplified for SQLite compatibility; advanced functions/triggers were not converted and will need manual porting if required.
- Authentication (Supabase auth) is **not** fully emulated. You may need to integrate an auth provider or keep using Supabase for auth while using SQLite for local data.
- This is intended as a starting point for local dev and containerized deployment. If you want full parity with Supabase features we can iteratively convert functions/triggers and add auth emulation.

To build & run locally (from project root):
```bash
docker compose build
docker compose up
# then open http://localhost:3000
```

- Implemented JWT auth endpoints (/auth/register, /auth/login) and a supabase shim for the frontend.
- Added /api endpoints for care parameters, care logs, tree events and a simplified /api/evaluate RPC.
