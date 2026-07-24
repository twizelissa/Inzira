"""
train_model.py — Inzira ML Pipeline
Trains a REAL recommendation model and saves it as .pkl files.

Models trained:
1. TF-IDF Vectorizer on place text features → cosine similarity matrix
2. Random Forest Regressor that learns scoring weights from synthetic user-place interactions
3. Saves everything to ml/models/ as .pkl files
"""

import os
import sys
import json
import math
import warnings
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib

warnings.filterwarnings('ignore')

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "Data")
MODEL_DIR = os.path.join(ROOT, "ml", "models")
PUBLIC_DIR = os.path.join(ROOT, "public")

os.makedirs(MODEL_DIR, exist_ok=True)

# ─── 1. Load & Clean Data ────────────────────────────────────────────────────

print("=" * 60)
print("INZIRA ML PIPELINE — Training Real Models")
print("=" * 60)

print("\n[1/7] Loading Rwanda places catalogue...")
df = pd.read_csv(os.path.join(DATA_DIR, "Rwanda_places_catalogue.csv"), dtype=str)
print(f"  Loaded {len(df)} places with {len(df.columns)} columns")

# Numeric conversions
df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
df["hidden_gem_score"] = pd.to_numeric(df["hidden_gem_score"], errors="coerce").fillna(5.0)
df = df.dropna(subset=["latitude", "longitude"]).reset_index(drop=True)
print(f"  After cleaning: {len(df)} places with valid coordinates")

# Normalize fields
COST_MAP = {"budget": "low", "moderate": "medium", "expensive": "high", "unknown": "unknown"}
DURATION_MAP = {"30-60 mins": "1-2 hours", "1-2 hours": "1-2 hours", "1-3 hours": "half-day",
                "2-3 hours": "half-day", "3-6 hours": "half-day", "overnight": "overnight", "unknown": "unknown"}

df["cost_level_norm"] = df["cost_level"].str.strip().str.lower().map(COST_MAP).fillna("unknown")
df["duration_norm"] = df["estimated_duration"].str.strip().str.lower().map(DURATION_MAP).fillna("unknown")
df["popularity_norm"] = df["popularity_level"].str.strip().str.lower().fillna("medium")
df["hidden_gem_score_norm"] = ((df["hidden_gem_score"] - 3) / 7 * 100).clip(0, 100)

# Parse tags
def parse_tags(raw):
    if pd.isna(raw) or str(raw).strip().lower() in ("", "nan", "unknown"):
        return []
    import re
    parts = re.split(r"[;,]+", str(raw))
    return [p.strip().lower() for p in parts if p.strip()]

df["tags_list"] = df["interest_tags"].apply(parse_tags)

# ─── 2. TF-IDF Feature Engineering ───────────────────────────────────────────

print("\n[2/7] Building TF-IDF feature matrix...")

# Create rich text features from all available place information
df["text_features"] = (
    df["place_name"].fillna("") + " " +
    df["category"].fillna("") + " " +
    df["district"].fillna("") + " " +
    df["province_or_city"].fillna("") + " " +
    df["interest_tags"].fillna("") + " " +
    df["cost_level"].fillna("") + " " +
    df["indoor_outdoor"].fillna("")
)

tfidf = TfidfVectorizer(
    max_features=300,
    stop_words="english",
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.95
)
tfidf_matrix = tfidf.fit_transform(df["text_features"])
print(f"  TF-IDF matrix shape: {tfidf_matrix.shape}")
print(f"  Vocabulary size: {len(tfidf.vocabulary_)}")
print(f"  Sample features: {list(tfidf.vocabulary_.keys())[:10]}")

# ─── 3. Cosine Similarity Matrix ─────────────────────────────────────────────

print("\n[3/7] Computing cosine similarity matrix...")
cosine_sim = cosine_similarity(tfidf_matrix)
print(f"  Similarity matrix shape: {cosine_sim.shape}")

# Test it: find similar places to first lodging
test_idx = df[df["category"] == "Food & Drink"].index[0]
test_name = df.iloc[test_idx]["place_name"]
sim_scores = sorted(enumerate(cosine_sim[test_idx]), key=lambda x: x[1], reverse=True)[1:6]
print(f"\n  Content-based test — Similar to '{test_name}':")
for idx, score in sim_scores:
    print(f"    {df.iloc[idx]['place_name']} ({df.iloc[idx]['category']}) — similarity: {score:.3f}")

# ─── 4. Generate Training Data for Scorer Model ──────────────────────────────

print("\n[4/7] Generating training data from simulated user-place interactions...")

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

ALL_INTERESTS = list(INTEREST_TO_TAGS.keys())
ALL_BUDGETS = ["low", "medium", "high", "any"]
ALL_TIMES = ["1-2 hours", "half-day", "overnight", "any"]
ALL_PROVINCES = list(df["province_or_city"].dropna().unique()) + ["any"]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    f = math.pi / 180
    a = (math.sin((lat2 - lat1) * f / 2) ** 2 +
         math.cos(lat1 * f) * math.cos(lat2 * f) * math.sin((lon2 - lon1) * f / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def compute_relevance_score(user_interests, user_budget, user_time, user_province, place_row):
    """Compute a ground-truth relevance score for a user-place pair."""
    score = 0.0
    place_tags = set(place_row["tags_list"])
    place_cat = place_row["category"]
    cat_interests = CATEGORY_TO_INTERESTS.get(place_cat, [])

    # Interest match (genuine semantic matching)
    if user_interests:
        match_count = 0
        for interest in user_interests:
            expanded = INTEREST_TO_TAGS.get(interest, [interest])
            tag_hits = sum(1 for t in expanded if t in place_tags)
            cat_hit = interest in cat_interests
            if tag_hits >= 2 or (tag_hits >= 1 and cat_hit):
                match_count += 2
            elif tag_hits >= 1 or cat_hit:
                match_count += 1
        score += min((match_count / (len(user_interests) * 2)) * 5.0, 5.0)
    else:
        score += 1.5

    # Budget match
    cost = place_row["cost_level_norm"]
    if user_budget != "any" and cost != "unknown":
        if cost == user_budget:
            score += 2.0
        elif (user_budget == "high") or (user_budget == "medium" and cost == "low"):
            score += 1.0
    else:
        score += 0.8

    # Time match
    dur = place_row["duration_norm"]
    if user_time != "any" and dur != "unknown":
        if dur == user_time:
            score += 1.5
        else:
            score += 0.5
    else:
        score += 0.5

    # Province match
    prov = place_row["province_or_city"]
    if user_province != "any" and prov == user_province:
        score += 1.0

    # Popularity bonus
    pop = place_row["popularity_norm"]
    if pop == "high":
        score += 0.5
    elif pop == "medium":
        score += 0.25

    return min(score / 10.0, 1.0)  # Normalize to 0-1

# Generate diverse synthetic user profiles and compute relevance
np.random.seed(42)
N_USERS = 500
training_rows = []

for _ in range(N_USERS):
    n_interests = np.random.randint(1, 4)
    user_interests = list(np.random.choice(ALL_INTERESTS, n_interests, replace=False))
    user_budget = np.random.choice(ALL_BUDGETS)
    user_time = np.random.choice(ALL_TIMES)
    user_province = np.random.choice(ALL_PROVINCES)

    # Sample places (mix of random + biased toward matching categories)
    n_places = np.random.randint(8, 20)
    place_indices = np.random.choice(len(df), n_places, replace=False)

    for pi in place_indices:
        place = df.iloc[pi]
        relevance = compute_relevance_score(user_interests, user_budget, user_time, user_province, place)

        # Feature vector for this user-place pair
        # Interest overlap features
        place_tags = set(place["tags_list"])
        cat_interests = CATEGORY_TO_INTERESTS.get(place["category"], [])
        tag_overlap = 0
        cat_overlap = 0
        for interest in user_interests:
            expanded = INTEREST_TO_TAGS.get(interest, [interest])
            tag_overlap += sum(1 for t in expanded if t in place_tags)
            if interest in cat_interests:
                cat_overlap += 1

        training_rows.append({
            "tag_overlap_count": tag_overlap,
            "category_overlap_count": cat_overlap,
            "n_user_interests": len(user_interests),
            "tag_overlap_ratio": tag_overlap / max(len(user_interests), 1),
            "budget_exact_match": 1 if place["cost_level_norm"] == user_budget else 0,
            "budget_compatible": 1 if user_budget == "any" or place["cost_level_norm"] == "unknown" else (
                1 if user_budget == "high" else (1 if user_budget == "medium" and place["cost_level_norm"] in ("low", "medium") else (
                    1 if user_budget == "low" and place["cost_level_norm"] == "low" else 0))),
            "time_exact_match": 1 if place["duration_norm"] == user_time else 0,
            "time_compatible": 1 if user_time == "any" or place["duration_norm"] == "unknown" else 0,
            "province_match": 1 if user_province != "any" and place["province_or_city"] == user_province else 0,
            "hidden_gem_score_norm": place["hidden_gem_score_norm"],
            "popularity_high": 1 if place["popularity_norm"] == "high" else 0,
            "popularity_medium": 1 if place["popularity_norm"] == "medium" else 0,
            "cost_low": 1 if place["cost_level_norm"] == "low" else 0,
            "cost_medium": 1 if place["cost_level_norm"] == "medium" else 0,
            "cost_high": 1 if place["cost_level_norm"] == "high" else 0,
            "is_food": 1 if place["category"] in ("Food & Drink", "Café") else 0,
            "is_nature": 1 if place["category"] in ("Nature & Wildlife", "Lakes & Waterways", "Scenic Viewpoints") else 0,
            "is_culture": 1 if place["category"] in ("Cultural & Historic", "Arts & Entertainment") else 0,
            "is_lodging": 1 if place["category"] == "Lodging" else 0,
            "relevance": relevance,
        })

train_df = pd.DataFrame(training_rows)
print(f"  Generated {len(train_df)} user-place training samples")
print(f"  Relevance distribution: mean={train_df['relevance'].mean():.3f}, std={train_df['relevance'].std():.3f}")

# ─── 5. Train Random Forest Scorer ───────────────────────────────────────────

print("\n[5/7] Training Random Forest recommendation scorer...")

FEATURE_COLS = [c for c in train_df.columns if c != "relevance"]
X = train_df[FEATURE_COLS].values
y = train_df["relevance"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(
    n_estimators=150,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
rmse = math.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print(f"  Train samples: {len(X_train)}, Test samples: {len(X_test)}")
print(f"  RMSE: {rmse:.4f}")
print(f"  R² Score: {r2:.4f}")

# Cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print(f"  5-Fold CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Feature importance
importances = dict(zip(FEATURE_COLS, model.feature_importances_))
print("\n  Feature Importances (top 8):")
for feat, imp in sorted(importances.items(), key=lambda x: -x[1])[:8]:
    print(f"    {feat}: {imp:.4f}")

# ─── 6. Save Models ──────────────────────────────────────────────────────────

print("\n[6/7] Saving trained models to ml/models/...")

joblib.dump(tfidf, os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
joblib.dump(cosine_sim, os.path.join(MODEL_DIR, "cosine_similarity_matrix.pkl"))
joblib.dump(model, os.path.join(MODEL_DIR, "rf_scorer.pkl"))
joblib.dump(FEATURE_COLS, os.path.join(MODEL_DIR, "feature_columns.pkl"))

# Save the processed dataframe for the API
df.to_pickle(os.path.join(MODEL_DIR, "processed_places.pkl"))

# Save metadata
metadata = {
    "n_places": len(df),
    "tfidf_features": tfidf_matrix.shape[1],
    "rf_n_estimators": 150,
    "rf_max_depth": 12,
    "rmse": round(rmse, 4),
    "r2_score": round(r2, 4),
    "cv_r2_mean": round(cv_scores.mean(), 4),
    "cv_r2_std": round(cv_scores.std(), 4),
    "feature_importances": {k: round(v, 4) for k, v in importances.items()},
    "training_samples": len(train_df),
    "feature_columns": FEATURE_COLS,
}
with open(os.path.join(MODEL_DIR, "model_metadata.json"), "w") as f:
    json.dump(metadata, f, indent=2)

for fname in os.listdir(MODEL_DIR):
    fpath = os.path.join(MODEL_DIR, fname)
    size_mb = os.path.getsize(fpath) / (1024 * 1024)
    print(f"  Saved: {fname} ({size_mb:.2f} MB)")

# ─── 7. Validation — End-to-End Prediction Test ──────────────────────────────

print("\n[7/7] Running end-to-end prediction validation...")

# Simulate a user query
test_user = {
    "interests": ["food", "culture"],
    "budget": "medium",
    "time": "1-2 hours",
    "province": "Kigali City"
}

print(f"  Test user: {test_user}")

# Build features for all places
test_features = []
for _, place in df.iterrows():
    place_tags = set(place["tags_list"])
    cat_interests = CATEGORY_TO_INTERESTS.get(place["category"], [])
    tag_overlap = 0
    cat_overlap = 0
    for interest in test_user["interests"]:
        expanded = INTEREST_TO_TAGS.get(interest, [interest])
        tag_overlap += sum(1 for t in expanded if t in place_tags)
        if interest in cat_interests:
            cat_overlap += 1

    test_features.append({
        "tag_overlap_count": tag_overlap,
        "category_overlap_count": cat_overlap,
        "n_user_interests": len(test_user["interests"]),
        "tag_overlap_ratio": tag_overlap / max(len(test_user["interests"]), 1),
        "budget_exact_match": 1 if place["cost_level_norm"] == test_user["budget"] else 0,
        "budget_compatible": 1 if place["cost_level_norm"] in ("low", "medium", "unknown") else 0,
        "time_exact_match": 1 if place["duration_norm"] == test_user["time"] else 0,
        "time_compatible": 1 if test_user["time"] == "any" or place["duration_norm"] == "unknown" else 0,
        "province_match": 1 if place["province_or_city"] == test_user["province"] else 0,
        "hidden_gem_score_norm": place["hidden_gem_score_norm"],
        "popularity_high": 1 if place["popularity_norm"] == "high" else 0,
        "popularity_medium": 1 if place["popularity_norm"] == "medium" else 0,
        "cost_low": 1 if place["cost_level_norm"] == "low" else 0,
        "cost_medium": 1 if place["cost_level_norm"] == "medium" else 0,
        "cost_high": 1 if place["cost_level_norm"] == "high" else 0,
        "is_food": 1 if place["category"] in ("Food & Drink", "Café") else 0,
        "is_nature": 1 if place["category"] in ("Nature & Wildlife", "Lakes & Waterways", "Scenic Viewpoints") else 0,
        "is_culture": 1 if place["category"] in ("Cultural & Historic", "Arts & Entertainment") else 0,
        "is_lodging": 1 if place["category"] == "Lodging" else 0,
    })

test_X = pd.DataFrame(test_features)[FEATURE_COLS].values
predictions = model.predict(test_X)

# Get top 6
top_indices = predictions.argsort()[::-1][:6]
print("\n  Model predictions — Top 6 recommendations:")
print(f"  {'Place Name':<35} {'Category':<22} {'District':<15} {'Score':>6}")
print(f"  {'-'*35} {'-'*22} {'-'*15} {'-'*6}")
for idx in top_indices:
    p = df.iloc[idx]
    print(f"  {p['place_name'][:35]:<35} {p['category']:<22} {p['district'][:15]:<15} {predictions[idx]*100:>5.1f}%")

print("\n" + "=" * 60)
print("ML PIPELINE COMPLETE — All models saved to ml/models/")
print("=" * 60)
