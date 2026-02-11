"use client"

import { useState, useEffect } from "react"
import { Search, Stethoscope, Beaker, Pill, Shield, ArrowRight, Clock, MapPin } from "lucide-react"
import { SymptomChecker } from "@/components/symptom-checker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ComparisonView } from "@/components/comparison-view"
import { FindCareResults } from "@/components/find-care-results"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SignInGate } from "@/components/sign-in-gate"
import { useAuth } from "@/components/auth-provider"

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [location, setLocation] = useState<string>("Detecting location...")
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCoords({ lat: latitude, lon: longitude })
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            )
            const data = await res.json()
            const city = data.address.city || data.address.town || data.address.village || "Unknown City"
            setLocation(city)
          } catch {
            setLocation("Location Available")
          }
        },
        () => setLocation("Location Access Denied"),
      )
    } else {
      setLocation("Location Not Supported")
    }
  }, [isAuthenticated])

  const handleFindCare = () => {
    if (!coords) {
      alert("Please allow location access to find care providers near you.")
      return
    }
    setIsSearching(true)
    setShowResults(false)
    // Small delay for UX feedback
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 400)
  }

  // Sign-in gate: show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return <SignInGate />
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium rounded-full">
                Neutral & Independent - Price Comparison
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
                Your Health, Our Priority. <span className="text-primary">Compare & Save.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
                Find the best doctors, labs, and medicines at the lowest prices. India's first neutral healthcare
                aggregator powered by AI.
              </p>

              <div className="flex flex-col md:flex-row items-center gap-3 p-2 bg-card rounded-2xl shadow-xl border border-border max-w-3xl mx-auto">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors, symptoms, or labs..."
                    className="pl-10 h-12 border-none shadow-none focus-visible:ring-0 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleFindCare() }}
                  />
                </div>
                <div className="flex items-center gap-2 border-l border-border pl-4 pr-2 w-full md:w-auto">
                  <MapPin className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-muted-foreground font-medium text-sm whitespace-nowrap min-w-[120px] text-left">
                    {location}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full md:w-auto px-8 h-12 rounded-xl text-base font-semibold"
                  onClick={handleFindCare}
                  disabled={isSearching}
                >
                  {isSearching ? "Searching..." : "Find Care"}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Verified Partners</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent" />
                  <span>4.8/5 Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background Accents */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        </section>

        {/* Conditional Results Display */}
        {showResults && coords && (
          <FindCareResults
            query={searchQuery}
            coords={coords}
            locationName={location}
          />
        )}

        {/* Quick Services */}
        <section className="py-12 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Stethoscope, label: "Find Doctors", color: "bg-blue-50 text-blue-600" },
                { icon: Beaker, label: "Lab Tests", color: "bg-teal-50 text-teal-600" },
                { icon: Pill, label: "Medicines", color: "bg-purple-50 text-purple-600" },
                { icon: Shield, label: "Health Plans", color: "bg-emerald-50 text-emerald-600" },
              ].map((service, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${service.color}`}>
                      <service.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-foreground">{service.label}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Differentiation & Comparison Section */}
        <section className="py-20">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-start gap-12">
              <div className="flex-1 lg:sticky lg:top-32 space-y-6">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                  Powered by Clinical NLP
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Not Just Search. <br />
                  <span className="text-primary text-accent">Clinical Intelligence.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our AI-driven clinical decision support system analyzes your symptoms to provide structured medical
                  guidance, differential diagnosis, and specialist recommendations.
                </p>
                <ul className="space-y-4">
                  {[
                    "Structured clinical assessment with differential diagnosis",
                    "Safe OTC medication suggestions with full dosage info",
                    "Recommended diagnostic tests with clinical reasoning",
                    "Emergency risk detection and red flag identification",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <span className="text-foreground/80 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  Try AI Clinical Companion
                </Button>
              </div>
              <div className="flex-1 w-full space-y-12">
                <SymptomChecker />
                <div className="p-8 bg-card rounded-3xl border border-border shadow-xl">
                  <ComparisonView />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
