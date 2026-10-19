import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CattleIcon, CalendarIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function AdminCattleCare() {
  const [farmers, setFarmers] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      const [fList, cList, rList] = await Promise.all([
        api.getFarmers(),
        api.getCattle(),
        api.getReminders()
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
        veterinarian_notes: vetNotes || undefined
      });
      setFormSuccess("Cattle care schedule saved and farmer notified!");
      setRemTitle('');
      setRemTitleKn('');
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

  const handleCompleteReminder = async (remId) => {
    try {
      await api.updateReminder(remId, { status: 'completed' });
      loadData();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Cattle Health & Veterinary Coordination
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Track registered animals, schedule vaccination camps, and monitor deworming drives
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Reminders List */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
            Vaccination & Care Schedules ({reminders.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 450, overflowY: 'auto' }}>
            {reminders.map((r) => {
              const isOverdue = r.status === 'overdue';
              const isCompleted = r.status === 'completed';

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: 8,
                    borderLeft: `4px solid ${isOverdue ? 'var(--status-overdue)' : (isCompleted ? 'var(--status-settled)' : 'var(--status-pending)')}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={`badge badge-${r.status}`} style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                        {r.status}
                      </span>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0.2rem 0' }}>{r.title}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Target: {r.cattle_name ? `${r.cattle_name} (${r.cattle_tag})` : 'All herd'} | Due: <strong>{r.due_date}</strong>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => handleCompleteReminder(r.id)}
                        className="btn btn-secondary touch-target"
                        style={{ minHeight: 32, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registered Herd Table */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
            Registered Cattle Herd ({cattleList.length})
          </h3>

          <div style={{ overflowX: 'auto', maxHeight: 450 }}>
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
            <label className="form-label">Veterinary Instructions & Notes</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Special instructions for the farmer..."
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
