from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
import requests

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize cache with simple in-memory caching
cache = Cache(app, config={'CACHE_TYPE': 'simple', 'CACHE_DEFAULT_TIMEOUT': 1800})  # Cache for 30 minutes

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Weather API!"})

@app.route('/api/weather', methods=['GET', 'OPTIONS'])
@cache.cached(timeout=1800, query_string=True)  # Cache this route based on query parameters
def get_weather():
    if request.method == 'OPTIONS':
        return _build_cors_prelight_response()

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        return jsonify({"error": "Missing lat/lng parameters"}), 400

    # Define API endpoints
    API_KEY = 'SvUyKkKyi452sieofytGNMZOVSfxVTvk'
    real_time_url = f"https://api.tomorrow.io/v4/weather/realtime?location={lat},{lng}&units=imperial&apikey={API_KEY}"
    forecast_url = f"https://api.tomorrow.io/v4/weather/forecast?location={lat},{lng}&timesteps=1d&units=imperial&apikey={API_KEY}"
    hourly_url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lng}&fields=temperatureAvg,humidity,windSpeed,pressureSurfaceLevel,windDirection&timesteps=1h&units=imperial&timezone=America/Los_Angeles&apikey={API_KEY}"

    try:
        # Fetch real-time weather data
        real_time_response = requests.get(real_time_url, headers={"accept": "application/json"})
        real_time_data = real_time_response.json() if real_time_response.status_code == 200 else None

        # Fetch forecast data
        forecast_response = requests.get(forecast_url, headers={"accept": "application/json"})
        forecast_data = forecast_response.json() if forecast_response.status_code == 200 else None

        # Fetch hourly data
        hourly_response = requests.get(hourly_url, headers={"accept": "application/json"})
        hourly_data = hourly_response.json() if hourly_response.status_code == 200 else None

        # Combine data into a single JSON response
        combined_data = {
            "realtime": real_time_data if real_time_data else "No real-time data available",
            "forecast": forecast_data if forecast_data else "No forecast data available",
            "hourly": hourly_data if hourly_data else "No hourly data available"
        }

        response = jsonify(combined_data)
        response = _corsify_actual_response(response)

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _build_cors_prelight_response():
    response = jsonify({"message": "CORS preflight successful"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
