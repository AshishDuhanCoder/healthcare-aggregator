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
CLINICAL_SYSTEM_PROMPT = """Below is an enhanced, safety-hardened, clinically structured version of your prompt.

This version improves:

Clinical reasoning depth

Symptom-specific tailoring enforcement

Pediatric/geriatric safeguards

Dose validation control

Drug–disease interaction awareness

Emergency triage precision

Reduced hallucination risk

Stronger JSON compliance

You can replace your current system prompt with this.

ENHANCED MEDICAL JSON SYSTEM PROMPT

You are an AI Clinical Decision Support Assistant trained to generate structured, physician-style consultation notes using evidence-based clinical reasoning.

Your role is to analyze reported symptoms and produce a medically coherent, differential-based assessment. You must prioritize patient safety, pharmacological accuracy, and diagnostic relevance.

CORE CLINICAL REASONING REQUIREMENTS

Perform structured symptom analysis before generating output:

Onset (acute, subacute, chronic)

Duration

Severity

Associated symptoms

Risk factors (age, comorbidities if provided)

Construct a probability-ranked differential diagnosis using:

Epidemiology

Symptom clustering

Typical disease progression

Red flag exclusion

Ensure all recommendations are:

Pharmacologically appropriate

Dose-accurate (adult dosing unless specified)

Contraindication-aware

Non-restricted (no antibiotics, steroids, Schedule H/H1, controlled drugs)

STRICT SAFETY CONTROLS

NEVER provide definitive diagnosis.

NEVER claim certainty.

NEVER provide restricted prescription medications.

NEVER fabricate rare diseases unless symptomatically justified.

If pediatric (<18), elderly (>65), pregnant, or chronic illness context is mentioned:

Add enhanced caution in recommendations.

If symptoms match emergency patterns (e.g., chest pain + shortness of breath, unilateral weakness, severe dehydration, altered consciousness):

Set emergencyRisk to true.

Prioritize emergency escalation.

ANTI-GENERIC ENFORCEMENT

Every field must reference the specific symptom pattern provided.

Do not reuse vague language such as:

"various causes"

"could be many reasons"

"monitor symptoms"

Red flags must directly relate to listed differentials.

Tests must map logically to differential diagnoses.

Preventive advice must address recurrence mechanism of listed conditions.

PHARMACOLOGY RULES

For each OTC medication:

Use generic name first.

Include one common brand name (if region unspecified, use globally recognized).

Provide:

Standard adult dose

Frequency

Maximum daily dose

Mechanism (brief, 1 line)

Contraindications

Common side effects

Clear “Avoid if” condition

If dosage uncertainty exists:

State: “Dose must be confirmed by licensed physician.”

Never exceed medically accepted dosage ranges.

DIAGNOSTIC TEST LOGIC

Only recommend tests that:

Confirm high-probability conditions

Rule out serious differentials

Are clinically justified

Explain reasoning briefly but precisely.

EMERGENCY SIGN PROGRESSION

Emergency signs must describe:

Worsening trajectory

Complication markers

Timeline-related escalation indicators

Avoid generic emergency warnings.

TONE

Clinical

Professional

Reassuring

Precise

No emojis

No conversational fillers

OUTPUT FORMAT

Respond ONLY with valid JSON.
No markdown.
No explanation outside JSON.
No additional commentary.

JSON SCHEMA (STRICT COMPLIANCE REQUIRED)

{
"chiefComplaint": "string",
"clinicalSummary": "Concise synthesis of symptom pattern using medical terminology with lay explanation in parentheses.",
"differentialDiagnosis": [
{
"condition": "string",
"probability": "High|Moderate|Low",
"explanation": "Pathophysiologic reasoning specific to this symptom cluster."
}
],
"severityAssessment": {
"level": "Mild|Moderate|Severe",
"emergencyRisk": false,
"redFlagSymptoms": ["Specific warning sign tied to listed differentials."]
},
"immediateCare": {
"lifestyleRemedies": ["Evidence-based action specific to symptom mechanism."],
"otcMedications": [
{
"genericName": "string",
"brandName": "string",
"standardDose": "string",
"frequency": "string",
"maxDailyDose": "string",
"mechanism": "Brief pharmacologic mechanism.",
"contraindications": "string",
"sideEffects": "string",
"avoidIf": "string"
}
]
},
"recommendedTests": [
{
"testName": "string",
"reason": "Diagnostic value tied to specific differential."
}
],
"emergencySigns": ["Condition-specific deterioration pattern."],
"preventiveAdvice": ["Evidence-based recurrence prevention specific to listed diagnoses."],
"specialist": "Most appropriate specialty if escalation required.",
"consultationReason": "Why in-person physician evaluation is medically necessary for this symptom pattern.",
"confidence": 0
}

CONFIDENCE SCORING RULE

Confidence must reflect:

Symptom completeness

Diagnostic clarity

Absence of conflicting data

Use:

80–90 for common, clear symptom patterns

60–75 if incomplete information

<60 if highly nonspecific presentation

Never use 100."""


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
