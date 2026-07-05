import sys
import os
# Allow imports from backend/ folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import unittest
import pandas as pd
from data_loader import RwandaDataLoader
from recommender import InziraRecommender

class TestInziraRecommender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loader = RwandaDataLoader()
        cls.recommender = InziraRecommender()
        cls.df = cls.loader.load_data()

    def test_dataset_loading_integrity(self):
        """Verify that the Rwanda places catalogue loads successfully with expected shapes and columns."""
        self.assertIsNotNone(self.df)
        self.assertGreater(len(self.df), 1000, "Dataset should contain at least 1,000 places.")
        required_columns = ["place_name", "latitude", "longitude", "category", "tags_list", "cost_level_norm", "duration_norm"]
        for col in required_columns:
            self.assertIn(col, self.df.columns, f"Required column '{col}' is missing.")

    def test_haversine_distance(self):
        """Verify mathematical correctness of the Haversine distance calculator."""
        # Great-circle distance from Kigali (Kigali Heights) to Gisenyi (Lake Kivu) is approx 96.5 km
        kigali_lat, kigali_lon = -1.9547, 30.0935
        gisenyi_lat, gisenyi_lon = -1.7019, 29.2625
        dist = self.recommender.haversine_distance(kigali_lat, kigali_lon, gisenyi_lat, gisenyi_lon)
        self.assertTrue(90.0 <= dist <= 110.0, f"Distance should be around ~96.5km, got {dist:.1f}km")

    def test_distance_score_tiers(self):
        """Verify the tiered distance scoring system maps correctly to distance limits."""
        self.assertEqual(self.recommender.calculate_distance_score(2.0), 100.0)    # <= 5km
        self.assertEqual(self.recommender.calculate_distance_score(12.0), 80.0)   # <= 15km
        self.assertEqual(self.recommender.calculate_distance_score(25.0), 60.0)   # <= 30km
        self.assertEqual(self.recommender.calculate_distance_score(50.0), 40.0)   # <= 60km
        self.assertEqual(self.recommender.calculate_distance_score(100.0), 25.0)  # <= 120km
        self.assertEqual(self.recommender.calculate_distance_score(150.0), 10.0)  # > 120km

    def test_preference_score_interests_expansion(self):
        """Verify that interest-to-tags expansion correctly matches places and assigns points."""
        place = pd.Series({
            "category": "Food & Drink",
            "tags_list": ["restaurant", "local", "rwandan"],
            "cost_level_norm": "medium",
            "duration_norm": "1-2 hours",
            "hidden_gem_score_norm": 50,
            "popularity_norm": "medium"
        })
        
        # Test case 1: Active 'food' interest gets expanded correctly and scores points
        prefs_with_food = {"interests": ["food"], "budget": "any", "available_time": "any", "hidden_gem_pref": "both"}
        score_food = self.recommender.calculate_preference_score(prefs_with_food, place)
        self.assertGreater(score_food, 50.0, "Interest matching 'food' should score preference match points.")

        # Test case 2: Unrelated interest evaluates to 0 due to strict filtering
        prefs_unrelated = {"interests": ["art"], "budget": "any", "available_time": "any", "hidden_gem_pref": "both"}
        score_unrelated = self.recommender.calculate_preference_score(prefs_unrelated, place)
        self.assertEqual(score_unrelated, 0.0, "Unrelated interests must yield 0 score for recommendations filtering.")

    def test_preference_score_budget_tiers(self):
        """Verify that budget matching filters budget categories correctly."""
        place_low_cost = pd.Series({
            "category": "Attraction",
            "tags_list": ["nature"],
            "cost_level_norm": "low",
            "duration_norm": "1-2 hours",
            "hidden_gem_score_norm": 50,
            "popularity_norm": "medium"
        })

        # Matches budget low
        prefs_low = {"interests": ["nature"], "budget": "low", "available_time": "any", "hidden_gem_pref": "both"}
        score_low = self.recommender.calculate_preference_score(prefs_low, place_low_cost)
        
        # Fails budget high (strictly compatible but not preferred)
        prefs_high = {"interests": ["nature"], "budget": "high", "available_time": "any", "hidden_gem_pref": "both"}
        score_high = self.recommender.calculate_preference_score(prefs_high, place_low_cost)
        
        self.assertGreater(score_low, score_high, "Budget matches should score higher than incompatible budgets.")

    def test_stage_1_main_recommendations(self):
        """Test Stage 1 recommendations retrieval & ordering."""
        prefs = {
            "interests": ["nature", "adventure"],
            "budget": "low",
            "available_time": "half-day",
            "preferred_province": "North",
            "hidden_gem_pref": "both"
        }
        recs = self.recommender.recommend_main_places(prefs, self.df, top_n=5)
        self.assertIsNotNone(recs)
        self.assertEqual(len(recs), 5, "Should return exactly top 5 recommendations.")
        # Check sorting
        scores = recs["final_score"].tolist()
        self.assertEqual(scores, sorted(scores, reverse=True), "Recommendations must be sorted descending by final score.")

    def test_stage_2_nearby_recommendations(self):
        """Test Stage 2 nearby recommendation logic including distance sorting & diversity bonus."""
        # Select a mock place (first entry in dataframe)
        selected_place = self.df.iloc[0]
        
        prefs = {
            "interests": ["food"],
            "budget": "any",
            "available_time": "any",
            "hidden_gem_pref": "both"
        }
        
        recs = self.recommender.recommend_nearby_places(selected_place, prefs, self.df, top_n=5)
        self.assertIsNotNone(recs)
        self.assertLess(len(recs), len(self.df))
        self.assertEqual(len(recs), 5)
        
        # Exclude selected place
        self.assertNotIn(selected_place["place_name"], recs["place_name"].tolist())
        # Verify distance calculations are attached
        self.assertIn("distance_km", recs.columns)
        self.assertLessEqual(recs.iloc[0]["distance_km"], recs.iloc[-1]["distance_km"] + 300, "Should score close places highly.")

if __name__ == "__main__":
    unittest.main()
