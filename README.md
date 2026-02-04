# ACTIVATE Skills and Service Marketplace (Ghana MVP)

Tailwind-powered frontend plus a Django backend with real API endpoints, JWT auth wiring, products/quotes/chat, and dashboards. Jumia brand palette, image-rich cards, and Ghana-first trust cues (escrow, disputes, two-way reviews).

## Structure
- `index.html` - Tailwind CDN landing page with carousel, hero search, category and expert cards.
- `marketplace.html`, `products.html`, `product-detail.html`, `expert-profile.html` - Marketplace browsing and detail views.
- `dashboard.html`, `dashboard-expert.html`, `admin-dashboard.html`, `profile.html` - Role dashboards and profile management.
- `scripts.js` - Vanilla JS for rendering data, filters, carousel, and client-side flows.
- `auth.js` - JWT login/signup/admin login + OAuth start URLs; stores tokens in `localStorage`.
- `config.js` - Central API base for deployed backend.
- `backend/` - Django 5 API (DRF + SimpleJWT + CORS + Postgres-ready).

## Run the frontend
- Open `index.html` directly in a modern browser (Tailwind CDN + local images).
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
   - Static Site (root `/`) with `staticPublishPath: .`.
3) Set environment variables on the Web Service:
   - `DJANGO_SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=.onrender.com`
   - `CORS_ALLOWED_ORIGINS=https://activate-ghana.onrender.com`
   - `CSRF_TRUSTED_ORIGINS=https://activate-ghana.onrender.com`
4) Update `config.js`:
   - `window.API_BASE = "https://activate-ghana-backend.onrender.com/api";`
5) Re-deploy the static site so the new `config.js` ships.

## UI highlights
- Navbar: Home, Marketplace, Login, Admin, Sign up; right-aligned.
- Carousel + cards: category, expert, job, review, dispute cards include photos, badges, and chips.
- Marketplace: browse experts/jobs/products; filter by skills/location; product detail includes seller contact + chat.
- Dashboards: client/expert/admin dashboards with quotes, escrow, proposals, and admin actions.
- Chat: localStorage mode or live API mode (when `?data=live` + JWT).
- Support: `support.html` / `help-center.html` with FAQ links, call/WhatsApp buttons, and a ticket form.

## Next steps (optional)
1) Replace remaining sample data with Django responses; add loading states and error toasts.
2) Add real role-based permissions and admin CRUD for users, jobs, products, and disputes.
3) Add file uploads (product images, KYC, evidence) with S3-compatible storage.
