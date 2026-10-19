import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  SMSIcon, AlertTriangleIcon, CheckCircleIcon,
  UsersIcon, ShieldCheckIcon, SendIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminSMSNotifications() {
  const [campaigns, setCampaigns] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, locality, individual
  const [targetLocality, setTargetLocality] = useState('');
  const [targetFarmerId, setTargetFarmerId] = useState('');

  // Preview & Modal State
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      const [cList, fList, vList] = await Promise.all([
        api.getSMSCampaigns(),
        api.getFarmers(),
        api.getVillages()
      ]);
      setCampaigns(cList);
      setFarmers(fList);
      setVillages(vList);
      if (vList.length > 0 && !targetLocality) setTargetLocality(vList[0]);
      if (fList.length > 0 && !targetFarmerId) setTargetFarmerId(fList[0].id.toString());
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
      setResultMsg(`Broadcast successfully recorded for ${res.recipient_count} farmers. [${res.delivery_status}]`);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  // Character calculation
  const charLength = message.length;
  const isUnicode = /[^\u0000-\u007f]/.test(message);
  const maxSingle = isUnicode ? 70 : 160;
  const parts = charLength <= maxSingle ? 1 : Math.ceil(charLength / (isUnicode ? 67 : 153));

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          SMS Broadcasts & Scheme Announcements
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Transmit verified government schemes, health camps, and cooperative notices directly to registered farmer mobile phones
        </p>
      </div>

      {/* Gateway Environment Status Banner */}
      <div style={{
        padding: '0.85rem 1.25rem',
        backgroundColor: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ color: '#d97706' }}>
          <AlertTriangleIcon size={22} />
        </div>
        <div style={{ fontSize: '0.88rem', color: '#92400e' }}>
          <strong>Gateway Mode: Development / Simulated SMS Mode Active.</strong>
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#b45309' }}>
            To protect production credits and privacy, messages are previewed, recipient numbers validated, and attempts logged in the database audit log without cellular dispatch unless <code>SMS_GATEWAY_API_KEY</code> is configured in <code>.env</code>.
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
            Compose Announcement
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

            {/* Locality Selector if locality chosen */}
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

            {/* Individual Farmer Selector if individual chosen */}
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
                    <option key={f.id} value={f.id}>{f.full_name} ({f.phone}) — {f.village}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Announcement Title */}
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
                Note: Do not invent government schemes; input verified deadlines and contact info.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
              <span>Preview & Validate Recipients</span>
            </button>
          </form>
        </div>

        {/* Realistic Mobile Phone Preview Mockup */}
        <div className="card" style={{
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Farmer Mobile Screen Preview
          </h3>

          {/* Smartphone Frame */}
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
            {/* Speaker bar */}
            <div style={{
              width: 60,
              height: 4,
              backgroundColor: '#9ca3af',
              borderRadius: 2,
              margin: '8px auto 6px'
            }} />

            {/* Phone Header */}
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

            {/* SMS Message Bubble */}
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

            {/* Phone bottom bar */}
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
          SMS Campaign Audit History
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Recipient Validation Modal */}
      {previewData && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Confirm SMS Broadcast Dispatch"
          maxWidth={600}
        >
          {/* Mode Banner */}
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

            <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.82rem' }}>Sample Recipients:</div>
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
    </div>
  );
}
