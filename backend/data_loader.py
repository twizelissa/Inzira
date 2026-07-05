"""
data_loader.py — Inzira
Load and normalize the Rwanda_places_catalogue dataset.
"""

import os
import re
import pandas as pd
import streamlit as st

# Resolve paths relative to the project root (one level up from app/)
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
_DATA_DIR = os.path.join(_ROOT, "Data")

RWANDA_CSV = os.path.join(_DATA_DIR, "Rwanda_places_catalogue.csv")
RWANDA_XLSX = os.path.join(_DATA_DIR, "Rwanda_places_catalogue.xlsx")
FEEDBACK_CSV = os.path.join(_DATA_DIR, "user_feedback.csv")

# ---------------------------------------------------------------------------
# Tag / cost / duration normalization
# ---------------------------------------------------------------------------

INTEREST_ALIASES = {
    "accommodation": "lodging",
    "wifi": "lodging",
    "national_park": "nature",
    "wildlife": "wildlife",
    "nature": "nature",
    "culture": "culture",
    "history": "history",
    "explore": "adventure",
    "viewpoint": "adventure",
    "lake": "nature",
    "art": "art",
    "shopping": "shopping",
    "coffee": "food",
    "coffee_shop": "food",
    "local": "food",
    "rwandan": "food",
    "african": "food",
    "regional": "food",
    "restaurant": "food",
    "barbecue": "food",
    "pizza": "food",
    "burger": "food",
    "grill": "food",
    "international": "food",
    "italian": "food",
    "indian": "food",
    "asian": "food",
    "chinese": "food",
    "japanese": "food",
    "sushi": "food",
    "korean": "food",
    "turkish": "food",
    "french": "food",
    "steak_house": "food",
    "chicken": "food",
    "fish": "food",
    "accessible": "adventure",
    "relaxation": "relaxation",
}

CATEGORY_TO_INTERESTS = {
    "Nature & Wildlife": ["nature", "wildlife"],
    "Lakes & Waterways": ["nature"],
    "Cultural & Historic": ["culture", "history"],
    "Attraction": ["adventure", "culture"],
    "Scenic Viewpoints": ["adventure"],
    "Food & Drink": ["food"],
    "Café": ["food", "relaxation"],
    "Lodging": ["lodging"],
    "Markets & Shopping": ["shopping"],
    "Arts & Entertainment": ["art"],
}

COST_MAP = {
    "budget": "low",
    "moderate": "medium",
    "expensive": "high",
    "unknown": "unknown",
}

DURATION_MAP = {
    "30-60 mins": "1-2 hours",
    "1-2 hours": "1-2 hours",
    "1-3 hours": "half-day",
    "2-3 hours": "half-day",
    "3-6 hours": "half-day",
    "overnight": "overnight",
    "unknown": "unknown",
}

POPULARITY_RATING = {
    "high": 85,
    "medium": 60,
    "low": 35,
}


def _normalize_tags(raw: str) -> list[str]:
    """Split mixed ;/,-separated tags, apply aliases, deduplicate."""
    if pd.isna(raw) or str(raw).strip().lower() in ("", "nan", "unknown"):
        return []
    parts = re.split(r"[;,]+", str(raw))
    result = set()
    for p in parts:
        p = p.strip().lower()
        if p:
            result.add(INTEREST_ALIASES.get(p, p))
    return sorted(result)


def _parse_review_count(val) -> int:
    if pd.isna(val):
        return 0
    s = str(val).strip().lower()
    if s in ("", "nan", "unknown"):
        return 0
    try:
        return int(float(s))
    except ValueError:
        return 0


@st.cache_data(show_spinner=False)
def load_rwanda_data() -> pd.DataFrame:
    """Load, clean and return the Rwanda places catalogue as a DataFrame."""
    # Support both CSV and XLSX
    if os.path.exists(RWANDA_CSV):
        df = pd.read_csv(RWANDA_CSV, dtype=str)
    elif os.path.exists(RWANDA_XLSX):
        df = pd.read_excel(RWANDA_XLSX, dtype=str)
    else:
        raise FileNotFoundError(
            "Rwanda_places_catalogue not found in Data/ folder. "
            "Expected CSV or XLSX."
        )

    # ---- Required columns ------------------------------------------------
    required = [
        "place_name", "district", "province_or_city",
        "latitude", "longitude", "category", "interest_tags",
    ]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Expected column '{col}' not found in Rwanda dataset.")

    # ---- Numeric conversions ---------------------------------------------
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["hidden_gem_score"] = pd.to_numeric(
        df.get("hidden_gem_score", pd.Series(dtype=float)), errors="coerce"
    ).fillna(5.0)

    df["review_count_int"] = df["review_count"].apply(_parse_review_count) if "review_count" in df.columns else 0

    # ---- Normalizations --------------------------------------------------
    df["cost_level_norm"] = (
        df["cost_level"].str.strip().str.lower()
        .map(COST_MAP)
        .fillna("unknown")
    ) if "cost_level" in df.columns else "unknown"

    df["duration_norm"] = (
        df["estimated_duration"].str.strip().str.lower()
        .map(DURATION_MAP)
        .fillna("unknown")
    ) if "estimated_duration" in df.columns else "unknown"

    df["popularity_norm"] = (
        df["popularity_level"].str.strip().str.lower()
        .fillna("medium")
    ) if "popularity_level" in df.columns else "medium"

    # ---- Derived rating score (0–100) ------------------------------------
    df["rating_score"] = df["popularity_norm"].map(POPULARITY_RATING).fillna(60)

    # ---- Hidden gem score normalized to 0–100 ----------------------------
    # Raw scores are 3–10; map to 0–100
    df["hidden_gem_score_norm"] = (
        (df["hidden_gem_score"] - 3) / (10 - 3) * 100
    ).clip(0, 100)

    # ---- Tag normalization -----------------------------------------------
    df["tags_list"] = df["interest_tags"].apply(_normalize_tags)

    # Also add category-derived tags
    def _enrich_tags(row):
        base = set(row["tags_list"])
        extra = CATEGORY_TO_INTERESTS.get(row.get("category", ""), [])
        base.update(extra)
        return sorted(base)

    df["tags_list"] = df.apply(_enrich_tags, axis=1)

    # ---- Drop rows with no valid coordinates -----------------------------
    df = df.dropna(subset=["latitude", "longitude"]).reset_index(drop=True)

    # ---- Clean place names -----------------------------------------------
    df["place_name"] = df["place_name"].str.strip()

    return df


def get_place_names(df: pd.DataFrame) -> list[str]:
    """Return sorted unique place names for dropdowns."""
    return sorted(df["place_name"].dropna().unique().tolist())


def get_provinces(df: pd.DataFrame) -> list[str]:
    """Return sorted unique province/city values."""
    provinces = df["province_or_city"].dropna().unique().tolist()
    return sorted([p for p in provinces if p.strip().lower() not in ("nan", "")])


def save_feedback(useful: str, rating: int, comment: str, recommended_place: str):
    """Append a feedback row to Data/user_feedback.csv."""
    row = pd.DataFrame([{
        "timestamp": pd.Timestamp.now().isoformat(),
        "recommended_place": recommended_place,
        "useful": useful,
        "rating": rating,
        "comment": comment,
    }])
    if os.path.exists(FEEDBACK_CSV):
        row.to_csv(FEEDBACK_CSV, mode="a", header=False, index=False)
    else:
        row.to_csv(FEEDBACK_CSV, index=False)
