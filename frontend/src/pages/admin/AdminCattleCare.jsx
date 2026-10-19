import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CattleIcon, CalendarIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon, SMSIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminCattleCare() {
  const [farmers, setFarmers] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Feedback State
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // New Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetFarmerId, setTargetFarmerId] = useState('');
  const [targetCattleId, setTargetCattleId] = useState('');
  const [remTitle, setRemTitle] = useState('');
  const [remTitleKn, setRemTitleKn] = useState('');
  const [careType, setCareType] = useState('vaccination');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [remGuidance, setRemGuidance] = useState('');
  const [vetNotes, setVetNotes] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Register Cattle Modal
  const [isCattleModalOpen, setIsCattleModalOpen] = useState(false);
  const [cattleFarmerId, setCattleFarmerId] = useState('');
  const [cTag, setCTag] = useState('');
  const [cName, setCName] = useState('');
  const [cBreed, setCBreed] = useState('Gir');
  const [cAge, setCAge] = useState('3.5');
  const [cYield, setCYield] = useState('12');
  const [cStatus, setCStatus] = useState('Milking');
  const [cNotes, setCNotes] = useState('');

  // Complete Administration Modal
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingRem, setCompletingRem] = useState(null);
  const [adminBy, setAdminBy] = useState('Dr. Ramesh Hegde (KMF Vet)');
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fList, cList, rList] = await Promise.all([
        api.getFarmers().catch(() => []),
        api.getCattle().catch(() => []),
        api.getReminders().catch(() => [])
      ]);
      setFarmers(fList);
      setCattleList(cList);
      setReminders(rList);
      if (fList.length > 0) {
        if (!targetFarmerId) setTargetFarmerId(fList[0].id.toString());
        if (!cattleFarmerId) setCattleFarmerId(fList[0].id.toString());
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

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await api.createReminder({
        farmer_id: parseInt(targetFarmerId),
        cattle_id: targetCattleId ? parseInt(targetCattleId) : null,
        title: remTitle,
        title_kn: remTitleKn || undefined,
        care_type: careType,
        due_date: dueDate,
        guidance: remGuidance || undefined,
        veterinarian_notes: vetNotes || undefined
      });
      setFormSuccess("Cattle care schedule saved and farmer notified!");
      setRemTitle('');
      setRemTitleKn('');
      setRemGuidance('');
      setVetNotes('');
      loadData();
      setTimeout(() => {
        setIsReminderModalOpen(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateCattle = async (e) => {
    e.preventDefault();
    try {
      await api.createCattle({
        farmer_id: parseInt(cattleFarmerId),
        tag_number: cTag.trim(),
        name: cName.trim(),
        breed: cBreed,
        age_years: parseFloat(cAge) || null,
        daily_yield_estimate: parseFloat(cYield) || 0,
        milking_status: cStatus,
        health_notes: cNotes || undefined
      });
      setIsCattleModalOpen(false);
      setCTag('');
      setCName('');
      setCNotes('');
      loadData();
    } catch (err) {
      alert("Error registering cattle: " + err.message);
    }
  };

  const openCompletionModal = (rem) => {
    setCompletingRem(rem);
    setCompletionNotes(rem.veterinarian_notes || '');
    setIsCompletionModalOpen(true);
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completingRem) return;
    try {
      await api.updateReminder(completingRem.id, {
        status: 'completed',
        administered_by: adminBy.trim() || 'Cooperative Vet Officer',
        veterinarian_notes: completionNotes.trim() || undefined,
        next_due_date: nextDueDate || undefined
      });
      setIsCompletionModalOpen(false);
      setActionSuccess(`Recorded administration for "${completingRem.title}". Next due date updated.`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadData();
    } catch (err) {
      alert("Error recording completion: " + err.message);
    }
  };

  const handleSendReminderSMS = async (rem) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.dispatchVaccinationSMS(rem.id);
      setActionSuccess(res.message || `SMS notification queued for ${rem.farmer_name || 'farmer'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError("Failed to queue SMS: " + err.message);
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleCancelReminder = async (remId) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled reminder?")) return;
    try {
      await api.deleteReminder(remId);
      setActionSuccess("Reminder cancelled.");
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err) {
      alert("Error cancelling reminder: " + err.message);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Cattle Health, Vaccination & Reminders
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Schedule veterinary drives, log administered doses, and transmit direct SMS reminders to farmers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsCattleModalOpen(true)}
            className="btn btn-outline touch-target"
          >
            <PlusIcon size={16} />
            <span>Add Cattle</span>
          </button>
          <button
            onClick={() => setIsReminderModalOpen(true)}
            className="btn btn-primary touch-target"
          >
            <CalendarIcon size={16} />
            <span>Schedule Health Reminder</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Reminders List Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
              Care Schedules ({filteredReminders.length})
            </h3>

            <select
              className="form-input"
              style={{ minHeight: 32, padding: '0.2rem 0.5rem', fontSize: '0.82rem', width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({reminders.length})</option>
              <option value="due_soon">Due Soon (&lt; 3 Days)</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: 520, overflowY: 'auto' }}>
            {filteredReminders.map((r) => {
              const isOverdue = r.status === 'overdue';
              const isDueSoon = r.status === 'due_soon';
              const isCompleted = r.status === 'completed';
              const isCancelled = r.status === 'cancelled';

              let borderAccent = 'var(--status-pending)';
              let badgeBg = '#eff6ff';
              let badgeColor = '#1d4ed8';

              if (isOverdue) {
                borderAccent = '#dc2626';
                badgeBg = '#fee2e2';
                badgeColor = '#b91c1c';
              } else if (isDueSoon) {
                borderAccent = '#d97706';
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
              } else if (isCompleted) {
                borderAccent = '#10b981';
                badgeBg = '#d1fae5';
                badgeColor = '#065f46';
              } else if (isCancelled) {
                borderAccent = '#6b7280';
                badgeBg = '#f3f4f6';
                badgeColor = '#374151';
              }

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '0.9rem',
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: 8,
                    borderLeft: `5px solid ${borderAccent}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 4,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          textTransform: 'uppercase'
                        }}>
                          {r.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {r.care_type}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.98rem', margin: '0.2rem 0' }}>{r.title}</h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Farmer: <strong>{r.farmer_name || `Farmer #${r.farmer_id}`}</strong>
                        {r.cattle_name ? ` • Animal: ${r.cattle_name} (${r.cattle_tag})` : ' • Herd-wide'}
                      </div>
                      <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        Due: <strong style={{ color: isOverdue ? '#dc2626' : (isDueSoon ? '#d97706' : 'var(--text-main)') }}>{r.due_date}</strong>
                      </div>
                    </div>
                  </div>

                  {isCompleted && (
                    <div style={{ fontSize: '0.78rem', color: '#065f46', backgroundColor: '#d1fae5', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
                      ✓ Administered by: <strong>{r.administered_by || 'Veterinary Officer'}</strong>
                      {r.next_due_date && <span> • Next booster: <strong>{r.next_due_date}</strong></span>}
                    </div>
                  )}

                  {r.guidance && (
                    <div style={{ fontSize: '0.78rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
                      Guidance: {r.guidance}
                    </div>
                  )}

                  {r.veterinarian_notes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                      Notes: {r.veterinarian_notes}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
                    {!isCompleted && !isCancelled && (
                      <>
                        <button
                          onClick={() => openCompletionModal(r)}
                          className="btn btn-primary"
                          style={{ minHeight: 30, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Record Administration
                        </button>

                        <button
                          onClick={() => handleSendReminderSMS(r)}
                          className="btn btn-outline"
                          style={{ minHeight: 30, padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Queue SMS notification to farmer"
                        >
                          <SMSIcon size={12} />
                          <span>Send SMS</span>
                        </button>

                        <button
                          onClick={() => handleCancelReminder(r.id)}
                          className="btn btn-outline"
                          style={{ minHeight: 30, padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredReminders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No care schedules match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Registered Herd Table */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
            Registered Cattle Herd ({cattleList.length})
          </h3>

          <div style={{ overflowX: 'auto', maxHeight: 520 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Tag</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Farmer</th>
                  <th style={{ padding: '0.5rem' }}>Breed</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cattleList.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>{c.tag_number}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '0.5rem' }}>{c.farmer_name}</td>
                    <td style={{ padding: '0.5rem' }}>{c.breed}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span className="badge badge-settled">{c.milking_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Administration Modal */}
      {completingRem && (
        <Modal
          isOpen={isCompletionModalOpen}
          onClose={() => setIsCompletionModalOpen(false)}
          title={`Record Administration: ${completingRem.title}`}
          maxWidth={500}
        >
          <form onSubmit={handleConfirmCompletion}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-page)', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>Farmer: <strong>{completingRem.farmer_name}</strong></div>
              <div>Target: <strong>{completingRem.cattle_name ? `${completingRem.cattle_name} (${completingRem.cattle_tag})` : 'Herd-wide'}</strong></div>
              <div>Scheduled Date: <strong>{completingRem.due_date}</strong></div>
            </div>

            <div className="form-group">
              <label className="form-label">Administered By (Veterinarian / Staff Name) *</label>
              <input
                type="text"
                className="form-input"
                value={adminBy}
                onChange={(e) => setAdminBy(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Due Date (Booster / Next Schedule)</label>
              <input
                type="date"
                className="form-input"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Recommended interval: 6 months for FMD booster, 1 year for Brucellosis.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Observations & Verification Notes</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="e.g. Dose administered subcutaneously, normal vital signs..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setIsCompletionModalOpen(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1.5 }}
              >
                Verify & Complete Dose
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Reminder Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Schedule Cattle Care Reminder / Camp"
      >
        {formSuccess && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleCreateReminder}>
          <div className="form-group">
            <label className="form-label">Target Farmer *</label>
            <select
              className="form-input"
              value={targetFarmerId}
              onChange={(e) => setTargetFarmerId(e.target.value)}
              required
            >
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Care Type *</label>
              <select
                className="form-input"
                value={careType}
                onChange={(e) => setCareType(e.target.value)}
              >
                <option value="vaccination">Vaccination (FMD, BQ, HS)</option>
                <option value="deworming">Deworming Drive</option>
                <option value="vet_camp">Veterinary Health Camp</option>
                <option value="health_check">Routine Health Checkup</option>
                <option value="nutrition">Mineral / Feed Advisory</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reminder Title (English) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. FMD Booster Dose"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reminder Title (Kannada Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="ಉದಾ: ಕಾಲುಬಾಯಿ ರೋಗದ ಲಸಿಕೆ"
              value={remTitleKn}
              onChange={(e) => setRemTitleKn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Farmer Care Guidance (Preparation Steps)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Keep animals in shade, do not feed heavy meals 2 hours prior..."
              value={remGuidance}
              onChange={(e) => setRemGuidance(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Veterinary Instructions & Clinical Notes</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Special instructions for the cooperative vet officer..."
              value={vetNotes}
              onChange={(e) => setVetNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
            Schedule & Notify Farmer
          </button>
        </form>
      </Modal>

      {/* Add Cattle Modal */}
      <Modal
        isOpen={isCattleModalOpen}
        onClose={() => setIsCattleModalOpen(false)}
        title="Register Cattle Profile"
      >
        <form onSubmit={handleCreateCattle}>
          <div className="form-group">
            <label className="form-label">Farmer Owner *</label>
            <select
              className="form-input"
              value={cattleFarmerId}
              onChange={(e) => setCattleFarmerId(e.target.value)}
              required
            >
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_uid})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Cattle Tag Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. KA-14-GIR-12"
                value={cTag}
                onChange={(e) => setCTag(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Name / Nickname *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kaveri"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Breed *</label>
              <select className="form-input" value={cBreed} onChange={(e) => setCBreed(e.target.value)}>
                <option value="Gir">Gir</option>
                <option value="Holstein Friesian">Holstein Friesian</option>
                <option value="Jersey">Jersey</option>
                <option value="Murrah Buffalo">Murrah Buffalo</option>
                <option value="Sahiwal">Sahiwal</option>
                <option value="Crossbred">Crossbred</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input type="number" step="0.1" className="form-input" value={cAge} onChange={(e) => setCAge(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Est Yield (L)</label>
              <input type="number" step="0.5" className="form-input" value={cYield} onChange={(e) => setCYield(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={cStatus} onChange={(e) => setCStatus(e.target.value)}>
              <option value="Milking">Milking</option>
              <option value="Dry">Dry</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Heifer">Heifer</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
            Register Animal in Database
          </button>
        </form>
      </Modal>
    </div>
  );
}
