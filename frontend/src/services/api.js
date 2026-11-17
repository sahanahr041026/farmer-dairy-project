const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dairysathi_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      // Don't auto logout on public endpoints
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/cooperatives')) {
        localStorage.removeItem('dairysathi_token');
        localStorage.removeItem('dairysathi_user');
      }
    }

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        errMsg = errorData.detail || errorData.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    // Handle binary / PDF or text
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return await res.blob();
    }
    if (contentType && contentType.includes('text/csv')) {
      return await res.text();
    }

    return await res.json();
  } catch (err) {
    // Check if offline
    if (!navigator.onLine || err.message.includes('Failed to fetch')) {
      throw new Error('Network connection unavailable. Please check internet connection.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  getCooperatives: () => request('/auth/cooperatives'),
  loginAdmin: (data) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  loginFarmer: (data) => request('/auth/farmer/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Farmers
  getFarmers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/farmers${qs ? `?${qs}` : ''}`);
  },
  getVillages: () => request('/farmers/villages'),
  createFarmer: (data) => request('/farmers', { method: 'POST', body: JSON.stringify(data) }),
  getFarmer: (id) => request(`/farmers/${id}`),
  updateFarmer: (id, data) => request(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setLanguage: (lang) => request(`/farmers/me/language?language=${lang}`, { method: 'PUT' }),

  // Rates
  getCurrentRate: () => request('/rates/current'),
  createRate: (data) => request('/rates', { method: 'POST', body: JSON.stringify(data) }),
  calculateRatePreview: (qty, fat, snf) => request(`/rates/calculate?quantity=${qty}&fat=${fat}&snf=${snf}`),

  // Milk Collections
  getCollections: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/milk${qs ? `?${qs}` : ''}`);
  },
  getTodaySummary: () => request('/milk/today'),
  recordCollection: (data, allowDuplicate = false, overwrite = false) => 
    request(`/milk?allow_duplicate=${allowDuplicate}&overwrite=${overwrite}`, { method: 'POST', body: JSON.stringify(data) }),
  correctCollection: (id, data) => 
    request(`/milk/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Payments
  getSettlements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/payments${qs ? `?${qs}` : ''}`);
  },
  createSettlement: (data) => request('/payments/settle', { method: 'POST', body: JSON.stringify(data) }),
  updateSettlement: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Cattle & Reminders
  getCattle: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cattle${qs ? `?${qs}` : ''}`);
  },
  createCattle: (data) => request('/cattle', { method: 'POST', body: JSON.stringify(data) }),
  updateCattle: (id, data) => request(`/cattle/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCattle: (id) => request(`/cattle/${id}`, { method: 'DELETE' }),
  getBreeds: () => request('/cattle/breeds'),
  getBreedDetails: (id) => request(`/cattle/breeds/${id}`),
  getReminderTemplates: () => request('/cattle/reminders/templates'),
  getReminders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cattle/reminders${qs ? `?${qs}` : ''}`);
  },
  createReminder: (data) => request('/cattle/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/cattle/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/cattle/reminders/${id}`, { method: 'DELETE' }),

  // Passbook & PDF
  getPassbook: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/passbook${qs ? `?${qs}` : ''}`);
  },
  downloadPassbookPdf: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const blob = await request(`/passbook/pdf${qs ? `?${qs}` : ''}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const start = params.start_date || 'period';
    const end = params.end_date || 'latest';
    a.download = `DairySathi_Passbook_${start}_${end}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Announcements & Schemes
  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/announcements${qs ? `?${qs}` : ''}`);
  },
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Assistant
  getAssistantSuggestions: (lang = 'en') => request(`/assistant/suggestions?language=${lang}`),
  chatAssistant: (data) => request('/assistant/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Reports
  getDashboardSummary: () => request('/reports/summary'),
  getTrends: (days = 14) => request(`/reports/trends?days=${days}`),
  getQuality: () => request('/reports/quality'),
  exportCollectionsCsv: (start, end) => `${API_BASE}/reports/export/collections-csv?start_date=${start || ''}&end_date=${end || ''}`,

  // SMS Notifications & Jobs
  getSMSCampaigns: () => request('/sms/campaigns'),
  getSMSJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sms/jobs${qs ? `?${qs}` : ''}`);
  },
  getSMSSummary: () => request('/sms/summary'),
  previewSMS: (data) => request('/sms/preview', { method: 'POST', body: JSON.stringify(data) }),
  sendSMS: (data) => request('/sms/send', { method: 'POST', body: JSON.stringify(data) }),
  retrySMSJob: (id) => request(`/sms/jobs/${id}/retry`, { method: 'POST' }),
  cancelSMSJob: (id) => request(`/sms/jobs/${id}/cancel`, { method: 'POST' }),
  dispatchVaccinationSMS: (reminderId) => request(`/sms/reminders/${reminderId}/send`, { method: 'POST' })
};

