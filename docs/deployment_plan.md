# Inzira — Deployment Plan

## Phase 1: Local Development (Current)

### Next.js Web App
- Run: `cd web && npm run dev`
- Access: http://localhost:3000
- All recommendation logic runs client-side using the Rwanda dataset loaded via API routes

### Python Backend (Optional)
- Run: `cd app && pip install -r requirements.txt`
- The `recommender.py` module can be wrapped in FastAPI for a REST API

---

## Phase 2: Staging — Vercel Deployment

1. Push repository to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Set root directory to `web/`
4. Add environment variable: `NEXT_PUBLIC_DATA_SOURCE=bundled`
5. Deploy → Vercel auto-deploys on every push

**Estimated cost:** Free tier (hobby)

---

## Phase 3: Production — Full Stack

### Option A: Vercel + Python FastAPI (Recommended)
```
User Browser → Vercel (Next.js) → FastAPI (Render.com) → Rwanda CSV
```

1. Deploy FastAPI backend to [render.com](https://render.com) (free tier)
2. FastAPI exposes `/recommend/main` and `/recommend/nearby` endpoints
3. Next.js calls FastAPI via `NEXT_PUBLIC_API_URL`

### Option B: Streamlit Community Cloud (Simple Demo)
```
User Browser → Streamlit Cloud → app.py → Rwanda CSV
```
- Push to GitHub, deploy via [streamlit.io/cloud](https://streamlit.io/cloud)
- Best for academic demonstration

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL | `https://inzira-api.onrender.com` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for dark map tiles | `pk.eyJ1...` |

---

## CI/CD (Future)

- GitHub Actions: lint + build check on pull requests
- Vercel: auto-deploy on merge to `main`
- Data refresh: cron job to update `Rwanda_places_catalogue.csv` quarterly

---

## Infrastructure Diagram

```
                    ┌─────────────────┐
                    │   User Browser  │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │  Vercel CDN     │
                    │  Next.js App    │
                    └────────┬────────┘
                             │ API calls
               ┌─────────────▼─────────────┐
               │   Next.js API Routes      │
               │   /api/recommend          │
               └─────────────┬─────────────┘
                             │
               ┌─────────────▼─────────────┐
               │  Rwanda_places_catalogue  │
               │  (bundled JSON / CSV)     │
               └───────────────────────────┘
```
