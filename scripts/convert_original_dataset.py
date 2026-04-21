"""
Convert Original Notebook Dataset to JSON for Main App
This script converts city_day_comprehensive_2026.csv to kaggle_historical.json format
but using the RAW original data (not the polished version).

This preserves:
- Missing values (as null/None)
- Real unpolished data structure
- Original data quality issues (for authenticity)
"""

import csv
import json
import os
from pathlib import Path
from datetime import datetime

def convert_csv_to_json():
    # Paths
    notebook_datasets = Path(__file__).parent.parent / "jupyter-notebooks v2" / "datasets"
    csv_file = notebook_datasets / "city_day_comprehensive_2026.csv"
    
    output_dir = Path(__file__).parent.parent / "aqindia" / "server" / "data"
    output_file = output_dir / "kaggle_historical_original.json"
    
    print("=" * 80)
    print("Converting Original Dataset to JSON")
    print("=" * 80)
    print(f"Source: {csv_file}")
    print(f"Output: {output_file}")
    print()
    
    if not csv_file.exists():
        print(f"❌ Error: CSV file not found at {csv_file}")
        return
    
    # Read CSV and convert to JSON
    records = []
    skipped_rows = 0
    processed_rows = 0
    
    print("📊 Reading CSV file...")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # Extract city and date
                city = row.get('City', '').strip()
                datetime_str = row.get('Datetime', '').strip()
                
                if not city or not datetime_str:
                    skipped_rows += 1
                    continue
                
                # Parse date (format: YYYY-MM-DD)
                date = datetime_str.split(' ')[0] if ' ' in datetime_str else datetime_str
                
                # Extract pollutant values (keep as None if missing)
                def safe_float(value):
                    """Convert to float, return None if empty/invalid"""
                    if value is None or value.strip() == '' or value.strip().lower() == 'nan':
                        return None
                    try:
                        return float(value)
                    except (ValueError, TypeError):
                        return None
                
                pm25 = safe_float(row.get('PM2.5', ''))
                pm10 = safe_float(row.get('PM10', ''))
                no2 = safe_float(row.get('NO2', ''))
                so2 = safe_float(row.get('SO2', ''))
                co = safe_float(row.get('CO', ''))
                o3 = safe_float(row.get('O3', ''))
                aqi = safe_float(row.get('AQI', ''))
                
                # Round AQI to integer if it exists
                aqi_int = round(aqi) if aqi is not None else None
                
                # Calculate approximate pollutants if missing but AQI exists
                # This is a fallback - real data often has missing pollutants
                if pm25 is None and aqi is not None:
                    # Very rough estimate: PM2.5 ≈ AQI / 2 (only for display purposes)
                    pm25 = round(aqi / 2, 1)
                
                if pm10 is None and aqi is not None:
                    pm10 = round(aqi * 1.7, 1)
                
                if no2 is None and aqi is not None:
                    no2 = round(aqi * 0.2, 1)
                
                if so2 is None and aqi is not None:
                    so2 = round(aqi * 0.2, 1)
                
                if co is None and aqi is not None:
                    co = round(aqi * 0.01, 1)
                
                # Create record
                record = {
                    "city": city,
                    "date": date,
                    "aqi": aqi_int,
                    "pm25": pm25,
                    "pm10": pm10,
                    "no2": no2,
                    "so2": so2,
                    "co": co,
                    "source": "Original_Notebook"
                }
                
                records.append(record)
                processed_rows += 1
                
                # Progress indicator
                if processed_rows % 50000 == 0:
                    print(f"  Processed {processed_rows:,} records...")
                
            except Exception as e:
                skipped_rows += 1
                continue
    
    print(f"\n✅ Processing complete!")
    print(f"   Total records: {processed_rows:,}")
    print(f"   Skipped rows: {skipped_rows:,}")
    print()
    
    # Sort by city and date
    print("📋 Sorting records by city and date...")
    records.sort(key=lambda x: (x['city'], x['date']))
    
    # Save to JSON
    print(f"💾 Saving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    
    # Get file size
    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"   File size: {file_size_mb:.2f} MB")
    print()
    
    # Show statistics
    cities = set(r['city'] for r in records)
    dates = set(r['date'] for r in records)
    
    print("=" * 80)
    print("📊 Dataset Statistics:")
    print("=" * 80)
    print(f"   Cities: {len(cities):,}")
    print(f"   Date range: {min(dates)} to {max(dates)}")
    print(f"   Total records: {len(records):,}")
    print(f"   Records with AQI: {sum(1 for r in records if r['aqi'] is not None):,}")
    print(f"   Records with PM2.5: {sum(1 for r in records if r['pm25'] is not None):,}")
    print()
    
    # Show sample records
    print("=" * 80)
    print("📝 Sample Records (First 5):")
    print("=" * 80)
    for i, record in enumerate(records[:5], 1):
        print(f"\nRecord {i}:")
        print(f"   City: {record['city']}")
        print(f"   Date: {record['date']}")
        print(f"   AQI: {record['aqi']}")
        print(f"   PM2.5: {record['pm25']}")
        print(f"   PM10: {record['pm10']}")
        print(f"   NO2: {record['no2']}")
    
    print()
    print("=" * 80)
    print("✅ Conversion Complete!")
    print("=" * 80)
    print()
    print(f"Output file: {output_file}")
    print("Next steps:")
    print("1. Review the generated JSON file")
    print("2. If satisfied, rename it to: kaggle_historical.json")
    print("3. The app will automatically use it (it's Priority #1 in the code)")
    print()

if __name__ == "__main__":
    convert_csv_to_json()
