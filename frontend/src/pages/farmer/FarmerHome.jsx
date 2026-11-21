import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import {
  MilkIcon, CattleIcon, AssistantIcon, SunIcon, MoonIcon,
  SpeakerIcon, _ArrowRightIcon, CalendarIcon, ShieldCheckIcon, _PhoneIcon
} from '../../components/Icons';

export function FarmerHome() {
  const { user, language } = useAuth();
  const [todayMilk, setTodayMilk] = useState(null);
  const [passbookSummary, setPassbookSummary] = useState(null);
  const [rateRule, setRateRule] = useState(null);
  const [nextReminder, setNextReminder] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [todayRes, pbRes, rateRes, remindersRes] = await Promise.all([
          api.getTodaySummary(),
          api.getPassbook(),
          api.getCurrentRate(),
          api.getReminders({ status_filter: 'upcoming' })
        ]);
        setTodayMilk(todayRes);
        setPassbookSummary(pbRes);
        setRateRule(rateRes);
        if (remindersRes && remindersRes.length > 0) {
          setNextReminder(remindersRes[0]);
        }
      } catch (e) {
        console.error("Error loading farmer home data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSpeakSummary = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }

    let speechText = "";
    if (language === 'kn') {
      speechText = `ನಮಸ್ಕಾರ ${user?.name}. ` +
        `ಇಂದು ಬೆಳಿಗ್ಗೆ ${todayMilk?.morning_litres || 0} ಲೀಟರ್, ಸಂಜೆ ${todayMilk?.evening_litres || 0} ಲೀಟರ್ ಹಾಲು ದಾಖಲಾಗಿದೆ. ` +
        `ಪ್ರಸ್ತುತ ಹಾಲಿನ ದರ ಲೀಟರ್‌ಗೆ ₹${rateRule?.base_rate || 40}. ` +
        `ಈ ತಿಂಗಳ ಒಟ್ಟು ಆದಾಯ ₹${passbookSummary?.total_earnings || 0}. ಬಾಕಿ ಬರಬೇಕಾದ ಹಣ ₹${passbookSummary?.pending_amount || 0}. ` +
        (nextReminder ? `ಮುಂದಿನ ಜ್ಞಾಪನೆ: ${nextReminder.title_kn || nextReminder.title}.` : '');
    } else {
      speechText = `Hello ${user?.name}. ` +
        `Today's collection is ${todayMilk?.morning_litres || 0} litres in the morning and ${todayMilk?.evening_litres || 0} litres in the evening. ` +
        `Current milk rate is ₹${rateRule?.base_rate || 40} per litre. ` +
        `This month's earnings are ₹${passbookSummary?.total_earnings || 0}, with a pending balance of ₹${passbookSummary?.pending_amount || 0}. ` +
        (nextReminder ? `Your next reminder is: ${nextReminder.title}.` : '');
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="container-narrow" style={{ padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Welcome Banner */}
      <div className="card" style={{
        backgroundColor: 'var(--primary)',
        color: '#FFFFFF',
        marginBottom: '1.25rem',
        padding: '1.5rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.2rem 0.6rem',
              borderRadius: 20,
              marginBottom: '0.4rem'
            }}>
              {t("coop_label", language)}: {user?.cooperative?.name}
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t("welcome_farmer", language, { name: user?.name || "Farmer" })}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              {t("farmer_id_label", language)}: {user?.farmer_uid}
            </p>
          </div>

          {/* Audio Speaker Button for Low Literacy */}
          <button
            onClick={handleSpeakSummary}
            className="touch-target"
            style={{
              backgroundColor: speaking ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              color: speaking ? 'var(--text-main)' : '#FFFFFF',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Read summary aloud"
            aria-label="Listen to summary spoken aloud"
          >
            <SpeakerIcon size={24} />
          </button>
        </div>
      </div>

      {/* Today's Milk Collection Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MilkIcon size={20} />
            <span>{t("todays_milk", language)}</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {/* Morning */}
          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--accent-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-pending)', fontSize: '0.85rem', fontWeight: 600 }}>
              <SunIcon size={16} />
              <span>{t("morning", language)}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {todayMilk ? todayMilk.morning_litres : '0.0'} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t("litres", language)}</span>
            </div>
          </div>

          {/* Evening */}
          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <MoonIcon size={16} />
              <span>{t("evening", language)}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {todayMilk ? todayMilk.evening_litres : '0.0'} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t("litres", language)}</span>
            </div>
          </div>
        </div>

        {/* Rate & Today Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 0.85rem',
          backgroundColor: 'var(--bg-page)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.88rem'
        }}>
          <span>{t("rate_today", language)}: <strong>₹{rateRule ? rateRule.base_rate.toFixed(2) : '—'}/L</strong></span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
            {language === 'kn' ? 'ಇಂದಿನ ಒಟ್ಟು' : 'Today'}: ₹{todayMilk ? todayMilk.total_amount.toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Payment & Earnings Summary */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.85rem' }}>
          {language === 'kn' ? 'ನನ್ನ ಪಾವತಿ ವಿವರ' : 'My Payments'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t("earnings_month", language)}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{passbookSummary ? passbookSummary.total_earnings.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-settled)', fontWeight: 600 }}>
              Paid: ₹{passbookSummary ? passbookSummary.paid_amount.toLocaleString() : '0'}
            </div>
          </div>

          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--status-pending-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--status-pending)'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--status-pending)' }}>{t("pending_payout", language)}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-pending)' }}>
              ₹{passbookSummary ? passbookSummary.pending_amount.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಮುಂದಿನ ಬಿಲ್ಲಿಂಗ್‌ನಲ್ಲಿ ಜಮೆ' : 'Pending bank credit'}
            </div>
          </div>
        </div>
      </div>

      {/* Next Cattle Care Reminder Card */}
      {nextReminder && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          borderLeft: '5px solid var(--secondary)',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <CalendarIcon size={16} />
            <span>{t("next_reminder", language)}</span>
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.35rem 0' }}>
            {language === 'kn' ? (nextReminder.title_kn || nextReminder.title) : nextReminder.title}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>{language === 'kn' ? 'ದಿನಾಂಕ' : 'Due'}: <strong>{nextReminder.due_date}</strong></span>
            <span className="badge badge-pending">{nextReminder.care_type}</span>
          </div>
        </div>
      )}

      {/* Large Shortcut Action Cards */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.85rem' }}>
        {language === 'kn' ? 'ಮುಖ್ಯ ಸೇವೆಗಳು' : 'Quick Actions'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '2rem' }}>
        <Link
          to="/farmer/passbook"
          className="card"
          style={{
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 125,
            border: '1.5px solid var(--border)'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <MilkIcon size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              {t("shortcut_passbook", language)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಪಾಸ್‌ಬುಕ್ & PDF' : 'Records & PDF'}
            </div>
          </div>
        </Link>

        <Link
          to="/farmer/cattle"
          className="card"
          style={{
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 125,
            border: '1.5px solid var(--border)'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <CattleIcon size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              {t("shortcut_cows", language)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಆರೋಗ್ಯ & ಲಸಿಕೆ' : 'Health & Vaccinations'}
            </div>
          </div>
        </Link>

        <Link
          to="/farmer/assistant"
          className="card"
          style={{
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 125,
            border: '1.5px solid var(--border)'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--accent-light)',
            color: 'var(--status-pending)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <AssistantIcon size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              {t("shortcut_assistant", language)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {language === 'kn' ? 'ಧ್ವನಿ ಸಲಹೆಗಾರ' : 'AI & Voice Guidance'}
            </div>
          </div>
        </Link>

        <div
          className="card"
          style={{
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 125,
            border: '1.5px solid var(--border)'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <ShieldCheckIcon size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              {language === 'kn' ? 'ಸಹಕಾರ ಸಂಘ' : 'Cooperative Help'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.cooperative?.phone || '08182-249012'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
