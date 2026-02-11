"""
Curated clinical fallback database for when AI/API is unavailable.
"""

FALLBACK_DATABASE = {
    "headache": {
        "chiefComplaint": "Patient reports headache symptoms requiring clinical evaluation.",
        "differentialDiagnosis": [
            {"condition": "Tension-type Headache", "probability": "High", "explanation": "Most common type caused by muscle tension in neck and scalp, often stress-related."},
            {"condition": "Migraine", "probability": "Moderate", "explanation": "Neurovascular disorder with throbbing pain, often unilateral, with photophobia and nausea."},
            {"condition": "Sinusitis-related Headache", "probability": "Low", "explanation": "Pain and pressure in frontal/maxillary regions due to sinus inflammation."},
        ],
        "severityAssessment": {
            "level": "Mild",
            "emergencyRisk": False,
            "redFlagSymptoms": ["Sudden thunderclap onset", "Fever with stiff neck", "Vision changes", "Worst headache of life", "Confusion or weakness"],
        },
        "immediateCare": {
            "lifestyleRemedies": ["Rest in a dark, quiet room", "Apply cold or warm compress to forehead/neck", "Stay hydrated (8+ glasses of water daily)", "Practice relaxation techniques", "Maintain regular sleep schedule (7-8 hours)"],
            "otcMedications": [
                {"genericName": "Paracetamol (Acetaminophen)", "brandName": "Crocin / Dolo 650", "standardDose": "500-650 mg", "frequency": "Every 4-6 hours as needed", "maxDailyDose": "3000 mg (3g)", "contraindications": "Liver disease, chronic alcohol use", "sideEffects": "Nausea, rash (rare)", "avoidIf": "Liver impairment, allergy to paracetamol"},
                {"genericName": "Ibuprofen", "brandName": "Brufen / Advil", "standardDose": "200-400 mg", "frequency": "Every 6-8 hours with food", "maxDailyDose": "1200 mg (OTC limit)", "contraindications": "Peptic ulcer, kidney disease, aspirin allergy", "sideEffects": "Stomach upset, dizziness, heartburn", "avoidIf": "Pregnancy (3rd trimester), GI bleeding history, renal impairment"},
            ],
        },
        "recommendedTests": [
            {"testName": "Blood Pressure Measurement", "reason": "Hypertension is a common but often overlooked cause of chronic headaches."},
            {"testName": "Complete Blood Count (CBC)", "reason": "To rule out anemia or infection contributing to headache."},
            {"testName": "Eye Examination", "reason": "Refractive errors and eye strain are frequent headache triggers."},
        ],
        "emergencySigns": ["Sudden, severe headache unlike any before (thunderclap)", "Headache with fever, stiff neck, rash, or confusion", "Headache after head injury", "Progressive worsening over days/weeks", "Neurological symptoms (weakness, numbness, speech difficulty, vision loss)"],
        "preventiveAdvice": ["Maintain consistent sleep schedule", "Manage stress through regular exercise", "Limit caffeine to 200mg/day", "Stay well-hydrated throughout the day", "Take regular screen breaks (20-20-20 rule)", "Maintain good posture especially during desk work"],
        "specialist": "General Physician / Neurologist",
        "consultationReason": "A primary care physician can perform a comprehensive neurological assessment, differentiate between tension headaches, migraines, and secondary causes, rule out serious conditions, and coordinate imaging (CT/MRI) if needed.",
        "confidence": 85,
    },
    "fever": {
        "chiefComplaint": "Patient reports elevated body temperature (fever) requiring clinical assessment.",
        "differentialDiagnosis": [
            {"condition": "Viral Upper Respiratory Infection", "probability": "High", "explanation": "Most common cause of acute fever, typically self-limiting within 3-7 days."},
            {"condition": "Bacterial Infection", "probability": "Moderate", "explanation": "UTI, strep throat, or other bacterial source requiring targeted antibiotic therapy."},
            {"condition": "COVID-19 / Influenza", "probability": "Moderate", "explanation": "Respiratory viral infections with systemic symptoms."},
        ],
        "severityAssessment": {
            "level": "Moderate",
            "emergencyRisk": False,
            "redFlagSymptoms": ["Temperature above 103F persisting >3 days", "Difficulty breathing or chest pain", "Severe headache with stiff neck", "Confusion or altered consciousness", "Persistent vomiting"],
        },
        "immediateCare": {
            "lifestyleRemedies": ["Rest adequately to support immune function", "Drink plenty of fluids (water, ORS, clear broths)", "Wear light, breathable clothing", "Tepid sponging for comfort", "Monitor temperature every 4-6 hours"],
            "otcMedications": [
                {"genericName": "Paracetamol (Acetaminophen)", "brandName": "Crocin / Dolo 650", "standardDose": "500-650 mg", "frequency": "Every 4-6 hours as needed", "maxDailyDose": "3000 mg (3g)", "contraindications": "Liver disease, chronic alcohol use", "sideEffects": "Nausea, allergic reaction (rare)", "avoidIf": "Liver impairment, allergy to paracetamol"},
                {"genericName": "Ibuprofen", "brandName": "Brufen", "standardDose": "200-400 mg", "frequency": "Every 6-8 hours with food", "maxDailyDose": "1200 mg (OTC limit)", "contraindications": "Peptic ulcer, kidney disease", "sideEffects": "GI discomfort, dizziness", "avoidIf": "Dengue suspected (increases bleeding risk), renal impairment, pregnancy"},
            ],
        },
        "recommendedTests": [
            {"testName": "Complete Blood Count (CBC)", "reason": "To differentiate viral vs bacterial infection and check for dengue/malaria markers."},
            {"testName": "Blood Culture", "reason": "If fever persists >5 days to identify bacteremia."},
            {"testName": "Urine Routine & Culture", "reason": "To rule out urinary tract infection as a fever source."},
        ],
        "emergencySigns": ["High fever (>103F) not responding to medication", "Breathing difficulty or chest pain", "Severe headache, stiff neck, or rash", "Confusion, drowsiness, or seizures", "Signs of dehydration"],
        "preventiveAdvice": ["Maintain hand hygiene", "Stay up to date with vaccinations", "Avoid close contact with sick individuals", "Maintain a balanced diet rich in vitamins C and D", "Ensure adequate sleep for immune health"],
        "specialist": "General Physician",
        "consultationReason": "A physician evaluates the source of fever through history, physical examination, and targeted diagnostics. They differentiate viral from bacterial causes and assess for dangerous tropical infections common in India.",
        "confidence": 88,
    },
    "default": {
        "chiefComplaint": "Patient reports symptoms requiring clinical evaluation and professional assessment.",
        "differentialDiagnosis": [
            {"condition": "Requires Clinical Evaluation", "probability": "High", "explanation": "The described symptoms need in-person assessment for accurate differential diagnosis."},
        ],
        "severityAssessment": {
            "level": "Moderate",
            "emergencyRisk": False,
            "redFlagSymptoms": ["Sudden onset of severe symptoms", "Difficulty breathing", "Chest pain", "Loss of consciousness", "Uncontrolled bleeding"],
        },
        "immediateCare": {
            "lifestyleRemedies": ["Rest and monitor symptoms closely", "Stay well-hydrated", "Maintain a symptom diary", "Avoid self-medication without professional guidance", "Ensure adequate nutrition and sleep"],
            "otcMedications": [
                {"genericName": "Paracetamol (Acetaminophen)", "brandName": "Crocin / Dolo 650", "standardDose": "500 mg", "frequency": "Every 6 hours if needed for pain/fever", "maxDailyDose": "3000 mg", "contraindications": "Liver disease", "sideEffects": "Nausea (rare)", "avoidIf": "Known allergy, liver conditions"},
            ],
        },
        "recommendedTests": [
            {"testName": "Complete Physical Examination", "reason": "Comprehensive in-person assessment is the gold standard for accurate diagnosis."},
            {"testName": "Basic Blood Panel (CBC, CMP)", "reason": "Provides baseline health markers to identify infections, metabolic issues, or organ dysfunction."},
        ],
        "emergencySigns": ["Sudden severe pain", "Difficulty breathing or chest tightness", "Loss of consciousness or confusion", "Uncontrolled bleeding or vomiting blood", "Signs of stroke (face drooping, arm weakness, speech difficulty)"],
        "preventiveAdvice": ["Schedule regular health checkups", "Maintain a balanced diet and regular exercise", "Manage stress through mindfulness practices", "Get adequate sleep (7-8 hours)", "Stay up to date with preventive screenings"],
        "specialist": "General Physician",
        "consultationReason": "A primary care physician provides comprehensive initial evaluation, takes your full medical history, performs a physical examination, and orders relevant diagnostic tests.",
        "confidence": 70,
    },
}


def match_fallback(symptoms: str) -> dict:
    """Keyword-match symptoms against the fallback database."""
    lower = symptoms.lower()
    for key, data in FALLBACK_DATABASE.items():
        if key != "default" and key in lower:
            return data
    return FALLBACK_DATABASE["default"]
