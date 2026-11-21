import { t } from '../../../i18n';

// Voice Guidance for Reminders
export function speakReminder(rem, language) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const _statusText = t(rem.status, language);
  const text = language === 'kn'
    ? `${rem.title_kn || rem.title}. ದಿನಾಂಕ: ${rem.due_date}. ಸ್ಥಿತಿ: ${rem.status === 'completed' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : (rem.status === 'overdue' ? 'ದಿನಾಂಕ ಮೀರಿದೆ' : 'ಮುಂಬರುವ')}. ${rem.veterinarian_notes || ''}`
    : `${rem.title}. Due date: ${rem.due_date}. Status: ${rem.status}. ${rem.veterinarian_notes || ''}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
  window.speechSynthesis.speak(utterance);
}
