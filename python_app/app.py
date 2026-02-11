"""
HealthAgg - AI-Powered Healthcare Aggregator
Full-stack Python Flask Application
"""

import json
import math
import os
from functools import wraps

import requests
from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from medical_fallback import FALLBACK_DATABASE, match_fallback

app = Flask(__name__)
app.config.from_object(Config)

# ──────────────────────────────────────────────
# In-memory user store (replace with DB in prod)
# ──────────────────────────────────────────────
users_db: dict[str, dict] = {}


# ──────────────────────────────────────────────
# Auth helpers
# ──────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_email" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ──────────────────────────────────────────────
# Auth routes
# ──────────────────────────────────────────────
@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_email" in session:
        return redirect(url_for("index"))

    error = None
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if email in users_db and check_password_hash(users_db[email]["password"], password):
            session["user_email"] = email
            session["user_name"] = users_db[email]["name"]
            return redirect(url_for("index"))
        error = "Invalid email or password. Please try again."

    return render_template("login.html", error=error, mode="signin")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if "user_email" in session:
        return redirect(url_for("index"))

    error = None
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not name or not email or not password:
            error = "All fields are required."
        elif len(password) < 6:
            error = "Password must be at least 6 characters."
        elif email in users_db:
            error = "An account with this email already exists."
        else:
            users_db[email] = {
                "name": name,
                "password": generate_password_hash(password),
            }
            session["user_email"] = email
            session["user_name"] = name
            return redirect(url_for("index"))

    return render_template("login.html", error=error, mode="signup")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ──────────────────────────────────────────────
# Main page
# ──────────────────────────────────────────────
@app.route("/")
@login_required
def index():
    return render_template(
        "index.html",
        user_name=session.get("user_name", "User"),
    )


# ──────────────────────────────────────────────
# API: Clinical NLP Analysis
# ──────────────────────────────────────────────
CLINICAL_SYSTEM_PROMPT = """You are an AI Clinical Decision Support Assistant with expertise equivalent to an experienced general physician. Generate a structured, doctor-style medical consultation note based on the patient's reported symptoms.

CRITICAL ACCURACY REQUIREMENTS:
- Every field MUST be specifically tailored to the exact symptoms described. Do NOT reuse generic templates.
- differentialDiagnosis MUST list conditions medically relevant to THIS symptom set with accurate probability rankings.
- redFlagSymptoms MUST be specific warning signs clinically associated with the conditions in the differential.
- otcMedications MUST be pharmacologically appropriate for the described symptoms.
- recommendedTests MUST be diagnostically relevant to confirm or rule out the specific differential diagnoses.
- emergencySigns MUST describe progression patterns specific to the conditions discussed.
- preventiveAdvice MUST be evidence-based strategies specific to preventing recurrence.
- consultationReason MUST explain why a physician is needed for THIS specific condition.

STRICT RULES:
- Use language like "could suggest," "possibilities include," "may indicate." NEVER claim definitive diagnosis.
- NEVER prescribe restricted/controlled medications, steroids, antibiotics, or Schedule H/H1 medicines.
- Provide only safe OTC suggestions with full dosage, contraindication, and side effect information.
- If symptoms indicate emergency, set emergencyRisk to true and recommend immediate emergency care.
- Use medical terminology with patient-friendly explanations in parentheses.
- State clearly this is for educational purposes only and not a substitute for professional medical care.

Respond ONLY with valid JSON matching this exact schema:
{
  "chiefComplaint": "string",
  "differentialDiagnosis": [{"condition":"string","probability":"High|Moderate|Low","explanation":"string"}],
  "severityAssessment": {"level":"Mild|Moderate|Severe","emergencyRisk":false,"redFlagSymptoms":["string"]},
  "immediateCare": {
    "lifestyleRemedies": ["string"],
    "otcMedications": [{"genericName":"string","brandName":"string","standardDose":"string","frequency":"string","maxDailyDose":"string","contraindications":"string","sideEffects":"string","avoidIf":"string"}]
  },
  "recommendedTests": [{"testName":"string","reason":"string"}],
  "emergencySigns": ["string"],
  "preventiveAdvice": ["string"],
  "specialist": "string",
  "consultationReason": "string",
  "confidence": 85
}"""


@app.route("/api/analyze", methods=["POST"])
@login_required
def analyze_symptoms():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request body"}), 400

    symptoms = data.get("symptoms", "").strip()
    api_key = data.get("apiKey", "").strip()

    if not symptoms:
        return jsonify({"error": "Please describe your symptoms"}), 400

    # Try AI-powered analysis if API key provided
    if api_key:
        try:
            result = _call_gemini_api(api_key, symptoms)
            if result:
                return jsonify(result)
        except ValueError as auth_err:
            return jsonify({"error": str(auth_err)}), 401
        except Exception as e:
            app.logger.error(f"AI error (non-auth), falling to fallback: {e}")

    # Try server-configured API key
    server_key = app.config.get("GEMINI_API_KEY", "")
    if server_key:
        try:
            result = _call_gemini_api(server_key, symptoms)
            if result:
                return jsonify(result)
        except Exception as e:
            app.logger.error(f"Server key AI error, falling to fallback: {e}")

    # Fallback to curated clinical knowledge base
    fallback = match_fallback(symptoms)
    return jsonify(fallback)


def _call_gemini_api(api_key: str, symptoms: str) -> dict | None:
    """Call Google Gemini API directly via REST for maximum compatibility."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"
    )

    prompt = (
        f"{CLINICAL_SYSTEM_PROMPT}\n\n"
        f'Patient\'s reported symptoms: "{symptoms}"\n\n'
        f"IMPORTANT: Analyze ONLY the symptoms described above. "
        f"Every field must be uniquely relevant to these specific symptoms. "
        f"Do not use generic filler."
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }

    resp = requests.post(url, json=payload, timeout=30)

    if resp.status_code in (401, 403):
        raise ValueError("Invalid API key. Please check your key and try again.")

    if resp.status_code == 400:
        body = resp.json()
        err_msg = json.dumps(body).lower()
        if "api_key_invalid" in err_msg or "api key not valid" in err_msg:
            raise ValueError("Invalid API key. Please check your key and try again.")

    resp.raise_for_status()

    resp_data = resp.json()
    text = resp_data["candidates"][0]["content"]["parts"][0]["text"]

    # Clean markdown wrappers if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    return json.loads(text)


# ──────────────────────────────────────────────
# API: Find Care (Overpass / OpenStreetMap)
# ──────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def build_overpass_query(lat, lon, radius_m, query):
    q = query.lower()
    filters = []

    # Always include hospitals and clinics
    for amenity in ("hospital", "clinic"):
        filters.append(f'node["amenity"="{amenity}"](around:{radius_m},{lat},{lon});')
        filters.append(f'way["amenity"="{amenity}"](around:{radius_m},{lat},{lon});')

    kw_map = {
        "doctor": [('amenity', 'doctors'), ('healthcare', 'doctor')],
        "physician": [('amenity', 'doctors'), ('healthcare', 'doctor')],
        "lab": [('healthcare', 'laboratory'), ('amenity', 'laboratory')],
        "test": [('healthcare', 'laboratory')],
        "diagnostic": [('healthcare', 'laboratory')],
        "pathology": [('healthcare', 'laboratory')],
        "pharmacy": [('amenity', 'pharmacy')],
        "medicine": [('amenity', 'pharmacy')],
        "dentist": [('amenity', 'dentist')],
        "dental": [('amenity', 'dentist')],
        "eye": [('healthcare', 'optometrist'), ('shop', 'optician')],
        "mental": [('healthcare', 'psychotherapist'), ('healthcare', 'counselling')],
        "psychiatr": [('healthcare', 'psychotherapist')],
    }

    matched = False
    for keyword, tags in kw_map.items():
        if keyword in q:
            matched = True
            for tag_key, tag_val in tags:
                filters.append(f'node["{tag_key}"="{tag_val}"](around:{radius_m},{lat},{lon});')
                filters.append(f'way["{tag_key}"="{tag_val}"](around:{radius_m},{lat},{lon});')

    if not matched:
        for tag_key, tag_val in [('amenity', 'doctors'), ('amenity', 'pharmacy'), ('healthcare', 'laboratory')]:
            filters.append(f'node["{tag_key}"="{tag_val}"](around:{radius_m},{lat},{lon});')

    return f'[out:json][timeout:15];({"".join(filters)});out center body;'


def categorize_provider(tags):
    amenity = tags.get("amenity", "")
    healthcare = tags.get("healthcare", "")
    mapping = {
        "hospital": "Hospital", "clinic": "Clinic", "doctors": "Doctor",
        "pharmacy": "Pharmacy", "dentist": "Dentist", "laboratory": "Laboratory",
    }
    for key, label in mapping.items():
        if amenity == key or healthcare == key:
            return label
    if healthcare == "optometrist":
        return "Eye Care"
    if healthcare in ("psychotherapist", "counselling"):
        return "Mental Health"
    return "Healthcare"


def relevance_score(tags, query):
    q = query.lower()
    name = (tags.get("name") or "").lower()
    score = 0
    if name and any(w in name for w in q.split()):
        score += 50
    specialty = (tags.get("healthcare:speciality") or tags.get("speciality") or "").lower()
    if specialty and any(w in specialty for w in q.split()):
        score += 40
    cat = categorize_provider(tags).lower()
    if cat in q:
        score += 30
    if tags.get("website") or tags.get("phone") or tags.get("contact:phone"):
        score += 10
    if tags.get("opening_hours"):
        score += 5
    return score


@app.route("/api/find-care")
@login_required
def find_care():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    radius = request.args.get("radius", 10000, type=int)
    query = request.args.get("q", "")
    limit = request.args.get("limit", 20, type=int)

    if not lat or not lon:
        return jsonify({"error": "Location coordinates required"}), 400

    try:
        overpass_q = build_overpass_query(lat, lon, radius, query)
        resp = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": overpass_q},
            timeout=15,
        )
        resp.raise_for_status()
        elements = resp.json().get("elements", [])

        providers = []
        for el in elements:
            tags = el.get("tags", {})
            if not tags.get("name"):
                continue
            el_lat = el.get("lat") or (el.get("center", {}) or {}).get("lat", 0)
            el_lon = el.get("lon") or (el.get("center", {}) or {}).get("lon", 0)
            dist = haversine(lat, lon, el_lat, el_lon)
            addr_parts = [tags.get(k) for k in ("addr:street", "addr:housenumber", "addr:city", "addr:postcode") if tags.get(k)]

            providers.append({
                "id": el.get("id"),
                "name": tags.get("name", "Unknown"),
                "type": categorize_provider(tags),
                "specialty": tags.get("healthcare:speciality") or tags.get("speciality"),
                "address": ", ".join(addr_parts) if addr_parts else None,
                "phone": tags.get("phone") or tags.get("contact:phone"),
                "website": tags.get("website") or tags.get("contact:website"),
                "openingHours": tags.get("opening_hours"),
                "distance": round(dist, 1),
                "lat": el_lat,
                "lon": el_lon,
                "relevance": relevance_score(tags, query),
                "operator": tags.get("operator"),
                "emergency": tags.get("emergency") == "yes",
            })

        providers.sort(key=lambda p: (-p["relevance"], p["distance"]))
        total = len(providers)
        providers = providers[:limit]

        return jsonify({
            "providers": providers,
            "total": total,
            "radius": radius / 1000,
            "location": {"lat": lat, "lon": lon},
        })

    except Exception as e:
        app.logger.error(f"Find care error: {e}")
        return jsonify({"error": "Unable to fetch care providers. Please try again."}), 500


# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
