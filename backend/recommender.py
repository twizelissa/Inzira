"""
recommender.py — Inzira
Two-stage recommendation engine for Rwanda places.
"""

from __future__ import annotations

import math
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BUDGET_COMPAT = {
    "any":    {"low", "medium", "high", "unknown"},
    "low":    {"low", "unknown"},
    "medium": {"low", "medium", "unknown"},
    "high":   {"low", "medium", "high", "unknown"},
}

TIME_COMPAT = {
    "any":      {"1-2 hours", "half-day", "overnight", "unknown"},
    "1-2 hours":{"1-2 hours", "unknown"},
    "half-day": {"1-2 hours", "half-day", "unknown"},
    "full-day": {"1-2 hours", "half-day", "overnight", "unknown"},
    "weekend":  {"1-2 hours", "half-day", "overnight", "unknown"},
}

CATEGORY_EMOJI = {
    "Nature & Wildlife":  "🌿",
    "Lakes & Waterways":  "🌊",
    "Cultural & Historic":"🏛️",
    "Attraction":         "🎯",
    "Scenic Viewpoints":  "🏔️",
    "Food & Drink":       "🍽️",
    "Café":               "☕",
    "Lodging":            "🏨",
    "Markets & Shopping": "🛍️",
    "Arts & Entertainment":"🎨",
}

CATEGORY_COLOR_CLASS = {
    "Nature & Wildlife":  "teal",
    "Lakes & Waterways":  "teal",
    "Cultural & Historic":"amber",
    "Attraction":         "purple",
    "Scenic Viewpoints":  "teal",
    "Food & Drink":       "amber",
    "Café":               "amber",
    "Lodging":            "purple",
    "Markets & Shopping": "amber",
    "Arts & Entertainment":"purple",
}


# ---------------------------------------------------------------------------
# 1. Haversine distance
# ---------------------------------------------------------------------------

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# 2. Preference score
# ---------------------------------------------------------------------------

def calculate_preference_score(user_prefs: dict, place: pd.Series) -> float:
    """
    Returns 0–100 based on:
    - interest match  (50 pts)
    - budget match    (25 pts)
    - time match      (15 pts)
    - hidden-gem pref (10 pts)
    """
    score = 0.0

    # --- Interest match ---------------------------------------------------
    user_interests = set(user_prefs.get("interests", []))
    place_tags = set(place.get("tags_list", []))
    if user_interests and place_tags:
        overlap = len(user_interests & place_tags)
        total = len(user_interests)
        score += (overlap / total) * 50
    elif not user_interests:
        score += 25  # neutral if no interests selected

    # --- Budget match -----------------------------------------------------
    user_budget = user_prefs.get("budget", "any").lower()
    place_cost = str(place.get("cost_level_norm", "unknown")).lower()
    compat_set = BUDGET_COMPAT.get(user_budget, BUDGET_COMPAT["any"])
    if place_cost in compat_set:
        score += 25

    # --- Time match -------------------------------------------------------
    user_time = user_prefs.get("available_time", "any").lower()
    place_dur = str(place.get("duration_norm", "unknown")).lower()
    time_set = TIME_COMPAT.get(user_time, TIME_COMPAT["any"])
    if place_dur in time_set:
        score += 15

    # --- Hidden-gem preference --------------------------------------------
    hg_pref = user_prefs.get("hidden_gem_pref", "both").lower()
    hg_score_norm = float(place.get("hidden_gem_score_norm", 50))  # 0–100
    pop_norm = str(place.get("popularity_norm", "medium")).lower()

    if hg_pref == "hidden gems":
        if hg_score_norm >= 70 or pop_norm == "low":
            score += 10
    elif hg_pref == "popular places":
        if pop_norm == "high" or hg_score_norm < 50:
            score += 10
    else:  # "both"
        score += 5

    return min(score, 100.0)


# ---------------------------------------------------------------------------
# 3. Distance score
# ---------------------------------------------------------------------------

def calculate_distance_score(distance_km: float) -> float:
    """Tiered distance score — closer = higher score."""
    if distance_km <= 5:
        return 100.0
    elif distance_km <= 15:
        return 80.0
    elif distance_km <= 30:
        return 60.0
    elif distance_km <= 60:
        return 40.0
    else:
        return 20.0


# ---------------------------------------------------------------------------
# 4. Rating score  (derived from popularity_level)
# ---------------------------------------------------------------------------

def calculate_rating_score(place: pd.Series) -> float:
    """0–100 rating proxy based on popularity_level and hidden_gem_score."""
    return float(place.get("rating_score", 60))


# ---------------------------------------------------------------------------
# 5. Hidden-gem score
# ---------------------------------------------------------------------------

def calculate_hidden_gem_score(place: pd.Series) -> float:
    """0–100 normalized hidden gem score."""
    return float(place.get("hidden_gem_score_norm", 50))


# ---------------------------------------------------------------------------
# 6. Location score (for Stage 1 — province / district match)
# ---------------------------------------------------------------------------

def calculate_location_score(user_prefs: dict, place: pd.Series) -> float:
    """0–100 location match for Stage 1."""
    pref_province = user_prefs.get("preferred_province", "any")
    if pref_province.lower() == "any" or not pref_province:
        return 70.0  # neutral
    place_province = str(place.get("province_or_city", "")).strip()
    if place_province.lower() == pref_province.lower():
        return 100.0
    # Partial match on district
    place_district = str(place.get("district", "")).strip()
    if pref_province.lower() in place_province.lower() or pref_province.lower() in place_district.lower():
        return 80.0
    return 20.0


# ---------------------------------------------------------------------------
# 7a. Stage 1 — Main personalized recommendations
# ---------------------------------------------------------------------------

def recommend_main_places(
    user_prefs: dict,
    df: pd.DataFrame,
    top_n: int = 5,
) -> pd.DataFrame:
    """
    Stage 1: Recommend top N places from Rwanda catalogue based on user preferences.

    main_score = 0.50 * preference_score
               + 0.20 * rating_score
               + 0.15 * hidden_gem_score
               + 0.15 * location_score
    """
    results = []
    for _, row in df.iterrows():
        pref_s  = calculate_preference_score(user_prefs, row)
        rat_s   = calculate_rating_score(row)
        hg_s    = calculate_hidden_gem_score(row)
        loc_s   = calculate_location_score(user_prefs, row)

        main_score = (
            0.50 * pref_s
            + 0.20 * rat_s
            + 0.15 * hg_s
            + 0.15 * loc_s
        )
        results.append({
            **row.to_dict(),
            "preference_score": round(pref_s, 1),
            "rating_score_calc": round(rat_s, 1),
            "hidden_gem_score_calc": round(hg_s, 1),
            "location_score_calc": round(loc_s, 1),
            "final_score": round(main_score, 1),
            "match_pct": round(main_score),
        })

    result_df = pd.DataFrame(results)
    result_df = result_df.sort_values("final_score", ascending=False).head(top_n)
    return result_df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 7b. Stage 2 — Nearby recommendations around a selected place
# ---------------------------------------------------------------------------

def recommend_nearby_places(
    selected_place: pd.Series,
    user_prefs: dict,
    df: pd.DataFrame,
    top_n: int = 5,
) -> pd.DataFrame:
    """
    Stage 2: Recommend nearby places around a selected recommended place.

    nearby_score = 0.40 * distance_score
                 + 0.30 * preference_score
                 + 0.20 * rating_score
                 + 0.10 * hidden_gem_score
    """
    sel_lat = float(selected_place["latitude"])
    sel_lon = float(selected_place["longitude"])
    sel_name = str(selected_place["place_name"])

    results = []
    for _, row in df.iterrows():
        # Exclude the selected place itself
        if str(row["place_name"]) == sel_name:
            continue

        dist_km = haversine_distance(
            sel_lat, sel_lon,
            float(row["latitude"]), float(row["longitude"])
        )

        dist_s  = calculate_distance_score(dist_km)
        pref_s  = calculate_preference_score(user_prefs, row)
        rat_s   = calculate_rating_score(row)
        hg_s    = calculate_hidden_gem_score(row)

        nearby_score = (
            0.40 * dist_s
            + 0.30 * pref_s
            + 0.20 * rat_s
            + 0.10 * hg_s
        )
        results.append({
            **row.to_dict(),
            "distance_km": round(dist_km, 1),
            "distance_score": round(dist_s, 1),
            "preference_score": round(pref_s, 1),
            "rating_score_calc": round(rat_s, 1),
            "hidden_gem_score_calc": round(hg_s, 1),
            "final_score": round(nearby_score, 1),
            "match_pct": round(nearby_score),
        })

    result_df = pd.DataFrame(results)
    result_df = result_df.sort_values("final_score", ascending=False).head(top_n)
    return result_df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 8. Generate human-readable reason
# ---------------------------------------------------------------------------

def generate_reason(
    user_prefs: dict,
    place: pd.Series,
    distance_km: float | None,
    selected_place_name: str | None,
) -> str:
    """Generate a short, friendly reason for the recommendation."""
    parts = []

    # Interest match
    interests = user_prefs.get("interests", [])
    place_tags = set(place.get("tags_list", []))
    matched = [i for i in interests if i.lower() in place_tags]
    if matched:
        parts.append(f"matches your {' & '.join(matched)} interests")

    # Budget
    budget = user_prefs.get("budget", "any")
    if budget != "any":
        parts.append(f"fits your {budget} budget")

    # Distance
    if distance_km is not None and selected_place_name:
        parts.append(f"is {distance_km:.1f} km from {selected_place_name}")

    # Hidden gem
    hg_pref = user_prefs.get("hidden_gem_pref", "both")
    if hg_pref == "hidden gems" and float(place.get("hidden_gem_score_norm", 0)) >= 70:
        parts.append("is a hidden gem")
    elif hg_pref == "popular places" and str(place.get("popularity_norm", "")).lower() == "high":
        parts.append("is a popular local favourite")

    if not parts:
        return "Recommended based on overall match with Rwanda destinations."

    return "Recommended because it " + ", and ".join(parts) + "."


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_category_emoji(category: str) -> str:
    return CATEGORY_EMOJI.get(category, "📍")


def get_category_color(category: str) -> str:
    return CATEGORY_COLOR_CLASS.get(category, "teal")
