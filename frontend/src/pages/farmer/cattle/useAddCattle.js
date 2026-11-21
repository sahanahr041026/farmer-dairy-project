import { useState } from 'react';
import { api } from '../../../services/api';

export function useAddCattle(language, loadData) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTag, setAddTag] = useState('');
  const [addName, setAddName] = useState('');
  const [addBreed, setAddBreed] = useState('Gir');
  const [addAge, setAddAge] = useState('3.5');
  const [addGender, _setAddGender] = useState('Female');
  const [addStatus, setAddStatus] = useState('Milking');
  const [addYield, setAddYield] = useState('12.0');
  const [addNotes, setAddNotes] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

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

  return {
    isAddModalOpen, setIsAddModalOpen,
    addTag, setAddTag,
    addName, setAddName,
    addBreed, setAddBreed,
    addAge, setAddAge,
    addStatus, setAddStatus,
    addYield, setAddYield,
    addNotes, setAddNotes,
    addError, addSuccess,
    handleAddCattle
  };
}
