/**
 * recommender.js — Inzira
 * Two-stage recommendation engine with differentiated scoring.
 */

// ─── Category metadata ───────────────────────────────────────────────────────

export const CATEGORY_EMOJI = {
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
};

export const CATEGORY_COLOR = {
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
};

// Interest → dataset tag mapping
const INTEREST_TO_TAGS = {
  nature:     ["nature", "wildlife", "lake", "national_park", "explore"],
  wildlife:   ["wildlife", "national_park", "nature"],
  culture:    ["culture", "history", "art"],
  food:       ["food", "local", "rwandan", "african", "regional", "restaurant",
               "barbecue", "pizza", "coffee", "coffee_shop", "international",
               "italian", "indian", "asian", "chinese", "steak_house", "chicken"],
  history:    ["history", "culture"],
  adventure:  ["adventure", "explore", "viewpoint", "accessible"],
  art:        ["art", "culture"],
  shopping:   ["shopping"],
  relaxation: ["relaxation", "coffee", "coffee_shop"],
};

const BUDGET_COMPAT = {
  any:    ["low", "medium", "high", "unknown"],
  low:    ["low", "unknown"],
  medium: ["low", "medium", "unknown"],
  high:   ["low", "medium", "high", "unknown"],
};

const TIME_COMPAT = {
  any:          ["1-2 hours", "half-day", "overnight", "unknown"],
  "1-2 hours":  ["1-2 hours", "unknown"],
  "half-day":   ["1-2 hours", "half-day", "unknown"],
  "full-day":   ["1-2 hours", "half-day", "overnight", "unknown"],
  weekend:      ["1-2 hours", "half-day", "overnight", "unknown"],
};

// ─── Haversine ───────────────────────────────────────────────────────────────

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Individual scoring functions ────────────────────────────────────────────

/**
 * Preference score 0–100.
 * Uses a richer interest expansion so "nature" matches nature/wildlife/lake tags.
 */
export function calcPreferenceScore(userPrefs, place) {
  let score = 0;

  // --- Interest match (50 pts) ---
  // Partial tag match gives proportional credit; exact category match gives bonus
  const interests = userPrefs.interests || [];
  const placeTags = new Set((place.tags_list || []).map((t) => t.toLowerCase()));
  const placeCategory = (place.category || "").toLowerCase();

  if (interests.length > 0) {
    let matchScore = 0;
    for (const interest of interests) {
      const expandedTags = INTEREST_TO_TAGS[interest] || [interest];
      // Count how many expanded tags match (more overlap = higher score)
      const tagMatches = expandedTags.filter(tag => placeTags.has(tag)).length;
      const catMatch = expandedTags.some(tag => placeCategory.includes(tag));
      if (tagMatches >= 2) matchScore += 50 / interests.length;        // Strong match
      else if (tagMatches === 1 || catMatch) matchScore += 30 / interests.length; // Partial
      // No match = 0 contribution
    }
    if (matchScore === 0) {
      return 0; // Force score to 0 so it gets filtered out of recommendations
    }
    score += Math.min(matchScore, 50);
  } else {
    score += 15;
  }

  // --- Budget match (20 pts) ---
  const budget = (userPrefs.budget || "any").toLowerCase();
  const cost = (place.cost_level_norm || "unknown").toLowerCase();
  const budgetCompatList = BUDGET_COMPAT[budget] || BUDGET_COMPAT.any;
  if (cost === "unknown") {
    score += 8;
  } else if (budget !== "any" && cost === budget) {
    score += 20; // perfect budget match
  } else if (budgetCompatList.includes(cost)) {
    score += budget === "any" ? 10 : 12;
  }

  // --- Time match (15 pts) ---
  const time = (userPrefs.available_time || "any").toLowerCase();
  const dur = (place.duration_norm || "unknown").toLowerCase();
  const timeCompatList = TIME_COMPAT[time] || TIME_COMPAT.any;
  if (dur === "unknown") {
    score += 5;
  } else if (time !== "any" && dur === time) {
    score += 15; // exact time match
  } else if (timeCompatList.includes(dur)) {
    score += time === "any" ? 8 : 10;
  }

  // --- Hidden gem preference (15 pts) ---
  const hgPref = (userPrefs.hidden_gem_pref || "both").toLowerCase();
  const hgNorm = place.hidden_gem_score_norm ?? 50;
  const popNorm = (place.popularity_norm || "medium").toLowerCase();

  if (hgPref === "hidden gems") {
    if (hgNorm >= 85) score += 15;
    else if (hgNorm >= 70) score += 10;
    else if (popNorm === "low") score += 6;
    else score += 2;
  } else if (hgPref === "popular places") {
    if (popNorm === "high") score += 15;
    else if (popNorm === "medium") score += 8;
    else score += 2;
  } else {
    // "both" — partial credit based on gem score
    score += 4 + (hgNorm / 100) * 8;
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Distance score 0–100 (tiered).
 */
export function calcDistanceScore(distKm) {
  if (distKm <= 5)   return 100;
  if (distKm <= 15)  return 80;
  if (distKm <= 30)  return 60;
  if (distKm <= 60)  return 40;
  if (distKm <= 120) return 25;
  return 10;
}

/**
 * Rating score 0–100 — from popularity_level + review_count bonus.
 */
export function calcRatingScore(place) {
  // Wider spread: High=80-100, Medium=40-65, Low=15-40
  const popMap = { high: 82, medium: 52, low: 22 };
  const base = popMap[(place.popularity_norm || "medium").toLowerCase()] ?? 52;
  // Up to 18 bonus points from hidden gem score for real spread
  const hgBonus = Math.round(((place.hidden_gem_score_norm ?? 50) / 100) * 18);
  return Math.min(base + hgBonus, 100);
}

/**
 * Hidden gem score 0–100 — normalized from raw 3–10 score.
 */
export function calcHiddenGemScore(place) {
  return place.hidden_gem_score_norm ?? 50;
}

/**
 * Location score 0–100 for Stage 1.
 */
export function calcLocationScore(userPrefs, place) {
  const pref = (userPrefs.preferred_province || "any").toLowerCase().trim();
  if (!pref || pref === "any") return 100;

  const province = (place.province_or_city || "").toLowerCase();
  const district = (place.district || "").toLowerCase();
  const kw = pref.split(" ")[0];

  if (province.includes(kw) || district.includes(kw)) return 100;
  return 0;
}

// ─── Stage 1: Main personalized recommendations ──────────────────────────────

export function recommendMainPlaces(userPrefs, places, topN = 5, savedPlaces = []) {
  const pref = (userPrefs.preferred_province || "any").toLowerCase().trim();
  let candidatePlaces = places;

  if (pref && pref !== "any") {
    const kw = pref.split(" ")[0];
    const provMatches = places.filter((p) => {
      const prov = (p.province_or_city || "").toLowerCase();
      const dist = (p.district || "").toLowerCase();
      return prov.includes(kw) || dist.includes(kw);
    });
    if (provMatches.length > 0) {
      candidatePlaces = provMatches;
    }
  }

  const scored = candidatePlaces.map((place) => {
    const prefS = calcPreferenceScore(userPrefs, place);
    const ratS  = calcRatingScore(place);
    const hgS   = calcHiddenGemScore(place);
    const locS  = calcLocationScore(userPrefs, place);

    // Personalization boost based on user's previously visited (saved) spots
    let personalizationBoost = 0;
    if (savedPlaces && savedPlaces.length > 0) {
      const savedCategories = savedPlaces.map(p => p.category).filter(Boolean);
      const savedTags = savedPlaces.flatMap(p => p.tags_list || []);

      // Boost similar categories
      const catMatches = savedCategories.filter(c => c === place.category).length;
      if (catMatches > 0) {
        personalizationBoost += Math.min(5 * catMatches, 15);
      }

      // Boost similar tags
      const placeTags = new Set((place.tags_list || []).map(t => t.toLowerCase()));
      const tagMatches = savedTags.filter(t => placeTags.has(t.toLowerCase())).length;
      if (tagMatches > 0) {
        personalizationBoost += Math.min(2 * tagMatches, 10);
      }
    }

    const mainScore = Math.min(
      0.50 * prefS +
      0.20 * ratS  +
      0.15 * hgS   +
      0.15 * locS  +
      personalizationBoost,
      99
    );

    return {
      ...place,
      _prefS: prefS,
      _ratS: ratS,
      _hgS: hgS,
      _locS: locS,
      final_score: Math.round(mainScore * 10) / 10,
      match_pct: Math.round(mainScore),
    };
  });

  return scored
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, topN);
}

// ─── Stage 2: Nearby recommendations ─────────────────────────────────────────

export function recommendNearbyPlaces(selectedPlace, userPrefs, places, topN = 5) {
  const selLat = parseFloat(selectedPlace.latitude);
  const selLon = parseFloat(selectedPlace.longitude);
  const selName = selectedPlace.place_name;
  const selCategory = selectedPlace.category;

  const scored = places
    .filter((p) => p.place_name !== selName)
    .map((place) => {
      const distKm = haversineDistance(
        selLat, selLon,
        parseFloat(place.latitude), parseFloat(place.longitude)
      );
      const distS  = calcDistanceScore(distKm);
      const prefS  = calcPreferenceScore(userPrefs, place);
      const ratS   = calcRatingScore(place);
      const hgS    = calcHiddenGemScore(place);

      // Diversity bonus: different category from selected place gets a boost
      const diversityBonus = (place.category !== selCategory) ? 5 : 0;

      const nearbyScore = Math.min(
        0.40 * distS +
        0.30 * prefS +
        0.20 * ratS  +
        0.10 * hgS   +
        diversityBonus,
        99
      );

      return {
        ...place,
        distance_km: Math.round(distKm * 10) / 10,
        _distS: distS,
        _prefS: prefS,
        _ratS: ratS,
        _hgS: hgS,
        final_score: Math.round(nearbyScore * 10) / 10,
        match_pct: Math.round(nearbyScore),
      };
    });

  return scored
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, topN);
}

// ─── Reason generator ────────────────────────────────────────────────────────

export function generateReason(userPrefs, place, distKm, selectedName) {
  const parts = [];

  // Interest match
  const interests = userPrefs.interests || [];
  const placeTags = new Set((place.tags_list || []).map((t) => t.toLowerCase()));
  const matched = interests.filter((interest) => {
    const tags = INTEREST_TO_TAGS[interest] || [interest];
    return tags.some((t) => placeTags.has(t) || (place.category || "").toLowerCase().includes(t));
  });
  if (matched.length > 0) {
    parts.push(`matches your ${matched.slice(0, 2).join(" & ")} interests`);
  }

  // Budget
  const budget = userPrefs.budget;
  if (budget && budget !== "any") {
    const costNorm = (place.cost_level_norm || "unknown").toLowerCase();
    if (costNorm !== "unknown") parts.push(`fits your ${budget} budget`);
  }

  // Distance
  if (distKm != null && selectedName) {
    parts.push(`${distKm.toFixed(1)} km from ${selectedName}`);
  }

  // Hidden gem
  const hgNorm = place.hidden_gem_score_norm ?? 50;
  const hgPref = (userPrefs.hidden_gem_pref || "both").toLowerCase();
  if (hgPref === "hidden gems" && hgNorm >= 70) parts.push("a hidden local gem");
  else if (hgPref === "popular places" && (place.popularity_norm || "").toLowerCase() === "high")
    parts.push("a popular local favourite");

  if (parts.length === 0) return `In ${place.district || place.province_or_city || "Rwanda"} · ${place.category || "Place"}`;
  return parts.join(" · ");
}

export function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category] || "📍";
}

export function getCategoryColor(category) {
  return CATEGORY_COLOR[category] || "teal";
}

// ─── Score label ─────────────────────────────────────────────────────────────

export function getMatchLabel(pct) {
  if (pct >= 85) return "Excellent";
  if (pct >= 70) return "Great";
  if (pct >= 55) return "Good";
  return "Fair";
}
