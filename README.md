# KrishiPashu — Livestock Management Web App

A multilingual (English / हिन्दी / मराठी) livestock management web app for Indian
farmers. It tracks animals, milk production, vaccinations, gives smart rule-based
recommendations, sends in-app notifications, generates per-animal QR codes that link
to a public profile page, and works offline.

This is a **pnpm monorepo** with two services:

| Folder | What it is | Default port |
|---|---|---|
| `artifacts/api-server` | Express + Drizzle + PostgreSQL REST API | `8080` |
| `artifacts/krishipashu-web` | React + Vite frontend | `3000` |
| `lib/*` | Shared TypeScript packages (db, api types, etc.) | — |

---

## 1. Prerequisites (Windows laptop)

Install these once:

1. **Node.js 20 LTS or newer** — <https://nodejs.org/en/download> (pick the
   "Windows Installer .msi", accept the default options).
2. **pnpm** — open *PowerShell* and run:
   ```powershell
   npm install -g pnpm
   ```
3. **PostgreSQL 15+** — <https://www.postgresql.org/download/windows/>.
   During install, set a password for the `postgres` user and remember it.
   The default port `5432` is fine.
4. **Git** (optional but recommended) — <https://git-scm.com/download/win>

Verify everything:
```powershell
node -v
pnpm -v
psql --version
```

---

## 2. Get the code

If you downloaded the ZIP, just extract it somewhere like `C:\krishipashu\`.

Open *PowerShell* and `cd` into that folder:
```powershell
cd C:\krishipashu
```

---

## 3. Create the database

Open *SQL Shell (psql)* from the Start menu, log in, then run:
```sql
CREATE DATABASE krishipashu;
\q
```

Your connection string will look like:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/krishipashu
```

---

## 4. Configure environment variables

Copy the example env files into real ones:

```powershell
copy artifacts\api-server\.env.example artifacts\api-server\.env
copy artifacts\krishipashu-web\.env.example artifacts\krishipashu-web\.env
```

Edit `artifacts\api-server\.env` and set:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/krishipashu
JWT_SECRET=<paste any long random string here>
```

Edit `artifacts\krishipashu-web\.env` and (only if you have already deployed) set:
```
VITE_PUBLIC_BASE_URL=https://your-deployed-domain.com
```
Leave it blank while developing locally — QR codes will use `http://localhost:3000`.

---

## 5. Install dependencies

From the project root:
```powershell
pnpm install
```

---

## 6. Create the database tables

```powershell
pnpm --filter @workspace/db run db:push
```
(Answer `yes` if it asks to create new tables.)

---

## 7. Run the app (development)

You need **two PowerShell windows** open in the project folder.

**Window 1 — API server:**
```powershell
pnpm --filter @workspace/api-server run dev
```
Wait until you see `Server listening on port 8080`.

**Window 2 — Web app:**
```powershell
pnpm --filter @workspace/krishipashu-web run dev
```
Wait until you see Vite's "Local: http://localhost:3000".

Open <http://localhost:3000> in your browser. You're done locally.

---

## 8. Build for production

From project root:
```powershell
pnpm -r run build
```
This builds both the API (`artifacts/api-server/dist/`) and the web app
(`artifacts/krishipashu-web/dist/public/`).

To run the production build locally:
```powershell
# Terminal 1 - API
cd artifacts\api-server
node --enable-source-maps .\dist\index.mjs

# Terminal 2 - Web (serves the built static files)
cd artifacts\krishipashu-web
pnpm run serve
```

---

## 9. Deploy

You can deploy this anywhere that runs Node.js + PostgreSQL. A common setup:

| Piece | Service options |
|---|---|
| PostgreSQL | Neon, Supabase, Railway, Render, AWS RDS |
| API server | Render, Railway, Fly.io, AWS, a VPS |
| Web frontend | Vercel, Netlify, Cloudflare Pages, or the same server as the API |

### Option A — Single VPS (simple)

1. Provision an Ubuntu VPS, install Node 20, pnpm, PostgreSQL, and nginx.
2. Copy the project folder onto the server.
3. Set up `.env` files exactly like in Step 4 (use the production DB).
4. Run `pnpm install` and `pnpm -r run build`.
5. Use `pm2` to keep the API alive:
   ```bash
   npm install -g pm2
   cd artifacts/api-server
   pm2 start "node --enable-source-maps ./dist/index.mjs" --name krishipashu-api
   pm2 save
   ```
6. Serve `artifacts/krishipashu-web/dist/public/` with nginx and proxy `/api/*`
   to `http://127.0.0.1:8080`.
7. Point your domain at the server, get an SSL cert with `certbot`.
8. In `artifacts/krishipashu-web/.env`, set
   `VITE_PUBLIC_BASE_URL=https://your-domain.com` and rebuild the web app —
   from now on **QR codes will show your real domain** instead of localhost.

### Option B — Vercel (web) + Render (api) + Neon (db)

1. **DB** — create a Neon project, copy the connection string.
2. **API** — push this repo to GitHub. On Render, create a *Web Service* from
   the `artifacts/api-server` folder.
   - Build command: `pnpm install && pnpm -r run build`
   - Start command: `node --enable-source-maps ./dist/index.mjs`
   - Env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT=10000`, `NODE_ENV=production`
3. **Web** — on Vercel, import the same repo, set the *Root Directory* to
   `artifacts/krishipashu-web`.
   - Build command: `pnpm install && pnpm run build`
   - Output directory: `dist/public`
   - Env vars: `VITE_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app`
4. Add a Vercel rewrite from `/api/(.*)` to your Render API URL so the
   frontend can call the backend on the same origin.

### Important: QR-code domain

The QR code each animal generates uses `VITE_PUBLIC_BASE_URL` if it is set,
otherwise the browser's current URL. **After deploying, set
`VITE_PUBLIC_BASE_URL` to your real domain and rebuild the web app**, otherwise
scanning a QR will open the development URL.

---

## 10. Common commands cheatsheet

```powershell
# Install / update deps
pnpm install

# Sync DB schema
pnpm --filter @workspace/db run db:push

# Dev
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/krishipashu-web run dev

# Type-check the whole repo
pnpm run typecheck

# Production build
pnpm -r run build
```

---

## 11. Default features

- Auth (email + password, JWT)
- Animals: add / edit / delete, photo upload, per-animal QR code
- Milk production tracking + analytics charts
- Vaccination schedule with auto-generated notifications
- Smart rule-based recommendations (translated to your selected language)
- Public scan page at `/scan/:animalId` — no login required
- Offline support via service worker (production builds only)
- 3 languages: English, हिन्दी, मराठी
- Light / dark theme

---

## 12. Troubleshooting

- **"PORT environment variable is required"** — make sure `.env` files exist and
  PowerShell is run from the project root, OR set `PORT` manually:
  `$env:PORT=3000; pnpm --filter @workspace/krishipashu-web run dev`
- **API calls 404 in dev** — start the API server first, then the web app.
- **DB connection errors** — verify `DATABASE_URL`, that the database exists, and
  that PostgreSQL is running (`services.msc` → "postgresql-x64-…").
- **QR code shows localhost after deploy** — set `VITE_PUBLIC_BASE_URL` and
  rebuild the web app.
