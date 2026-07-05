import os
import sys
import pandas as pd
import json

# Ensure app/ directory is in path for imports
sys.path.append(os.path.abspath('.'))
sys.path.append(os.path.abspath('app'))

# Mock streamlit to prevent import errors when streamlit is not installed
from types import ModuleType
mock_st = ModuleType('streamlit')
mock_st.cache_data = lambda *args, **kwargs: (lambda f: f)
sys.modules['streamlit'] = mock_st

from data_loader import load_rwanda_data

CSV_PATH = "Data/Rwanda_places_catalogue.csv"

# Detailed list of top Kigali restaurants to add
KIGALI_RESTAURANTS = [
    {
        "place_name": "Heaven Restaurant & Boutique Hotel",
        "district": "Nyarugenge",
        "latitude": -1.948211,
        "longitude": 30.063124,
        "category": "Food & Drink",
        "interest_tags": "restaurant, rwandan, local, international",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Meza Malonga",
        "district": "Gasabo",
        "latitude": -1.933314,
        "longitude": 30.155512,
        "category": "Food & Drink",
        "interest_tags": "restaurant, fine_dining, african, fusion",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "9"
    },
    {
        "place_name": "14th Avenue",
        "district": "Gasabo",
        "latitude": -1.939212,
        "longitude": 30.125145,
        "category": "Food & Drink",
        "interest_tags": "restaurant, european, french, fine_dining",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Fusion Restaurant",
        "district": "Nyarugenge",
        "latitude": -1.956814,
        "longitude": 30.063512,
        "category": "Food & Drink",
        "interest_tags": "restaurant, fusion, international, local",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Kurry Kingdom",
        "district": "Gasabo",
        "latitude": -1.942211,
        "longitude": 30.126412,
        "category": "Food & Drink",
        "interest_tags": "restaurant, indian, vegetarian, curry",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Zaaffran",
        "district": "Nyarugenge",
        "latitude": -1.948112,
        "longitude": 30.067412,
        "category": "Food & Drink",
        "interest_tags": "restaurant, indian, vegetarian, curry",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Kōzo Kigali",
        "district": "Gasabo",
        "latitude": -1.934512,
        "longitude": 30.110212,
        "category": "Food & Drink",
        "interest_tags": "restaurant, asian, sushi, fine_dining",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Monmartse",
        "district": "Nyarugenge",
        "latitude": -1.949512,
        "longitude": 30.080112,
        "category": "Food & Drink",
        "interest_tags": "restaurant, korean, asian, bibimbap",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Fayrouz Restaurant",
        "district": "Gasabo",
        "latitude": -1.943112,
        "longitude": 30.108612,
        "category": "Food & Drink",
        "interest_tags": "restaurant, yemeni, middle_eastern",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Efes Cafe Bistro",
        "district": "Gasabo",
        "latitude": -1.942412,
        "longitude": 30.129812,
        "category": "Food & Drink",
        "interest_tags": "restaurant, turkish, mediterranean, cafe",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Mixed",
        "popularity_level": "Medium",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "La Fourchette",
        "district": "Gasabo",
        "latitude": -1.941912,
        "longitude": 30.128712,
        "category": "Food & Drink",
        "interest_tags": "restaurant, french, international",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Inka Steakhouse",
        "district": "Gasabo",
        "latitude": -1.933914,
        "longitude": 30.113612,
        "category": "Food & Drink",
        "interest_tags": "restaurant, steakhouse, beef, local",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Choma’d Bar & Grill",
        "district": "Gasabo",
        "latitude": -1.934114,
        "longitude": 30.109012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, barbecue, grill, burgers",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Mixed",
        "popularity_level": "High",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Mr. Chips",
        "district": "Nyarugenge",
        "latitude": -1.946314,
        "longitude": 30.092112,
        "category": "Food & Drink",
        "interest_tags": "restaurant, casual, fast_food, burgers",
        "cost_level": "Budget",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "4"
    },
    {
        "place_name": "Meze Fresh",
        "district": "Nyarugenge",
        "latitude": -1.945514,
        "longitude": 30.089012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, mexican, casual, burritos",
        "cost_level": "Budget",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Baso Patissier",
        "district": "Nyarugenge",
        "latitude": -1.952814,
        "longitude": 30.057412,
        "category": "Café",
        "interest_tags": "cafe, bakery, dessert, burgers",
        "cost_level": "Moderate",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Inzora Rooftop Café",
        "district": "Nyarugenge",
        "latitude": -1.946714,
        "longitude": 30.060912,
        "category": "Café",
        "interest_tags": "cafe, coffee, local, viewpoint",
        "cost_level": "Budget",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Shokola Café",
        "district": "Gasabo",
        "latitude": -1.938314,
        "longitude": 30.093312,
        "category": "Café",
        "interest_tags": "cafe, coffee, library, viewpoint",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Sole Luna",
        "district": "Gasabo",
        "latitude": -1.948014,
        "longitude": 30.123812,
        "category": "Food & Drink",
        "interest_tags": "restaurant, italian, pizza, pasta",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Mixed",
        "popularity_level": "High",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Pili Pili",
        "district": "Gasabo",
        "latitude": -1.936014,
        "longitude": 30.132212,
        "category": "Food & Drink",
        "interest_tags": "restaurant, lounge, grill, barbecue",
        "cost_level": "Moderate",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Soy Asian Table",
        "district": "Gasabo",
        "latitude": -1.942514,
        "longitude": 30.129812,
        "category": "Food & Drink",
        "interest_tags": "restaurant, asian, international",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Zen Restaurant",
        "district": "Gasabo",
        "latitude": -1.926614,
        "longitude": 30.094712,
        "category": "Food & Drink",
        "interest_tags": "restaurant, chinese, japanese, sushi",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Brachetto Restaurant",
        "district": "Gasabo",
        "latitude": -1.942414,
        "longitude": 30.129812,
        "category": "Food & Drink",
        "interest_tags": "restaurant, italian, fine_dining",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "Kiseki Authentic Japanese Restaurant",
        "district": "Nyarugenge",
        "latitude": -1.956214,
        "longitude": 30.062612,
        "category": "Food & Drink",
        "interest_tags": "restaurant, japanese, sushi",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Java House UTC",
        "district": "Nyarugenge",
        "latitude": -1.946114,
        "longitude": 30.061212,
        "category": "Café",
        "interest_tags": "cafe, coffee, international, burgers",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Java House Heights",
        "district": "Gasabo",
        "latitude": -1.952314,
        "longitude": 30.099012,
        "category": "Café",
        "interest_tags": "cafe, coffee, international, burgers",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Camellia UTC",
        "district": "Nyarugenge",
        "latitude": -1.945014,
        "longitude": 30.089012,
        "category": "Café",
        "interest_tags": "cafe, coffee, local, international",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Camellia KBC",
        "district": "Gasabo",
        "latitude": -1.942514,
        "longitude": 30.129812,
        "category": "Café",
        "interest_tags": "cafe, coffee, local, international",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Riders Lounge",
        "district": "Gasabo",
        "latitude": -1.942314,
        "longitude": 30.130012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, lounge, international, bar",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Mixed",
        "popularity_level": "High",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Question Coffee Gishushu",
        "district": "Gasabo",
        "latitude": -1.952914,
        "longitude": 30.096612,
        "category": "Café",
        "interest_tags": "cafe, coffee, local, explore",
        "cost_level": "Budget",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "High",
        "hidden_gem_score": "8"
    },
    {
        "place_name": "L'Épicurien",
        "district": "Gasabo",
        "latitude": -1.945314,
        "longitude": 30.103012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, french, fine_dining",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "7"
    },
    {
        "place_name": "Soko Restaurant",
        "district": "Nyarugenge",
        "latitude": -1.955514,
        "longitude": 30.060112,
        "category": "Food & Drink",
        "interest_tags": "restaurant, international, breakfast",
        "cost_level": "Expensive",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Turambe Shoppe",
        "district": "Gasabo",
        "latitude": -1.942114,
        "longitude": 30.126012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, salad, healthy, vegetarian",
        "cost_level": "Moderate",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "6"
    },
    {
        "place_name": "Delizia Italiana",
        "district": "Gasabo",
        "latitude": -1.943314,
        "longitude": 30.124812,
        "category": "Café",
        "interest_tags": "cafe, ice_cream, dessert, italian",
        "cost_level": "Moderate",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "High",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Choose Kigali",
        "district": "Gasabo",
        "latitude": -1.921114,
        "longitude": 30.113012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, fine_dining, art, viewpoint",
        "cost_level": "Expensive",
        "estimated_duration": "2-3 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "9"
    },
    {
        "place_name": "Cocobean",
        "district": "Nyarugenge",
        "latitude": -1.944114,
        "longitude": 30.062012,
        "category": "Food & Drink",
        "interest_tags": "restaurant, rwandan, local, nightclub",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Outdoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Shami Kitchen",
        "district": "Kicukiro",
        "latitude": -1.968814,
        "longitude": 30.119812,
        "category": "Food & Drink",
        "interest_tags": "restaurant, local, buffet",
        "cost_level": "Budget",
        "estimated_duration": "30-60 mins",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "5"
    },
    {
        "place_name": "Jollof House",
        "district": "Kicukiro",
        "latitude": -1.961214,
        "longitude": 30.114412,
        "category": "Food & Drink",
        "interest_tags": "restaurant, nigerian, west_african, spicy",
        "cost_level": "Moderate",
        "estimated_duration": "1-2 hours",
        "indoor_outdoor": "Indoor",
        "popularity_level": "Medium",
        "hidden_gem_score": "7"
    }
]

def update():
    # Read existing catalogue
    df = pd.read_csv(CSV_PATH, dtype=str)
    print(f"Original catalogue size: {len(df)}")

    # Clean existing place names for accurate matching
    existing_names = set(df["place_name"].str.strip().str.lower().tolist())

    added_count = 0
    new_rows = []
    
    for r in KIGALI_RESTAURANTS:
        name = r["place_name"].strip()
        if name.lower() in existing_names:
            print(f"Skipping duplicate: {name}")
            continue
            
        # Create a new unique place_id
        place_id = f"inzira_rest_{abs(hash(name)) % 1000000000}"
        
        # Build CSV row matching column order
        row = {
            "place_id": place_id,
            "place_name": name,
            "district": r["district"],
            "province_or_city": "Kigali City",
            "latitude": str(r["latitude"]),
            "longitude": str(r["longitude"]),
            "category": r["category"],
            "interest_tags": r["interest_tags"],
            "cost_level": r["cost_level"],
            "estimated_duration": r["estimated_duration"],
            "indoor_outdoor": r["indoor_outdoor"],
            "contact": "unknown",
            "review_count": "unknown",
            "popularity_level": r["popularity_level"],
            "hidden_gem_score": r["hidden_gem_score"],
            "source": "Kigali Culinary Guide",
            "last_updated": "2026-06-11"
        }
        new_rows.append(row)
        added_count += 1
        existing_names.add(name.lower())

    if new_rows:
        new_df = pd.DataFrame(new_rows)
        # Concatenate keeping order
        updated_df = pd.concat([df, new_df], ignore_index=True)
        # Write back to CSV
        updated_df.to_csv(CSV_PATH, index=False)
        print(f"Added {added_count} restaurants to {CSV_PATH}")
    else:
        print("No new restaurants added.")

    # Now load and normalize all data using data_loader.py logic
    print("Normalizing dataset and generating JSON files...")
    norm_df = load_rwanda_data()
    
    # Reset index and convert to dict list
    places_list = norm_df.to_dict(orient='records')
    
    # Save to Data/rwanda_places.json and web/public/rwanda_places.json
    for out_path in ["Data/rwanda_places.json", "web/public/rwanda_places.json"]:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(places_list, f, ensure_ascii=False)
        print(f"Saved normalized data to {out_path} ({len(places_list)} records)")

if __name__ == "__main__":
    update()
