"use client"

import { useState, useCallback, useEffect } from "react"
import { MapPin, Phone, Globe, Clock, AlertTriangle, Navigation, ChevronDown, Loader2, Building2, Stethoscope, Beaker, Pill, Heart, Eye, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CareProvider {
  id: number
  name: string
  type: string
  specialty: string | null
  address: string | null
  phone: string | null
  website: string | null
  openingHours: string | null
  distance: number
  lat: number
  lon: number
  relevance: number
  operator: string | null
  emergency: boolean
}

interface FindCareResultsProps {
  query: string
  coords: { lat: number; lon: number }
  locationName: string
}

const DISTANCE_OPTIONS = [
  { label: "10 km", value: 10000 },
  { label: "20 km", value: 20000 },
  { label: "50 km", value: 50000 },
  { label: "100 km", value: 100000 },
]

function getTypeIcon(type: string) {
  switch (type) {
    case "Hospital": return <Building2 className="h-5 w-5" />
    case "Clinic": return <Stethoscope className="h-5 w-5" />
    case "Doctor": return <Stethoscope className="h-5 w-5" />
    case "Pharmacy": return <Pill className="h-5 w-5" />
    case "Laboratory": return <Beaker className="h-5 w-5" />
    case "Dentist": return <Heart className="h-5 w-5" />
    case "Eye Care": return <Eye className="h-5 w-5" />
    case "Mental Health": return <Brain className="h-5 w-5" />
    default: return <Building2 className="h-5 w-5" />
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Hospital": return "bg-red-50 text-red-700 border-red-200"
    case "Clinic": return "bg-blue-50 text-blue-700 border-blue-200"
    case "Doctor": return "bg-teal-50 text-teal-700 border-teal-200"
    case "Pharmacy": return "bg-green-50 text-green-700 border-green-200"
    case "Laboratory": return "bg-amber-50 text-amber-700 border-amber-200"
    case "Dentist": return "bg-purple-50 text-purple-700 border-purple-200"
    case "Eye Care": return "bg-indigo-50 text-indigo-700 border-indigo-200"
    case "Mental Health": return "bg-pink-50 text-pink-700 border-pink-200"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

export function FindCareResults({ query, coords, locationName }: FindCareResultsProps) {
  const [providers, setProviders] = useState<CareProvider[]>([])
  const [totalFound, setTotalFound] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRadius, setActiveRadius] = useState(10000)
  const [displayLimit, setDisplayLimit] = useState(3)
  const [hasSearched, setHasSearched] = useState(false)

  const fetchProviders = useCallback(async (radius: number, limit: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        lat: coords.lat.toString(),
        lon: coords.lon.toString(),
        radius: radius.toString(),
        q: query,
        limit: limit.toString(),
      })
      const res = await fetch(`/api/find-care?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Search failed")

      setProviders(data.providers || [])
      setTotalFound(data.total || 0)
      setHasSearched(true)
    } catch (err: any) {
      setError(err.message || "Unable to fetch care providers")
    } finally {
      setLoading(false)
    }
  }, [coords, query])

  const handleRadiusChange = (radius: number) => {
    setActiveRadius(radius)
    setDisplayLimit(3)
    fetchProviders(radius, 20)
  }

  const handleShowMore = () => {
    const newLimit = displayLimit + 5
    setDisplayLimit(newLimit)
  }

  // Auto-fetch on mount
  useEffect(() => {
    fetchProviders(activeRadius, 20)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayedProviders = providers.slice(0, displayLimit)

  return (
    <section className="py-12 bg-card animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Care Options {locationName !== "Detecting location..." ? `near ${locationName}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? "Searching real-time healthcare providers..."
                : hasSearched
                  ? `${totalFound} provider${totalFound !== 1 ? "s" : ""} found within ${activeRadius / 1000} km`
                  : "Fetching nearby providers..."}
            </p>
          </div>
          <Badge variant="outline" className="whitespace-nowrap">
            Top {Math.min(displayLimit, providers.length)} of {totalFound} results
          </Badge>
        </div>

        {/* Distance Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-sm font-medium text-muted-foreground mr-1">Search radius:</span>
          {DISTANCE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={activeRadius === opt.value ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs font-semibold px-4"
              onClick={() => handleRadiusChange(opt.value)}
              disabled={loading}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Scanning healthcare providers within {activeRadius / 1000} km...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-destructive/5 rounded-xl border border-destructive/20 mb-6">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchProviders(activeRadius, 20)}>
              Retry
            </Button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && hasSearched && providers.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">No providers found within {activeRadius / 1000} km</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Try expanding your search radius or modifying your search terms.
            </p>
            {activeRadius < 100000 && (
              <Button
                variant="outline"
                onClick={() => handleRadiusChange(Math.min(activeRadius * 2, 100000))}
                className="mt-2"
              >
                Expand to {Math.min(activeRadius * 2, 100000) / 1000} km
              </Button>
            )}
          </div>
        )}

        {/* Provider Cards */}
        {!loading && !error && displayedProviders.length > 0 && (
          <div className="grid gap-4">
            {displayedProviders.map((provider, i) => (
              <Card
                key={provider.id}
                className={`border-border hover:border-primary/30 transition-all shadow-sm overflow-hidden group ${i === 0 ? "ring-2 ring-primary/20" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Provider Info */}
                    <div className="p-6 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className={`text-[11px] font-bold uppercase tracking-wider ${getTypeColor(provider.type)}`}>
                          <span className="mr-1.5 inline-flex">{getTypeIcon(provider.type)}</span>
                          {provider.type}
                        </Badge>
                        {provider.emergency && (
                          <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Emergency
                          </Badge>
                        )}
                        {i === 0 && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                            Best Match
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-1">{provider.name}</h3>

                      {provider.specialty && (
                        <p className="text-sm text-primary font-medium mb-2">Specialty: {provider.specialty}</p>
                      )}

                      {provider.operator && (
                        <p className="text-sm text-muted-foreground mb-2">Operated by: {provider.operator}</p>
                      )}

                      <div className="flex flex-col gap-2 mt-3">
                        {provider.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
                            <span>{provider.address}</span>
                          </div>
                        )}
                        {provider.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0 text-primary/60" />
                            <a href={`tel:${provider.phone}`} className="hover:text-primary underline-offset-2 hover:underline">
                              {provider.phone}
                            </a>
                          </div>
                        )}
                        {provider.website && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-4 w-4 shrink-0 text-primary/60" />
                            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline-offset-2 hover:underline truncate max-w-[250px]">
                              {provider.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          </div>
                        )}
                        {provider.openingHours && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0 text-primary/60" />
                            <span>{provider.openingHours}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Distance & Actions Panel */}
                    <div className="p-6 bg-muted/20 md:w-52 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-border gap-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="text-2xl font-bold text-foreground">{provider.distance}</span>
                          <span className="text-sm text-muted-foreground font-medium">km</span>
                        </div>
                        <p className="text-xs text-muted-foreground">from your location</p>
                      </div>

                      <Button
                        className="w-full rounded-xl font-bold transition-transform group-hover:scale-105"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lon}`,
                            "_blank",
                          )
                        }}
                      >
                        Get Directions
                      </Button>

                      {provider.phone && (
                        <Button
                          variant="outline"
                          className="w-full rounded-xl font-semibold"
                          onClick={() => {
                            window.open(`tel:${provider.phone}`, "_self")
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1.5" /> Call
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {!loading && !error && providers.length > displayLimit && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" className="rounded-full px-8 gap-2" onClick={handleShowMore}>
              <ChevronDown className="h-4 w-4" />
              Show More Providers ({providers.length - displayLimit} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
