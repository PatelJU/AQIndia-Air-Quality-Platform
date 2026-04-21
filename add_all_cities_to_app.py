"""
Add all cities from Jupyter Notebook dataset to main app
Generates cities.json with all 302 cities from city_day_cleaned.csv
"""
import pandas as pd
import json

# Load your trained dataset
df = pd.read_csv('./jupyter-notebooks v2/datasets/city_day_cleaned.csv')

# Load existing cities (to preserve coordinates for cities already in app)
with open('./aqindia/server/data/cities.json', 'r') as f:
    existing_cities = json.load(f)

# Create lookup for existing cities
existing_lookup = {c['name'].lower(): c for c in existing_cities}

# Get unique cities from your dataset
cities_in_dataset = df.groupby(['City', 'State', 'Region']).agg(
    record_count=('AQI', 'count'),
    avg_aqi=('AQI', 'mean'),
    min_date=('Datetime', 'min'),
    max_date=('Datetime', 'max')
).reset_index()

print(f"Found {len(cities_in_dataset)} cities in dataset")

# Generate new cities list
new_cities = []
for _, row in cities_in_dataset.iterrows():
    city_name = row['City']
    state = row['State']
    region = row['Region']
    avg_aqi = int(row['avg_aqi'])
    record_count = int(row['record_count'])
    
    # Check if city exists in old data (to get coordinates)
    if city_name.lower() in existing_lookup:
        # Use existing coordinates
        old_city = existing_lookup[city_name.lower()]
        new_cities.append({
            "id": old_city['id'],
            "name": city_name,
            "state": state,
            "region": region,
            "lat": old_city['lat'],
            "lon": old_city['lon'],
            "base_aqi": avg_aqi,
            "population": old_city.get('population', 0),
            "type": old_city.get('type', 'city'),
            "record_count": record_count
        })
    else:
        # Generate ID from city name
        city_id = city_name.lower()
        city_id = city_id.replace(' ', '-').replace('(', '').replace(')', '').replace(',', '').replace('&', 'and')
        
        # Try to get approximate coordinates from state capital
        # This is a simplified approach - you can refine with geopy later
        state_capitals = {
            'Andhra Pradesh': (15.9129, 79.7400),
            'Arunachal Pradesh': (28.2180, 94.7650),
            'Assam': (26.2006, 92.9376),
            'Bihar': (25.0961, 85.3131),
            'Chhattisgarh': (21.2787, 81.8661),
            'Delhi': (28.6139, 77.2090),
            'Goa': (15.2993, 74.1240),
            'Gujarat': (23.0225, 72.5714),
            'Haryana': (28.4595, 77.0266),
            'Himachal Pradesh': (31.1048, 77.1734),
            'Jharkhand': (23.6102, 85.2799),
            'Karnataka': (12.9716, 77.5946),
            'Kerala': (8.5241, 76.9366),
            'Madhya Pradesh': (23.2599, 77.4126),
            'Maharashtra': (19.0760, 72.8777),
            'Manipur': (24.8170, 93.9368),
            'Meghalaya': (25.5788, 91.8933),
            'Mizoram': (23.7272, 92.7176),
            'Nagaland': (26.1584, 94.5624),
            'Odisha': (20.9517, 85.0985),
            'Punjab': (30.7333, 76.7794),
            'Rajasthan': (26.9124, 75.7873),
            'Sikkim': (27.5330, 88.5122),
            'Tamil Nadu': (13.0827, 80.2707),
            'Telangana': (17.3850, 78.4867),
            'Tripura': (23.8315, 91.2868),
            'Uttar Pradesh': (26.8467, 80.9462),
            'Uttarakhand': (30.0668, 79.0193),
            'West Bengal': (22.9868, 87.8550),
        }
        
        # Default to state capital coordinates
        coords = state_capitals.get(state, (20.5937, 78.9629))  # India center as fallback
        
        # Determine city type based on AQI and records
        if avg_aqi > 200 or record_count > 1000:
            city_type = "metro"
        elif avg_aqi > 100:
            city_type = "city"
        else:
            city_type = "town"
        
        new_cities.append({
            "id": city_id,
            "name": city_name,
            "state": state,
            "region": region,
            "lat": round(coords[0] + (hash(city_name) % 100) / 1000, 4),  # Small variation
            "lon": round(coords[1] + (hash(city_name + "lon") % 100) / 1000, 4),
            "base_aqi": avg_aqi,
            "population": 0,  # Can be filled later
            "type": city_type,
            "record_count": record_count
        })

# Sort by base_aqi (highest pollution first)
new_cities.sort(key=lambda x: x['base_aqi'], reverse=True)

print(f"\nGenerated {len(new_cities)} cities")
print(f"  - Cities from existing app: {sum(1 for c in new_cities if c['id'] in [ec['id'] for ec in existing_cities])}")
print(f"  - New cities added: {sum(1 for c in new_cities if c['id'] not in [ec['id'] for ec in existing_cities])}")

# Save to cities.json
with open('./aqindia/server/data/cities.json', 'w') as f:
    json.dump(new_cities, f, indent=2, ensure_ascii=False)

print(f"\n✓ Saved to aqindia/server/data/cities.json")
print(f"✓ Top 10 most polluted cities:")
for i, city in enumerate(new_cities[:10], 1):
    print(f"  {i}. {city['name']}, {city['state']} - AQI: {city['base_aqi']}")

# Also save a summary
summary = {
    "total_cities": len(new_cities),
    "total_records": int(df.shape[0]),
    "date_range": f"{df['Datetime'].min()} to {df['Datetime'].max()}",
    "regions": df['Region'].unique().tolist(),
    "states": df['State'].nunique(),
    "avg_aqi_national": round(df['AQI'].mean(), 1)
}

with open('./aqindia/server/data/city_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print(f"\n✓ City summary saved")
print(f"  - Total cities: {summary['total_cities']}")
print(f"  - Total records: {summary['total_records']:,}")
print(f"  - States: {summary['states']}")
print(f"  - National avg AQI: {summary['avg_aqi_national']}")
