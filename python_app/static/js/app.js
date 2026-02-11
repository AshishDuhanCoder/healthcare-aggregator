/**
 * HealthAgg - Frontend JavaScript
 * Handles geolocation, Find Care search, Symptom Checker, and API key management.
 */

// ──────────────────────────────────────────────
// Global state
// ──────────────────────────────────────────────
let userCoords = null;
let currentRadius = 10000;
let allProviders = [];
let displayLimit = 3;
let storedApiKey = sessionStorage.getItem("healthagg_api_key") || "";

// ──────────────────────────────────────────────
// Geolocation
// ──────────────────────────────────────────────
(function initLocation() {
  if (!("geolocation" in navigator)) {
    document.getElementById("location-text").textContent = "Location Not Supported";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lon}`
        );
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || "Location Available";
        document.getElementById("location-text").textContent = city;
      } catch {
        document.getElementById("location-text").textContent = "Location Available";
      }
    },
    () => {
      document.getElementById("location-text").textContent = "Location Access Denied";
    }
  );
})();

// Init API key UI
(function initApiKey() {
  updateApiKeyUI();
})();

// Enter key on search
document.getElementById("care-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleFindCare();
});

// ──────────────────────────────────────────────
// Find Care
// ──────────────────────────────────────────────
function handleFindCare() {
  if (!userCoords) {
    alert("Please allow location access to find care providers near you.");
    return;
  }
  displayLimit = 3;
  document.getElementById("care-results").classList.remove("hidden");
  fetchCareProviders();
}

async function fetchCareProviders() {
  const query = document.getElementById("care-search").value.trim();
  const section = document.getElementById("care-results");
  const loading = document.getElementById("care-loading");
  const error = document.getElementById("care-error");
  const empty = document.getElementById("care-empty");
  const cards = document.getElementById("care-cards");
  const showMoreWrap = document.getElementById("show-more-wrap");

  loading.classList.remove("hidden");
  error.classList.add("hidden");
  empty.classList.add("hidden");
  cards.innerHTML = "";
  showMoreWrap.classList.add("hidden");

  try {
    const params = new URLSearchParams({
      lat: userCoords.lat,
      lon: userCoords.lon,
      radius: currentRadius,
      q: query,
      limit: 50,
    });
    const res = await fetch(`/api/find-care?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Search failed");

    allProviders = data.providers || [];
    const total = data.total || 0;
    const locationName = document.getElementById("location-text").textContent;

    document.getElementById("results-title").textContent =
      locationName !== "Detecting location..." ? `Care Options near ${locationName}` : "Care Options";
    document.getElementById("results-subtitle").textContent =
      `${total} provider${total !== 1 ? "s" : ""} found within ${currentRadius / 1000} km`;

    renderProviders();
  } catch (err) {
    error.classList.remove("hidden");
    document.getElementById("care-error-text").textContent = err.message || "Unable to fetch care providers";
  } finally {
    loading.classList.add("hidden");
  }
}

function renderProviders() {
  const cards = document.getElementById("care-cards");
  const showMoreWrap = document.getElementById("show-more-wrap");
  const empty = document.getElementById("care-empty");

  cards.innerHTML = "";

  if (allProviders.length === 0) {
    empty.classList.remove("hidden");
    showMoreWrap.classList.add("hidden");
    document.getElementById("results-badge").textContent = "0 results";
    return;
  }

  empty.classList.add("hidden");
  const visible = allProviders.slice(0, displayLimit);

  document.getElementById("results-badge").textContent =
    `Top ${Math.min(displayLimit, allProviders.length)} of ${allProviders.length} results`;

  visible.forEach((p, i) => {
    cards.insertAdjacentHTML("beforeend", providerCardHTML(p, i));
  });

  if (allProviders.length > displayLimit) {
    showMoreWrap.classList.remove("hidden");
    document.getElementById("show-more-text").textContent =
      `Show More Providers (${allProviders.length - displayLimit} remaining)`;
  } else {
    showMoreWrap.classList.add("hidden");
  }
}

function showMoreProviders() {
  displayLimit += 5;
  renderProviders();
}

function changeRadius(radius) {
  currentRadius = radius;
  displayLimit = 3;
  document.querySelectorAll(".radius-btn").forEach((btn) => {
    if (parseInt(btn.dataset.radius) === radius) {
      btn.className = "radius-btn px-4 py-1.5 text-xs font-semibold rounded-full border transition bg-primary text-white border-primary";
    } else {
      btn.className = "radius-btn px-4 py-1.5 text-xs font-semibold rounded-full border transition bg-white text-foreground border-border hover:border-primary";
    }
  });
  fetchCareProviders();
}

function providerCardHTML(p, index) {
  const typeIcons = {
    Hospital: "fa-hospital", Clinic: "fa-stethoscope", Doctor: "fa-user-md",
    Pharmacy: "fa-pills", Laboratory: "fa-flask", Dentist: "fa-tooth",
    "Eye Care": "fa-eye", "Mental Health": "fa-brain", Healthcare: "fa-hospital",
  };
  const typeColors = {
    Hospital: "bg-red-50 text-red-700 border-red-200",
    Clinic: "bg-blue-50 text-blue-700 border-blue-200",
    Doctor: "bg-teal-50 text-teal-700 border-teal-200",
    Pharmacy: "bg-green-50 text-green-700 border-green-200",
    Laboratory: "bg-amber-50 text-amber-700 border-amber-200",
    Dentist: "bg-purple-50 text-purple-700 border-purple-200",
    "Eye Care": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Mental Health": "bg-pink-50 text-pink-700 border-pink-200",
    Healthcare: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const icon = typeIcons[p.type] || "fa-hospital";
  const color = typeColors[p.type] || typeColors.Healthcare;
  const ring = index === 0 ? "ring-2 ring-primary/20" : "";

  let details = "";
  if (p.address) details += `<div class="flex items-center gap-2 text-sm text-muted-foreground"><i class="fas fa-map-marker-alt text-primary/60 flex-shrink-0"></i><span>${esc(p.address)}</span></div>`;
  if (p.phone) details += `<div class="flex items-center gap-2 text-sm text-muted-foreground"><i class="fas fa-phone text-primary/60 flex-shrink-0"></i><a href="tel:${esc(p.phone)}" class="hover:text-primary hover:underline">${esc(p.phone)}</a></div>`;
  if (p.website) details += `<div class="flex items-center gap-2 text-sm text-muted-foreground"><i class="fas fa-globe text-primary/60 flex-shrink-0"></i><a href="${esc(p.website)}" target="_blank" rel="noopener" class="hover:text-primary hover:underline truncate max-w-[250px]">${esc(p.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></div>`;
  if (p.openingHours) details += `<div class="flex items-center gap-2 text-sm text-muted-foreground"><i class="fas fa-clock text-primary/60 flex-shrink-0"></i><span>${esc(p.openingHours)}</span></div>`;

  return `
  <div class="border border-border hover:border-primary/30 rounded-2xl transition-all shadow-sm overflow-hidden group ${ring}">
    <div class="flex flex-col md:flex-row">
      <div class="p-6 flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${color}">
            <i class="fas ${icon}"></i> ${esc(p.type)}
          </span>
          ${p.emergency ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 rounded-full"><i class="fas fa-exclamation-triangle"></i> Emergency</span>' : ""}
          ${index === 0 ? '<span class="inline-flex px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">Best Match</span>' : ""}
        </div>
        <h3 class="text-lg font-bold text-foreground mb-1">${esc(p.name)}</h3>
        ${p.specialty ? `<p class="text-sm text-primary font-medium mb-2">Specialty: ${esc(p.specialty)}</p>` : ""}
        ${p.operator ? `<p class="text-sm text-muted-foreground mb-2">Operated by: ${esc(p.operator)}</p>` : ""}
        <div class="flex flex-col gap-2 mt-3">${details}</div>
      </div>
      <div class="p-6 bg-muted/20 md:w-52 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-border gap-3">
        <div class="text-center">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <i class="fas fa-location-arrow text-primary text-sm"></i>
            <span class="text-2xl font-bold text-foreground">${p.distance}</span>
            <span class="text-sm text-muted-foreground font-medium">km</span>
          </div>
          <p class="text-xs text-muted-foreground">from your location</p>
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener"
          class="w-full py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 text-sm text-center transition-transform group-hover:scale-105 block">
          Get Directions
        </a>
        ${p.phone ? `<a href="tel:${esc(p.phone)}" class="w-full py-2.5 rounded-xl font-semibold border border-border hover:bg-muted text-sm text-center transition flex items-center justify-center gap-1.5"><i class="fas fa-phone text-xs"></i> Call</a>` : ""}
      </div>
    </div>
  </div>`;
}

// ──────────────────────────────────────────────
// Symptom Checker
// ──────────────────────────────────────────────
async function analyzeSymptoms(e) {
  e.preventDefault();
  const input = document.getElementById("symptoms-input").value.trim();
  if (!input) return;

  const btn = document.getElementById("analyze-btn");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Analyzing...';

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: input, apiKey: storedApiKey || "" }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Analysis failed");

    showResults(data);
  } catch (err) {
    alert(err.message || "Unable to analyze symptoms. Please try again.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-brain"></i> <span>Analyze Symptoms</span>';
  }
}

function showResults(r) {
  document.getElementById("checker-input").classList.add("hidden");
  document.getElementById("checker-results").classList.remove("hidden");

  const sevColors = { Mild: "bg-green-50 text-green-700 border-green-200", Moderate: "bg-amber-50 text-amber-700 border-amber-200", Severe: "bg-red-50 text-red-700 border-red-200" };
  const probColors = { High: "bg-red-50 text-red-700", Moderate: "bg-amber-50 text-amber-700", Low: "bg-blue-50 text-blue-700" };
  const sevLevel = r.severityAssessment?.level || "Moderate";

  let html = `
  <div class="bg-primary/5 border-b border-primary/10 p-6">
    <div class="flex items-center justify-between mb-3">
      <span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-primary text-white">
        <i class="fas fa-sparkles text-[10px]"></i> CLINICAL ANALYSIS
      </span>
      <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full border ${sevColors[sevLevel] || ""}">${sevLevel} Severity</span>
    </div>
    <h3 class="text-lg font-bold text-foreground">Clinical Assessment Report</h3>
    <p class="text-sm text-muted-foreground mt-1">${esc(r.chiefComplaint)}</p>
  </div>
  <div class="p-6 space-y-6">`;

  // Emergency warning
  if (r.severityAssessment?.emergencyRisk) {
    html += `<div class="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
      <p class="font-bold text-red-800 flex items-center gap-2 text-sm"><i class="fas fa-ambulance"></i> EMERGENCY RISK DETECTED</p>
      <p class="text-red-700 text-sm mt-1">Please seek immediate medical attention or call emergency services.</p>
    </div>`;
  }

  // Differential diagnosis
  if (r.differentialDiagnosis?.length) {
    html += `<div class="space-y-3"><h4 class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-brain text-primary"></i> Possible Clinical Causes</h4><div class="space-y-2">`;
    r.differentialDiagnosis.forEach((dx) => {
      html += `<div class="p-3 bg-muted/30 rounded-xl border border-border">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-sm text-foreground">${esc(dx.condition)}</span>
          <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full ${probColors[dx.probability] || ""}">${dx.probability} Probability</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">${esc(dx.explanation)}</p>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Red flags
  if (r.severityAssessment?.redFlagSymptoms?.length) {
    html += `<div class="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-2">
      <h4 class="font-bold text-sm flex items-center gap-2 text-amber-900"><i class="fas fa-exclamation-circle"></i> Red Flag Symptoms to Watch</h4>
      <ul class="space-y-1">`;
    r.severityAssessment.redFlagSymptoms.forEach((f) => {
      html += `<li class="text-xs text-amber-800 flex items-start gap-2"><span class="text-amber-600 mt-0.5">-</span> ${esc(f)}</li>`;
    });
    html += `</ul></div>`;
  }

  // Lifestyle remedies
  if (r.immediateCare?.lifestyleRemedies?.length) {
    html += `<div class="space-y-3"><h4 class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-heart text-primary"></i> Lifestyle and Home Remedies</h4><div class="flex flex-wrap gap-2">`;
    r.immediateCare.lifestyleRemedies.forEach((rem) => {
      html += `<span class="px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 text-xs rounded-full font-medium">${esc(rem)}</span>`;
    });
    html += `</div></div>`;
  }

  // OTC Medications
  if (r.immediateCare?.otcMedications?.length) {
    html += `<div class="space-y-3"><h4 class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-pills text-primary"></i> OTC Medication Options</h4><div class="space-y-2">`;
    r.immediateCare.otcMedications.forEach((med, i) => {
      html += `<div class="border border-border rounded-xl overflow-hidden">
        <button type="button" onclick="toggleMed(${i})" class="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
          <div><span class="font-semibold text-sm text-foreground">${esc(med.genericName)}</span><span class="text-xs text-muted-foreground ml-2">(${esc(med.brandName)})</span></div>
          <i id="med-icon-${i}" class="fas fa-chevron-down text-xs text-muted-foreground"></i>
        </button>
        <div id="med-detail-${i}" class="hidden px-3 pb-3 border-t border-border bg-muted/10">
          <div class="grid grid-cols-2 gap-2 pt-3 text-xs">
            <div><span class="font-semibold text-foreground">Dose:</span> <span class="text-muted-foreground">${esc(med.standardDose)}</span></div>
            <div><span class="font-semibold text-foreground">Frequency:</span> <span class="text-muted-foreground">${esc(med.frequency)}</span></div>
            <div><span class="font-semibold text-foreground">Max Daily:</span> <span class="text-muted-foreground">${esc(med.maxDailyDose)}</span></div>
            <div><span class="font-semibold text-foreground">Avoid if:</span> <span class="text-muted-foreground">${esc(med.avoidIf)}</span></div>
          </div>
          <div class="mt-2 text-xs space-y-1">
            <p><span class="font-semibold text-foreground">Contraindications:</span> <span class="text-muted-foreground">${esc(med.contraindications)}</span></p>
            <p><span class="font-semibold text-foreground">Side Effects:</span> <span class="text-muted-foreground">${esc(med.sideEffects)}</span></p>
          </div>
          <p class="mt-2 text-[10px] text-amber-700 font-medium italic">Do not self-medicate without consulting a healthcare professional.</p>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Recommended Tests
  if (r.recommendedTests?.length) {
    html += `<div class="space-y-3"><h4 class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-flask text-primary"></i> Recommended Medical Tests</h4><div class="space-y-2">`;
    r.recommendedTests.forEach((t) => {
      html += `<div class="p-3 bg-muted/30 rounded-xl border border-border">
        <span class="font-semibold text-sm text-foreground">${esc(t.testName)}</span>
        <p class="text-xs text-muted-foreground mt-0.5">${esc(t.reason)}</p>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Emergency Signs
  if (r.emergencySigns?.length) {
    html += `<div class="p-4 bg-red-50/50 rounded-xl border border-red-200/30 space-y-2">
      <h4 class="font-bold text-sm flex items-center gap-2 text-red-800"><i class="fas fa-ambulance"></i> When to Seek Immediate Medical Attention</h4>
      <ul class="space-y-1">`;
    r.emergencySigns.forEach((s) => {
      html += `<li class="text-xs text-red-700 flex items-start gap-2"><span class="text-red-500 mt-0.5">-</span> ${esc(s)}</li>`;
    });
    html += `</ul></div>`;
  }

  // Consultation reason
  if (r.specialist && r.consultationReason) {
    html += `<div class="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
      <h4 class="font-bold text-sm flex items-center gap-2 text-primary"><i class="fas fa-user-md"></i> Why See a ${esc(r.specialist)}?</h4>
      <p class="text-sm text-muted-foreground leading-relaxed">${esc(r.consultationReason)}</p>
    </div>`;
  }

  // Preventive Advice
  if (r.preventiveAdvice?.length) {
    html += `<div class="space-y-3"><h4 class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-shield-alt text-primary"></i> Preventive Advice</h4><div class="flex flex-wrap gap-2">`;
    r.preventiveAdvice.forEach((a) => {
      html += `<span class="px-3 py-1.5 bg-muted/30 text-xs border border-border rounded-full">${esc(a)}</span>`;
    });
    html += `</div></div>`;
  }

  // Action buttons
  html += `
    <div class="pt-4 border-t flex flex-col sm:flex-row gap-3">
      <button class="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition text-sm">
        Book ${esc(r.specialist || "Specialist")} Appointment
      </button>
      <button class="flex-1 py-3 rounded-xl font-bold border border-border hover:bg-muted transition text-sm">
        Order Diagnostic Tests
      </button>
    </div>
    <div class="flex items-start gap-2 text-[10px] text-muted-foreground mt-6 leading-tight">
      <i class="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
      <p>This AI guidance is for informational purposes only and does not replace a licensed medical professional.</p>
    </div>
  </div>`;

  document.getElementById("results-container").innerHTML = html;
}

function toggleMed(i) {
  const detail = document.getElementById(`med-detail-${i}`);
  const icon = document.getElementById(`med-icon-${i}`);
  if (detail.classList.contains("hidden")) {
    detail.classList.remove("hidden");
    icon.classList.replace("fa-chevron-down", "fa-chevron-up");
  } else {
    detail.classList.add("hidden");
    icon.classList.replace("fa-chevron-up", "fa-chevron-down");
  }
}

function resetChecker() {
  document.getElementById("checker-input").classList.remove("hidden");
  document.getElementById("checker-results").classList.add("hidden");
}

// ──────────────────────────────────────────────
// API Key Management
// ──────────────────────────────────────────────
function toggleApiKeyModal() {
  const modal = document.getElementById("api-key-modal");
  modal.classList.toggle("hidden");
  updateApiKeyUI();
}

function updateApiKeyUI() {
  const hasKey = !!storedApiKey;
  const label = document.getElementById("api-key-label");
  const statusBtn = document.getElementById("api-key-status-btn");

  if (hasKey) {
    label.textContent = "API Key Connected";
    statusBtn.classList.add("border-green-300", "text-green-700");
    statusBtn.classList.remove("border-border");
  } else {
    label.textContent = "Add API Key";
    statusBtn.classList.remove("border-green-300", "text-green-700");
    statusBtn.classList.add("border-border");
  }

  const connected = document.getElementById("api-key-connected");
  const form = document.getElementById("api-key-form");
  if (hasKey) {
    connected.classList.remove("hidden");
    form.classList.add("hidden");
    document.getElementById("api-key-preview").textContent =
      `Provider: Google Gemini | Key: ${storedApiKey.slice(0, 8)}...${storedApiKey.slice(-4)}`;
  } else {
    connected.classList.add("hidden");
    form.classList.remove("hidden");
  }
}

function saveApiKey() {
  const inp = document.getElementById("api-key-input");
  const key = inp.value.trim();
  if (!key) return;
  storedApiKey = key;
  sessionStorage.setItem("healthagg_api_key", key);
  inp.value = "";
  toggleApiKeyModal();
}

function removeApiKey() {
  storedApiKey = "";
  sessionStorage.removeItem("healthagg_api_key");
  toggleApiKeyModal();
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────
function esc(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
