// Help content for all pages in AQIndia
// Each page has multiple sections with easy-to-understand explanations

export const helpContent = {
  home: {
    title: "Air Quality Overview Guide",
    sections: [
      {
        heading: "What is AQI (Air Quality Index)?",
        content: "The Air Quality Index (AQI) is a number from 0 to 500 that tells you how clean or polluted the air is. Think of it like a report card for air quality. A lower number means cleaner air, while a higher number means more pollution. The AQI is calculated based on major pollutants like PM2.5 (tiny particles), PM10 (larger particles), NO₂ (nitrogen dioxide), SO₂ (sulfur dioxide), O₃ (ozone), and CO (carbon monoxide).",
        tips: [
          "0-50 (Green): Good - Air quality is satisfactory, little to no risk",
          "51-100 (Yellow): Moderate - Acceptable quality, moderate risk for sensitive people",
          "101-200 (Orange): Poor - Sensitive groups may experience health effects",
          "201-300 (Red): Very Poor - Everyone may experience health effects",
          "301-500 (Maroon): Severe - Health emergency, avoid outdoor activities"
        ],
        example: "If Delhi shows AQI 185 (Orange/Poor), it means the air quality is unhealthy for sensitive groups like children, elderly, and people with asthma. They should limit outdoor activities."
      },
      {
        heading: "Understanding the City Cards",
        content: "Each card represents a city and shows its current air quality. The large number is the AQI value, colored based on severity. Below it, you'll see the category name (Good, Moderate, Poor, etc.). The mini sparkline chart shows recent AQI trends - if it's going up, pollution is increasing; if going down, air is getting cleaner. Wind speed and temperature are also shown because weather affects pollution levels.",
        tips: [
          "Green numbers = Good air quality (safe for everyone)",
          "Red/Maroon numbers = Dangerous air quality (stay indoors)",
          "Upward arrow (↑) = Pollution is getting worse",
          "Downward arrow (↓) = Air quality is improving",
          "Wind helps disperse pollution - higher wind = better air quality"
        ],
        example: "A card showing 'Delhi - AQI 185 ↑' with orange color means Delhi currently has poor air quality (185), and the upward arrow indicates it's getting worse compared to recent readings."
      },
      {
        heading: "KPI Cards (Key Performance Indicators)",
        content: "The four large cards at the top show important summary statistics: National Average AQI (average pollution across all 108 cities), Best City (city with cleanest air right now), Worst City (city with most polluted air), and Severe Cities (count of cities with AQI above 200, which is unhealthy for everyone).",
        tips: [
          "National Avg gives you an overall sense of India's air quality today",
          "Best/Worst cities help identify extremes",
          "Severe Cities count shows how widespread the pollution problem is",
          "These numbers update in real-time from live data sources"
        ],
        example: "If 'Severe Cities: 15', it means 15 out of 108 monitored cities currently have AQI above 200, indicating serious pollution problems in those areas."
      },
      {
        heading: "AQI Distribution Pie Chart",
        content: "The donut chart shows how many cities fall into each AQI category. Each colored segment represents a category (Good=green, Moderate=yellow, Poor=orange, Very Poor=red, Severe=maroon). The numbers beside each color tell you exactly how many cities are in that category. This helps you quickly understand the overall air quality situation across India.",
        tips: [
          "Larger green segment = Most cities have good air quality",
          "Larger red/maroon segments = Widespread severe pollution",
          "Compare segment sizes to see which category dominates",
          "This is a snapshot of current conditions across all 108 cities"
        ],
        example: "If the chart shows Good: 25, Moderate: 40, Poor: 30, Very Poor: 10, Severe: 3, it means most cities (40) have moderate air quality, but 43 cities combined have poor to severe pollution."
      },
      {
        heading: "Filters and Search",
        content: "You can filter cities by region (North, South, East, West, Central India), by AQI category (only show 'Poor' cities, for example), or by typing a city name in the search box. You can also sort cities by AQI (worst first or best first), alphabetically, or by region. The grid/list view toggle lets you choose how to display the city cards.",
        tips: [
          "Use search to quickly find your city",
          "Filter by region to compare cities in the same area",
          "Sort by 'Worst First' to see most polluted cities immediately",
          "Combine filters (e.g., North region + Poor category) for detailed views"
        ],
        example: "Searching 'Mumbai' will show only Mumbai's card. Filtering by 'North' region will show only North Indian cities like Delhi, Jaipur, Lucknow, etc."
      }
    ]
  },

  cityDetail: {
    title: "City Detail Page Guide",
    sections: [
      {
        heading: "Live AQI Gauge and Pollutant Breakdown",
        content: "The circular gauge at the top shows the current AQI with a needle pointing to the severity level. The color changes based on AQI (green=good, red=severe). Below the gauge, you'll see individual pollutant levels (PM2.5, PM10, NO₂, SO₂, O₃, CO) with horizontal bars showing how close each is to dangerous levels. Each pollutant has a different maximum safe limit.",
        tips: [
          "PM2.5 is the most harmful - tiny particles that enter your lungs",
          "PM2.5 safe limit: 60 µg/m³ (Indian standard), PM10: 100 µg/m³",
          "NO₂ comes from vehicle exhaust, SO₂ from industrial emissions",
          "O₃ (ozone) is higher in summer due to sunlight reactions",
          "CO (carbon monoxide) is from incomplete combustion"
        ],
        example: "If PM2.5 shows 85 µg/m³ with a bar filled 70% in orange, it means PM2.5 is 70% of the way to the dangerous threshold (120 µg/m³ for Poor category)."
      },
      {
        heading: "Historical AQI Trend Chart (Area Chart)",
        content: "This line chart shows how AQI has changed over the past 30 days (or your selected time period). The filled area under the line helps you see patterns - peaks mean high pollution days, valleys mean cleaner air. You can spot trends: is pollution getting worse or better over time? Look for weekly patterns (often worse on weekdays due to traffic) or sudden spikes (might be due to festivals, crop burning, or weather changes).",
        tips: [
          "Upward slope = pollution increasing over time",
          "Downward slope = air quality improving",
          "Sudden spikes might indicate events like Diwali (firecrackers)",
          "Seasonal patterns: Winter (Oct-Feb) usually worse, Monsoon (Jun-Sep) better"
        ],
        example: "If the chart shows AQI rising from 120 to 180 over 2 weeks, it means pollution is steadily worsening - possibly due to changing weather patterns or increased emissions."
      },
      {
        heading: "Radar Chart (Pollutant Profile)",
        content: "The radar (spider) chart shows the levels of all 6 major pollutants on one chart. Each spoke represents a different pollutant. The further out the colored area extends on a spoke, the higher that pollutant's level. This helps you identify which pollutants are the main contributors to poor air quality in this city. Different cities have different pollutant profiles based on their industries, traffic, and geography.",
        tips: [
          "Larger area on PM2.5 spoke = particulate matter is the main problem",
          "Larger area on NO₂ spoke = vehicle emissions are significant",
          "Larger area on SO₂ spoke = industrial pollution is high",
          "Compare shapes between cities to see different pollution sources"
        ],
        example: "If Delhi's radar shows large PM2.5 and NO₂ areas but small SO₂, it means traffic and construction dust are bigger problems than industrial emissions."
      },
      {
        heading: "Seasonal Decomposition Chart",
        content: "This chart breaks down the AQI pattern into three components: Trend (long-term direction - is pollution getting better or worse over months?), Seasonal (repeating patterns - like higher pollution every winter), and Residual (random fluctuations that don't follow a pattern - like sudden spikes from unusual events). This helps scientists understand what's driving pollution changes.",
        tips: [
          "Trend line going up = long-term pollution increase (bad)",
          "Trend line going down = long-term improvement (good)",
          "Seasonal pattern shows predictable yearly cycles",
          "Large residuals mean unpredictable events affecting air quality"
        ],
        example: "If the Trend component shows a gradual decrease from 200 to 150 over 12 months, it means the city's air quality is slowly improving long-term, even if there are seasonal spikes."
      },
      {
        heading: "Mann-Kendall Trend Analysis",
        content: "This is a statistical test that determines if there's a consistent increasing or decreasing trend in air quality over time. Instead of just looking at the chart, this test mathematically confirms whether the trend is real or just random variation. The 'Tau' value ranges from -1 to +1: negative means improving air quality, positive means worsening. The 'p-value' tells you how confident we are (p < 0.05 means the trend is statistically significant, not just random chance).",
        tips: [
          "Tau > 0 (positive) = pollution is increasing (bad trend)",
          "Tau < 0 (negative) = pollution is decreasing (good trend)",
          "p-value < 0.05 = trend is real and statistically significant",
          "p-value > 0.05 = trend might just be random noise"
        ],
        example: "If Tau = -0.35 and p-value = 0.002, it means there's a moderate decreasing trend (improving air quality) and we're 99.8% confident this is a real trend, not random chance."
      }
    ]
  },

  forecast: {
    title: "AQI Forecast Guide",
    sections: [
      {
        heading: "What is AQI Forecasting?",
        content: "AQI forecasting uses Machine Learning (ML) models to predict future air quality based on historical patterns, weather data, seasonal trends, and pollution levels. Just like weather forecasts tell you if it will rain tomorrow, AQI forecasts tell you if pollution will be high or low in coming days. This helps you plan activities - if a high pollution day is predicted, you can stay indoors or wear a mask.",
        tips: [
          "Forecasts are more accurate for near-term (1-3 days)",
          "Long-term forecasts (30+ days) show general trends, not exact values",
          "Models learn from years of historical data to make predictions",
          "Forecasts help you prepare for upcoming pollution episodes"
        ],
        example: "If the forecast predicts AQI 250 (Very Poor) in 3 days, you can plan to work from home, buy an air purifier, or limit outdoor exercise during that period."
      },
      {
        heading: "Understanding the Forecast Chart",
        content: "The main chart shows predicted AQI values for future dates. The solid line is the predicted AQI, while the shaded areas show 'confidence intervals' - a range where the actual AQI is likely to fall. The narrower shaded area (80% confidence) means we're 80% sure the real AQI will be in that range. The wider shaded area (95% confidence) means we're 95% sure. As you go further into the future, these ranges get wider because predictions become less certain.",
        tips: [
          "Solid line = predicted AQI value for each day",
          "Narrow shaded band = 80% confidence range (more certain)",
          "Wide shaded band = 95% confidence range (almost certain)",
          "Wider bands in the future = less certainty about distant predictions"
        ],
        example: "If Day 5 shows predicted AQI 180 with 80% range [160, 200] and 95% range [140, 220], it means there's an 80% chance the real AQI will be between 160-200, and 95% chance it'll be between 140-220."
      },
      {
        heading: "Forecast Horizons (Time Periods)",
        content: "You can choose different forecast periods: 24 Hours (very short-term, most accurate), 72 Hours (3 days), 7 Days (1 week), 30 Days (1 month), Quarterly (3 months), or Annual (1 year). Shorter forecasts use recent data and are highly accurate. Longer forecasts show seasonal trends and general patterns but with more uncertainty. Different ML models work better for different time horizons.",
        tips: [
          "24h-72h: Best for daily planning (most accurate)",
          "7d-30d: Good for weekly/monthly planning",
          "Quarterly-Annual: Shows seasonal trends, not exact daily values",
          "Accuracy decreases as you forecast further into the future"
        ],
        example: "A 24-hour forecast might predict AQI 145 ± 10 (very precise), while a 30-day forecast might predict AQI 180 ± 50 (less precise but shows general trend)."
      },
      {
        heading: "ML Models Used for Forecasting",
        content: "AQIndia uses 5 different ML models, each with strengths: XGBoost (fast and accurate for short-term), Random Forest (robust, handles complex patterns), LSTM Neural Network (deep learning, good at time sequences), Prophet (Facebook's model, excellent for seasonality), and Ensemble (combines all models for best overall performance). The Ensemble model usually performs best because it combines the strengths of all models.",
        tips: [
          "Ensemble = combination of all models (recommended, most reliable)",
          "XGBoost = great for short-term predictions (1-7 days)",
          "LSTM = deep learning, captures complex temporal patterns",
          "Prophet = excellent for seasonal/yearly patterns"
        ],
        example: "If you're checking next week's forecast, use Ensemble or XGBoost. If you want to see winter pollution trends 6 months ahead, use Prophet or Ensemble."
      },
      {
        heading: "Festival Impact Warnings",
        content: "The forecast page shows upcoming festivals (like Diwali or Holi) that significantly impact air quality. During Diwali, firecrackers can increase AQI by 200-400 points in a single night. The forecast accounts for these events and may show warnings. Historical data shows Diwali typically increases PM2.5 by 3-5x normal levels for 2-3 days. This helps you prepare for predictable pollution spikes.",
        tips: [
          "Diwali can increase AQI by 200-400 points in hours",
          "PM2.5 levels often 3-5x higher during Diwali",
          "Effects last 2-3 days after the festival",
          "Plan indoor activities and stock up on masks before festivals"
        ],
        example: "If Diwali is in 5 days and the forecast shows AQI jumping from 120 to 380 on the festival date, you should prepare by staying indoors, closing windows, and using air purifiers."
      }
    ]
  },

  analytics: {
    title: "Analytics & Statistics Guide",
    sections: [
      {
        heading: "Correlation Heatmap",
        content: "A correlation heatmap shows how different pollutants are related to each other. Each cell shows a number from -1 to +1. A value of +1 means two pollutants always increase together (perfectly correlated), 0 means no relationship, and -1 means when one goes up, the other goes down. For example, PM2.5 and PM10 usually have high positive correlation (0.8-0.9) because they both come from similar sources like dust and combustion. This helps identify pollution sources.",
        tips: [
          "Red cells (positive values) = pollutants increase together",
          "Blue cells (negative values) = one goes up, other goes down",
          "Values near 0 = no relationship between pollutants",
          "High PM2.5-PM10 correlation suggests similar pollution sources"
        ],
        example: "If PM2.5 and NO₂ have correlation 0.75 (strong red cell), it suggests vehicle emissions contribute significantly to both, since NO₂ primarily comes from traffic."
      },
      {
        heading: "Mann-Kendall Trend Test Results",
        content: "This statistical test determines if air quality is getting better or worse over time for each city. Unlike just looking at a chart, this test mathematically proves whether a trend exists. The 'Tau' value ranges from -1 to +1: negative Tau means improving air quality (AQI decreasing), positive Tau means worsening air quality (AQI increasing). The 'p-value' tells you how confident we are - if p < 0.05, the trend is statistically significant (real, not random chance).",
        tips: [
          "Tau > 0 = pollution increasing (worsening trend)",
          "Tau < 0 = pollution decreasing (improving trend)",
          "p-value < 0.05 = trend is real and significant",
          "Cities with high positive Tau need urgent pollution control"
        ],
        example: "If Delhi shows Tau = +0.42 with p-value = 0.001, it means pollution is moderately increasing over time, and we're 99.9% confident this is a real trend, not random fluctuation."
      },
      {
        heading: "Source Apportionment (Where Pollution Comes From)",
        content: "Source apportionment uses a statistical method called NMF (Non-negative Matrix Factorization) to estimate what percentage of pollution comes from different sources: Vehicular (cars, trucks, bikes), Industrial (factories, power plants), Biomass (crop burning, wood smoke, garbage burning), and Dust (construction, road dust, natural dust). This helps policymakers target the biggest pollution sources. The percentages add up to 100% for each city.",
        tips: [
          "Vehicular = traffic-related pollution (exhaust, brake wear)",
          "Industrial = factory emissions, power plants",
          "Biomass = crop burning, wood smoke, waste burning",
          "Dust = construction, road dust, desert dust"
        ],
        example: "If a city shows Vehicular: 45%, Industrial: 25%, Biomass: 20%, Dust: 10%, it means traffic is the biggest pollution source, so improving public transport would have the largest impact."
      },
      {
        heading: "Festival Impact Analysis",
        content: "This analysis compares air quality before, during, and after major festivals (Diwali and Holi) to measure their impact. For each city, it shows average AQI in the 7 days before the festival, during the festival period, and 7 days after. Statistical tests (t-test) determine if the increase is significant. The p-value tells you if the festival effect is real (p < 0.05 means statistically significant increase). This quantifies how much festivals contribute to pollution.",
        tips: [
          "Diwali typically increases AQI by 100-300 points",
          "Holi increases particulate matter from colored powders",
          "Effects usually last 2-3 days after the festival",
          "Compare 'before' vs 'during' to see festival impact"
        ],
        example: "If Delhi shows Before: 180, During: 420, After: 220, it means Diwali caused a 240-point AQI spike (133% increase), with effects lasting several days after."
      },
      {
        heading: "Scatter Plot (PM2.5 vs AQI Relationship)",
        content: "This scatter plot shows the relationship between PM2.5 levels and overall AQI. Each dot represents one day's measurement. If dots form an upward-sloping pattern, it means higher PM2.5 leads to higher AQI (which is expected since PM2.5 is a major AQI component). The tightness of the pattern shows how strongly they're related. This helps validate that PM2.5 is indeed a dominant pollutant in the city.",
        tips: [
          "Upward pattern = PM2.5 strongly affects overall AQI",
          "Tight cluster = strong, consistent relationship",
          "Scattered dots = other pollutants also significantly affect AQI",
          "Outliers (far from pattern) = unusual days worth investigating"
        ],
        example: "If dots form a tight upward line, it means PM2.5 is the main driver of AQI in this city. Reducing PM2.5 would directly improve overall air quality."
      }
    ]
  },

  mlPredictions: {
    title: "Machine Learning Predictions Guide",
    sections: [
      {
        heading: "What are ML Models Doing Here?",
        content: "Machine Learning (ML) models analyze years of historical air quality data, weather patterns, seasonal trends, and pollution measurements to learn complex patterns. Once trained, they can predict future AQI values. Think of it like teaching a student with 5 years of exam papers - after studying patterns, the student can predict what might appear in future exams. Here, models learn from historical AQI data to forecast future pollution levels with high accuracy.",
        tips: [
          "Models trained on 2020-2024 historical data",
          "5 different models used, each with unique strengths",
          "Ensemble model combines all models for best accuracy",
          "R² score of 0.98 means 98% accuracy in predictions"
        ],
        example: "Just like weather apps predict rain by analyzing past weather patterns, AQIndia predicts pollution by analyzing historical air quality, temperature, humidity, wind, and seasonal data."
      },
      {
        heading: "Understanding Model Metrics (RMSE, MAE, R², MAPE)",
        content: "These numbers tell you how accurate each ML model is:\n\n• RMSE (Root Mean Square Error): Average prediction error. Lower is better. RMSE of 12 means predictions are typically off by ±12 AQI points.\n\n• MAE (Mean Absolute Error): Average absolute difference between predicted and actual AQI. Lower is better. MAE of 8 means average error is 8 AQI points.\n\n• R² (R-squared): How well the model explains the data, from 0 to 1. R² of 0.98 means the model explains 98% of AQI variation (excellent!).\n\n• MAPE (Mean Absolute Percentage Error): Average error as a percentage. Lower is better. MAPE of 7% means predictions are 93% accurate.",
        tips: [
          "RMSE: Lower = better (penalizes large errors more)",
          "MAE: Lower = better (average error magnitude)",
          "R²: Higher = better (0.90+ is excellent)",
          "MAPE: Lower = better (<10% is very good)"
        ],
        example: "If Ensemble model shows RMSE=11.9, MAE=8.1, R²=0.98, MAPE=7.2%, it means predictions are typically within ±12 AQI points, explain 98% of variation, and are 92.8% accurate."
      },
      {
        heading: "SHAP Values (Why Did the Model Predict This?)",
        content: "SHAP (SHapley Additive exPlanations) is a technique that explains WHY an ML model made a particular prediction. It shows which features (inputs) contributed most to the prediction and in which direction. For example, if the model predicts high AQI, SHAP might show that 'PM2.5 level yesterday' contributed +40 points, 'low wind speed' contributed +15 points, and 'high humidity' contributed -10 points. This makes AI predictions transparent and trustworthy.",
        tips: [
          "Higher SHAP value = feature has more influence on prediction",
          "Positive SHAP = feature increases predicted AQI",
          "Negative SHAP = feature decreases predicted AQI",
          "Top features are usually recent PM2.5, temperature, season"
        ],
        example: "If SHAP shows 'pm25_lag_1' (yesterday's PM2.5) has importance 0.35, it means yesterday's pollution level is the strongest predictor of today's AQI - pollution tends to persist day-to-day."
      },
      {
        heading: "SHAP Beeswarm Plot (Feature Importance Visualization)",
        content: "The beeswarm plot shows all features ranked by importance (top to bottom). Each dot is one prediction. The horizontal position shows how much that feature affected the prediction (left = decreases AQI, right = increases AQI). Color shows the feature's value (red = high value, blue = low value). For example, if 'pm25_lag_1' dots are mostly on the right side and red, it means high yesterday PM2.5 strongly increases today's AQI prediction.",
        tips: [
          "Features at top = most important for predictions",
          "Dots on right side = feature increases predicted AQI",
          "Red dots = high feature values, Blue = low values",
          "Wide spread = feature has variable impact on predictions"
        ],
        example: "If 'temperature' dots are mostly on the left and blue, it means low temperatures increase AQI (winter pollution), while high temperatures decrease it (summer dispersion)."
      },
      {
        heading: "Model Comparison (Which Model is Best?)",
        content: "The comparison table shows all 5 ML models side-by-side with their accuracy metrics. You can see which model performs best overall and which might be better for specific use cases. Generally, the Ensemble model (combining all models) performs best, but individual models might excel in certain scenarios. For example, Prophet might be better for long-term seasonal forecasts, while XGBoost excels at short-term predictions.",
        tips: [
          "Ensemble = best overall (combines all models)",
          "XGBoost = best for short-term (1-7 days)",
          "Prophet = best for seasonal/yearly patterns",
          "LSTM = best for complex temporal patterns"
        ],
        example: "If you need tomorrow's forecast, XGBoost (RMSE 12.3) might be slightly better than Prophet (RMSE 15.2). But for 6-month seasonal trends, Prophet would be more reliable."
      }
    ]
  },

  comparison: {
    title: "City Comparison Guide",
    sections: [
      {
        heading: "Comparing Multiple Cities Side-by-Side",
        content: "This page lets you compare air quality across up to 5 cities simultaneously. You can see current AQI, pollutant levels, and historical trends for all selected cities on the same charts. This helps answer questions like: 'Is Delhi more polluted than Mumbai?' or 'Which city has the best air quality in North India?' By overlaying multiple cities, you can spot regional patterns and identify which areas need more pollution control measures.",
        tips: [
          "Select 2-5 cities to compare (more cities = more crowded chart)",
          "Each city gets a unique color for easy identification",
          "Compare AQI values, pollutant levels, and trends",
          "Look for regional patterns (e.g., all North Indian cities high)"
        ],
        example: "Comparing Delhi (AQI 220), Mumbai (AQI 95), and Bangalore (AQI 75) shows Delhi has 2-3x higher pollution, likely due to geography (landlocked), traffic density, and winter crop burning."
      },
      {
        heading: "Radar Chart Comparison (Pollutant Profiles)",
        content: "The radar chart overlays pollutant profiles of all selected cities on one chart. Each city gets a different colored polygon. This visualizes which pollutants dominate in each city. If Delhi's polygon extends far on PM2.5 and NO₂ spokes while Bangalore's is smaller, it shows Delhi has higher particulate matter and vehicle emissions. Different shapes indicate different pollution sources and city characteristics.",
        tips: [
          "Larger polygon = higher overall pollution levels",
          "Shape differences = different pollution sources",
          "Long PM2.5 spoke = construction/dust/combustion issues",
          "Long NO₂ spoke = heavy traffic/vehicle emissions"
        ],
        example: "If Delhi's radar is large and skewed toward PM2.5/NO₂ while Goa's is small and balanced, it shows Delhi has severe traffic/dust pollution while Goa has relatively clean, balanced air."
      },
      {
        heading: "Historical Trend Comparison",
        content: "This line chart overlays historical AQI trends for all selected cities on one timeline. You can see if cities follow similar patterns (suggesting regional factors like weather or crop burning) or different patterns (suggesting local factors like traffic or industry). Parallel trends indicate shared pollution sources, while diverging trends suggest city-specific issues.",
        tips: [
          "Parallel lines = shared regional pollution factors",
          "Diverging lines = city-specific pollution problems",
          "Sudden synchronized spikes = regional events (Diwali, dust storms)",
          "Different seasonal patterns = geographic/climate differences"
        ],
        example: "If Delhi, Jaipur, and Lucknow all spike in November, it's likely due to regional crop burning and Diwali. If only Mumbai spikes, it might be a local industrial issue."
      },
      {
        heading: "Statistical Comparison Table",
        content: "The table shows key statistics for each city: Current AQI, Average AQI (over the selected period), Maximum AQI (worst day), Minimum AQI (best day), and Standard Deviation (how much AQI varies day-to-day). High standard deviation means unpredictable air quality (some days good, some terrible), while low deviation means consistent air quality (always moderate, always poor, etc.).",
        tips: [
          "High Std Dev = unpredictable air quality (wild swings)",
          "Low Std Dev = consistent air quality (stable)",
          "Max AQI shows worst-case scenario you might face",
          "Average AQI shows typical conditions"
        ],
        example: "If City A has Avg=150, Max=380, StdDev=80 and City B has Avg=150, Max=180, StdDev=15, both have same average but City A is much more unpredictable with dangerous spikes."
      }
    ]
  },

  mapView: {
    title: "India Map View Guide",
    sections: [
      {
        heading: "Geographic Air Quality Visualization",
        content: "The map shows all 108 monitored cities across India with colored dots representing their current AQI. Green dots = good air quality, yellow = moderate, orange = poor, red = very poor, maroon = severe. This geographic view helps you instantly see pollution patterns across the country. You can identify pollution hotspots (clusters of red/maroon dots), clean air zones (green clusters), and regional trends (e.g., North India more polluted than South).",
        tips: [
          "Dot color = AQI category (same as city cards)",
          "Dot size can indicate AQI magnitude (larger = worse)",
          "Clusters of red dots = regional pollution problems",
          "Hover over dots to see exact AQI values"
        ],
        example: "If you see a cluster of red/maroon dots in North India (Delhi, Jaipur, Lucknow, Kanpur) and mostly green/yellow dots in South India (Bangalore, Chennai, Kochi), it shows severe regional disparity."
      },
      {
        heading: "Regional Pollution Patterns",
        content: "The map reveals geographic patterns that numbers alone can't show. The Indo-Gangetic Plain (North India from Punjab to West Bengal) often shows high pollution due to: geography (Himalayas trap pollution), agriculture (crop burning in Punjab/Haryana), high population density, and industrialization. Coastal cities and Northeast India typically show better air quality due to ocean winds and less industry. Mountain cities (Shimla, Dehradun) have naturally cleaner air.",
        tips: [
          "North India (Indo-Gangetic Plain) = usually most polluted",
          "Coastal cities = better air quality (sea breeze helps)",
          "Northeast India = generally good (less industry)",
          "Mountain cities = cleanest (altitude, less pollution sources)"
        ],
        example: "The map often shows a 'pollution belt' across North India from Amritsar to Kolkata, while South India, Northeast, and Himalayan regions appear green/yellow."
      },
      {
        heading: "Interactive Map Features",
        content: "You can click on any city dot to navigate to its detailed page with full analysis. Zoom in to see city clusters more clearly. The map helps answer spatial questions: 'Which cities near me have good air quality?' (for weekend trips), 'Is pollution worse in industrial areas?', 'How does geography affect air quality?' Combine this geographic view with the data from other pages for comprehensive understanding.",
        tips: [
          "Click any city dot to see detailed analysis",
          "Zoom in to see dense city clusters (like NCR region)",
          "Use map to find clean-air cities for travel planning",
          "Compare coastal vs inland, plain vs mountain cities"
        ],
        example: "If you're in Delhi and want a weekend getaway, the map quickly shows Shimla, Dehradun, or Jaipur (depending on current AQI) as options with better air quality."
      }
    ]
  },

  rankings: {
    title: "City Rankings Guide",
    sections: [
      {
        heading: "Understanding City Rankings",
        content: "The rankings page lists all 108 cities sorted by AQI from worst to best (or best to worst, your choice). Rank #1 is the most polluted city, Rank #108 is the cleanest. Each row shows the city name, state, region, current AQI, AQI category, and key pollutant levels. This helps you quickly identify which cities have the worst air quality problems and which are performing well. You can filter by region, category, or search for specific cities.",
        tips: [
          "Rank 1 = most polluted city currently",
          "Rank 108 = cleanest city currently",
          "Rankings change in real-time as AQI updates",
          "A city's rank can change dramatically during pollution episodes"
        ],
        example: "If Delhi is Rank #3 today with AQI 285, it means only 2 cities in India have worse air quality right now. Tomorrow it might be Rank #1 if pollution increases."
      },
      {
        heading: "Filtering and Sorting Rankings",
        content: "You can customize the ranking view using several filters: Sort by AQI (worst first or best first), by city name (A-Z), or by region. Filter by region to see only North Indian cities, for example. Filter by AQI category to see only 'Severe' cities. Use the search box to find a specific city quickly. The ranking count shows how many cities match your current filters.",
        tips: [
          "'Worst First' shows most polluted cities at top (default)",
          "'Best First' shows cleanest cities at top",
          "Filter by region to compare cities in same area",
          "Filter by category to see all 'Severe' or all 'Good' cities"
        ],
        example: "Filtering by 'North' region + 'Poor' category might show 15 North Indian cities with AQI 101-200, helping you understand regional pollution severity."
      },
      {
        heading: "What the Ranking Numbers Mean",
        content: "Each row shows: Rank (position among all 108 cities), City Name & State, Region (North/South/East/West/Central), Current AQI (the main pollution number), Category (Good/Moderate/Poor/Very Poor/Severe), and dominant pollutant levels (PM2.5, PM10, NO₂). The AQI value determines the rank - higher AQI = worse rank. Cities with similar AQI will have consecutive ranks. Look at pollutant levels to understand why a city has poor air quality.",
        tips: [
          "AQI 0-50 = Good (clean air)",
          "AQI 51-100 = Moderate (acceptable)",
          "AQI 101-200 = Poor (unhealthy for sensitive groups)",
          "AQI 201+ = Very Poor/Severe (unhealthy for everyone)"
        ],
        example: "Rank 5: Delhi, AQI 245 (Very Poor), PM2.5=145, PM10=280, NO₂=85 shows Delhi is the 5th most polluted city, with PM2.5 and PM10 as main pollutants."
      }
    ]
  },

  health: {
    title: "Health Advisory Guide",
    sections: [
      {
        heading: "AQI-Based Health Recommendations",
        content: "This page provides specific health guidance based on current AQI levels. Different AQI categories require different precautions. For Good AQI (0-50), no special precautions are needed. For Moderate (51-100), sensitive people (asthma, heart disease, elderly, children) should limit prolonged outdoor exposure. For Poor (101-200), everyone should reduce outdoor activities and wear N95 masks. For Very Poor/Severe (201+), avoid all outdoor activities, use air purifiers indoors, and seek medical help if experiencing breathing difficulties.",
        tips: [
          "Good (0-50): Normal activities, no precautions needed",
          "Moderate (51-100): Sensitive groups limit outdoor exertion",
          "Poor (101-200): Wear N95 masks, reduce outdoor activities",
          "Very Poor/Severe (201+): Stay indoors, use air purifiers"
        ],
        example: "If AQI is 185 (Poor), the advisory will recommend: wear N95 masks outdoors, avoid jogging/exercise outside, keep windows closed, use air purifier indoors, and children/elderly should stay inside."
      },
      {
        heading: "Guidance for Sensitive Groups",
        content: "Certain people are more vulnerable to air pollution: children (lungs still developing), elderly (weaker immune systems), pregnant women (affects fetal development), people with asthma/COPD (respiratory issues), people with heart disease (pollution stresses cardiovascular system), and diabetics (higher inflammation risk). This page provides specific recommendations for each group based on current AQI. If you're in a sensitive group, take extra precautions even at moderate AQI levels.",
        tips: [
          "Children: Avoid outdoor play when AQI > 100",
          "Elderly: Limit all outdoor exposure when AQI > 150",
          "Asthma: Carry inhaler, avoid triggers when AQI > 100",
          "Heart disease: Pollution increases cardiac stress at AQI > 150"
        ],
        example: "If you have asthma and AQI is 165 (Poor), you should: stay indoors as much as possible, keep rescue inhaler nearby, avoid all exercise, use air purifier, and close all windows."
      },
      {
        heading: "Protective Measures and Precautions",
        content: "This section lists practical steps to protect yourself from air pollution based on current AQI levels. These include: wearing N95/P100 masks (not cloth masks, they don't filter fine particles), using air purifiers with HEPA filters indoors, keeping windows closed during high pollution, avoiding outdoor exercise (heavy breathing pulls more pollution deep into lungs), washing face/hands after outdoor exposure (removes particles), and staying hydrated (helps body process pollutants). During severe pollution, consider working from home or relocating temporarily.",
        tips: [
          "N95 masks filter 95% of PM2.5 particles (cloth masks don't)",
          "HEPA air purifiers remove 99.97% of particles indoors",
          "Avoid outdoor exercise when AQI > 150 (deep breathing = more exposure)",
          "Keep windows closed and use AC/recirculated air in cars"
        ],
        example: "During AQI 300+ (Very Poor), ideal protection: stay indoors with HEPA purifier running, wear N95 mask if you must go outside, avoid all exercise, shower after outdoor exposure, and drink plenty of water."
      },
      {
        heading: "Festival Health Warnings",
        content: "During festivals like Diwali (firecrackers) and Holi (colored powders), air quality can deteriorate rapidly. This page shows upcoming festival warnings with specific health guidance. For Diwali: avoid lighting firecrackers, stay indoors during evening/night when fireworks peak, use N95 masks if you go outside, and keep air purifiers running. Effects typically last 2-3 days after the festival. For Holi: use natural/organic colors (chemical colors add toxic particles), avoid inhaling colored powder, and wash exposed skin immediately.",
        tips: [
          "Diwali: AQI can jump 200-400 points in hours",
          "Stay indoors with air purifier during Diwali evening/night",
          "Avoid firecrackers entirely if you have respiratory conditions",
          "Holi: Use organic colors, avoid inhaling powder, wash immediately"
        ],
        example: "If Diwali is tomorrow and current AQI is 150, expect it to reach 350-500 on Diwali night. Prepare by: buying N95 masks, setting up air purifiers, staying indoors evening/night, and avoiding all outdoor activities for 2-3 days after."
      }
    ]
  },

  dataScience: {
    title: "Data Science Dashboard Guide",
    sections: [
      {
        heading: "Understanding the Data Pipeline",
        content: "This dashboard shows the complete data science workflow behind AQIndia's predictions and analysis. The pipeline includes: Data Collection (gathering AQI from Open-Meteo, WAQI, CPCB APIs), Data Validation (Gemini AI checks for anomalies), Feature Engineering (creating 60+ predictive features like lag values, rolling averages, seasonal indicators), Model Training (teaching 5 ML models on historical data), Model Evaluation (testing accuracy with metrics like R², RMSE), and Deployment (serving predictions to the app). This transparency shows the rigorous scientific process.",
        tips: [
          "236,736 historical records used for training (2020-2025)",
          "60+ engineered features improve prediction accuracy",
          "5-fold TimeSeriesCrossValidation prevents overfitting",
          "Gemini AI validates all live data for anomalies"
        ],
        example: "The pipeline processes raw API data → validates with AI → engineers features (like 'PM2.5 from 7 days ago', 'rolling 30-day average', 'winter indicator') → trains models → evaluates accuracy → deploys best model for predictions."
      },
      {
        heading: "Feature Engineering (Creating Predictive Inputs)",
        content: "Feature engineering transforms raw data into meaningful inputs for ML models. AQIndia creates 60+ features including: Lag Features (PM2.5 from 1, 7, 30 days ago - pollution persists), Rolling Statistics (7-day and 30-day averages - smooths out noise), Seasonal Indicators (winter/monsoon flags - pollution varies by season), Ratios (PM2.5/PM10 ratio - indicates pollution type), and Temporal Features (month, day of year, quarter - captures cycles). Good features are the key to accurate predictions.",
        tips: [
          "Lag features capture pollution persistence (yesterday affects today)",
          "Rolling averages smooth daily fluctuations to show trends",
          "Seasonal flags help models learn winter vs summer patterns",
          "Ratios like PM2.5/PM10 indicate pollution sources"
        ],
        example: "Instead of just using today's PM2.5, features include: PM2.5 from 1 day ago (lag_1), 7 days ago (lag_7), 30-day average (rolling_30), whether it's winter (is_winter), and the month (month_11 for November). This gives the model much richer information."
      },
      {
        heading: "Model Training and Validation",
        content: "The 5 ML models are trained using TimeSeriesSplit cross-validation (5 folds), which means the data is split into 5 time-based chunks. The model trains on chunks 1-4, tests on chunk 5, then trains on 2-5, tests on chunk 6, and so on. This time-based validation ensures models learn from past data and predict future data (realistic scenario). Random splitting would cheat by using future data to predict the past. Models are evaluated on RMSE, MAE, R², and MAPE to measure accuracy.",
        tips: [
          "TimeSeriesSplit prevents 'data leakage' (using future to predict past)",
          "5-fold validation means model tested on 5 different time periods",
          "R² > 0.95 means excellent predictive power",
          "Ensemble model combines all 5 models for best performance"
        ],
        example: "Training on 2020-2023 data, testing on 2024 data simulates real-world use: model learned from past, now predicts unseen future. If it achieves R²=0.98 on test data, it means 98% accurate on new, unseen data."
      },
      {
        heading: "Dataset Statistics and Quality",
        content: "This section shows key stats about the training dataset: Total Records (236,736 daily AQI readings), Total Cities (108 monitored cities), Training Samples (80% of data = ~189,000 records used to teach models), Test Samples (20% = ~47,000 records used to evaluate models), Date Range (2020-01-01 to 2025-04-11, over 5 years of data), and Pollutants tracked (PM2.5, PM10, NO₂, SO₂, O₃, CO). Large, diverse datasets lead to more accurate and generalizable models.",
        tips: [
          "236K+ records = massive dataset for robust training",
          "80/20 train/test split is standard ML practice",
          "5+ years of data captures multiple seasonal cycles",
          "6 pollutants tracked = comprehensive air quality picture"
        ],
        example: "With 236,736 records across 108 cities over 5 years, the models learn diverse patterns: Delhi's winter pollution, Mumbai's coastal dispersion, Bangalore's moderate climate, seasonal crop burning effects, and festival impacts."
      }
    ]
  },

  reports: {
    title: "Reports & Export Guide",
    sections: [
      {
        heading: "Generating Air Quality Reports",
        content: "The Reports page lets you generate comprehensive PDF or CSV reports for any city. Reports include: current AQI and pollutant levels, historical trends (past 30 days by default), 7-day forecast, Mann-Kendall trend analysis, and health recommendations. You can customize the date range (7, 30, 90 days, or custom). PDF reports are formatted for printing/sharing, while CSV files contain raw data for further analysis in Excel or other tools. Reports are useful for research, presentations, or sharing pollution data with others.",
        tips: [
          "PDF reports = formatted, printable, good for presentations",
          "CSV files = raw data, good for Excel/further analysis",
          "Customize date range to focus on specific periods",
          "Reports include charts, statistics, and health guidance"
        ],
        example: "Generate a 90-day PDF report for Delhi to show: current AQI 220 (Very Poor), historical trend showing gradual worsening over 3 months, forecast predicting 250+ next week due to winter, and recommendation to use air purifiers and limit outdoor activities."
      },
      {
        heading: "What's Included in Reports",
        content: "Each report contains: (1) City Overview - name, state, region, current AQI, category, and dominant pollutants. (2) Historical Analysis - line chart showing AQI trends over selected period, with statistics (average, max, min, standard deviation). (3) Forecast - 7-day ML prediction with confidence intervals. (4) Trend Analysis - Mann-Kendall test results showing if air quality is improving or worsening long-term. (5) Health Advisory - specific recommendations based on current AQI levels. This comprehensive view gives complete picture of a city's air quality situation.",
        tips: [
          "Historical chart shows patterns, spikes, and trends",
          "Statistics (avg/max/min) summarize the period",
          "Forecast helps plan for upcoming pollution",
          "Mann-Kendall test confirms if trends are real"
        ],
        example: "A Delhi report might show: Current AQI 220 (Very Poor), 30-day avg 195, max 340 (Diwali spike), min 120, Mann-Kendall Tau=+0.38 (worsening trend), forecast 240-280 next week, health advisory: avoid outdoor activities, use N95 masks, run air purifiers."
      },
      {
        heading: "Export Formats and Usage",
        content: "PDF Export: Generates a formatted, printable report with charts and text. Ideal for: sharing with teachers/professors, including in presentations, printing for reference, or sending to concerned citizens. The PDF includes all visualizations (charts, gauges, radar plots) formatted for A4 paper. CSV Export: Downloads raw data as a spreadsheet file. Ideal for: further analysis in Excel/Google Sheets, creating custom charts, statistical analysis, or combining with other datasets. CSV contains daily AQI, all pollutant levels, and forecast values.",
        tips: [
          "PDF = formatted report with charts (for presentations)",
          "CSV = raw data table (for Excel/analysis)",
          "PDF includes all visualizations formatted for printing",
          "CSV can be imported into Excel, Google Sheets, Python, R"
        ],
        example: "For a college project: generate PDF report to include in your presentation (shows professional charts and analysis), and CSV to create custom visualizations or run additional statistical tests in Excel."
      }
    ]
  },

  apiSettings: {
    title: "API Settings Guide",
    sections: [
      {
        heading: "What are API Keys and Why Do You Need Them?",
        content: "API keys are like passwords that let AQIndia access external data sources. By default, AQIndia uses Open-Meteo (free, no key needed) for basic AQI data. But you can add optional API keys for enhanced features: WAQI key provides real-time data from 1000+ Indian ground monitoring stations (more accurate than satellite data), and Gemini AI key validates all AQI readings using artificial intelligence to catch errors and anomalies. These keys are stored encrypted on your device and never sent to our servers.",
        tips: [
          "Open-Meteo = free, works automatically (no key needed)",
          "WAQI = optional, provides ground-station data (more accurate)",
          "Gemini AI = optional, validates data for errors/anomalies",
          "Keys are encrypted and stored only on your device"
        ],
        example: "Without WAQI key: AQI from satellite estimates (Open-Meteo). With WAQI key: AQI from actual ground monitoring stations near you (more precise). Without Gemini: raw data shown. With Gemini: AI checks if readings are realistic and flags anomalies."
      },
      {
        heading: "How to Get WAQI API Key",
        content: "WAQI (World Air Quality Index) provides free API access to real-time air quality data from ground monitoring stations worldwide. To get your free key: (1) Visit https://aqicn.org/data-platform/token/, (2) Fill in your name and email, (3) You'll receive an API token via email instantly, (4) Copy the token and paste it in AQIndia Settings → WAQI API Key field, (5) Click 'Save & Test' to verify it works. The free tier allows 1000 requests/day (enough for personal use). WAQI data is more accurate because it comes from actual air quality monitors, not satellite estimates.",
        tips: [
          "WAQI key is free, instant email delivery",
          "Free tier: 1000 requests/day (plenty for personal use)",
          "Ground station data > satellite estimates (more accurate)",
          "Test button verifies your key works before saving"
        ],
        example: "After adding WAQI key, Delhi's AQI will come from actual monitoring stations like 'Delhi - Anand Vihar' or 'Delhi - RK Puram' instead of satellite estimates, giving you street-level accuracy."
      },
      {
        heading: "How to Get Gemini AI API Key",
        content: "Google's Gemini AI can validate air quality readings to catch sensor errors, impossible values, or anomalies. To get your free key: (1) Visit https://aistudio.google.com/app/apikey, (2) Sign in with your Google account, (3) Click 'Create API Key', (4) Copy the key and paste it in AQIndia Settings → Gemini API Key field, (5) Click 'Save & Test'. The free tier allows 60 requests/minute (more than enough). Gemini checks things like: Is AQI 500 realistic for this city in this season? Does PM2.5 > PM10 (impossible, indicates sensor error)? Is this value an outlier compared to historical data?",
        tips: [
          "Gemini key is free with Google account",
          "Free tier: 60 requests/minute (very generous)",
          "AI validates every AQI reading for errors/anomalies",
          "Catches impossible values (like PM2.5 > PM10)"
        ],
        example: "If a sensor reports Delhi AQI = 800 (impossible, max is 500), Gemini will flag it as anomalous and suggest a corrected value based on historical patterns and current weather conditions."
      },
      {
        heading: "Security and Privacy of API Keys",
        content: "Your API keys are protected with AES-256 encryption (military-grade security). When you enter a key, it's encrypted using a key derived from your browser's unique fingerprint before being stored in localStorage. This means: (1) Keys are unreadable if someone inspects your browser storage, (2) Keys can only be decrypted on your specific device/browser, (3) Keys are never sent to AQIndia servers - they're used directly from your browser to call WAQI/Gemini APIs, (4) If you clear browser data, keys are deleted and you'll need to re-enter them. This client-side encryption ensures your keys stay private and secure.",
        tips: [
          "AES-256 encryption = military-grade security",
          "Keys stored only on your device (not on servers)",
          "Encrypted keys are useless if stolen (can't be decrypted elsewhere)",
          "Clearing browser data deletes keys (re-enter if needed)"
        ],
        example: "Even if someone accesses your browser's localStorage and sees the encrypted key, they can't use it because it's encrypted with your browser's unique fingerprint. The encrypted key on your laptop won't work on another computer."
      }
    ]
  },

  about: {
    title: "About AQIndia Guide",
    sections: [
      {
        heading: "What is AQIndia?",
        content: "AQIndia is a comprehensive air quality intelligence platform that monitors, analyzes, and forecasts air pollution across 108 Indian cities in real-time. It combines data from multiple sources (Open-Meteo, WAQI, CPCB), applies advanced machine learning models (XGBoost, LSTM, Prophet, Ensemble), performs statistical analysis (Mann-Kendall trends, correlation, source apportionment), and presents everything through interactive visualizations. The platform helps citizens understand air quality, plan activities, protect their health, and policymakers identify pollution sources and trends.",
        tips: [
          "Monitors 108 Indian cities with real-time AQI",
          "5 ML models for accurate forecasting (R² = 0.98)",
          "236,736 historical records (2020-2025) for analysis",
          "12+ chart types: radar, heatmap, violin, SHAP, etc."
        ],
        example: "AQIndia answers questions like: What's the air quality in my city right now? Will pollution be worse tomorrow? Which pollutant is the main problem? Is air quality getting better or worse over time? Where does pollution come from?"
      },
      {
        heading: "Technology Stack",
        content: "AQIndia is built with modern, production-grade technologies: Frontend uses React 19 (UI framework), TypeScript (type safety), Tailwind CSS 4 (styling), Recharts (data visualization), and Framer Motion (animations). Backend uses Express 4 (server), tRPC 11 (type-safe API), and Drizzle ORM (database). Data science uses Python, scikit-learn, XGBoost, and statistical libraries. Security uses AES-256 encryption for API keys. The entire platform is fully responsive (works on mobile/tablet/desktop) and follows WCAG AAA accessibility standards.",
        tips: [
          "React 19 + TypeScript = modern, type-safe frontend",
          "tRPC = end-to-end type safety (no API mismatches)",
          "Recharts = interactive, customizable charts",
          "WCAG AAA = fully accessible to all users"
        ],
        example: "When you view a chart, React renders it, TypeScript ensures data types are correct, tRPC fetches data with full type safety, Recharts displays the visualization, and Framer Motion adds smooth animations - all working together seamlessly."
      },
      {
        heading: "Data Sources and Methodology",
        content: "AQIndia uses multiple data sources for accuracy and redundancy: Open-Meteo (free satellite-based AQI, global coverage), WAQI (ground monitoring stations, 1000+ in India, requires API key), CPCB (Indian government data, historical), and Kaggle datasets (18,265 real records 2015-2024 for ML training). Data is validated with Gemini AI to catch anomalies. Historical data spans 2020-2025 (5+ years, 236K+ records). ML models are trained using time-series cross-validation to ensure real-world accuracy. All pollutant measurements follow CPCB (Central Pollution Control Board) standards.",
        tips: [
          "Multiple sources = redundancy and accuracy",
          "236K+ historical records = robust ML training",
          "Gemini AI validation = catches sensor errors/anomalies",
          "CPCB standards = official Indian AQI scale (0-500)"
        ],
        example: "If Open-Meteo reports AQI 180 for Delhi, WAQI (if key provided) might report 175 from ground station. Gemini validates both are realistic. The system uses the most reliable source and flags any anomalies."
      },
      {
        heading: "Project Purpose and Impact",
        content: "AQIndia serves multiple purposes: (1) Citizen Awareness - helps people understand air quality in their city and take protective actions, (2) Health Protection - provides AQI-based health advisories to reduce pollution exposure, (3) Research and Education - demonstrates data science, ML, and statistical analysis techniques, (4) Policy Support - identifies pollution trends, sources, and hotspots for targeted interventions, (5) Forecasting - predicts future pollution so people can plan activities. Air pollution causes ~1.67 million deaths annually in India (2019 study), making awareness and action critical.",
        tips: [
          "1.67 million deaths/year in India from air pollution",
          "Awareness → Action → Health improvement",
          "Forecasting helps people plan and protect themselves",
          "Data-driven insights support effective policy decisions"
        ],
        example: "If AQIndia shows AQI will reach 300+ tomorrow, a parent can keep their child indoors, an asthmatic can prepare medications, a school can cancel outdoor sports, and a policymaker can implement emergency measures like odd-even vehicle rules."
      }
    ]
  }
};
