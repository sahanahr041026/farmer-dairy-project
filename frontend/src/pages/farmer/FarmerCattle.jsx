import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import {
  CattleIcon, CalendarIcon, CheckCircleIcon,
  AlertTriangleIcon, PlusIcon, SpeakerIcon, EditIcon, InfoIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

export function FarmerCattle() {
  const { user, language } = useAuth();
  const [activeTab, setActiveTab] = useState('cows'); // 'cows', 'reminders', 'breeds'
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Cattle Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTag, setAddTag] = useState('');
  const [addName, setAddName] = useState('');
  const [addBreed, setAddBreed] = useState('Gir');
  const [addAge, setAddAge] = useState('3.5');
  const [addGender, setAddGender] = useState('Female');
  const [addStatus, setAddStatus] = useState('Milking');
  const [addYield, setAddYield] = useState('12.0');
  const [addNotes, setAddNotes] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Edit Cattle Modal State
  const [editingCattle, setEditingCattle] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('Gir');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Female');
  const [editStatus, setEditStatus] = useState('Milking');
  const [editYield, setEditYield] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, rList, bList] = await Promise.all([
        api.getCattle(),
        api.getReminders(),
        api.getBreeds()
      ]);
      setCattleList(cList);
      setReminders(rList);
      setBreeds(bList);
      if (bList.length > 0 && !selectedBreed) {
        setSelectedBreed(bList[0]);
      }
    } catch (e) {
      console.error("Error loading cattle data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Voice Guidance for Reminders
  const handleSpeakReminder = (rem) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const statusText = t(rem.status, language);
    const text = language === 'kn'
      ? `${rem.title_kn || rem.title}. ದಿನಾಂಕ: ${rem.due_date}. ಸ್ಥಿತಿ: ${rem.status === 'completed' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : (rem.status === 'overdue' ? 'ದಿನಾಂಕ ಮೀರಿದೆ' : 'ಮುಂಬರುವ')}. ${rem.veterinarian_notes || ''}`
      : `${rem.title}. Due date: ${rem.due_date}. Status: ${rem.status}. ${rem.veterinarian_notes || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // Add Cattle Handler
  const handleAddCattle = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!addTag.trim() || !addName.trim()) {
      setAddError(language === 'kn' ? "ದಯವಿಟ್ಟು ಟ್ಯಾಗ್ ಸಂಖ್ಯೆ ಮತ್ತು ಹಸುವಿನ ಹೆಸರನ್ನು ನಮೂದಿಸಿ." : "Please provide a tag number and cattle name.");
      return;
    }

    try {
      await api.createCattle({
        tag_number: addTag.trim().toUpperCase(),
        name: addName.trim(),
        breed: addBreed,
        age_years: parseFloat(addAge) || null,
        gender: addGender,
        milking_status: addStatus,
        daily_yield_estimate: parseFloat(addYield) || 0.0,
        health_notes: addNotes.trim() || undefined
      });

      setAddSuccess(language === 'kn' ? "ಹೊಸ ಹಸು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಣಿಯಾಗಿದೆ!" : "Cattle registered successfully!");
      setAddTag('');
      setAddName('');
      setAddNotes('');
      loadData();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess('');
      }, 1500);
    } catch (err) {
      setAddError(err.message || "Failed to register cattle");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cow) => {
    setEditingCattle(cow);
    setEditName(cow.name);
    setEditBreed(cow.breed);
    setEditAge(cow.age_years ? cow.age_years.toString() : '');
    setEditGender(cow.gender || 'Female');
    setEditStatus(cow.milking_status || 'Milking');
    setEditYield(cow.daily_yield_estimate ? cow.daily_yield_estimate.toString() : '0');
    setEditNotes(cow.health_notes || '');
    setEditError('');
    setEditSuccess('');
  };

  // Update Cattle Handler
  const handleUpdateCattle = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editName.trim()) {
      setEditError(language === 'kn' ? "ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ನಮೂದಿಸಿ." : "Please enter a name.");
      return;
    }

    try {
      await api.updateCattle(editingCattle.id, {
        name: editName.trim(),
        breed: editBreed,
        age_years: parseFloat(editAge) || null,
        gender: editGender,
        milking_status: editStatus,
        daily_yield_estimate: parseFloat(editYield) || 0.0,
        health_notes: editNotes.trim() || undefined
      });

      setEditSuccess(language === 'kn' ? "ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ತಿದ್ದುಪಡಿಯಾಗಿದೆ!" : "Cattle profile updated successfully!");
      loadData();
      setTimeout(() => {
        setEditingCattle(null);
        setEditSuccess('');
      }, 1500);
    } catch (err) {
      setEditError(err.message || "Failed to update profile");
    }
  };

  // Mark Reminder Completed
  const handleCompleteReminder = async (remId) => {
    try {
      await api.updateReminder(remId, { status: 'completed' });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Header with Title and Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t("cattle_title", language)}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {cattleList.length} {language === 'kn' ? 'ದಾಖಲಾದ ಜಾನುವಾರುಗಳು' : 'registered animals'} | {user?.cooperative?.name}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary touch-target"
          style={{ minHeight: 42, padding: '0.45rem 1rem', fontSize: '0.9rem' }}
        >
          <PlusIcon size={18} />
          <span>{t("add_cattle", language)}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.5rem',
        marginBottom: '1.25rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('cows')}
          className="touch-target"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'cows' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'cows' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {t("tab_my_cows", language)} ({cattleList.length})
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className="touch-target"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'reminders' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'reminders' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {t("tab_reminders", language)} ({reminders.filter(r => r.status !== 'completed').length})
        </button>

        <button
          onClick={() => setActiveTab('breeds')}
          className="touch-target"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'breeds' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'breeds' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {t("tab_breed_guide", language)}
        </button>
      </div>

      {/* TAB 1: MY HERD */}
      {activeTab === 'cows' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading registered cattle...
            </div>
          ) : cattleList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <CattleIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                {language === 'kn' ? 'ಯಾವುದೇ ಹಸು ನೋಂದಣಿಯಾಗಿಲ್ಲ' : 'No cattle registered yet'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {language === 'kn' ? 'ನಿಮ್ಮ ಮೊದಲ ಹಸು ಅಥವಾ ಎಮ್ಮೆಯನ್ನು ನೋಂದಾಯಿಸಿ.' : 'Register your cows and buffaloes to track milk yield and health schedules.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary touch-target"
                style={{ margin: '0 auto' }}
              >
                <PlusIcon size={18} />
                <span>{t("add_cattle", language)}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cattleList.map((cow) => (
                <div key={cow.id} className="card" style={{ padding: '1.1rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        backgroundColor: 'var(--secondary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CattleIcon size={28} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {cow.name}
                        </h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Tag: <span style={{ color: 'var(--primary)' }}>{cow.tag_number}</span> | {cow.breed}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${cow.milking_status === 'Milking' ? 'badge-settled' : 'badge-pending'}`} style={{ fontSize: '0.75rem' }}>
                        {cow.milking_status}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(cow)}
                        className="btn btn-outline touch-target"
                        style={{ minHeight: 36, padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        title="Edit profile"
                      >
                        <EditIcon size={14} />
                        <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '0.85rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("age", language)}</span>
                      <strong>{cow.age_years ? `${cow.age_years} ${t("years", language)}` : 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("daily_yield", language)}</span>
                      <strong>{cow.daily_yield_estimate ? `${cow.daily_yield_estimate} L/day` : '0 L'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t("gender", language)}</span>
                      <strong>{cow.gender === 'Female' ? t("female", language) : t("male", language)}</strong>
                    </div>
                  </div>

                  {cow.health_notes && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '0.4rem 0.6rem', borderRadius: 4 }}>
                      💡 <strong>Note:</strong> {cow.health_notes}
                    </div>
                  )}

                  {/* Cattle Reminders Mini List */}
                  {cow.reminders && cow.reminders.length > 0 && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Active Reminders:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {cow.reminders.map((r) => (
                          <span
                            key={r.id}
                            className={`badge badge-${r.status}`}
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          >
                            {language === 'kn' ? (r.title_kn || r.title) : r.title} (Due: {r.due_date})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HEALTH REMINDERS */}
      {activeTab === 'reminders' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {t("reminders_title", language)}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಲಸಿಕೆ ಶಿಬಿರಗಳು, ಜಂತುಹುಳು ನಿವಾರಣೆ ಮತ್ತು ಪಶುವೈದ್ಯರ ತಪಾಸಣೆ ವೇಳಾಪಟ್ಟಿ' : 'Vaccination camps, deworming, and veterinary health schedule'}
            </p>
          </div>

          {reminders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <CalendarIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No health reminders currently scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {reminders.map((rem) => {
                const isOverdue = rem.status === 'overdue';
                const isCompleted = rem.status === 'completed';

                return (
                  <div
                    key={rem.id}
                    className="card"
                    style={{
                      padding: '1rem',
                      borderLeft: `5px solid ${isOverdue ? 'var(--status-overdue)' : (isCompleted ? 'var(--status-settled)' : 'var(--status-pending)')}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <span className={`badge badge-${rem.status}`}>
                          {rem.status === 'overdue' ? t("overdue", language) : (rem.status === 'completed' ? t("completed", language) : t("upcoming", language))}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
                          {rem.care_type}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.02rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-main)' }}>
                        {language === 'kn' ? (rem.title_kn || rem.title) : rem.title}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {rem.cattle_name ? `Animal: ${rem.cattle_name} (${rem.cattle_tag}) | ` : ''} Due: <strong>{rem.due_date}</strong>
                      </div>
                      {rem.veterinarian_notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.3rem', backgroundColor: 'var(--primary-light)', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
                          Dr. Advisory: {rem.veterinarian_notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleSpeakReminder(rem)}
                        className="touch-target"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Listen to reminder read aloud"
                        aria-label="Listen to reminder read aloud"
                      >
                        <SpeakerIcon size={20} />
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => handleCompleteReminder(rem.id)}
                          className="btn btn-outline touch-target"
                          style={{ minHeight: 32, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                          title="Mark completed"
                        >
                          <CheckCircleIcon size={14} />
                          <span>{language === 'kn' ? 'ಆಗಿದೆ' : 'Done'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BREED ADVISORY GUIDE */}
      {activeTab === 'breeds' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              {language === 'kn' ? 'ಭಾರತೀಯ ಹೈನುಗಾರಿಕೆ ತಳಿ ಮಾರ್ಗದರ್ಶಿ' : 'Indian Dairy Cattle & Buffalo Breed Advisory'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಪ್ರಮುಖ ತಳಿಗಳ ಹಾಲು ಇಳುವರಿ, ಫ್ಯಾಟ್ ಅಂಶ, ಆಹಾರ ಪದ್ಧತಿ ಮತ್ತು ರೋಗ ರಕ್ಷಣಾ ಮಾಹಿತಿ' : 'Milk yield potential, fat profiles, nutrition guidelines, and climate suitability'}
            </p>
          </div>

          {/* Breed Selector Pills */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            {breeds.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBreed(b)}
                className="touch-target"
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid',
                  borderColor: selectedBreed?.id === b.id ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: selectedBreed?.id === b.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedBreed?.id === b.id ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {language === 'kn' ? b.name_kn : b.name}
              </button>
            ))}
          </div>

          {/* Selected Breed Detail Card */}
          {selectedBreed && (
            <div className="card" style={{ padding: '1.25rem', border: '2px solid var(--secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                    {language === 'kn' ? selectedBreed.name_kn : selectedBreed.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Origin: {selectedBreed.origin}
                  </div>
                </div>
                <span className="badge badge-settled" style={{ fontSize: '0.8rem' }}>
                  {selectedBreed.category.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                {language === 'kn' ? selectedBreed.description_kn : selectedBreed.description}
              </p>

              {/* Stats Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-main)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Daily Yield</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{selectedBreed.avg_yield_litres}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Avg Fat Content</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedBreed.fat_content}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Avg SNF Content</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedBreed.snf_content}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Heat Tolerance</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{selectedBreed.heat_tolerance}</strong>
                </div>
              </div>

              {/* Feeding Chart */}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {language === 'kn' ? 'ದೈನಂದಿನ ಆಹಾರ ಮಾರ್ಗಸೂಚಿ (ಪೌಷ್ಟಿಕತೆ):' : 'Daily Feeding Guidelines (Nutrition Plan):'}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  🌿 <strong>{language === 'kn' ? 'ಹಸಿರು ಮೇವು' : 'Green Fodder'}:</strong>
                  <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.green_fodder : selectedBreed.feeding_guide?.green_fodder}</div>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  🌾 <strong>{language === 'kn' ? 'ಒಣ ಮೇವು (ಫೈಬರ್)' : 'Dry Fodder'}:</strong>
                  <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.dry_fodder : selectedBreed.feeding_guide?.dry_fodder}</div>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  🥣 <strong>{language === 'kn' ? 'ಹಿಂಡಿ / ಸಾಂದ್ರ ಆಹಾರ' : 'Concentrate Feed'}:</strong>
                  <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.concentrate : selectedBreed.feeding_guide?.concentrate}</div>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  🧂 <strong>{language === 'kn' ? 'ಖನಿಜ ಮಿಶ್ರಣ' : 'Mineral Mixture'}:</strong>
                  <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.mineral_mix : selectedBreed.feeding_guide?.mineral_mix}</div>
                </div>
              </div>

              {/* Care Tips */}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {language === 'kn' ? 'ಆರೈಕೆ ಮತ್ತು ಕೊಟ್ಟಿಗೆ ನಿರ್ವಹಣೆ:' : 'Care & Management Tips:'}
              </h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {(language === 'kn' ? selectedBreed.care_tips_kn : selectedBreed.care_tips)?.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{tip}</li>
                ))}
              </ul>

              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.5rem 0.8rem', borderRadius: 6, fontWeight: 600 }}>
                💡 {language === 'kn' ? 'ಯಾರಿಗೆ ಹೆಚ್ಚು ಸೂಕ್ತ: ' : 'Suitability: '} {selectedBreed.suitability}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD CATTLE */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("add_cattle", language)}
      >
        {addSuccess ? (
          <div style={{ padding: '1rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, fontWeight: 700 }}>
            {addSuccess}
          </div>
        ) : (
          <form onSubmit={handleAddCattle}>
            {addError && (
              <div style={{ padding: '0.6rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                {addError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t("tag_number", language)} *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. KA-14-GIR-05"
                value={addTag}
                onChange={(e) => setAddTag(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("cow_name", language)} *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Ganga / Lakshmi"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">{t("breed", language)}</label>
                <select className="form-input" value={addBreed} onChange={(e) => setAddBreed(e.target.value)}>
                  <option value="Gir">Gir (ಗಿರ್)</option>
                  <option value="Murrah Buffalo">Murrah Buffalo (ಮುರ್ರಾ)</option>
                  <option value="Jersey Cross">Jersey Cross (ಜರ್ಸಿ)</option>
                  <option value="Holstein Friesian">Holstein Friesian (HF)</option>
                  <option value="Sahiwal">Sahiwal (ಸಾಹಿವಾಲ್)</option>
                  <option value="Hallikar">Hallikar (ಹಳ್ಳಿಕಾರ್)</option>
                  <option value="Other / Crossbreed">Other / Crossbreed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t("milking_status", language)}</label>
                <select className="form-input" value={addStatus} onChange={(e) => setAddStatus(e.target.value)}>
                  <option value="Milking">Milking (ಹಾಲು ನೀಡುವ)</option>
                  <option value="Dry">Dry (ಬತ್ತಿದ ಹಸು)</option>
                  <option value="Pregnant">Pregnant (ಗರ್ಭಿಣಿ)</option>
                  <option value="Heifer">Heifer (ಕರು/ಹೆಣ್ಣು ಕರು)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">{t("age", language)} ({t("years", language)})</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={addAge}
                  onChange={(e) => setAddAge(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("daily_yield", language)} (L/day)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={addYield}
                  onChange={(e) => setAddYield(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("health_notes", language)}</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Vaccination status, feeding notes, calving history..."
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
              {t("add_cattle", language)}
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL 2: EDIT CATTLE */}
      {editingCattle && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCattle(null)}
          title={`${t("edit_cattle", language)}: ${editingCattle.name} (${editingCattle.tag_number})`}
        >
          {editSuccess ? (
            <div style={{ padding: '1rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, fontWeight: 700 }}>
              {editSuccess}
            </div>
          ) : (
            <form onSubmit={handleUpdateCattle}>
              {editError && (
                <div style={{ padding: '0.6rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  {editError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t("cow_name", language)} *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{t("breed", language)}</label>
                  <select className="form-input" value={editBreed} onChange={(e) => setEditBreed(e.target.value)}>
                    <option value="Gir">Gir (ಗಿರ್)</option>
                    <option value="Murrah Buffalo">Murrah Buffalo (ಮುರ್ರಾ)</option>
                    <option value="Jersey Cross">Jersey Cross (ಜರ್ಸಿ)</option>
                    <option value="Holstein Friesian">Holstein Friesian (HF)</option>
                    <option value="Sahiwal">Sahiwal (ಸಾಹಿವಾಲ್)</option>
                    <option value="Hallikar">Hallikar (ಹಳ್ಳಿಕಾರ್)</option>
                    <option value="Other / Crossbreed">Other / Crossbreed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("milking_status", language)}</label>
                  <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="Milking">Milking (ಹಾಲು ನೀಡುವ)</option>
                    <option value="Dry">Dry (ಬತ್ತಿದ ಹಸು)</option>
                    <option value="Pregnant">Pregnant (ಗರ್ಭಿಣಿ)</option>
                    <option value="Heifer">Heifer (ಕರು/ಹೆಣ್ಣು ಕರು)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{t("age", language)} ({t("years", language)})</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("daily_yield", language)} (L/day)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editYield}
                    onChange={(e) => setEditYield(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("health_notes", language)}</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
                {language === 'kn' ? 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ' : 'Save Changes'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
