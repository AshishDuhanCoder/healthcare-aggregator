import { NextRequest } from "next/server"

interface OverpassElement {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function buildOverpassQuery(lat: number, lon: number, radiusMeters: number, query: string): string {
  const lowerQuery = query.toLowerCase()

  // Map user query to relevant OSM amenity/healthcare tags
  const tagFilters: string[] = []

  // Always search for hospitals and clinics
  tagFilters.push(`node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});`)
  tagFilters.push(`way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});`)
  tagFilters.push(`node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});`)
  tagFilters.push(`way["amenity"="clinic"](around:${radiusMeters},${lat},${lon});`)

  // Doctor-related queries
  if (lowerQuery.includes("doctor") || lowerQuery.includes("physician") || lowerQuery.includes("specialist")) {
    tagFilters.push(`node["amenity"="doctors"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["healthcare"="doctor"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`way["amenity"="doctors"](around:${radiusMeters},${lat},${lon});`)
  }

  // Lab/diagnostic queries
  if (lowerQuery.includes("lab") || lowerQuery.includes("test") || lowerQuery.includes("diagnostic") || lowerQuery.includes("pathology") || lowerQuery.includes("blood")) {
    tagFilters.push(`node["healthcare"="laboratory"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`way["healthcare"="laboratory"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["amenity"="laboratory"](around:${radiusMeters},${lat},${lon});`)
  }

  // Pharmacy/medicine queries
  if (lowerQuery.includes("pharmacy") || lowerQuery.includes("medicine") || lowerQuery.includes("med") || lowerQuery.includes("drug")) {
    tagFilters.push(`node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});`)
  }

  // Dentist
  if (lowerQuery.includes("dentist") || lowerQuery.includes("dental") || lowerQuery.includes("tooth")) {
    tagFilters.push(`node["amenity"="dentist"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`way["amenity"="dentist"](around:${radiusMeters},${lat},${lon});`)
  }

  // Eye care
  if (lowerQuery.includes("eye") || lowerQuery.includes("optician") || lowerQuery.includes("vision") || lowerQuery.includes("ophthalmol")) {
    tagFilters.push(`node["healthcare"="optometrist"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["shop"="optician"](around:${radiusMeters},${lat},${lon});`)
  }

  // Mental health
  if (lowerQuery.includes("mental") || lowerQuery.includes("psychiatr") || lowerQuery.includes("psycholog") || lowerQuery.includes("counsel") || lowerQuery.includes("therap")) {
    tagFilters.push(`node["healthcare"="psychotherapist"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["healthcare"="counselling"](around:${radiusMeters},${lat},${lon});`)
  }

  // If only generic query, also add doctors and pharmacies
  if (tagFilters.length <= 4) {
    tagFilters.push(`node["amenity"="doctors"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});`)
    tagFilters.push(`node["healthcare"="laboratory"](around:${radiusMeters},${lat},${lon});`)
  }

  return `[out:json][timeout:15];(${tagFilters.join("")});out center body;`
}

function categorizeProvider(tags: Record<string, string>): string {
  const amenity = tags.amenity || ""
  const healthcare = tags.healthcare || ""
  if (amenity === "hospital" || healthcare === "hospital") return "Hospital"
  if (amenity === "clinic" || healthcare === "clinic") return "Clinic"
  if (amenity === "doctors" || healthcare === "doctor") return "Doctor"
  if (amenity === "pharmacy") return "Pharmacy"
  if (amenity === "dentist" || healthcare === "dentist") return "Dentist"
  if (healthcare === "laboratory" || amenity === "laboratory") return "Laboratory"
  if (healthcare === "optometrist") return "Eye Care"
  if (healthcare === "psychotherapist" || healthcare === "counselling") return "Mental Health"
  return "Healthcare"
}

function relevanceScore(tags: Record<string, string>, query: string): number {
  const lowerQuery = query.toLowerCase()
  const name = (tags.name || "").toLowerCase()
  let score = 0

  // Name match is highest relevance
  if (name && lowerQuery.split(/\s+/).some((word) => name.includes(word))) score += 50

  // Specialty match
  const specialty = (tags["healthcare:speciality"] || tags.speciality || tags.specialty || "").toLowerCase()
  if (specialty && lowerQuery.split(/\s+/).some((word) => specialty.includes(word))) score += 40

  // Type match
  const category = categorizeProvider(tags).toLowerCase()
  if (lowerQuery.includes(category)) score += 30

  // Has website/phone (better data quality)
  if (tags.website || tags.phone || tags["contact:phone"]) score += 10

  // Has opening hours
  if (tags.opening_hours) score += 5

  return score
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = Number.parseFloat(searchParams.get("lat") || "0")
  const lon = Number.parseFloat(searchParams.get("lon") || "0")
  const radius = Number.parseInt(searchParams.get("radius") || "10000", 10)
  const query = searchParams.get("q") || ""
  const limit = Number.parseInt(searchParams.get("limit") || "3", 10)

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "Location coordinates required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const overpassQuery = buildOverpassQuery(lat, lon, radius, query)
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!res.ok) {
      throw new Error(`Overpass API returned ${res.status}`)
    }

    const data = await res.json()
    const elements: OverpassElement[] = data.elements || []

    const providers = elements
      .filter((el) => el.tags?.name)
      .map((el) => {
        const elLat = el.lat || el.center?.lat || 0
        const elLon = el.lon || el.center?.lon || 0
        const distance = haversineDistance(lat, lon, elLat, elLon)
        const tags = el.tags || {}
        return {
          id: el.id,
          name: tags.name || "Unknown Provider",
          type: categorizeProvider(tags),
          specialty: tags["healthcare:speciality"] || tags.speciality || tags.specialty || null,
          address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", ") || null,
          phone: tags.phone || tags["contact:phone"] || null,
          website: tags.website || tags["contact:website"] || null,
          openingHours: tags.opening_hours || null,
          distance: Math.round(distance * 10) / 10,
          lat: elLat,
          lon: elLon,
          relevance: relevanceScore(tags, query),
          operator: tags.operator || null,
          emergency: tags.emergency === "yes",
        }
      })
      // Sort by relevance first, then by distance
      .sort((a, b) => {
        const relevanceDiff = b.relevance - a.relevance
        if (relevanceDiff !== 0) return relevanceDiff
        return a.distance - b.distance
      })
      .slice(0, limit)

    return new Response(
      JSON.stringify({
        providers,
        total: elements.filter((el) => el.tags?.name).length,
        radius: radius / 1000,
        location: { lat, lon },
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error("[v0] Find care API error:", error.message)
    return new Response(
      JSON.stringify({ error: "Unable to fetch care providers. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
