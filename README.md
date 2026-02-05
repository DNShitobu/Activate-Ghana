# ACTIVATE Skills and Service Marketplace (Ghana MVP)

Tailwind-powered frontend plus a Django backend with real API endpoints, JWT auth wiring, products/quotes/chat, and dashboards. Jumia brand palette, image-rich cards, and Ghana-first trust cues (escrow, disputes, two-way reviews).

## Structure
- `index.html` - Tailwind-built landing page with carousel, hero search, category and expert cards.
- `marketplace.html`, `products.html`, `product-detail.html`, `expert-profile.html` - Marketplace browsing and detail views.
- `dashboard.html`, `dashboard-expert.html`, `admin-dashboard.html`, `profile.html` - Role dashboards and profile management.
- `scripts.js` - Vanilla JS for rendering data, filters, carousel, and client-side flows.
- `auth.js` - JWT login/signup/admin login + OAuth start URLs; stores tokens in `localStorage`.
- `config.js` - Central API base for deployed backend.
- `backend/` - Django 5 API (DRF + SimpleJWT + CORS + Postgres-ready).
- `assets/tailwind-input.css`, `assets/tailwind.css`, `tailwind.config.js`, `package.json` - Tailwind build pipeline.

## Run the frontend
```bash
npm install
npm run build:css
```
- Open `index.html` directly in a modern browser (local images + compiled Tailwind).
- Optional local server: `python -m http.server 8000` then visit `http://localhost:8000/`.

## Auth and API wiring (frontend expectations)
- Auth pages (`login.html`, `signup.html`, `admin-login.html`) call `/api/auth/...` endpoints for login/signup/admin login, JWT, password reset, and OAuth (Google/LinkedIn) via `auth.js`. Tokens are stored in `localStorage` (`jwt_access`, `jwt_refresh`, `user_role`).
- Adjust `window.API_BASE` in `config.js` if the Django backend runs elsewhere.
- Dashboards and marketplace use live API data when `?data=live` is present; otherwise they use sample data.

## Run the backend (Django)
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```
APIs live at `http://127.0.0.1:8001/api/`.

## Deploy on Render (backend + static frontend)
1) Push this repo to GitHub (done).
2) Create a Render Blueprint from `render.yaml` (recommended), or manually create:
   - Web Service (rootDir `backend`) using build:
     `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
     and start: `gunicorn skillset.wsgi:application`.
   - Postgres database and connect `DATABASE_URL`.
   - Static Site (root `/`) with `staticPublishPath: .` and build command `npm install && npm run build:css`.
3) Set environment variables on the Web Service:
   - `DJANGO_SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=.onrender.com`
   - `CORS_ALLOWED_ORIGINS=https://activate-ghana.onrender.com`
   - `CSRF_TRUSTED_ORIGINS=https://activate-ghana.onrender.com`
4) Update `config.js`:
   - `window.API_BASE = "https://activate-ghana-backend.onrender.com/api";`
5) Re-deploy the static site so the new `config.js` ships.

Screenshot checklist (Render)
- **R1**: Render services list showing API + Static Site.
- **R2**: API service env vars (secrets masked).
- **R3**: Latest deploy logs showing success.

## OAuth setup (Google + LinkedIn)
Required env vars on the API service:
- `FRONTEND_URL=https://activate-ghana.onrender.com`
- `BACKEND_URL=https://activate-ghana-backend.onrender.com`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI=https://activate-ghana-backend.onrender.com/api/auth/oauth/google/callback`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI=https://activate-ghana-backend.onrender.com/api/auth/oauth/linkedin/callback`

Provider console redirect URLs:
- Google OAuth redirect: `https://activate-ghana-backend.onrender.com/api/auth/oauth/google/callback`
- LinkedIn OAuth redirect: `https://activate-ghana-backend.onrender.com/api/auth/oauth/linkedin/callback`

### Google OAuth (detailed steps)
1) Open **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**.
   - **App name**: ACTIVATE Skills and Service Marketplace
   - **User support email**: your admin email
   - **Authorized domains**: `onrender.com` (and your custom domain if any)
   - Save & continue to **Scopes** (add `email`, `profile`, `openid`).
2) Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
   - **Application type**: Web application
   - **Name**: ACTIVATE Web
   - **Authorized redirect URIs**:
     - `https://activate-ghana-backend.onrender.com/api/auth/oauth/google/callback`
3) Copy the generated **Client ID** and **Client secret**.
4) Set Render API env vars:
   - `GOOGLE_CLIENT_ID=<from console>`
   - `GOOGLE_CLIENT_SECRET=<from console>`
   - `GOOGLE_REDIRECT_URI=https://activate-ghana-backend.onrender.com/api/auth/oauth/google/callback`
5) Redeploy API, then test on `login.html` → **Continue with Google**.

Screenshot checklist (Google)
- **G1**: OAuth consent screen summary (app name + scopes).
- **G2**: OAuth client ID config (authorized redirect URIs visible).
- **G3**: Credentials page showing Client ID (mask secret).

### LinkedIn OAuth (detailed steps)
1) Open **LinkedIn Developer Portal** → **My Apps** → **Create App**.
   - App name: ACTIVATE Skills and Service Marketplace
   - LinkedIn Page: your business page (required)
2) Inside your app, go to **Auth** tab.
   - Add **OAuth 2.0 Redirect URLs**:
     - `https://activate-ghana-backend.onrender.com/api/auth/oauth/linkedin/callback`
3) Go to **Products** tab:
   - Enable **Sign In with LinkedIn using OpenID Connect**.
4) Copy **Client ID** and **Client Secret** from the app settings.
5) Set Render API env vars:
   - `LINKEDIN_CLIENT_ID=<from portal>`
   - `LINKEDIN_CLIENT_SECRET=<from portal>`
   - `LINKEDIN_REDIRECT_URI=https://activate-ghana-backend.onrender.com/api/auth/oauth/linkedin/callback`
6) Redeploy API, then test on `login.html` → **Continue with LinkedIn**.

Screenshot checklist (LinkedIn)
- **L1**: App Auth tab with redirect URL set.
- **L2**: Products tab showing “Sign In with LinkedIn using OpenID Connect”.
- **L3**: App credentials (Client ID visible, secret masked).

## UI highlights
- Navbar: Home, Marketplace, Login, Admin, Sign up; right-aligned.
- Carousel + cards: category, expert, job, review, dispute cards include photos, badges, and chips.
- Marketplace: browse experts/jobs/products; filter by skills/location; product detail includes seller contact + chat.
- Dashboards: client/expert/admin dashboards with quotes, escrow, proposals, and admin actions.
- Chat: localStorage mode or live API mode (when `?data=live` + JWT).
- Support: `support.html` / `help-center.html` with FAQ links, call/WhatsApp buttons, and a ticket form.

## Security guardrails
- CSP headers on the API and CSP meta tags on the static pages to reduce XSS risk (no inline scripts or styles, no `unsafe-eval`).
- Rate limiting on auth + reset + OAuth endpoints to mitigate brute‑force and abuse.
- Tailwind CSS is compiled locally via `assets/tailwind-input.css` + `tailwind.config.js` (no CDN scripts needed).
  - If you change the API host or add new external image hosts, update the CSP allowlist in the HTML meta tags and `backend/skillset/settings.py`.

## Next steps (optional)
1) Replace remaining sample data with Django responses; add loading states and error toasts.
2) Add real role-based permissions and admin CRUD for users, jobs, products, and disputes.
3) Add file uploads (product images, KYC, evidence) with S3-compatible storage.
