"""
recommender.py — Inzira
Two-stage recommendation engine for Rwanda places.
Refactored to follow Object-Oriented Programming (OOP) principles and match JS scoring weights.
"""

from __future__ import annotations

import math
import pandas as pd

class InziraRecommender:
    """OOP implementation of Inzira's two-stage client-side equivalent recommendation scorer."""

    BUDGET_COMPAT = {
        "any":    {"low", "medium", "high", "unknown"},
        "low":    {"low", "unknown"},
        "medium": {"low", "medium", "unknown"},
        "high":   {"low", "medium", "high", "unknown"},
    }

    TIME_COMPAT = {
        "any":          {"1-2 hours", "half-day", "overnight", "unknown"},
        "1-2 hours":    {"1-2 hours", "unknown"},
        "half-day":     {"1-2 hours", "half-day", "unknown"},
        "full-day":     {"1-2 hours", "half-day", "overnight", "unknown"},
        "weekend":      {"1-2 hours", "half-day", "overnight", "unknown"},
    }

    INTEREST_TO_TAGS = {
        "nature":     ["nature", "wildlife", "lake", "national_park", "explore"],
        "wildlife":   ["wildlife", "national_park", "nature"],
        "culture":    ["culture", "history", "art"],
        "food":       ["food", "local", "rwandan", "african", "regional", "restaurant",
                       "barbecue", "pizza", "coffee", "coffee_shop", "international",
                       "italian", "indian", "asian", "chinese", "steak_house", "chicken"],
        "history":    ["history", "culture"],
        "adventure":  ["adventure", "explore", "viewpoint", "accessible"],
        "art":        ["art", "culture"],
        "shopping":   ["shopping"],
        "relaxation": ["relaxation", "coffee", "coffee_shop"],
    }

    CATEGORY_EMOJI = {
        "Nature & Wildlife":   "🌿",
        "Lakes & Waterways":   "🌊",
        "Cultural & Historic": "🏛️",
        "Attraction":          "🎯",
        "Scenic Viewpoints":   "🏔️",
        "Food & Drink":        "🍽️",
        "Café":                "☕",
        "Cafe":                "☕",
        "Lodging":             "🏨",
        "Markets & Shopping":  "🛍️",
        "Arts & Entertainment":"🎨",
    }

    CATEGORY_COLOR_CLASS = {
        "Nature & Wildlife":   "teal",
        "Lakes & Waterways":   "teal",
        "Scenic Viewpoints":   "teal",
        "Cultural & Historic": "amber",
        "Food & Drink":        "amber",
        "Café":                "amber",
        "Cafe":                "amber",
        "Markets & Shopping":  "amber",
        "Attraction":          "purple",
        "Lodging":             "purple",
        "Arts & Entertainment":"purple",
    }

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Return great-circle distance in kilometres between two coordinates."""
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def calculate_preference_score(self, user_prefs: dict, place: pd.Series) -> float:
        """
        Returns 0–100 based on Interest (50), Budget (20), Time (15), and Gem Preference (15).
        """
        score = 0.0

        # --- Interest match (50 pts) ---
        interests = user_prefs.get("interests", [])
        place_tags = set([t.lower() for t in place.get("tags_list", [])])
        place_category = str(place.get("category", "")).lower()

        if interests:
            match_score = 0.0
            for interest in interests:
                expanded_tags = self.INTEREST_TO_TAGS.get(interest, [interest])
                tag_matches = len([tag for tag in expanded_tags if tag in place_tags])
                cat_match = any(tag in place_category for tag in expanded_tags)
                if tag_matches >= 2:
                    match_score += 50.0 / len(interests)
                elif tag_matches == 1 or cat_match:
                    match_score += 30.0 / len(interests)
            
            if match_score == 0.0:
                return 0.0  # Force score to 0 so it gets filtered out of recommendations
            score += min(match_score, 50.0)
        else:
            score += 15.0

        # --- Budget match (20 pts) ---
        user_budget = user_prefs.get("budget", "any").lower()
        place_cost = str(place.get("cost_level_norm", "unknown")).lower()
        compat_set = self.BUDGET_COMPAT.get(user_budget, self.BUDGET_COMPAT["any"])
        
        if place_cost == "unknown":
            score += 8.0
        elif user_budget != "any" and place_cost == user_budget:
            score += 20.0
        elif place_cost in compat_set:
            score += 10.0 if user_budget == "any" else 12.0

        # --- Time match (15 pts) ---
        user_time = user_prefs.get("available_time", "any").lower()
        place_dur = str(place.get("duration_norm", "unknown")).lower()
        time_set = self.TIME_COMPAT.get(user_time, self.TIME_COMPAT["any"])

        if place_dur == "unknown":
            score += 5.0
        elif user_time != "any" and place_dur == user_time:
            score += 15.0
        elif place_dur in time_set:
            score += 8.0 if user_time == "any" else 10.0

        # --- Hidden-gem preference (15 pts) ---
        hg_pref = user_prefs.get("hidden_gem_pref", "both").lower()
        hg_score_norm = float(place.get("hidden_gem_score_norm", 50))
        pop_norm = str(place.get("popularity_norm", "medium")).lower()

        if hg_pref == "hidden gems":
            if hg_score_norm >= 85:
                score += 15.0
            elif hg_score_norm >= 70:
                score += 10.0
            elif pop_norm == "low":
                score += 6.0
            else:
                score += 2.0
        elif hg_pref == "popular places":
            if pop_norm == "high":
                score += 15.0
            elif pop_norm == "medium":
                score += 8.0
            else:
                score += 2.0
        else:  # "both"
            score += 4.0 + (hg_score_norm / 100.0) * 8.0

        return min(max(score, 0.0), 100.0)

    def calculate_distance_score(self, distance_km: float) -> float:
        """Tiered distance score — closer = higher score."""
        if distance_km <= 5:
            return 100.0
        elif distance_km <= 15:
            return 80.0
        elif distance_km <= 30:
            return 60.0
        elif distance_km <= 60:
            return 40.0
        elif distance_km <= 120:
            return 25.0
        else:
            return 10.0

    def calculate_rating_score(self, place: pd.Series) -> float:
        """Derived rating score mapping popularity level + hidden gem bonus."""
        pop_map = {"high": 82, "medium": 52, "low": 22}
        base = pop_map.get(str(place.get("popularity_norm", "medium")).lower(), 52)
        hg_bonus = round((float(place.get("hidden_gem_score_norm", 50)) / 100.0) * 18)
        return min(base + hg_bonus, 100.0)

    def calculate_hidden_gem_score(self, place: pd.Series) -> float:
        """0–100 normalized hidden gem score."""
        return float(place.get("hidden_gem_score_norm", 50))

    def calculate_location_score(self, user_prefs: dict, place: pd.Series) -> float:
        """0–100 location match for Stage 1."""
        pref_province = user_prefs.get("preferred_province", "any").lower().strip()
        if pref_province == "any" or not pref_province:
            return 65.0

        place_province = str(place.get("province_or_city", "")).lower()
        place_district = str(place.get("district", "")).lower()

        if place_province == pref_province:
            return 100.0
        if pref_province in place_province or place_province in pref_province:
            return 90.0
        if pref_province in place_district or place_district in pref_province:
            return 70.0
        return 15.0

    def recommend_main_places(self, user_prefs: dict, df: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
        """
        Stage 1: Recommend top N places from Rwanda catalogue based on user preferences.
        main_score = 0.50 * preference_score
                   + 0.20 * rating_score
                   + 0.15 * hidden_gem_score
                   + 0.15 * location_score
        """
        hg_pref = user_prefs.get("hidden_gem_pref", "both").lower()
        candidate_df = df
        if hg_pref == "hidden gems":
            candidate_df = df[df["popularity_norm"].str.lower() != "high"]

        is_resident = user_prefs.get("user_type", "tourist").lower() == "resident"
        w_pref = 0.50
        w_rat = 0.05 if is_resident else 0.20
        w_hg = 0.30 if is_resident else 0.15
        w_loc = 0.15

        results = []
        for _, row in candidate_df.iterrows():
            pref_s  = self.calculate_preference_score(user_prefs, row)
            rat_s   = self.calculate_rating_score(row)
            hg_s    = self.calculate_hidden_gem_score(row)
            loc_s   = self.calculate_location_score(user_prefs, row)

            main_score = min(
                w_pref * pref_s
                + w_rat * rat_s
                + w_hg * hg_s
                + w_loc * loc_s,
                99.0
            )
            results.append({
                **row.to_dict(),
                "preference_score": round(pref_s, 1),
                "rating_score_calc": round(rat_s, 1),
                "hidden_gem_score_calc": round(hg_s, 1),
                "location_score_calc": round(loc_s, 1),
                "final_score": round(main_score, 1),
                "match_pct": round(main_score),
                "_prefS": pref_s,
            })

        result_df = pd.DataFrame(results)
        result_df = result_df[result_df["_prefS"] > 10]
        result_df = result_df.sort_values("final_score", ascending=False).head(top_n)
        return result_df.reset_index(drop=True)

    def recommend_nearby_places(self, selected_place: pd.Series, user_prefs: dict, df: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
        """
        Stage 2: Recommend nearby places around a selected recommended place.
        nearby_score = 0.40 * distance_score
                     + 0.30 * preference_score
                     + 0.20 * rating_score
                     + 0.10 * hidden_gem_score
                     + diversity_bonus
        """
        sel_lat = float(selected_place["latitude"])
        sel_lon = float(selected_place["longitude"])
        sel_name = str(selected_place["place_name"])
        sel_category = str(selected_place.get("category", ""))

        hg_pref = user_prefs.get("hidden_gem_pref", "both").lower()

        candidate_df = df[df["place_name"] != sel_name]
        if hg_pref == "hidden gems":
            candidate_df = candidate_df[candidate_df["popularity_norm"].str.lower() != "high"]

        is_resident = user_prefs.get("user_type", "tourist").lower() == "resident"
        w_dist = 0.40
        w_pref = 0.30
        w_rat = 0.05 if is_resident else 0.20
        w_hg = 0.25 if is_resident else 0.10

        results = []
        for _, row in candidate_df.iterrows():

            dist_km = self.haversine_distance(
                sel_lat, sel_lon,
                float(row["latitude"]), float(row["longitude"])
            )

            dist_s  = self.calculate_distance_score(dist_km)
            pref_s  = self.calculate_preference_score(user_prefs, row)
            rat_s   = self.calculate_rating_score(row)
            hg_s    = self.calculate_hidden_gem_score(row)

            diversity_bonus = 5.0 if str(row.get("category", "")) != sel_category else 0.0

            nearby_score = min(
                w_dist * dist_s
                + w_pref * pref_s
                + w_rat * rat_s
                + w_hg * hg_s
                + diversity_bonus,
                99.0
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

    def generate_reason(self, user_prefs: dict, place: pd.Series, distance_km: float | None, selected_place_name: str | None) -> str:
        """Generate a short, friendly reason for the recommendation."""
        parts = []

        interests = user_prefs.get("interests", [])
        place_tags = set([t.lower() for t in place.get("tags_list", [])])
        place_category = str(place.get("category", "")).lower()

        matched = []
        for interest in interests:
            expanded = self.INTEREST_TO_TAGS.get(interest, [interest])
            if any(tag in place_tags for tag in expanded) or any(tag in place_category for tag in expanded):
                matched.append(interest)

        if matched:
            parts.append(f"matches your {' & '.join(matched[:2])} interests")

        budget = user_prefs.get("budget", "any")
        if budget != "any":
            cost_norm = str(place.get("cost_level_norm", "unknown")).lower()
            if cost_norm != "unknown":
                parts.append(f"fits your {budget} budget")

        if distance_km is not None and selected_place_name:
            parts.append(f"{distance_km:.1f} km from {selected_place_name}")

        hg_norm = float(place.get("hidden_gem_score_norm", 50))
        hg_pref = user_prefs.get("hidden_gem_pref", "both").lower()
        if hg_pref == "hidden gems" and hg_norm >= 70:
            parts.append("a hidden local gem")
        elif hg_pref == "popular places" and str(place.get("popularity_norm", "")).lower() == "high":
            parts.append("a popular local favourite")

        if not parts:
            dist = str(place.get("district", place.get("province_or_city", "Rwanda")))
            cat = str(place.get("category", "Place"))
            return f"In {dist} · {cat}"

        return " · ".join(parts)


# ---------------------------------------------------------------------------
# Backward Compatibility Wrappers (Functional API)
# ---------------------------------------------------------------------------

_recommender_instance = InziraRecommender()

def recommend_main_places(user_prefs: dict, df: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
    return _recommender_instance.recommend_main_places(user_prefs, df, top_n)

def recommend_nearby_places(selected_place: pd.Series, user_prefs: dict, df: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
    return _recommender_instance.recommend_nearby_places(selected_place, user_prefs, df, top_n)

def generate_reason(user_prefs: dict, place: pd.Series, distance_km: float | None, selected_place_name: str | None) -> str:
    return _recommender_instance.generate_reason(user_prefs, place, distance_km, selected_place_name)

def get_category_emoji(category: str) -> str:
    return _recommender_instance.CATEGORY_EMOJI.get(category, "📍")

def get_category_color(category: str) -> str:
    return _recommender_instance.CATEGORY_COLOR_CLASS.get(category, "teal")
