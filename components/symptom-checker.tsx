"use client"

import type React from "react"
import { useState } from "react"
import {
  Sparkles,
  Brain,
  AlertCircle,
  Pill,
  ChevronLeft,
  Shield,
  Activity,
  TestTube,
  Siren,
  HeartPulse,
  Key,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useApiKey } from "@/components/api-key-provider"

type OtcMedication = {
  genericName: string
  brandName: string
  standardDose: string
  frequency: string
  maxDailyDose: string
  contraindications: string
  sideEffects: string
  avoidIf: string
}

type DifferentialDiagnosis = {
  condition: string
  probability: "High" | "Moderate" | "Low"
  explanation: string
}

type RecommendedTest = {
  testName: string
  reason: string
}

type ClinicalResult = {
  chiefComplaint: string
  differentialDiagnosis: DifferentialDiagnosis[]
  severityAssessment: {
    level: "Mild" | "Moderate" | "Severe"
    emergencyRisk: boolean
    redFlagSymptoms: string[]
  }
  immediateCare: {
    lifestyleRemedies: string[]
    otcMedications: OtcMedication[]
  }
  recommendedTests: RecommendedTest[]
  emergencySigns: string[]
  preventiveAdvice: string[]
  specialist: string
  consultationReason: string
  confidence: number
  error?: string
}

export function SymptomChecker() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ClinicalResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [tempApiKey, setTempApiKey] = useState("")
  const [expandedMed, setExpandedMed] = useState<number | null>(null)

  const { apiKey, provider, setApiKey, removeApiKey, hasApiKey } = useApiKey()

  const medicalDisclaimer = (
    <div className="flex items-start gap-2 text-[10px] text-muted-foreground mt-6 leading-tight">
      <AlertCircle className="h-3 w-3 shrink-0" />
      <p>
        This AI guidance is for informational purposes only and does not replace a licensed medical professional. For
        persistent, worsening, or severe symptoms, consult a qualified doctor immediately.
      </p>
    </div>
  )

  const onAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
          apiKey: apiKey || undefined,
          provider: provider || "gemini",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process analysis.")
      }

      setResult(data)
      setShowAnalysis(true)
    } catch (err: any) {
      setError(err.message || "Unable to analyze symptoms. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim(), "gemini")
      setShowApiKeyModal(false)
      setTempApiKey("")
    }
  }

  const severityColor = (level: string) => {
    switch (level) {
      case "Mild": return "bg-green-50 text-green-700 border-green-200"
      case "Moderate": return "bg-amber-50 text-amber-700 border-amber-200"
      case "Severe": return "bg-red-50 text-red-700 border-red-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const probabilityColor = (prob: string) => {
    switch (prob) {
      case "High": return "bg-red-50 text-red-700"
      case "Moderate": return "bg-amber-50 text-amber-700"
      case "Low": return "bg-blue-50 text-blue-700"
      default: return "bg-muted text-muted-foreground"
    }
  }

  // API Key Modal
  if (showApiKeyModal) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/10 overflow-hidden bg-card">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">Configure AI API Key</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowApiKeyModal(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-muted-foreground">
            Add your Google Gemini API key for enhanced AI-powered clinical analysis. Get a free key from{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Google AI Studio
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">API Key Connected</p>
                  <p className="text-xs text-green-700">
                    {"Provider: Google Gemini | Key: "}
                    {apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : ""}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl bg-transparent" onClick={() => { removeApiKey(); setShowApiKeyModal(false) }}>
                Remove API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="api-key-input">Google Gemini API Key</label>
                <Input
                  id="api-key-input"
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">How to get your free API key:</p>
                <p>1. Visit Google AI Studio (aistudio.google.com/apikey)</p>
                <p>2. Sign in with your Google account</p>
                <p>3. Click "Create API Key" and copy it</p>
                <p>4. Paste it above and click Save</p>
              </div>
              <Button className="w-full h-12 rounded-xl font-bold" onClick={handleSaveApiKey} disabled={!tempApiKey.trim()}>
                Save API Key
              </Button>
            </div>
          )}

          <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-tight pt-2 border-t">
            <Shield className="h-3 w-3 shrink-0" />
            <p>Your API key is stored only in your browser session and is never saved on our servers. It is cleared when you close the tab.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Clinical Analysis Results View
  if (showAnalysis && result) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          variant="ghost"
          onClick={() => { setShowAnalysis(false); setResult(null) }}
          className="mb-2 hover:bg-primary/5 text-muted-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> New Analysis
        </Button>

        <Card className="shadow-2xl border-primary/10 overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-primary flex items-center gap-1 text-primary-foreground">
                <Sparkles className="h-3 w-3" /> CLINICAL ANALYSIS
              </Badge>
              <Badge variant="outline" className={severityColor(result.severityAssessment?.level || "Moderate")}>
                {result.severityAssessment?.level || "Moderate"} Severity
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold">Clinical Assessment Report</CardTitle>
            <CardDescription>{result.chiefComplaint}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Emergency Warning */}
            {result.severityAssessment?.emergencyRisk && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                <p className="font-bold text-red-800 flex items-center gap-2 text-sm">
                  <Siren className="h-4 w-4" /> EMERGENCY RISK DETECTED
                </p>
                <p className="text-red-700 text-sm mt-1">Please seek immediate medical attention or call emergency services.</p>
              </div>
            )}

            {/* Differential Diagnosis */}
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-primary" /> Possible Clinical Causes
              </h4>
              <div className="space-y-2">
                {result.differentialDiagnosis?.map((dx, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-foreground">{dx.condition}</span>
                      <Badge variant="secondary" className={`text-[10px] ${probabilityColor(dx.probability)}`}>
                        {dx.probability} Probability
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{dx.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flag Symptoms */}
            {result.severityAssessment?.redFlagSymptoms?.length > 0 && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2 text-amber-900">
                  <AlertCircle className="h-4 w-4" /> Red Flag Symptoms to Watch
                </h4>
                <ul className="space-y-1">
                  {result.severityAssessment.redFlagSymptoms.map((flag, i) => (
                    <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">-</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lifestyle Remedies */}
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2 text-sm">
                <HeartPulse className="h-4 w-4 text-primary" /> Lifestyle and Home Remedies
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.immediateCare?.lifestyleRemedies?.map((remedy, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 bg-primary/5 text-primary border-primary/10 text-xs">
                    {remedy}
                  </Badge>
                ))}
              </div>
            </div>

            {/* OTC Medications */}
            {result.immediateCare?.otcMedications?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-sm">
                  <Pill className="h-4 w-4 text-primary" /> OTC Medication Options
                </h4>
                <div className="space-y-2">
                  {result.immediateCare.otcMedications.map((med, i) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedMed(expandedMed === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div>
                          <span className="font-semibold text-sm text-foreground">{med.genericName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({med.brandName})</span>
                        </div>
                        {expandedMed === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {expandedMed === i && (
                        <div className="px-3 pb-3 border-t border-border bg-muted/10">
                          <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
                            <div><span className="font-semibold text-foreground">Dose:</span> <span className="text-muted-foreground">{med.standardDose}</span></div>
                            <div><span className="font-semibold text-foreground">Frequency:</span> <span className="text-muted-foreground">{med.frequency}</span></div>
                            <div><span className="font-semibold text-foreground">Max Daily:</span> <span className="text-muted-foreground">{med.maxDailyDose}</span></div>
                            <div><span className="font-semibold text-foreground">Avoid if:</span> <span className="text-muted-foreground">{med.avoidIf}</span></div>
                          </div>
                          <div className="mt-2 text-xs space-y-1">
                            <p><span className="font-semibold text-foreground">Contraindications:</span> <span className="text-muted-foreground">{med.contraindications}</span></p>
                            <p><span className="font-semibold text-foreground">Side Effects:</span> <span className="text-muted-foreground">{med.sideEffects}</span></p>
                          </div>
                          <p className="mt-2 text-[10px] text-amber-700 font-medium italic">Do not self-medicate without consulting a healthcare professional.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Tests */}
            {result.recommendedTests?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-sm">
                  <TestTube className="h-4 w-4 text-primary" /> Recommended Medical Tests
                </h4>
                <div className="space-y-2">
                  {result.recommendedTests.map((test, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="font-semibold text-sm text-foreground">{test.testName}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{test.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When to Seek Emergency Care */}
            {result.emergencySigns?.length > 0 && (
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-200/30 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2 text-red-800">
                  <Siren className="h-4 w-4" /> When to Seek Immediate Medical Attention
                </h4>
                <ul className="space-y-1">
                  {result.emergencySigns.map((sign, i) => (
                    <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">-</span> {sign}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Consultation Reason */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2 text-primary">
                <Activity className="h-4 w-4" /> Why See a {result.specialist}?
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.consultationReason}</p>
            </div>

            {/* Preventive Advice */}
            {result.preventiveAdvice?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" /> Preventive Advice
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.preventiveAdvice.map((advice, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1.5 bg-muted/30 text-xs">
                      {advice}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
                Book {result.specialist} Appointment
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold bg-transparent">
                Order Diagnostic Tests
              </Button>
            </div>

            {medicalDisclaimer}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Input Form View
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/10 overflow-hidden bg-card">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-primary hover:bg-primary font-semibold tracking-wide flex items-center gap-1 text-primary-foreground">
            <Sparkles className="h-3 w-3" /> CLINICAL COMPANION
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl text-xs gap-1.5 bg-transparent ${hasApiKey ? "border-green-300 text-green-700 hover:bg-green-50" : "border-border"}`}
            onClick={() => setShowApiKeyModal(true)}
          >
            <Key className="h-3 w-3" />
            {hasApiKey ? "API Key Connected" : "Add API Key"}
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold">AI Clinical Decision Support</CardTitle>
        <CardDescription className="text-muted-foreground text-balance">
          Describe your symptoms for a structured clinical assessment including differential diagnosis, recommended
          tests, OTC medication options, and specialist referral guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onAnalyze} className="space-y-6">
          <div className="relative">
            <textarea
              className="w-full h-32 p-4 bg-muted/30 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-base text-foreground"
              placeholder="Describe your symptoms in detail (e.g., I have been experiencing severe headache on the left side with nausea and light sensitivity for the past 3 days)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Brain className="h-3 w-3" /> Clinical NLP Engine
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-semibold shadow-lg transition-all"
            size="lg"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? "Generating Clinical Assessment..." : "Analyze My Health"}
          </Button>
        </form>

        {!hasApiKey && (
          <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground flex items-start gap-2">
            <Key className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              For enhanced AI analysis, add your free{" "}
              <button type="button" onClick={() => setShowApiKeyModal(true)} className="text-primary font-semibold hover:underline">
                Google Gemini API key
              </button>
              . Without a key, the system uses a curated medical knowledge base.
            </p>
          </div>
        )}

        {medicalDisclaimer}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
