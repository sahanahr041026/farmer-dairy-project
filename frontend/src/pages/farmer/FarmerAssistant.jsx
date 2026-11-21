import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { t } from '../../i18n';
import {
  SendIcon,
  MicIcon,
  SpeakerIcon,
  ShieldCheckIcon
} from '../../components/Icons';

export function FarmerAssistant() {
  const { user, language } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [vetContact, setVetContact] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize welcome message & suggestions
  useEffect(() => {
    async function initAssistant() {
      try {
        const suggList = await api.getAssistantSuggestions(language);
        setSuggestions(suggList);
      } catch (e) {
        console.error("Error loading suggestions:", e);
      }

      const initialGreeting = language === 'kn'
        ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಡೈರಿಸಾಥಿ ಪಶು ಆರೈಕೆ ಸಹಾಯಕ. ಹಸುಗಳ ಆಹಾರ, ಲಸಿಕೆ ವೇಳಾಪಟ್ಟಿ ಅಥವಾ ಹಾಲಿನ ಫ್ಯಾಟ್ ಹೆಚ್ಚಳದ ಬಗ್ಗೆ ನೀವು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು."
        : "Hello! I am your DairySathi Cattle Care Assistant. You can ask me questions about feed nutrition, milk fat & SNF improvement, vaccination schedules, and herd hygiene.";

      setMessages([
        {
          id: 1,
          sender: 'assistant',
          text: initialGreeting,
          source: 'curated_expert_faq',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    initAssistant();
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.chatAssistant({
        message: trimmed,
        language: language,
        farmer_id: user?.id
      });

      if (res.vet_contact) {
        setVetContact(res.vet_contact);
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.response,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: "Sorry, I could not process your query at this moment. Please reach out directly to your cooperative veterinary officer.",
        source: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Voice Input (Speech-to-Text)
  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Speech Synthesizer (Text-to-Speech)
  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Strip metadata prefixes if any
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="container-narrow" style={{
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 130px)',
      maxHeight: 780
    }}>
      {/* Vet Escort Banner */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--primary-light)',
        border: '1.5px solid var(--secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheckIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              {t("vet_box_title", language)}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {vetContact?.name || user?.cooperative?.vet_name || "Dr. Ramesh Hegde (KMF Senior Vet)"}
            </div>
          </div>
        </div>
        <a
          href={`tel:${vetContact?.phone || user?.cooperative?.vet_phone || '9845123456'}`}
          className="btn btn-secondary touch-target"
          style={{ minHeight: 38, padding: '0.35rem 0.75rem', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem' }}
        >
          {language === 'kn' ? 'ಕರೆ ಮಾಡಿ' : 'Call Vet'}
        </a>
      </div>

      {/* Suggested Questions Chips */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s.text)}
            className="touch-target"
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 20,
              backgroundColor: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: 'var(--text-main)',
              minHeight: 36,
              // Keep each chip at its natural width; the row scrolls horizontally instead of
              // squeezing the chips (which made their text overflow and overlap).
              flexShrink: 0
            }}
          >
            {s.text}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        padding: '0.5rem 0'
      }}>
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                alignSelf: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-card)',
                  color: isUser ? '#FFFFFF' : 'var(--text-main)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line'
                }}
              >
                {m.text}
              </div>

              {/* Bot Meta & Speaker */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.25rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ whiteSpace: 'nowrap' }}>{m.timestamp}</span>
                {!isUser && (
                  <>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {m.source === 'live_llm' ? t("source_llm", language) : t("source_expert", language)}
                    </span>
                    <button
                      onClick={() => handleSpeakText(m.text)}
                      className="touch-target"
                      style={{
                        padding: '0.1rem 0.4rem',
                        minHeight: 28,
                        minWidth: 28,
                        borderRadius: 4,
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      title="Read answer aloud"
                    >
                      <SpeakerIcon size={14} />
                      <span>{t("listen_audio", language)}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1rem',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            {language === 'kn' ? 'ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ...' : 'Consulting dairy veterinary knowledge...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Medical Safety Disclaimer */}
      <div style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: '0.35rem 0'
      }}>
        {t("emergency_notice", language)}
      </div>

      {/* Input Bar with Voice Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border)'
      }}>
        {/* Microphone Button */}
        <button
          onClick={handleStartListening}
          className="touch-target"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: isListening ? 'var(--status-overdue)' : 'var(--primary-light)',
            color: isListening ? '#FFFFFF' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            animation: isListening ? 'pulse 1.2s infinite' : 'none'
          }}
          title={language === 'kn' ? "ಧ್ವನಿ ಮೂಲಕ ಪ್ರಶ್ನೆ ಕೇಳಿ" : "Speak your question"}
          aria-label="Microphone for voice input"
        >
          <MicIcon size={22} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          className="form-input"
          placeholder={t("type_question", language)}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ flex: 1, minHeight: 48, borderRadius: 24, padding: '0.65rem 1.1rem' }}
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || loading}
          className="touch-target"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: inputText.trim() && !loading ? 'var(--primary)' : 'var(--border)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          aria-label="Send message"
        >
          <SendIcon size={20} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
