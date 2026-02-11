import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

const clinicalSchema = z.object({
  chiefComplaint: z.string().describe("Professional summary of the user's reported problem"),
  differentialDiagnosis: z.array(
    z.object({
      condition: z.string(),
      probability: z.enum(["High", "Moderate", "Low"]),
      explanation: z.string(),
    }),
  ).describe("2-5 likely causes ranked by probability"),
  severityAssessment: z.object({
    level: z.enum(["Mild", "Moderate", "Severe"]),
    emergencyRisk: z.boolean(),
    redFlagSymptoms: z.array(z.string()).describe("Red flag symptoms to watch for"),
  }),
  immediateCare: z.object({
    lifestyleRemedies: z.array(z.string()).describe("Evidence-based home remedies and lifestyle advice"),
    otcMedications: z.array(
      z.object({
        genericName: z.string(),
        brandName: z.string().describe("Common brand name, India-relevant if applicable"),
        standardDose: z.string(),
        frequency: z.string(),
        maxDailyDose: z.string(),
        contraindications: z.string(),
        sideEffects: z.string(),
        avoidIf: z.string(),
      }),
    ).describe("Safe OTC medication options with full details. Do NOT include antibiotics or controlled drugs."),
  }),
  recommendedTests: z.array(
    z.object({
      testName: z.string(),
      reason: z.string(),
    }),
  ).describe("Blood tests, imaging, or specialist referrals with reasons"),
  emergencySigns: z.array(z.string()).describe("When to seek immediate medical attention"),
  preventiveAdvice: z.array(z.string()).describe("Long-term prevention strategies"),
  specialist: z.string().describe("Recommended specialist for consultation"),
  consultationReason: z.string().describe("Why consulting a primary care physician is essential, covering their role in initial evaluation, differential diagnosis, ruling out red flags, and coordinating specialist referrals"),
  confidence: z.number().min(0).max(100),
})

const CLINICAL_SYSTEM_PROMPT = `You are an AI Clinical Decision Support Assistant designed to generate structured, doctor-style medical guidance based on user-reported symptoms.

You must respond in a professional clinical format similar to a qualified physician consultation note.

MANDATORY RULES:
- Avoid overconfidence. Use language like "could suggest," "possibilities include," "may indicate."
- NEVER claim definitive diagnosis.
- NEVER prescribe restricted/controlled medications, steroids, antibiotics, or Schedule H/H1 medicines.
- Provide only safe OTC suggestions with full dosage, contraindication, and side effect info.
- Clearly state red-flag conditions and emergency signs.
- Recommend lab tests where appropriate with clear reasoning.
- Include dosage only for OTC medicines.
- Include contraindication warnings for every OTC medicine.
- Include when to see a doctor urgently.
- If symptoms indicate emergency (chest pain, stroke signs, severe bleeding, breathing difficulty), immediately recommend emergency care.
- If child, pregnant woman, elderly, or chronic disease patient, add extra caution.
- If dosage uncertainty, say "Consult physician for exact dosage."
- Use medical terminology with patient-friendly explanations.
- Always state this is for educational purposes only and not a substitute for professional medical care.

TONE: Professional, Clinical, Reassuring, Clear. No casual language. No emojis. No generic vague responses.`

// Fallback clinical database for when AI is unavailable
const FALLBACK_DATABASE: Record<string, any> = {
  headache: {
    chiefComplaint: "Patient reports headache symptoms requiring clinical evaluation.",
    differentialDiagnosis: [
      { condition: "Tension-type Headache", probability: "High", explanation: "Most common type caused by muscle tension in neck and scalp, often stress-related." },
      { condition: "Migraine", probability: "Moderate", explanation: "Neurovascular disorder with throbbing pain, often unilateral, with photophobia and nausea." },
      { condition: "Sinusitis-related Headache", probability: "Low", explanation: "Pain and pressure in frontal/maxillary regions due to sinus inflammation." },
    ],
    severityAssessment: { level: "Mild", emergencyRisk: false, redFlagSymptoms: ["Sudden thunderclap onset", "Fever with stiff neck", "Vision changes", "Worst headache of life", "Confusion or weakness"] },
    immediateCare: {
      lifestyleRemedies: ["Rest in a dark, quiet room", "Apply cold or warm compress to forehead/neck", "Stay hydrated (8+ glasses of water daily)", "Practice relaxation techniques (deep breathing, meditation)", "Maintain regular sleep schedule (7-8 hours)"],
      otcMedications: [
        { genericName: "Paracetamol (Acetaminophen)", brandName: "Crocin / Dolo 650", standardDose: "500-650 mg", frequency: "Every 4-6 hours as needed", maxDailyDose: "3000 mg (3g)", contraindications: "Liver disease, chronic alcohol use", sideEffects: "Nausea, rash (rare)", avoidIf: "Liver impairment, allergy to paracetamol" },
        { genericName: "Ibuprofen", brandName: "Brufen / Advil", standardDose: "200-400 mg", frequency: "Every 6-8 hours with food", maxDailyDose: "1200 mg (OTC limit)", contraindications: "Peptic ulcer, kidney disease, aspirin allergy", sideEffects: "Stomach upset, dizziness, heartburn", avoidIf: "Pregnancy (3rd trimester), GI bleeding history, renal impairment" },
      ],
    },
    recommendedTests: [
      { testName: "Blood Pressure Measurement", reason: "Hypertension is a common but often overlooked cause of chronic headaches." },
      { testName: "Complete Blood Count (CBC)", reason: "To rule out anemia or infection contributing to headache." },
      { testName: "Eye Examination", reason: "Refractive errors and eye strain are frequent headache triggers." },
    ],
    emergencySigns: ["Sudden, severe headache unlike any before (thunderclap)", "Headache with fever, stiff neck, rash, or confusion", "Headache after head injury", "Progressive worsening over days/weeks", "Neurological symptoms (weakness, numbness, speech difficulty, vision loss)"],
    preventiveAdvice: ["Maintain consistent sleep schedule", "Manage stress through regular exercise", "Limit caffeine to 200mg/day and avoid abrupt withdrawal", "Stay well-hydrated throughout the day", "Take regular screen breaks (20-20-20 rule)", "Maintain good posture especially during desk work"],
    specialist: "General Physician / Neurologist",
    consultationReason: "A primary care physician can perform a comprehensive neurological assessment, differentiate between tension headaches, migraines, and secondary causes. They rule out serious conditions like intracranial pressure changes, vascular abnormalities, or infections. They coordinate imaging (CT/MRI) if needed and manage referrals to neurology for complex cases.",
    confidence: 85,
  },
  fever: {
    chiefComplaint: "Patient reports elevated body temperature (fever) requiring clinical assessment.",
    differentialDiagnosis: [
      { condition: "Viral Upper Respiratory Infection", probability: "High", explanation: "Most common cause of acute fever, typically self-limiting within 3-7 days." },
      { condition: "Bacterial Infection", probability: "Moderate", explanation: "UTI, strep throat, or other bacterial source requiring targeted antibiotic therapy." },
      { condition: "COVID-19 / Influenza", probability: "Moderate", explanation: "Respiratory viral infections with systemic symptoms." },
    ],
    severityAssessment: { level: "Moderate", emergencyRisk: false, redFlagSymptoms: ["Temperature above 103F (39.4C) persisting >3 days", "Difficulty breathing or chest pain", "Severe headache with stiff neck", "Confusion or altered consciousness", "Persistent vomiting or inability to keep fluids down"] },
    immediateCare: {
      lifestyleRemedies: ["Rest adequately to support immune function", "Drink plenty of fluids (water, ORS, clear broths)", "Wear light, breathable clothing", "Tepid sponging for comfort (avoid cold water)", "Monitor temperature every 4-6 hours"],
      otcMedications: [
        { genericName: "Paracetamol (Acetaminophen)", brandName: "Crocin / Dolo 650", standardDose: "500-650 mg", frequency: "Every 4-6 hours as needed", maxDailyDose: "3000 mg (3g)", contraindications: "Liver disease, chronic alcohol use", sideEffects: "Nausea, allergic reaction (rare)", avoidIf: "Liver impairment, allergy to paracetamol" },
        { genericName: "Ibuprofen", brandName: "Brufen", standardDose: "200-400 mg", frequency: "Every 6-8 hours with food", maxDailyDose: "1200 mg (OTC limit)", contraindications: "Peptic ulcer, kidney disease", sideEffects: "GI discomfort, dizziness", avoidIf: "Dengue suspected (increases bleeding risk), renal impairment, pregnancy" },
      ],
    },
    recommendedTests: [
      { testName: "Complete Blood Count (CBC)", reason: "To differentiate viral vs bacterial infection and check for dengue/malaria markers." },
      { testName: "Blood Culture", reason: "If fever persists >5 days to identify bacteremia." },
      { testName: "Urine Routine & Culture", reason: "To rule out urinary tract infection as a fever source." },
    ],
    emergencySigns: ["High fever (>103F) not responding to medication", "Breathing difficulty or chest pain", "Severe headache, stiff neck, or rash", "Confusion, drowsiness, or seizures", "Signs of dehydration (dry mouth, no urination, sunken eyes)"],
    preventiveAdvice: ["Maintain hand hygiene (wash hands frequently)", "Stay up to date with vaccinations", "Avoid close contact with sick individuals", "Maintain a balanced diet rich in vitamins C and D", "Ensure adequate sleep for immune health"],
    specialist: "General Physician",
    consultationReason: "A physician evaluates the source of fever through history, physical examination, and targeted diagnostics. They differentiate viral from bacterial causes (critical since antibiotics only work for bacterial infections). They assess for dangerous tropical infections (dengue, malaria, typhoid) common in India, and coordinate appropriate treatment and follow-up.",
    confidence: 88,
  },
  default: {
    chiefComplaint: "Patient reports symptoms requiring clinical evaluation and professional assessment.",
    differentialDiagnosis: [
      { condition: "Requires Clinical Evaluation", probability: "High", explanation: "The described symptoms need in-person assessment for accurate differential diagnosis." },
    ],
    severityAssessment: { level: "Moderate", emergencyRisk: false, redFlagSymptoms: ["Sudden onset of severe symptoms", "Difficulty breathing", "Chest pain", "Loss of consciousness", "Uncontrolled bleeding"] },
    immediateCare: {
      lifestyleRemedies: ["Rest and monitor symptoms closely", "Stay well-hydrated", "Maintain a symptom diary (onset, duration, triggers)", "Avoid self-medication without professional guidance", "Ensure adequate nutrition and sleep"],
      otcMedications: [
        { genericName: "Paracetamol (Acetaminophen)", brandName: "Crocin / Dolo 650", standardDose: "500 mg", frequency: "Every 6 hours if needed for pain/fever", maxDailyDose: "3000 mg", contraindications: "Liver disease", sideEffects: "Nausea (rare)", avoidIf: "Known allergy, liver conditions" },
      ],
    },
    recommendedTests: [
      { testName: "Complete Physical Examination", reason: "Comprehensive in-person assessment is the gold standard for accurate diagnosis." },
      { testName: "Basic Blood Panel (CBC, CMP)", reason: "Provides baseline health markers to identify infections, metabolic issues, or organ dysfunction." },
    ],
    emergencySigns: ["Sudden severe pain", "Difficulty breathing or chest tightness", "Loss of consciousness or confusion", "Uncontrolled bleeding or vomiting blood", "Signs of stroke (face drooping, arm weakness, speech difficulty)"],
    preventiveAdvice: ["Schedule regular health checkups", "Maintain a balanced diet and regular exercise", "Manage stress through mindfulness practices", "Get adequate sleep (7-8 hours)", "Stay up to date with preventive screenings"],
    specialist: "General Physician",
    consultationReason: "A primary care physician provides comprehensive initial evaluation, takes your full medical history, performs a physical examination, and orders relevant diagnostic tests. They rule out serious conditions, provide evidence-based treatment, and coordinate specialist referrals when needed.",
    confidence: 70,
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, apiKey, provider } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastMessage = messages[messages.length - 1]
    const userSymptoms = lastMessage.content

    // If user provided their own API key, use it with the specified provider
    if (apiKey) {
      try {
        let modelString = "google/gemini-2.5-flash-preview-05-20"

        if (provider === "gemini") {
          const google = createGoogleGenerativeAI({ apiKey })
          const { object } = await generateObject({
            model: google("gemini-2.5-flash-preview-05-20"),
            schema: clinicalSchema,
            prompt: `${CLINICAL_SYSTEM_PROMPT}\n\nPatient's reported symptoms: "${userSymptoms}"`,
          })
          return new Response(JSON.stringify(object), {
            headers: { "Content-Type": "application/json" },
          })
        }

        // For other providers via gateway
        const { object } = await generateObject({
          model: modelString,
          schema: clinicalSchema,
          prompt: `${CLINICAL_SYSTEM_PROMPT}\n\nPatient's reported symptoms: "${userSymptoms}"`,
        })
        return new Response(JSON.stringify(object), {
          headers: { "Content-Type": "application/json" },
        })
      } catch (aiError: any) {
        console.error("[v0] AI with user key failed:", aiError.message)
        return new Response(
          JSON.stringify({ error: "Invalid API key or AI service error. Please check your key and try again." }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    // No API key provided - try gateway first, then fallback
    try {
      const { object } = await generateObject({
        model: "google/gemini-2.5-flash-preview-05-20",
        schema: clinicalSchema,
        prompt: `${CLINICAL_SYSTEM_PROMPT}\n\nPatient's reported symptoms: "${userSymptoms}"`,
      })
      return new Response(JSON.stringify(object), {
        headers: { "Content-Type": "application/json" },
      })
    } catch (gatewayError: any) {
      console.error("[v0] Gateway failed, using fallback:", gatewayError.message)

      // Keyword matching fallback
      const symptomsLower = userSymptoms.toLowerCase()
      let matchedData = FALLBACK_DATABASE.default
      for (const [key, data] of Object.entries(FALLBACK_DATABASE)) {
        if (key !== "default" && symptomsLower.includes(key)) {
          matchedData = data
          break
        }
      }

      return new Response(JSON.stringify(matchedData), {
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("[v0] API Route Error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to process medical analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
