"""
Filter cities.json to only include cities with live API data
This ensures users only see cities that actually work (108 cities)
"""

import json
from pathlib import Path

def filter_cities_with_api_data():
    # Paths
    data_dir = Path(__file__).parent.parent / "aqindia" / "server" / "data"
    cities_file = data_dir / "cities.json"
    current_aqi_file = data_dir / "current_aqi.json"
    output_file = data_dir / "cities.json"  # Overwrite original
    backup_file = data_dir / "cities_backup_full_276.json"  # Already created
    
    print("=" * 80)
    print("Filtering Cities to Only Include Those with Live API Data")
    print("=" * 80)
    
    # Load current AQI data (cities with live API)
    with open(current_aqi_file, 'r', encoding='utf-8') as f:
        current_aqi = json.load(f)
    
    api_city_ids = set(city['id'] for city in current_aqi)
    print(f"✅ Cities with live API data: {len(api_city_ids)}")
    
    # Load all cities
    with open(cities_file, 'r', encoding='utf-8') as f:
        all_cities = json.load(f)
    
    print(f"📊 Total cities in cities.json: {len(all_cities)}")
    
    # Filter to only include cities with API data
    filtered_cities = [city for city in all_cities if city['id'] in api_city_ids]
    
    print(f"✅ Cities after filtering: {len(filtered_cities)}")
    print(f"❌ Cities removed (no API data): {len(all_cities) - len(filtered_cities)}")
    print()
    
    # Show some examples of removed cities
    removed_cities = [city for city in all_cities if city['id'] not in api_city_ids]
    if removed_cities:
        print("=" * 80)
        print("Examples of Removed Cities (No API Data):")
        print("=" * 80)
        for city in removed_cities[:10]:
            print(f"  - {city['name']}, {city['state']} (ID: {city['id']})")
        if len(removed_cities) > 10:
            print(f"  ... and {len(removed_cities) - 10} more")
        print()
    
    # Save filtered cities
    print(f"💾 Saving filtered cities to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_cities, f, indent=2, ensure_ascii=False)
    
    # Verify
    with open(output_file, 'r', encoding='utf-8') as f:
        verified = json.load(f)
    
    print(f"✅ Verified: {len(verified)} cities saved")
    print()
    
    # Show final list
    print("=" * 80)
    print(f"✅ Final City List ({len(verified)} cities with Live API Data):")
    print("=" * 80)
    for i, city in enumerate(verified[:20], 1):
        print(f"  {i:3d}. {city['name']}, {city['state']}")
    if len(verified) > 20:
        print(f"  ... and {len(verified) - 20} more cities")
    print()
    
    print("=" * 80)
    print("✅ Filtering Complete!")
    print("=" * 80)
    print()
    print("Summary:")
    print(f"  - Before: {len(all_cities)} cities (some without API data)")
    print(f"  - After: {len(filtered_cities)} cities (all with live API data)")
    print(f"  - Backup: cities_backup_full_276.json (original 276 cities)")
    print()
    print("To revert to original:")
    print(f"  Copy {backup_file} back to cities.json")
    print()

if __name__ == "__main__":
    filter_cities_with_api_data()
