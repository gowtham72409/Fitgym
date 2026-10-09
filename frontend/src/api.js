const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL;
    return raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
  }
  // Local development
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return "http://localhost:8000/api";
  }
  // Production Render live backend URL
  return "https://fitgym-zr0u.onrender.com/api";
};

const ENV_API_URL = getDefaultApiUrl();
const BACKEND_URL = ENV_API_URL;

// Fallback URLs to try if primary fails (only on NETWORK errors)
const FALLBACK_URLS = [
  ENV_API_URL,
  "https://fitgym-zr0u.onrender.com/api",
  "http://localhost:8000/api"
];

// Check if running in native Capacitor app
const isNative = typeof window !== 'undefined' && Boolean(window.Capacitor && window.Capacitor.isNativePlatform?.());

async function nativeRequest(url, options = {}) {
  if (window.CapacitorHttp) {
    const response = await window.CapacitorHttp.request({
      url: url,
      method: options.method || "GET",
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined,
      connectTimeout: 20000,
      readTimeout: 20000,
    });
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
      headers: {
        get: (name) => response.headers?.[name] || response.headers?.[name.toLowerCase()] || null
      }
    };
  }
  return webRequest(url, options);
}

async function webRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const res = await fetch(url, {
    ...options,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  return res;
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("fitquest_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Try primary URL first, then fallbacks only on NETWORK errors
  const urlsToTry = [BACKEND_URL, ...FALLBACK_URLS];
  let lastError = null;

  for (const baseUrl of urlsToTry) {
    const fullUrl = `${baseUrl}${endpoint}`;
    try {
      // Use native HTTP on Capacitor, regular fetch on web
      const res = isNative 
        ? await nativeRequest(fullUrl, config)
        : await webRequest(fullUrl, config);

      // We got a response from the server - DON'T retry on other URLs
      // This means the server IS reachable, handle the response here

      if (res.status === 401) {
        localStorage.removeItem("fitquest_token");
        window.dispatchEvent(new Event("auth-changed"));
        throw new Error("Session expired. Please log in again.");
      }

      const data = await res.json();
      if (!res.ok) {
        // Server responded with an error (404, 400, 500, etc.)
        // This is an APPLICATION error, not a network error
        // Don't retry on fallback URLs - the server answered!
        throw new Error(data.detail || "An error occurred with your request.");
      }

      console.log(`[API] ✅ Success: ${endpoint}`);
      return data;
    } catch (err) {
      // Check if this is a NETWORK error (connection failed, timeout, etc.)
      // vs an APPLICATION error (server responded with error status)
      const isNetworkError = (
        err.message.includes("Failed to connect") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("Network request failed") ||
        err.message.includes("timeout") ||
        err.message.includes("abort") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("net::") ||
        err.name === "AbortError" ||
        err.name === "TypeError"
      );

      if (isNetworkError) {
        // Network error - try next URL
        lastError = err;
        console.warn(`[API] 🔌 Network error on ${baseUrl}, trying next...`, err.message);
        continue;
      }

      // Application error (401, 404, 500, etc.) - don't retry, throw immediately
      console.warn(`[API] ⚠️ App error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // All URLs failed with network errors
  const errorDetails = lastError ? `${lastError.name}: ${lastError.message}` : "Unknown error";
  console.error(`[API] All endpoints failed for ${endpoint}:`, errorDetails);
  
  if (isNative) {
    alert(`Network Error: ${endpoint}\n\nCannot reach server.\nPlease check your internet connection.\n\nDetails: ${errorDetails}`);
  }

  throw new Error("Cannot connect to server. Please check your internet connection and try again.");
}

export const api = {
  // Auth
  register: (name, email, password) => request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  loginWithPassword: (email, password) => request("/auth/login-password", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) => request("/auth/login-password", { method: "POST", body: JSON.stringify({ email, password: password || "123456" }) }),
  verifyOTP: (email, code) => request("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) }),
  
  // Profile
  getProfile: () => request("/profile"),
  updateProfile: (data) => request("/profile", { method: "POST", body: JSON.stringify(data) }),

  // Diet
  getDiet: () => request("/day"),
  generateDiet: () => request("/plan", { method: "POST" }),
  customizeDiet: (data) => request("/customize", { method: "POST", body: JSON.stringify(data) }),

  // Workout
  getWorkout: () => request("/workout"),
  generateWorkout: () => request("/workout", { method: "POST" }),
  customizeWorkout: (data) => request("/workout/customize", { method: "POST", body: JSON.stringify(data) }),
  customizeWorkoutExercise: (data) => request("/workout/exercise", { method: "POST", body: JSON.stringify(data) }),

  // Food AI Scanner
  scanFood: (data) => request("/nutrition", { method: "POST", body: JSON.stringify(data) }),
  getNutritionHistory: () => request("/nutrition/history"),
  deleteNutritionScan: (id) => request(`/nutrition/${id}`, { method: "DELETE" }),

  // Activities
  saveActivity: (data) => request("/activities", { method: "POST", body: JSON.stringify(data) }),
  getActivities: () => request("/activities"),
  updateActivity: (id, data) => request(`/activities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteActivity: (id) => request(`/activities/${id}`, { method: "DELETE" }),

  // Challenges & Gamification
  getChallenges: () => request("/challenge"),
  completeChallenge: (challenge_id) => request("/challenge/complete", { method: "POST", body: JSON.stringify({ challenge_id }) }),
  createChallenge: (data) => request("/challenge", { method: "POST", body: JSON.stringify(data) }),
  updateChallenge: (id, data) => request(`/challenge/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChallenge: (id) => request(`/challenge/${id}`, { method: "DELETE" }),
  resetChallenges: () => request("/challenge/reset", { method: "POST" }),

  // Check-in
  submitCheckin: (data) => request("/checkin", { method: "POST", body: JSON.stringify(data) }),
  getCheckinHistory: () => request("/checkin/history"),

  // Weight
  logWeight: (data) => request("/weight", { method: "POST", body: JSON.stringify(data) }),
  getWeightData: () => request("/weight"),

  // Summary
  getMonthlySummary: (month, year) => request(`/monthly-summary${month ? `?month=${month}&year=${year}` : ''}`),

  // Sara AI Assistant
  askSara: (message) => request("/sara", { method: "POST", body: JSON.stringify({ message }) }),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (data) => request("/settings", { method: "POST", body: JSON.stringify(data) }),
  deleteAccount: () => request("/settings/account", { method: "DELETE" }),

  // History
  getFullHistory: () => request("/history"),
};
