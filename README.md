# ACTIVATE Skills and Service Marketplace (Ghana MVP)

Tailwind-powered frontend plus a Django backend scaffold. Blue/white professional palette, image-rich cards, carousel, and Ghana-first trust cues (escrow, disputes, two-way reviews).

## Structure
- `index.html` — Tailwind CDN single page with carousel, hero search, category and expert cards.
- `scripts.js` — Vanilla JS to render sample data, filters, carousel, and smooth scrolling.
- `backend/` — Django 5 scaffold with simple JSON endpoints:
  - `manage.py`, `skillset/` project, `api/` app with `/api/health`, `/api/experts`, `/api/jobs`, `/api/disputes`.
  - `requirements.txt` for Django + DRF.

## Run the frontend
- Open `index.html` directly in a modern browser (Tailwind CDN + Unsplash images).
- Optional local server: `python -m http.server 8000` then visit `http://localhost:8000/`.

## Auth & API wiring (frontend expectations)
- Auth pages (`login.html`, `signup.html`, `admin-login.html`) call `/api/auth/...` endpoints for login/signup/admin login, JWT, password reset, and OAuth (Google/LinkedIn) via `auth.js`. Tokens are stored in `localStorage` (`jwt_access`, `jwt_refresh`, `user_role`).
- Adjust `API_BASE` in `auth.js` if the Django backend runs elsewhere.
- Dashboards, onboarding, job post, proposals, disputes, payments, analytics, and help center are static stubs ready to hook to the Django REST API.

## Run the backend (Django)
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```
APIs live at `http://127.0.0.1:8001/api/experts` etc.

## UI highlights
- Navbar: Find experts search box, Browse jobs link, Login and Sign up buttons.
- Hero: CTA buttons, dual search, trust pills, and stat cards.
- Carousel: rotating trust/feature highlights with imagery.
- Cards: category, expert, job, review, and dispute cards now include photos, badges, and chips.
- Trust cues: escrow timers (5d initial, 3d after revision), admin actions (release_full, release_partial, refund_client, split_funds, freeze_wallet), two-way review publish rule (both parties or 14 days).
- Low-bandwidth mode: set `document.body.dataset.lite = "1"` in `scripts.js` to compress images and pause autoplay for low-end Android users.
- Accessibility/perf: lazy-load images; use Lighthouse to audit focus, contrast, and cache headers.
- Support: `support.html` / `help-center.html` offer FAQ links, call/WhatsApp buttons, and a ticket form.

## Next steps (optional)
1) Swap CDN Tailwind for a build pipeline (Vite/Next.js) and connect real API calls.  
2) Replace sample data with Django responses; add loading states and toasts.  
3) Extend Django with auth/JWT and real models for accounts, experts, jobs, contracts, disputes, and reviews.  
