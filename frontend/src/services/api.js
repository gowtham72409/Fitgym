const getDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  return 'https://fitgym-zr0u.onrender.com';
};

const API_BASE_URL = getDefaultBaseUrl();

let authToken = localStorage.getItem('fitquest_token') || '';
let onServerWakingCallback = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('fitquest_token', token);
  } else {
    localStorage.removeItem('fitquest_token');
  }
};

export const getAuthToken = () => authToken;

export const setServerWakingListener = (callback) => {
  onServerWakingCallback = callback;
};

// Generic Fetch Wrapper
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Cold-start timer detection: if request takes > 2.5s, signal cold-start waking up
  let wakingTimer = setTimeout(() => {
    if (onServerWakingCallback) onServerWakingCallback(true);
  }, 2500);

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    clearTimeout(wakingTimer);
    if (onServerWakingCallback) onServerWakingCallback(false);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(wakingTimer);
    if (onServerWakingCallback) onServerWakingCallback(false);
    throw err;
  }
}

// API methods
export const api = {
  // Health
  checkHealth: () => apiRequest('/health'),

  // Auth
  verifyToken: () => apiRequest('/api/auth/verify-token', { method: 'POST' }),

  // Profile
  getProfile: () => apiRequest('/api/profile'),
  updateProfile: (data) => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Day consolidated summary
  getDaySummary: () => apiRequest('/api/day'),

  // Plans
  generatePlans: () => apiRequest('/api/plan/generate', { method: 'POST' }),

  // Diet
  getDiet: () => apiRequest('/api/diet'),
  updateDiet: (data) => apiRequest('/api/diet', { method: 'PUT', body: JSON.stringify(data) }),
  replaceMeal: (data) => apiRequest('/api/diet/replace-meal', { method: 'POST', body: JSON.stringify(data) }),

  // Workout
  getWorkout: () => apiRequest('/api/workout'),
  regenerateWorkout: (data) => apiRequest('/api/workout/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkout: (data) => apiRequest('/api/workout/customize', { method: 'PUT', body: JSON.stringify(data) }),
  completeWorkout: (data) => apiRequest('/api/workout/complete', { method: 'POST', body: JSON.stringify(data) }),

  // Nutrition & Camera Scanner
  analyzeFoodImage: (formData) => apiRequest('/api/nutrition/analyze', { method: 'POST', body: formData }),
  getNutritionHistory: () => apiRequest('/api/nutrition/history'),
  updateNutritionLog: (id, data) => apiRequest(`/api/nutrition/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNutritionLog: (id) => apiRequest(`/api/nutrition/${id}`, { method: 'DELETE' }),

  // GPS Activity
  startActivity: (data) => apiRequest('/api/activity/start', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (data) => apiRequest('/api/activity/update', { method: 'POST', body: JSON.stringify(data) }),
  finishActivity: (data) => apiRequest('/api/activity/finish', { method: 'POST', body: JSON.stringify(data) }),
  getActivityHistory: () => apiRequest('/api/activity/history'),
  deleteActivity: (id) => apiRequest(`/api/activity/${id}`, { method: 'DELETE' }),
  updateActivityLabel: (id, data) => apiRequest(`/api/activity/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Challenges
  getChallenges: () => apiRequest('/api/challenges'),
  customizeChallenge: (data) => apiRequest('/api/challenges/customize', { method: 'POST', body: JSON.stringify(data) }),
  completeChallenge: (id) => apiRequest(`/api/challenges/${id}/complete`, { method: 'POST' }),

  // Checkin & Weight
  logCheckin: (data) => apiRequest('/api/checkin', { method: 'POST', body: JSON.stringify(data) }),
  getCheckinHistory: () => apiRequest('/api/checkin/history'),
  logWeight: (data) => apiRequest('/api/weight', { method: 'POST', body: JSON.stringify(data) }),
  getWeightHistory: () => apiRequest('/api/weight/history'),

  // Sara AI
  askSara: (message, agent_id = "sara") => apiRequest('/api/sara', { method: 'POST', body: JSON.stringify({ message, agent_id }) }),
  getSaraHistory: () => apiRequest('/api/sara/history'),

  // Monthly summary
  getMonthlySummary: (month, year) => {
    const q = month && year ? `?month=${month}&year=${year}` : '';
    return apiRequest(`/api/monthly-summary${q}`);
  },

  // Settings & Preferences
  getSettings: () => apiRequest('/api/settings'),
  updateSettings: (data) => apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getDashboardPreferences: () => apiRequest('/api/dashboard-preferences'),
  updateDashboardPreferences: (data) => apiRequest('/api/dashboard-preferences', { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: () => apiRequest('/api/account/delete', { method: 'DELETE' }),
};
