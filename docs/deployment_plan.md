# Inzira — Deployment Plan

## Phase 1: Local Development (Current)

### Next.js Web App
- Run: `npm install && npm run dev` (in the root directory)
- Access: http://localhost:3000
- All recommendation logic runs client-side at the Edge (using the bundled static dataset `/rwanda_places.json` loaded via client-side fetch) for sub-millisecond execution latency.

### Python Backend & Analytics Dashboard
- Run: `cd backend && pip install -r requirements.txt && streamlit run app.py`
- Access: http://localhost:8501
- Exposes an interactive Streamlit UI for data visualization, custom scoring experiments, and ML pipeline verification.

---

## Phase 2: Staging — Vercel Deployment

1. Push repository to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Set root directory to `.` (the repository root contains package.json)
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
                     ┌─────────────────┐
                     │   User Browser  │
                     └────────┬────────┘
                              │ HTTPS
                     ┌────────▼────────┐
                     │  Render CDN     │
                     │  Next.js App    │
                     └────────┬────────┘
                              │ Static Load
                ┌─────────────▼─────────────┐
                │   /rwanda_places.json     │
                │   (client-side memory)    │
                └─────────────┬─────────────┘
                              │ Feedback Logs
                ┌─────────────▼─────────────┐
                │   Next.js API Routes      │
                │   /api/feedback           │
                └─────────────┬─────────────┘
                              │
                ┌─────────────▼─────────────┐
                │   user_feedback.csv       │
                │   (local/persistent CSV)  │
                └───────────────────────────┘

---

## Deployment Verification Plan

To verify the deployment in the target environment (Render or Vercel), perform the following checks:

### 1. Build Verification
Ensure the build log on Render concludes with:
```text
✓ Generating static pages (5/5)
✓ Finalizing page optimization
Route (app)                              Size     First Load JS
┌ M /                                    182 kB          271 kB
└ ○ /api/feedback                        0 B                0 B
+ First Load JS shared by all            87.9 kB
  ├ chunks/framework-f2b1d3a436214db2.js 45.4 kB
  ├ chunks/main-88db09a27dbf8da6.js      31.2 kB
  └ ...
✓ Uploading build...
✓ Deploying...
```

### 2. Live Application Functional Smoke Tests
Once the status changes to "Live", verify:
1. **Homepage Load**: Access the deployed URL (`https://inzira-cdr7.onrender.com/`). The search box, category tags, and "PROBLEM EVIDENCE" dashboard must render without JS exceptions.
2. **Recommendation Engine**: Select `🌿 Nature` and click **Get Recommendations**. Confirm that top picks (e.g. *Burera Viewpoint*, *Nyungwe National Park*) display with match percentages.
3. **Map Rendering**: Navigate to the **Map** tab and confirm that the leaflet voyager dark tiles render correctly.
4. **Active Feedback Loop**: Expand a pick, submit feedback (e.g., "Excellent UI!"), and verify via Developer Tools that a `POST` request to `/api/feedback` returns a `200 OK` status code.
5. **Static Data Integrity**: Verify that visiting `https://<deployed-url>/rwanda_places.json` returns a valid JSON array of 1,236 items.
```
