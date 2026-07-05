/**
 * test_recommender.js — Inzira
 * Command-line regression testing suite for Next.js recommendation logic.
 * Runs in standard Node.js to verify ES module algorithm calculations.
 */

const fs = require('fs');
const path = require('path');

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

(async () => {
  console.log('🧪 Starting JavaScript Recommendation Engine Tests...');

  // 1. Load the ES Module dynamically
  let recommender;
  try {
    recommender = await import('./recommender.js');
  } catch (err) {
    console.error('❌ Failed to import recommender.js. Ensure Node.js v18+ is used.', err);
    process.exit(1);
  }

  const {
    haversineDistance,
    calcPreferenceScore,
    calcDistanceScore,
    recommendMainPlaces,
    recommendNearbyPlaces
  } = recommender;

  // 2. Load the Places Catalogue
  let places;
  try {
    const filePath = path.join(__dirname, '../public/rwanda_places.json');
    places = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`✅ Dataset loaded successfully: ${places.length} places indexed.`);
    assert(places.length > 1000, 'Places index should contain >1000 places.');
  } catch (err) {
    console.error('❌ Failed to read or parse rwanda_places.json.', err);
    process.exit(1);
  }

  // 3. Test Haversine Distance
  const kigali = { lat: -1.9547, lon: 30.0935 };
  const gisenyi = { lat: -1.7019, lon: 29.2625 };
  const distance = haversineDistance(kigali.lat, kigali.lon, gisenyi.lat, gisenyi.lon);
  console.log(`✅ Haversine Distance (Kigali Heights -> Gisenyi): ${distance.toFixed(1)} km`);
  assert(distance >= 90.0 && distance <= 110.0, 'Distance must be roughly 90-110 km.');

  // 4. Test Distance Scores
  assert(calcDistanceScore(2) === 100, 'Distance score <= 5km must be 100');
  assert(calcDistanceScore(12) === 80, 'Distance score <= 15km must be 80');
  assert(calcDistanceScore(25) === 60, 'Distance score <= 30km must be 60');
  assert(calcDistanceScore(150) === 10, 'Distance score > 120km must be 10');
  console.log('✅ Distance score tiers verified successfully.');

  // 5. Test Preference Scoring & Interest Mappings
  const mockPlace = {
    place_name: 'Mock Cafe',
    category: 'Café',
    tags_list: ['coffee', 'relaxation'],
    cost_level_norm: 'medium',
    duration_norm: '1-2 hours',
    hidden_gem_score_norm: 80,
    popularity_norm: 'medium'
  };

  // Test Interest Match: food / relaxation should map to coffee/relaxation
  const prefsMatch = { interests: ['food'], budget: 'any', available_time: 'any', hidden_gem_pref: 'both' };
  const scoreMatch = calcPreferenceScore(prefsMatch, mockPlace);
  console.log(`✅ Preference Score (Matching food interest): ${scoreMatch} pts`);
  assert(scoreMatch > 50, 'Matching interests must score preference points.');

  // Test Interest Mismatch: shopping should evaluate to 0 since no tag overlaps
  const prefsMismatch = { interests: ['shopping'], budget: 'any', available_time: 'any', hidden_gem_pref: 'both' };
  const scoreMismatch = calcPreferenceScore(prefsMismatch, mockPlace);
  console.log(`✅ Preference Score (Mismatching shopping interest): ${scoreMismatch} pts`);
  assert(scoreMismatch === 0, 'Unrelated interests must score 0 and be filtered out.');

  // 6. Test Stage 1: Main Recommendations
  const userPrefs = {
    interests: ['nature'],
    budget: 'low',
    available_time: 'half-day',
    preferred_province: 'West',
    hidden_gem_pref: 'both'
  };
  const mainRecs = recommendMainPlaces(userPrefs, places, 5);
  console.log(`✅ Stage 1 main recommendations computed. Top pick: "${mainRecs[0].place_name}"`);
  assert(mainRecs.length === 5, 'Stage 1 should return exactly 5 recommendations.');
  assert(mainRecs[0].final_score >= mainRecs[4].final_score, 'Recommendations must be sorted descending.');

  // 7. Test Stage 2: Nearby recommendations
  const selectedPlace = mainRecs[0];
  const nearbyRecs = recommendNearbyPlaces(selectedPlace, userPrefs, places, 5);
  console.log(`✅ Stage 2 nearby recommendations computed around "${selectedPlace.place_name}".`);
  assert(nearbyRecs.length === 5, 'Stage 2 should return exactly 5 nearby picks.');
  assert(nearbyRecs.every(p => p.place_name !== selectedPlace.place_name), 'Selected place must be excluded from nearby picks.');

  console.log('\n🎉 All JavaScript Recommendation Scorer tests passed successfully!');
  process.exit(0);
})();
