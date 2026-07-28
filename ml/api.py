"""
api.py — Inzira ML API Server
FastAPI backend that loads trained .pkl models and serves real predictions.
"""

import os
import math
import json
import hashlib
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Load trained models ──────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

print("Loading trained ML models...")
rf_model = joblib.load(os.path.join(MODEL_DIR, "rf_scorer.pkl"))
tfidf = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
cosine_sim = joblib.load(os.path.join(MODEL_DIR, "cosine_similarity_matrix.pkl"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))
df = pd.read_pickle(os.path.join(MODEL_DIR, "processed_places.pkl"))

with open(os.path.join(MODEL_DIR, "model_metadata.json")) as f:
    model_metadata = json.load(f)

print(f"Loaded {len(df)} places, RF model ({model_metadata['rf_n_estimators']} trees), TF-IDF ({model_metadata['tfidf_features']} features)")
print(f"Model performance: R²={model_metadata['r2_score']}, RMSE={model_metadata['rmse']}")

# ─── Constants ────────────────────────────────────────────────────────────────

INTEREST_TO_TAGS = {
    "nature": ["nature", "wildlife", "lake", "national_park", "explore"],
    "wildlife": ["wildlife", "national_park", "nature"],
    "culture": ["culture", "history", "art"],
    "food": ["food", "local", "rwandan", "african", "regional", "restaurant",
             "barbecue", "pizza", "coffee", "coffee_shop", "international",
             "italian", "indian", "asian", "chinese", "steak_house", "chicken"],
    "history": ["history", "culture"],
    "adventure": ["adventure", "explore", "viewpoint", "accessible"],
    "art": ["art", "culture"],
    "shopping": ["shopping"],
    "relaxation": ["relaxation", "coffee", "coffee_shop"],
}

CATEGORY_TO_INTERESTS = {
    "Nature & Wildlife": ["nature", "wildlife"],
    "Lakes & Waterways": ["nature"],
    "Cultural & Historic": ["culture", "history"],
    "Attraction": ["adventure", "culture"],
    "Scenic Viewpoints": ["adventure"],
    "Food & Drink": ["food"],
    "Café": ["food", "relaxation"],
    "Lodging": ["relaxation"],
    "Markets & Shopping": ["shopping"],
    "Arts & Entertainment": ["art"],
}

BUDGET_COMPAT = {
    "any": {"low", "medium", "high", "unknown"},
    "low": {"low", "unknown"},
    "medium": {"low", "medium", "unknown"},
    "high": {"low", "medium", "high", "unknown"},
}

# ─── Helper Functions ─────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    f = math.pi / 180
    a = (math.sin((lat2 - lat1) * f / 2) ** 2 +
         math.cos(lat1 * f) * math.cos(lat2 * f) * math.sin((lon2 - lon1) * f / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def build_features(user_interests, user_budget, user_time, user_province, place):
    """Build the feature vector for a user-place pair, matching training features."""
    place_tags = set(place["tags_list"]) if isinstance(place["tags_list"], list) else set()
    cat_interests = CATEGORY_TO_INTERESTS.get(place["category"], [])

    tag_overlap = 0
    cat_overlap = 0
    for interest in user_interests:
        expanded = INTEREST_TO_TAGS.get(interest, [interest])
        tag_overlap += sum(1 for t in expanded if t in place_tags)
        if interest in cat_interests:
            cat_overlap += 1

    budget_compat_set = BUDGET_COMPAT.get(user_budget, BUDGET_COMPAT["any"])

    return {
        "tag_overlap_count": tag_overlap,
        "category_overlap_count": cat_overlap,
        "n_user_interests": len(user_interests),
        "tag_overlap_ratio": tag_overlap / max(len(user_interests), 1),
        "budget_exact_match": 1 if place["cost_level_norm"] == user_budget else 0,
        "budget_compatible": 1 if place["cost_level_norm"] in budget_compat_set else 0,
        "time_exact_match": 1 if place["duration_norm"] == user_time else 0,
        "time_compatible": 1 if user_time == "any" or place["duration_norm"] in ("unknown", user_time) else 0,
        "province_match": 1 if (user_province != "any" and (
            user_province.lower().split()[0] in str(place.get("province_or_city", "")).lower() or
            user_province.lower().split()[0] in str(place.get("district", "")).lower()
        )) else 0,
        "hidden_gem_score_norm": float(place["hidden_gem_score_norm"]),
        "popularity_high": 1 if place["popularity_norm"] == "high" else 0,
        "popularity_medium": 1 if place["popularity_norm"] == "medium" else 0,
        "cost_low": 1 if place["cost_level_norm"] == "low" else 0,
        "cost_medium": 1 if place["cost_level_norm"] == "medium" else 0,
        "cost_high": 1 if place["cost_level_norm"] == "high" else 0,
        "is_food": 1 if place["category"] in ("Food & Drink", "Café") else 0,
        "is_nature": 1 if place["category"] in ("Nature & Wildlife", "Lakes & Waterways", "Scenic Viewpoints") else 0,
        "is_culture": 1 if place["category"] in ("Cultural & Historic", "Arts & Entertainment") else 0,
        "is_lodging": 1 if place["category"] == "Lodging" else 0,
    }


def place_to_dict(place_row, score, distance_km=None):
    """Convert a DataFrame row to a JSON-serializable dict."""
    result = {
        "place_id": str(place_row.get("place_id", "")),
        "place_name": str(place_row["place_name"]),
        "district": str(place_row.get("district", "")),
        "province_or_city": str(place_row.get("province_or_city", "")),
        "latitude": float(place_row["latitude"]),
        "longitude": float(place_row["longitude"]),
        "category": str(place_row["category"]),
        "tags_list": place_row["tags_list"] if isinstance(place_row["tags_list"], list) else [],
        "cost_level_norm": str(place_row.get("cost_level_norm", "unknown")),
        "duration_norm": str(place_row.get("duration_norm", "unknown")),
        "popularity_norm": str(place_row.get("popularity_norm", "medium")),
        "hidden_gem_score_norm": float(place_row.get("hidden_gem_score_norm", 50)),
        "match_pct": int(round(score * 100)),
        "final_score": round(score * 100, 1),
    }
    if distance_km is not None:
        result["distance_km"] = round(distance_km, 1)
    return result


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="Inzira ML API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    interests: list[str] = []
    budget: str = "any"
    available_time: str = "any"
    preferred_province: str = "any"
    hidden_gem_pref: str = "hidden gems"
    top_n: int = 6
    search_query: str = ""
    saved_places: list = []
    user_type: str = "tourist"


class NearbyRequest(BaseModel):
    place_name: str
    interests: list[str] = []
    budget: str = "any"
    available_time: str = "any"
    hidden_gem_pref: str = "hidden gems"
    top_n: int = 6
    user_type: str = "tourist"


class SimilarRequest(BaseModel):
    place_name: str
    top_n: int = 5


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": "RandomForest",
        "n_places": len(df),
        "r2_score": model_metadata["r2_score"],
        "rmse": model_metadata["rmse"],
    }


@app.get("/api/model-info")
def model_info():
    return model_metadata


@app.post("/api/recommend")
def recommend(req: RecommendRequest):
    """Stage 1: ML-powered personalized recommendations using trained Random Forest."""

    # Filter by search query if provided (using keyword split to match all keywords across multiple fields)
    candidates = df
    if req.search_query.strip():
        keywords = req.search_query.lower().strip().split()
        if keywords:
            mask = pd.Series(True, index=candidates.index)
            for kw in keywords:
                kw_mask = (
                    candidates["place_name"].str.lower().str.contains(kw, na=False) |
                    candidates["category"].str.lower().str.contains(kw, na=False) |
                    candidates["district"].str.lower().str.contains(kw, na=False) |
                    candidates["province_or_city"].str.lower().str.contains(kw, na=False) |
                    candidates["interest_tags"].str.lower().str.contains(kw, na=False)
                )
                mask = mask & kw_mask
            candidates = candidates[mask]

    # Filter by preferred province if specified
    if req.preferred_province and req.preferred_province.strip().lower() != "any":
        prov_kw = req.preferred_province.strip().lower().split()[0]
        prov_mask = (
            candidates["province_or_city"].str.lower().str.contains(prov_kw, na=False) |
            candidates["district"].str.lower().str.contains(prov_kw, na=False)
        )
        prov_candidates = candidates[prov_mask]
        if len(prov_candidates) > 0:
            candidates = prov_candidates

    # Filter out highly popular places if user wants hidden gems (to omit well-known spots)
    if req.hidden_gem_pref == "hidden gems":
        candidates = candidates[candidates["popularity_norm"] != "high"]

    if len(candidates) == 0:
        return {"results": [], "model": "rf_scorer", "n_candidates": 0}

    # Build feature matrix for all candidate places
    features = []
    for _, place in candidates.iterrows():
        feat = build_features(
            req.interests, req.budget, req.available_time,
            req.preferred_province, place
        )
        features.append(feat)

    X = pd.DataFrame(features)[feature_cols].values

    # Run model prediction
    scores = rf_model.predict(X)

    # Apply hidden gem preference boost
    for i, (_, place) in enumerate(candidates.iterrows()):
        if req.hidden_gem_pref == "hidden gems":
            if float(place["hidden_gem_score_norm"]) >= 70:
                scores[i] *= 1.15
        elif req.hidden_gem_pref == "popular places":
            if place["popularity_norm"] == "high":
                scores[i] *= 1.15

    # Apply personalization boost based on previously saved/visited spots
    if req.saved_places:
        saved_categories = [p.get("category") for p in req.saved_places if p.get("category")]
        saved_tags = []
        for p in req.saved_places:
            tags = p.get("tags_list", [])
            if isinstance(tags, list):
                saved_tags.extend(tags)

        for i, (_, place) in enumerate(candidates.iterrows()):
            # Category boost: up to +0.15 boost for matching categories
            cat_matches = saved_categories.count(place["category"])
            if cat_matches > 0:
                scores[i] += min(0.05 * cat_matches, 0.15)

            # Tag boost: up to +0.10 boost for matching tags
            place_tags = place.get("tags_list", [])
            if not isinstance(place_tags, list):
                place_tags = []
            tag_matches = sum(1 for t in saved_tags if t in place_tags)
            if tag_matches > 0:
                scores[i] += min(0.02 * tag_matches, 0.10)

    # Apply search query relevance boost for direct name matches
    if req.search_query.strip():
        q_words = req.search_query.lower().strip().split()
        for i, (_, place) in enumerate(candidates.iterrows()):
            name_lower = str(place["place_name"]).lower()
            if all(w in name_lower for w in q_words):
                scores[i] = max(scores[i], 0.95)
            elif any(w in name_lower for w in q_words):
                scores[i] = max(scores[i], 0.85)

    # Diversity tiebreaker: only breaks ties among places whose RF scores are
    # within 2% of each other — never reorders genuinely different results.
    cand_list = list(candidates.itertuples())
    max_score = float(scores.max()) if len(scores) > 0 else 1.0
    for i, row in enumerate(cand_list):
        score_delta = max_score - scores[i]
        if score_delta < 0.02:  # Only adjust near-tied scores
            name_key = str(getattr(row, 'place_name', '')) + str(getattr(row, 'district', ''))
            h = int(hashlib.md5(name_key.encode()).hexdigest(), 16) & 0xFFFF
            scores[i] += (h / 0xFFFF - 0.5) * 0.016  # max ±0.8% nudge within tied group

    # Persona-based adjustments for Local Residents (boosting hidden gems, dampening famous spots)
    if req.user_type == "resident":
        for i, (_, place) in enumerate(candidates.iterrows()):
            if float(place["hidden_gem_score_norm"]) >= 70:
                scores[i] *= 1.2
            if place["popularity_norm"] == "high":
                scores[i] *= 0.7

    scores = np.clip(scores, 0.0, 0.99)

    # Filter out zero-relevance results when interests are specified
    if req.interests:
        valid_mask = scores > 0.05
        valid_indices = np.where(valid_mask)[0]
        if len(valid_indices) == 0:
            return {"results": [], "model": "rf_scorer", "n_candidates": len(candidates)}
        scores = scores[valid_indices]
        candidates = candidates.iloc[valid_indices]

    # Sort and take top N
    top_indices = scores.argsort()[::-1][:req.top_n]

    results = []
    for idx in top_indices:
        place = candidates.iloc[idx]
        score = min(scores[idx], 0.99)
        results.append(place_to_dict(place, score))

    return {
        "results": results,
        "model": "rf_scorer",
        "n_candidates": len(candidates),
    }


@app.post("/api/nearby")
def nearby(req: NearbyRequest):
    """Stage 2: Nearby recommendations combining Haversine distance + ML scores."""

    # Find the selected place
    match = df[df["place_name"] == req.place_name]
    if len(match) == 0:
        return {"results": [], "selected_place": None}

    selected = match.iloc[0]
    sel_lat = float(selected["latitude"])
    sel_lon = float(selected["longitude"])

    # Score all other places
    other = df[df["place_name"] != req.place_name]
    if req.hidden_gem_pref == "hidden gems":
        other = other[other["popularity_norm"] != "high"]

    features = []
    distances = []
    for _, place in other.iterrows():
        feat = build_features(req.interests, req.budget, req.available_time, "any", place)
        features.append(feat)
        dist = haversine(sel_lat, sel_lon, float(place["latitude"]), float(place["longitude"]))
        distances.append(dist)

    X = pd.DataFrame(features)[feature_cols].values
    pref_scores = rf_model.predict(X)
    distances = np.array(distances)

    # Distance score (tiered)
    dist_scores = np.zeros_like(distances)
    dist_scores[distances <= 5] = 1.0
    dist_scores[(distances > 5) & (distances <= 15)] = 0.8
    dist_scores[(distances > 15) & (distances <= 30)] = 0.6
    dist_scores[(distances > 30) & (distances <= 60)] = 0.4
    dist_scores[(distances > 60) & (distances <= 120)] = 0.25
    dist_scores[distances > 120] = 0.1

    # Diversity bonus
    sel_category = selected["category"]
    diversity = np.array([0.05 if cat != sel_category else 0.0 for cat in other["category"]])

    # Combined nearby score
    nearby_scores = 0.40 * dist_scores + 0.30 * pref_scores + 0.20 * (pref_scores * 0.8) + 0.10 * diversity
    
    # Persona-based adjustments for Local Residents in nearby spots
    if req.user_type == "resident":
        for i, (_, place) in enumerate(other.iterrows()):
            if place["popularity_norm"] == "high":
                nearby_scores[i] *= 0.7
            if float(place["hidden_gem_score_norm"]) >= 70:
                nearby_scores[i] *= 1.2

    nearby_scores = np.clip(nearby_scores, 0, 0.99)

    top_indices = nearby_scores.argsort()[::-1][:req.top_n]

    results = []
    for idx in top_indices:
        place = other.iloc[idx]
        results.append(place_to_dict(place, nearby_scores[idx], distances[idx]))

    return {
        "results": results,
        "selected_place": place_to_dict(selected, 1.0),
        "model": "rf_scorer + haversine",
    }


@app.post("/api/similar")
def similar(req: SimilarRequest):
    """Content-based similarity using TF-IDF cosine similarity matrix."""

    match = df[df["place_name"] == req.place_name]
    if len(match) == 0:
        return {"results": [], "query": req.place_name}

    idx = match.index[0]
    sim_scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)[1:req.top_n + 1]

    results = []
    for i, score in sim_scores:
        place = df.iloc[i]
        results.append({**place_to_dict(place, score), "similarity": round(score, 3)})

    return {
        "results": results,
        "query": req.place_name,
        "model": "tfidf_cosine_similarity",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
