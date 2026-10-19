import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  SMSIcon, AlertTriangleIcon, CheckCircleIcon,
  UsersIcon, ShieldCheckIcon, SendIcon, PlusIcon, RefreshCwIcon, InfoIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminSMSNotifications() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'schemes' | 'jobs'
  const [campaigns, setCampaigns] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [smsJobs, setSmsJobs] = useState([]);
  const [smsSummary, setSmsSummary] = useState(null);
  const [jobFilter, setJobFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, locality, individual
  const [targetLocality, setTargetLocality] = useState('');
  const [targetFarmerId, setTargetFarmerId] = useState('');

  // Broadcast Preview & Modal State
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Scheme Modal State
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeTitleKn, setSchemeTitleKn] = useState('');
  const [schemeCategory, setSchemeCategory] = useState('subsidy');
  const [schemeAudience, setSchemeAudience] = useState('all');
  const [schemeVillage, setSchemeVillage] = useState('');
  const [schemeFarmerId, setSchemeFarmerId] = useState('');
  const [schemeContent, setSchemeContent] = useState('');
  const [schemeContentKn, setSchemeContentKn] = useState('');
  const [schemeEligibility, setSchemeEligibility] = useState('');
  const [schemeBenefits, setSchemeBenefits] = useState('');
  const [schemeContact, setSchemeContact] = useState('');
  const [schemeLink, setSchemeLink] = useState('');
  const [schemeExpiresAt, setSchemeExpiresAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [schemeSendSms, setSchemeSendSms] = useState(true);
  const [schemeSubmitting, setSchemeSubmitting] = useState(false);

  // Template Presets
  const templates = [
    {
      id: 'scheme_pashu_bhagya',
      name: 'Govt Scheme: Karnataka Pashu Bhagya 2026 Subsidy',
      title: 'Pashu Bhagya Scheme 50% Subsidy',
      text: 'Govt of Karnataka Pashu Bhagya Scheme: 50% subsidy available for crossbred cows & shed upgrade. Submit verified Aadhaar & land records at cooperative office by Oct 30.'
    },
    {
      id: 'fmd_camp',
      name: 'Cattle Camp: Free FMD & BQ Vaccination',
      title: 'Free Cattle Vaccination Camp This Saturday',
      text: 'KMF Veterinary Camp Notice: Free FMD (Foot & Mouth) & Black Quarter vaccination camp at village dairy chilling centre this Saturday 8 AM to 2 PM. Please bring all cattle.'
    },
    {
      id: 'payment_ready',
      name: 'Billing: Weekly Milk Payout Disbursed',
      title: 'Milk Payment Credited to Bank Account',
      text: 'Dear Farmer, your milk payment for the previous billing period has been processed and credited to your registered bank account via NEFT. Download e-passbook on DairySathi.'
    },
    {
      id: 'weather_alert',
      name: 'Advisory: Monsoon Cattle Foot Rot Prevention',
      title: 'Monsoon Cattle Health Advisory',
      text: 'Urgent Advisory: Keep cattle shed floors dry with lime powder to prevent foot-rot and mastitis during heavy rains. Contact cooperative vet Dr. Ramesh Hegde (9845123456) for care.'
    }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [cList, fList, vList, aList, sData, jList] = await Promise.all([
        api.getSMSCampaigns().catch(() => []),
        api.getFarmers().catch(() => []),
        api.getVillages().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getSMSSummary().catch(() => null),
        api.getSMSJobs({ limit: 50 }).catch(() => [])
      ]);
      setCampaigns(cList);
      setFarmers(fList);
      setVillages(vList);
      setAnnouncements(aList);
      setSmsSummary(sData);
      setSmsJobs(jList);

      if (vList.length > 0) {
        if (!targetLocality) setTargetLocality(vList[0]);
        if (!schemeVillage) setSchemeVillage(vList[0]);
      }
      if (fList.length > 0) {
        if (!targetFarmerId) setTargetFarmerId(fList[0].id.toString());
        if (!schemeFarmerId) setSchemeFarmerId(fList[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) {
      setTitle(tmpl.title);
      setMessage(tmpl.text);
    }
  };

  const handleRequestPreview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResultMsg('');

    if (!message.trim()) {
      setErrorMsg("Message body cannot be empty.");
      return;
    }

    try {
      const res = await api.previewSMS({
        title,
        message,
        target_audience: targetAudience,
        target_locality: targetAudience === 'locality' ? targetLocality : null,
        target_farmer_id: targetAudience === 'individual' ? parseInt(targetFarmerId) : null
      });
      setPreviewData(res);
      setIsPreviewOpen(true);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setErrorMsg('');
    setResultMsg('');

    try {
      const res = await api.sendSMS({
        title,
        message,
        target_audience: targetAudience,
        target_locality: targetAudience === 'locality' ? targetLocality : null,
        target_farmer_id: targetAudience === 'individual' ? parseInt(targetFarmerId) : null
      });

      setIsPreviewOpen(false);
      setResultMsg(`Broadcast successfully queued for ${res.recipient_count} farmers. [${res.delivery_status}]`);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  // Scheme Creation
  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setSchemeSubmitting(true);
    setErrorMsg('');
    try {
      await api.createAnnouncement({
        title: schemeTitle,
        title_kn: schemeTitleKn || undefined,
        category: schemeCategory,
        target_audience: schemeAudience,
        target_village: schemeAudience === 'village' ? schemeVillage : undefined,
        target_farmer_id: schemeAudience === 'individual' ? parseInt(schemeFarmerId) : undefined,
        content: schemeContent,
        content_kn: schemeContentKn || undefined,
        eligibility_criteria: schemeEligibility || undefined,
        benefits: schemeBenefits || undefined,
        contact_person: schemeContact || undefined,
        reference_link: schemeLink || undefined,
        expires_at: schemeExpiresAt ? `${schemeExpiresAt}T23:59:59` : undefined,
        is_published: true,
        send_sms: schemeSendSms
      });
      setIsSchemeModalOpen(false);
      setResultMsg("New scheme published and notifications queued!");
      // Reset form
      setSchemeTitle('');
      setSchemeTitleKn('');
      setSchemeContent('');
      setSchemeContentKn('');
      setSchemeEligibility('');
      setSchemeBenefits('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSchemeSubmitting(false);
    }
  };

  const handleTogglePublishScheme = async (annc) => {
    try {
      await api.updateAnnouncement(annc.id, { is_published: !annc.is_published });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteScheme = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      loadData();
    } catch (err) {
      alert("Error deleting scheme: " + err.message);
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      await api.retrySMSJob(jobId);
      loadData();
    } catch (err) {
      alert("Error retrying SMS job: " + err.message);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await api.cancelSMSJob(jobId);
      loadData();
    } catch (err) {
      alert("Error cancelling SMS job: " + err.message);
    }
  };

  // Character calculation
  const charLength = message.length;
  const isUnicode = /[^\u0000-\u007f]/.test(message);
  const maxSingle = isUnicode ? 70 : 160;
  const parts = charLength <= maxSingle ? 1 : Math.ceil(charLength / (isUnicode ? 67 : 153));

  const filteredJobs = smsJobs.filter(job => {
    if (jobFilter === 'all') return true;
    return job.status === jobFilter;
  });

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            SMS Notifications, Broadcasts & Schemes
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage official cooperative schemes, emergency SMS broadcasts, and cellular delivery audit queues
          </p>
        </div>

        {activeTab === 'schemes' && (
          <button
            onClick={() => setIsSchemeModalOpen(true)}
            className="btn btn-primary touch-target"
          >
            <PlusIcon size={16} />
            <span>Create Scheme / Notice</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border)',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'campaigns' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'campaigns' ? 800 : 600,
            color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          SMS Broadcast Dispatch
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'schemes' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'schemes' ? 800 : 600,
            color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>Schemes & Announcements</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: 12,
            backgroundColor: activeTab === 'schemes' ? 'var(--primary-light)' : '#f3f4f6',
            color: activeTab === 'schemes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700
          }}>
            {announcements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'jobs' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'jobs' ? 800 : 600,
            color: activeTab === 'jobs' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>SMS Delivery Queue & Jobs</span>
          {smsSummary && smsSummary.failed > 0 && (
            <span style={{
              fontSize: '0.72rem',
              padding: '0.1rem 0.45rem',
              borderRadius: 12,
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontWeight: 700
            }}>
              {smsSummary.failed} Failed
            </span>
          )}
        </button>
      </div>

      {/* Gateway Environment Status Banner */}
      <div style={{
        padding: '0.75rem 1.1rem',
        backgroundColor: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ color: '#d97706' }}>
          <AlertTriangleIcon size={20} />
        </div>
        <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
          <strong>Gateway Mode: Simulated Provider (DLT Compliant Mode).</strong>
          <span style={{ display: 'block', fontSize: '0.78rem', color: '#b45309' }}>
            Farmer mobile numbers are protected with privacy masking (e.g. <code>+91 98451 •••••</code>) and deduplicated via cryptographic idempotency keys. Live DLT gateway activates when <code>SMS_GATEWAY_API_KEY</code> is configured.
          </span>
        </div>
      </div>

      {resultMsg && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {resultMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* ===================== TAB 1: CAMPAIGNS & BROADCAST ===================== */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Composer & Phone Mockup Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Form Card */}
            <div className="card" style={{ border: '2px solid var(--secondary)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
                Compose Broadcast SMS
              </h3>

              <form onSubmit={handleRequestPreview}>
                {/* Template Presets */}
                <div className="form-group">
                  <label className="form-label">Load Verified Announcement Template (Optional)</label>
                  <select
                    className="form-input"
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select a standard template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div className="form-group">
                  <label className="form-label">Target Farmer Audience *</label>
                  <select
                    className="form-input"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    required
                  >
                    <option value="all">All Registered Farmers ({farmers.length} active members)</option>
                    <option value="locality">Farmers in Specific Village / Locality</option>
                    <option value="individual">Individual Farmer</option>
                  </select>
                </div>

                {/* Locality Selector */}
                {targetAudience === 'locality' && (
                  <div className="form-group">
                    <label className="form-label">Select Village *</label>
                    <select
                      className="form-input"
                      value={targetLocality}
                      onChange={(e) => setTargetLocality(e.target.value)}
                      required
                    >
                      {villages.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Individual Farmer Selector */}
                {targetAudience === 'individual' && (
                  <div className="form-group">
                    <label className="form-label">Select Farmer *</label>
                    <select
                      className="form-input"
                      value={targetFarmerId}
                      onChange={(e) => setTargetFarmerId(e.target.value)}
                      required
                    >
                      {farmers.map(f => (
                        <option key={f.id} value={f.id}>{f.full_name} ({f.phone ? `••••${f.phone.slice(-4)}` : 'No phone'}) — {f.village}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Campaign Title */}
                <div className="form-group">
                  <label className="form-label">Campaign Title / Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Free Cattle Vaccination Camp"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Message Body */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>SMS Message Text *</label>
                    <span style={{ fontSize: '0.78rem', color: charLength > maxSingle ? 'var(--status-pending)' : 'var(--text-muted)' }}>
                      {charLength} chars | {parts} SMS {isUnicode ? '(Unicode)' : '(GSM 7-bit)'}
                    </span>
                  </div>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Type verified announcement details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Note: Transparent, DLT-formatted text prevents delivery rejection by telecom operators.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
                  <span>Preview & Validate Recipients</span>
                </button>
              </form>
            </div>

            {/* Mobile Phone Preview Mockup */}
            <div className="card" style={{
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Farmer Handset Screen Preview
              </h3>

              <div style={{
                width: 280,
                height: 440,
                borderRadius: 36,
                border: '8px solid #24332A',
                backgroundColor: '#f3f4f6',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: 60,
                  height: 4,
                  backgroundColor: '#9ca3af',
                  borderRadius: 2,
                  margin: '8px auto 6px'
                }} />

                <div style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>
                    DAIRYSTH (KMF)
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    Official Cooperative SMS
                  </div>
                </div>

                <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    wordBreak: 'break-word'
                  }}>
                    {title && (
                      <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.25rem', fontSize: '0.82rem' }}>
                        [{title}]
                      </strong>
                    )}
                    {message || "Enter your SMS message in the form to see a live preview of how it will appear on low-cost feature and smartphones..."}
                    <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                      Just now • SMS
                    </div>
                  </div>
                </div>

                <div style={{
                  width: 100,
                  height: 4,
                  backgroundColor: '#24332A',
                  borderRadius: 2,
                  margin: '6px auto'
                }} />
              </div>
            </div>
          </div>

          {/* Campaign History Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
              Broadcast Campaign History
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem' }}>Date & Time</th>
                    <th style={{ padding: '0.65rem' }}>Campaign Title</th>
                    <th style={{ padding: '0.65rem' }}>Audience</th>
                    <th style={{ padding: '0.65rem' }}>Recipients</th>
                    <th style={{ padding: '0.65rem' }}>Delivery Status</th>
                    <th style={{ padding: '0.65rem' }}>Message Text</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem', whiteSpace: 'nowrap' }}>
                        {new Date(c.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {c.title}
                      </td>
                      <td style={{ padding: '0.65rem', textTransform: 'capitalize' }}>
                        {c.target_audience} {c.target_locality ? `(${c.target_locality})` : ''}
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}>
                        {c.recipient_count} farmers
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
                          {c.delivery_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.message}>
                        {c.message}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No broadcast campaigns recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: SCHEMES & ANNOUNCEMENTS ===================== */}
      {activeTab === 'schemes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {announcements.map((annc) => (
              <div
                key={annc.id}
                className="card"
                style={{
                  padding: '1.1rem',
                  borderTop: `4px solid ${annc.is_published ? 'var(--primary)' : '#9ca3af'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8'
                    }}>
                      {annc.category}
                    </span>

                    <span className={`badge badge-${annc.is_published ? 'settled' : 'pending'}`} style={{ fontSize: '0.72rem' }}>
                      {annc.is_published ? 'Published' : 'Draft / Archived'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {annc.title}
                  </h4>
                  {annc.title_kn && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      {annc.title_kn}
                    </div>
                  )}

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.75rem', maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {annc.content}
                  </p>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>Audience: <strong style={{ textTransform: 'capitalize' }}>{annc.target_audience} {annc.target_village ? `(${annc.target_village})` : ''}</strong></div>
                    {annc.expires_at && <div>Valid Until: <strong>{new Date(annc.expires_at).toLocaleDateString()}</strong></div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handleTogglePublishScheme(annc)}
                    className="btn btn-outline"
                    style={{ flex: 1, minHeight: 34, fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                  >
                    {annc.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDeleteScheme(annc.id)}
                    className="btn btn-outline"
                    style={{ minHeight: 34, fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {announcements.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <InfoIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No cooperative schemes or notices created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: SMS DELIVERY QUEUE & JOBS ===================== */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Metrics Cards */}
          {smsSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Jobs</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{smsSummary.total_jobs}</span>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Delivered / Sent</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{smsSummary.sent + smsSummary.delivered}</span>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pending in Queue</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{smsSummary.pending}</span>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Failed / Undelivered</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{smsSummary.failed}</span>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Success Rate</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{smsSummary.success_rate_percent}%</span>
              </div>
            </div>
          )}

          {/* Jobs Table Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                Per-Recipient Cellular Dispatch Log
              </h3>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-input"
                  style={{ minHeight: 34, padding: '0.2rem 0.6rem', fontSize: '0.82rem' }}
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent / Delivered</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={loadData}
                  className="btn btn-outline"
                  style={{ minHeight: 34, padding: '0.2rem 0.6rem', fontSize: '0.82rem' }}
                  title="Refresh status"
                >
                  <RefreshCwIcon size={14} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Timestamp</th>
                    <th style={{ padding: '0.6rem' }}>Farmer</th>
                    <th style={{ padding: '0.6rem' }}>Masked Phone</th>
                    <th style={{ padding: '0.6rem' }}>Type</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                    <th style={{ padding: '0.6rem' }}>Attempts</th>
                    <th style={{ padding: '0.6rem' }}>Error / Gateway Info</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem', whiteSpace: 'nowrap' }}>
                        {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                        {job.farmer_name || `Farmer #${job.farmer_id}`}
                      </td>
                      <td style={{ padding: '0.6rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {job.phone_masked}
                      </td>
                      <td style={{ padding: '0.6rem', textTransform: 'capitalize' }}>
                        {job.job_type.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className={`badge badge-${job.status === 'sent' || job.status === 'delivered' ? 'settled' : (job.status === 'failed' ? 'overdue' : 'pending')}`} style={{ fontSize: '0.72rem' }}>
                          {job.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        {job.retry_count}
                      </td>
                      <td style={{ padding: '0.6rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: job.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }} title={job.error_message || 'Simulated provider execution'}>
                        {job.error_message || (job.status === 'sent' ? 'Delivered via simulated gateway' : '-')}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="btn btn-secondary"
                            style={{ minHeight: 28, padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Retry
                          </button>
                        )}
                        {job.status === 'pending' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="btn btn-outline"
                            style={{ minHeight: 28, padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No SMS notification jobs found matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Recipient Validation Modal */}
      {previewData && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Confirm SMS Broadcast Dispatch"
          maxWidth={600}
        >
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: previewData.is_mock_gateway ? 'var(--status-pending-bg)' : 'var(--status-settled-bg)',
            color: previewData.is_mock_gateway ? 'var(--status-pending)' : 'var(--status-settled)',
            borderRadius: 6,
            marginBottom: '1rem',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {previewData.mock_banner}
          </div>

          <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Target Audience:</span>
                <div><strong>{previewData.recipient_count} Valid Mobile Numbers</strong></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>SMS Segments:</span>
                <div><strong>{previewData.estimated_parts} part(s) ({previewData.message_length} chars)</strong></div>
              </div>
            </div>

            <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.82rem' }}>Sample Recipients (Privacy Masked):</div>
            <div style={{ backgroundColor: 'var(--bg-page)', padding: '0.5rem', borderRadius: 6, fontSize: '0.8rem' }}>
              {previewData.sample_recipients.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                  <span>{r.name} ({r.village})</span>
                  <strong>{r.phone}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <strong>Message Preview:</strong>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
              "{message}"
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="btn btn-outline"
              style={{ flex: 1 }}
              disabled={sending}
            >
              Back to Edit
            </button>
            <button
              onClick={handleConfirmSend}
              className="btn btn-primary"
              style={{ flex: 1.5 }}
              disabled={sending}
            >
              {sending ? "Transmitting..." : `Confirm & Broadcast to ${previewData.recipient_count} Farmers`}
            </button>
          </div>
        </Modal>
      )}

      {/* Create Scheme Modal */}
      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title="Publish Cooperative Scheme or Notice"
        maxWidth={620}
      >
        <form onSubmit={handleCreateScheme}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
                value={schemeCategory}
                onChange={(e) => setSchemeCategory(e.target.value)}
              >
                <option value="subsidy">Government Subsidy (Pashu Bhagya etc.)</option>
                <option value="procurement">Procurement Notice & Bonus</option>
                <option value="health_camp">Veterinary / Vaccination Camp</option>
                <option value="meeting">General Body Meeting</option>
                <option value="general">General Notice</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience *</label>
              <select
                className="form-input"
                value={schemeAudience}
                onChange={(e) => setSchemeAudience(e.target.value)}
              >
                <option value="all">All Registered Farmers</option>
                <option value="village">Specific Village</option>
                <option value="individual">Individual Farmer</option>
              </select>
            </div>
          </div>

          {schemeAudience === 'village' && (
            <div className="form-group">
              <label className="form-label">Select Target Village *</label>
              <select
                className="form-input"
                value={schemeVillage}
                onChange={(e) => setSchemeVillage(e.target.value)}
              >
                {villages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}

          {schemeAudience === 'individual' && (
            <div className="form-group">
              <label className="form-label">Select Target Farmer *</label>
              <select
                className="form-input"
                value={schemeFarmerId}
                onChange={(e) => setSchemeFarmerId(e.target.value)}
              >
                {farmers.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Scheme Title (English) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Pashu Bhagya 50% Subsidy Scheme 2026"
              value={schemeTitle}
              onChange={(e) => setSchemeTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheme Title (Kannada Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="ಉದಾ: ಪಶು ಭಾಗ್ಯ ಶೇ ೫೦ ಸಹಾಯಧನ ಯೋಜನೆ"
              value={schemeTitleKn}
              onChange={(e) => setSchemeTitleKn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheme Content / Description *</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Detailed guidelines, required documents, and submission steps..."
              value={schemeContent}
              onChange={(e) => setSchemeContent(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheme Content (Kannada Optional)</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="ಕನ್ನಡ ವಿವರಣೆ..."
              value={schemeContentKn}
              onChange={(e) => setSchemeContentKn(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Eligibility Criteria</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Small & marginal dairy farmers"
                value={schemeEligibility}
                onChange={(e) => setSchemeEligibility(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Benefits</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ₹25,000 subsidy per cattle unit"
                value={schemeBenefits}
                onChange={(e) => setSchemeBenefits(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Person / Office</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Society Secretary or Vet Officer"
                value={schemeContact}
                onChange={(e) => setSchemeContact(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valid Until (Expiry Date)</label>
              <input
                type="date"
                className="form-input"
                value={schemeExpiresAt}
                onChange={(e) => setSchemeExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="send_sms_checkbox"
              checked={schemeSendSms}
              onChange={(e) => setSchemeSendSms(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="send_sms_checkbox" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
              Queue SMS alert immediately to all eligible farmers
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsSchemeModalOpen(false)}
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.5 }}
              disabled={schemeSubmitting}
            >
              {schemeSubmitting ? "Publishing..." : "Publish & Notify Farmers"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
