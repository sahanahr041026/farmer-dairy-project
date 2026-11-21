// Default: the API on port 8000 of whatever host served this page, so the app works when opened as
// http://localhost:5174 or via a LAN IP like http://192.168.1.20:5174 (cookies then stay same-site).
// Set VITE_API_URL to override (e.g. a deployed API on another domain).
const API_BASE = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:8000/api`;

export const UNAUTHORIZED_EVENT = 'dairysathi:unauthorized';
const CSRF_HEADER_VALUE = 'dairysathi-web';

export function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// FastAPI returns `detail` as a string, or as a list of validation errors.
export function formatErrorDetail(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((x) => x !== 'body' && x !== 'query').join('.') : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join('; ');
  }
  return JSON.stringify(detail);
}

async function request(endpoint, options = {}) {
  // The session lives in an httpOnly cookie that JavaScript cannot read, so there is no token to
  // attach. The custom header is the CSRF guard the API requires on cookie-authenticated writes.
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    'X-Requested-With': CSRF_HEADER_VALUE,
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
  } catch (err) {
    throw new Error('Network connection unavailable. Please check internet connection.');
  }

  const isLoginCall = endpoint.startsWith('/auth/admin/login') || endpoint.startsWith('/auth/farmer/login');
  if (res.status === 401 && !isLoginCall) {
    // Session expired/invalid: clear the cached profile and tell the app so React state/routing follow.
    localStorage.removeItem('dairysathi_user');
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      errMsg = formatErrorDetail(errorData.detail) || errorData.message || errMsg;
    } catch (e) { /* non-JSON error body */ }
    const error = new Error(errMsg);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;

  // Handle binary / PDF or text
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) return await res.blob();
  if (contentType.includes('text/csv')) return await res.text();
  return await res.json();
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  // Auth
  getCooperatives: () => request('/auth/cooperatives'),
  loginAdmin: (data) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  loginFarmer: (data) => request('/auth/farmer/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Farmers
  getFarmers: (params = {}) => request(`/farmers${buildQuery(params)}`),
  getVillages: () => request('/farmers/villages'),
  createFarmer: (data) => request('/farmers', { method: 'POST', body: JSON.stringify(data) }),
  getFarmer: (id) => request(`/farmers/${id}`),
  updateFarmer: (id, data) => request(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setLanguage: (lang) => request(`/farmers/me/language${buildQuery({ language: lang })}`, { method: 'PUT' }),

  // Rates
  // Resolves to null when the cooperative has no rate rule yet (404), so pages can still render.
  getCurrentRate: async (date) => {
    try {
      return await request(`/rates/current${buildQuery({ date })}`);
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  },
  createRate: (data) => request('/rates', { method: 'POST', body: JSON.stringify(data) }),
  calculateRatePreview: (qty, fat, snf, collectionDate) =>
    request(`/rates/calculate${buildQuery({ quantity: qty, fat, snf, collection_date: collectionDate })}`),

  // Milk Collections
  getCollections: (params = {}) => request(`/milk${buildQuery(params)}`),
  getTodaySummary: () => request('/milk/today'),
  recordCollection: (data, allowDuplicate = false, overwrite = false) => 
    request(`/milk?allow_duplicate=${allowDuplicate}&overwrite=${overwrite}`, { method: 'POST', body: JSON.stringify(data) }),
  correctCollection: (id, data) => 
    request(`/milk/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Payments
  getSettlements: (params = {}) => request(`/payments${buildQuery(params)}`),
  createSettlement: (data) => request('/payments/settle', { method: 'POST', body: JSON.stringify(data) }),
  updateSettlement: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Cattle & Reminders
  getCattle: (params = {}) => request(`/cattle${buildQuery(params)}`),
  createCattle: (data) => request('/cattle', { method: 'POST', body: JSON.stringify(data) }),
  updateCattle: (id, data) => request(`/cattle/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCattle: (id) => request(`/cattle/${id}`, { method: 'DELETE' }),
  getBreeds: () => request('/cattle/breeds'),
  getBreedDetails: (id) => request(`/cattle/breeds/${id}`),
  getReminderTemplates: () => request('/cattle/reminders/templates'),
  getReminders: (params = {}) => request(`/cattle/reminders${buildQuery(params)}`),
  createReminder: (data) => request('/cattle/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/cattle/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/cattle/reminders/${id}`, { method: 'DELETE' }),

  // Passbook & PDF
  getPassbook: (params = {}) => request(`/passbook${buildQuery(params)}`),
  downloadPassbookPdf: async (params = {}) => {
    const blob = await request(`/passbook/pdf${buildQuery(params)}`);
    saveBlob(blob, `DairySathi_Passbook_${params.start_date || 'period'}_${params.end_date || 'latest'}.pdf`);
  },

  // Announcements & Schemes
  getAnnouncements: (params = {}) => request(`/announcements${buildQuery(params)}`),
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Assistant
  getAssistantSuggestions: (lang = 'en') => request(`/assistant/suggestions${buildQuery({ language: lang })}`),
  chatAssistant: (data) => request('/assistant/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Reports
  getDashboardSummary: () => request('/reports/summary'),
  getTrends: (days = 14) => request(`/reports/trends${buildQuery({ days })}`),
  getQuality: () => request('/reports/quality'),
  // Authenticated download (a plain link/window.open cannot send the Authorization header).
  downloadCollectionsCsv: async (start, end) => {
    const text = await request(`/reports/export/collections-csv${buildQuery({ start_date: start, end_date: end })}`);
    saveBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), `Milk_Collections_${start || 'month'}_${end || 'today'}.csv`);
  },

  // SMS Notifications & Jobs
  getSMSCampaigns: () => request('/sms/campaigns'),
  getSMSJobs: (params = {}) => request(`/sms/jobs${buildQuery(params)}`),
  getSMSSummary: () => request('/sms/summary'),
  previewSMS: (data) => request('/sms/preview', { method: 'POST', body: JSON.stringify(data) }),
  sendSMS: (data) => request('/sms/send', { method: 'POST', body: JSON.stringify(data) }),
  retrySMSJob: (id) => request(`/sms/jobs/${id}/retry`, { method: 'POST' }),
  cancelSMSJob: (id) => request(`/sms/jobs/${id}/cancel`, { method: 'POST' }),
  dispatchVaccinationSMS: (reminderId) => request(`/sms/reminders/${reminderId}/send`, { method: 'POST' })
};

