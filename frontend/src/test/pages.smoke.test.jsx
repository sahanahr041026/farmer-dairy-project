// Smoke tests: mount each page with realistic API data, click through the buttons that
// are on screen (tab switches, modal openers), and fail if anything throws. Builds and unit tests
// cannot catch runtime errors like undefined components or bad props; rendering does.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => {
  const farmer = {
    id: 1, farmer_uid: 'DS-FARM-101', full_name: 'Basavaraj Patil', phone: '9000000001', village: 'Hosahalli',
    is_active: true, sms_enabled: true, cattle_count: 2, total_litres_month: 10, pending_payout: 100,
  };
  const reminder = (id, status) => ({
    id, cooperative_id: 1, farmer_id: 1, cattle_id: 1, cattle_name: 'Ganga', cattle_tag: 'KA-1', farmer_name: farmer.full_name,
    title: `FMD Vaccination ${id}`, title_kn: null, care_type: 'vaccination', due_date: '2026-12-01', status,
    guidance: 'Keep animal calm', veterinarian_notes: 'Cold chain', created_at: '2026-11-01T00:00:00',
  });
  const cattle = {
    id: 1, cooperative_id: 1, farmer_id: 1, farmer_name: farmer.full_name, tag_number: 'KA-1', name: 'Ganga', breed: 'Gir',
    age_years: 4, gender: 'female', milking_status: 'Milking', daily_yield_estimate: 8, health_notes: 'ok',
    reminders: [reminder(1, 'upcoming')], created_at: '2026-01-01T00:00:00',
  };
  const collection = {
    id: 1, farmer_id: 1, farmer_name: farmer.full_name, farmer_uid: farmer.farmer_uid, collection_date: '2026-11-20',
    session: 'morning', quantity_litres: 10, fat_percentage: 4, snf_percentage: 8.5, rate_per_litre: 43, total_amount: 430,
    payment_status: 'pending', record_status: 'recorded', audits: [], notes: null, correction_reason: null,
  };
  const rule = {
    id: 1, rule_name: 'Standard', version: '1.0', calculation_method: 'fat_snf_formula', flat_rate: 40, base_rate: 41,
    base_fat: 4, base_snf: 8.5, fat_rate_step: 0.45, snf_rate_step: 0.3, min_rate: 20, max_rate: 80,
  };
  const breed = {
    id: 'gir', name: 'Gir', name_kn: 'ಗಿರ್', category: 'Indigenous', origin: 'Gujarat', avg_yield_litres: '10-12',
    fat_content: '4.5%', snf_content: '8.7%', heat_tolerance: 'High', description: 'Hardy breed', description_kn: 'ಗಟ್ಟಿ',
    feeding_guide: { Green: '20 kg' }, feeding_guide_kn: { Green: '20 ಕೆಜಿ' }, care_tips: ['Clean shed'], care_tips_kn: ['ಶುಚಿ'],
    suitability: 'Hot climates',
  };
  const template = {
    template_id: 'fmd', title: 'FMD Vaccination (6 months)', title_kn: 'ಕಾಲುಬಾಯಿ', care_type: 'vaccination',
    recommended_frequency: '6 months', default_notes: 'Keep cold',
  };
  const job = {
    id: 1, cooperative_id: 1, campaign_id: 1, source_type: 'campaign', source_id: 1, farmer_id: 1, recipient_name: farmer.full_name,
    phone_number: '98XXXXX001', message_text: 'Hello', status: 'failed', error_message: 'gateway', retry_count: 1, max_retries: 3,
    is_mock: true, scheduled_at: null, sent_at: null, created_at: '2026-11-20T10:00:00',
  };
  const campaign = {
    id: 1, cooperative_id: 1, title: 'Camp', message: 'Health camp', target_audience: 'all', target_locality: null,
    recipient_count: 5, is_mock_delivery: true, delivery_status: 'simulated', sent_at: '2026-11-20T10:00:00', notes: null,
  };
  const announcement = {
    id: 1, cooperative_id: 1, admin_id: 1, title: 'Scheme', title_kn: null, content: 'Subsidy', content_kn: null,
    category: 'subsidy', target_audience: 'all', target_village: null, target_farmer_id: null, is_published: true,
    publish_date: '2026-11-01', expiry_date: null, sms_notify: false, official_link: null,
  };
  const summary = {
    total_jobs: 4, queued: 1, submitted: 0, sent: 1, delivered: 1, failed: 1, cancelled: 0,
    is_mock_gateway: true, gateway_provider: 'Simulated Local Development Provider',
  };

  const settlement = {
    id: 1, cooperative_id: 1, farmer_id: 1, farmer_name: farmer.full_name, farmer_uid: farmer.farmer_uid,
    period_start: '2026-11-01', period_end: '2026-11-15', total_litres: 100, calculated_amount: 4300, approved_amount: 4300,
    paid_amount: 0, payment_mode: 'Direct Deposit', reference_no: null, status: 'approved', payment_date: null,
    created_at: '2026-11-16T00:00:00',
  };
  const notification = {
    id: 1, cooperative_id: 1, farmer_id: 1, title: 'Milk Recorded', title_kn: null, message: '10L recorded', message_kn: null,
    category: 'milk', is_read: false, created_at: '2026-11-20T08:00:00',
  };
  const passbook = {
    farmer_id: 1, farmer_name: farmer.full_name, farmer_uid: farmer.farmer_uid, cooperative_name: 'Coop', cooperative_code: 'C',
    total_litres: 10, avg_fat: 4, avg_snf: 8.5, total_earnings: 430, paid_amount: 0, pending_amount: 430,
    today_litres: 10, today_earnings: 430, month_litres: 10, month_earnings: 430, records: [collection],
  };
  const dashboard = {
    total_farmers: 5,
    today_collection: { total_litres: 10, morning_litres: 6, evening_litres: 4, amount: 430, entries_count: 2 },
    monthly_collection: { total_litres: 100, total_amount: 4300, avg_daily_litres: 5 },
    financials: { pending_amount: 430, completed_settlements: 0 },
    upcoming_vaccinations: 1,
  };
  const trends = [
    { date: '19 Nov', full_date: '2026-11-19', morning: 5, evening: 3, total: 8, amount: 344 },
    { date: '20 Nov', full_date: '2026-11-20', morning: 6, evening: 4, total: 10, amount: 430 },
  ];
  const quality = { fat_distribution: [{ label: 'Below 3.5%', count: 1 }, { label: '3.5% - 4.0%', count: 2 }], sample_size: 3 };
  const coop = { id: 1, name: 'Nandini Malnad Dairy', code: 'KMF-MLN-108', locality: 'Shivamogga' };

  const handlers = {
    getFarmers: async () => [farmer],
    getVillages: async () => ['Hosahalli'],
    getCollections: async () => [collection],
    getCurrentRate: async () => rule,
    getCattle: async () => [cattle],
    getReminders: async () => [reminder(1, 'upcoming'), reminder(2, 'overdue'), reminder(3, 'completed')],
    getReminderTemplates: async () => [template],
    getBreeds: async () => [breed],
    getSMSCampaigns: async () => [campaign],
    getSMSJobs: async () => [job],
    getSMSSummary: async () => summary,
    getAnnouncements: async () => [announcement],
    getSettlements: async () => [settlement],
    getNotifications: async () => [notification],
    getPassbook: async () => passbook,
    getDashboardSummary: async () => dashboard,
    getTrends: async () => trends,
    getQuality: async () => quality,
    getTodaySummary: async () => ({ date: '2026-11-21', total_litres: 10, morning_litres: 6, evening_litres: 4, total_amount: 430, total_entries: 2 }),
    getCooperatives: async () => [coop],
    getAssistantSuggestions: async () => [{ text: 'How to prevent mastitis?', category: 'health' }],
    previewSMS: async () => ({ recipient_count: 1, sample_message: 'Hello', is_mock: true, recipients: [] }),
  };
  const api = new Proxy({}, {
    get: (_t, name) => (name === 'then' ? undefined : (handlers[name] || (async () => ({})))),
  });
  return { api, UNAUTHORIZED_EVENT: 'dairysathi:unauthorized' };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'farmer', id: 1, name: 'Basavaraj', farmer_uid: 'DS-FARM-101', cooperative: { id: 1, name: 'Coop', code: 'C' } },
    role: 'farmer',
    language: 'en',
    setLanguage: () => {},
    logout: () => {},
  }),
}));

import { ErrorBoundary } from '../components/ErrorBoundary';
import { AdminMilkCollection } from '../pages/admin/AdminMilkCollection';
import { AdminCattleCare } from '../pages/admin/AdminCattleCare';
import { AdminSMSNotifications } from '../pages/admin/AdminSMSNotifications';
import { FarmerCattle } from '../pages/farmer/FarmerCattle';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminFarmers } from '../pages/admin/AdminFarmers';
import { AdminPayments } from '../pages/admin/AdminPayments';
import { AdminRates } from '../pages/admin/AdminRates';
import { AdminReports } from '../pages/admin/AdminReports';
import { FarmerHome } from '../pages/farmer/FarmerHome';
import { FarmerPassbook } from '../pages/farmer/FarmerPassbook';
import { FarmerAssistant } from '../pages/farmer/FarmerAssistant';
import { FarmerNotifications } from '../pages/farmer/FarmerNotifications';
import { LandingPage } from '../pages/LandingPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { FarmerLoginPage } from '../pages/FarmerLoginPage';

const PAGES = [
  ['AdminMilkCollection', AdminMilkCollection],
  ['AdminCattleCare', AdminCattleCare],
  ['AdminSMSNotifications', AdminSMSNotifications],
  ['FarmerCattle', FarmerCattle],
  ['AdminDashboard', AdminDashboard],
  ['AdminFarmers', AdminFarmers],
  ['AdminPayments', AdminPayments],
  ['AdminRates', AdminRates],
  ['AdminReports', AdminReports],
  ['FarmerHome', FarmerHome],
  ['FarmerPassbook', FarmerPassbook],
  ['FarmerAssistant', FarmerAssistant],
  ['FarmerNotifications', FarmerNotifications],
  ['LandingPage', LandingPage],
  ['AdminLoginPage', AdminLoginPage],
  ['FarmerLoginPage', FarmerLoginPage],
];

async function settle() {
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
}

describe.each(PAGES)('%s smoke test', (name, Page) => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      // Set SMOKE_DEBUG=1 to see the real error behind a tripped error boundary.
      if (globalThis.process?.env?.SMOKE_DEBUG) console.log('CONSOLE.ERROR:', args.map(String).join(' | ').slice(0, 700));
    });
  });

  const mount = () => render(
    <ErrorBoundary>
      <MemoryRouter><Page /></MemoryRouter>
    </ErrorBoundary>
  );

  it('renders with data and without hitting the error boundary', async () => {
    const { container } = mount();
    await settle();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.textContent.length).toBeGreaterThan(50);
  });

  it('survives clicking every button that is initially on screen', async () => {
    mount();
    await settle();
    const buttons = screen.queryAllByRole('button'); // some pages (e.g. the dashboard) have none
    for (const b of buttons) {
      if (!b.isConnected) continue; // an earlier click may have replaced it
      fireEvent.click(b);
      await settle();
      expect(screen.queryByRole('alert'), `error boundary tripped after clicking "${b.textContent.trim()}"`).toBeNull();
    }
  });
});
