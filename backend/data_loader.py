"""
data_loader.py — Inzira
Load and normalize the Rwanda_places_catalogue dataset.
Refactored to follow Object-Oriented Programming (OOP) principles.
"""

import os
import re
import pandas as pd
import streamlit as st

class RwandaDataLoader:
    """OOP data loader to process, normalize and persist place coordinates & user feedback."""

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

    def __init__(self, data_dir: str | None = None):
        if data_dir is None:
            # Resolve paths relative to this module (one level up from backend/)
            here = os.path.dirname(os.path.abspath(__file__))
            root = os.path.dirname(here)
            data_dir = os.path.join(root, "Data")
        self.data_dir = data_dir
        self.rwanda_csv = os.path.join(self.data_dir, "Rwanda_places_catalogue.csv")
        self.rwanda_xlsx = os.path.join(self.data_dir, "Rwanda_places_catalogue.xlsx")
        self.feedback_csv = os.path.join(self.data_dir, "user_feedback.csv")

    def _normalize_tags(self, raw: str) -> list[str]:
        """Split mixed ;/,-separated tags, apply aliases, deduplicate."""
        if pd.isna(raw) or str(raw).strip().lower() in ("", "nan", "unknown"):
            return []
        parts = re.split(r"[;,]+", str(raw))
        result = set()
        for p in parts:
            p = p.strip().lower()
            if p:
                result.add(self.INTEREST_ALIASES.get(p, p))
        return sorted(result)

    def _parse_review_count(self, val) -> int:
        """Helper to parse raw TripAdvisor review count to integer."""
        if pd.isna(val):
            return 0
        s = str(val).strip().lower()
        if s in ("", "nan", "unknown"):
            return 0
        try:
            return int(float(s))
        except ValueError:
            return 0

    def load_data(self) -> pd.DataFrame:
        """Load, clean and return the Rwanda places catalogue as a normalized DataFrame."""
        if os.path.exists(self.rwanda_csv):
            df = pd.read_csv(self.rwanda_csv, dtype=str)
        elif os.path.exists(self.rwanda_xlsx):
            df = pd.read_excel(self.rwanda_xlsx, dtype=str)
        else:
            raise FileNotFoundError(
                f"Rwanda_places_catalogue not found in {self.data_dir}. Expected CSV or XLSX."
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

        df["review_count_int"] = df["review_count"].apply(self._parse_review_count) if "review_count" in df.columns else 0

        # ---- Normalizations --------------------------------------------------
        df["cost_level_norm"] = (
            df["cost_level"].str.strip().str.lower()
            .map(self.COST_MAP)
            .fillna("unknown")
        ) if "cost_level" in df.columns else "unknown"

        df["duration_norm"] = (
            df["estimated_duration"].str.strip().str.lower()
            .map(self.DURATION_MAP)
            .fillna("unknown")
        ) if "estimated_duration" in df.columns else "unknown"

        df["popularity_norm"] = (
            df["popularity_level"].str.strip().str.lower()
            .fillna("medium")
        ) if "popularity_level" in df.columns else "medium"

        # ---- Derived rating score (0–100) ------------------------------------
        df["rating_score"] = df["popularity_norm"].map(self.POPULARITY_RATING).fillna(60)

        # ---- Hidden gem score normalized to 0–100 ----------------------------
        # Raw scores are 3–10; map to 0–100
        df["hidden_gem_score_norm"] = (
            (df["hidden_gem_score"] - 3) / (10 - 3) * 100
        ).clip(0, 100)

        # Add a deterministic diversity offset based on place_name hash.
        # This ensures places with identical raw scores (very common in the dataset)
        # still produce meaningfully different final recommendation scores.
        # The offset is stable: the same place always gets the same adjustment.
        def _diversity_offset(row) -> float:
            name_hash = hash(str(row.get("place_name", "")) + str(row.get("district", ""))) & 0xFFFF
            # Map hash to a -20 to +20 point spread
            return (name_hash / 0xFFFF) * 40.0 - 20.0

        df["hidden_gem_score_norm"] = (
            df["hidden_gem_score_norm"] + df.apply(_diversity_offset, axis=1)
        ).clip(0, 100)

        # ---- Tag normalization -----------------------------------------------
        df["tags_list"] = df["interest_tags"].apply(self._normalize_tags)

        # Enrich tags with category mappings
        def _enrich_tags(row):
            base = set(row["tags_list"])
            extra = self.CATEGORY_TO_INTERESTS.get(row.get("category", ""), [])
            base.update(extra)
            return sorted(base)

        df["tags_list"] = df.apply(_enrich_tags, axis=1)

        # ---- Drop rows with no valid coordinates -----------------------------
        df = df.dropna(subset=["latitude", "longitude"]).reset_index(drop=True)

        # ---- Clean place names -----------------------------------------------
        df["place_name"] = df["place_name"].str.strip()

        return df

    def save_feedback(self, useful: str, rating: int, comment: str, recommended_place: str):
        """Append a feedback row to the feedback CSV."""
        row = pd.DataFrame([{
            "timestamp": pd.Timestamp.now().isoformat(),
            "recommended_place": recommended_place,
            "useful": useful,
            "rating": rating,
            "comment": comment,
        }])
        if os.path.exists(self.feedback_csv):
            row.to_csv(self.feedback_csv, mode="a", header=False, index=False)
        else:
            row.to_csv(self.feedback_csv, index=False)


# ---------------------------------------------------------------------------
# Backward Compatibility Wrappers (Functional API)
# ---------------------------------------------------------------------------

_default_loader = RwandaDataLoader()

@st.cache_data(show_spinner=False)
def load_rwanda_data() -> pd.DataFrame:
    return _default_loader.load_data()

def get_place_names(df: pd.DataFrame) -> list[str]:
    """Return sorted unique place names for dropdowns."""
    return sorted(df["place_name"].dropna().unique().tolist())

def get_provinces(df: pd.DataFrame) -> list[str]:
    """Return sorted unique province/city values."""
    provinces = df["province_or_city"].dropna().unique().tolist()
    return sorted([p for p in provinces if p.strip().lower() not in ("nan", "")])

def save_feedback(useful: str, rating: int, comment: str, recommended_place: str):
    """Save feedback using default loader instance."""
    _default_loader.save_feedback(useful, rating, comment, recommended_place)
