import { useState } from 'react';
import { api } from '../../../services/api';

export function useEditCattle(language, loadData) {
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

  return {
    editingCattle, setEditingCattle,
    editName, setEditName,
    editBreed, setEditBreed,
    editAge, setEditAge,
    editStatus, setEditStatus,
    editYield, setEditYield,
    editNotes, setEditNotes,
    editError, editSuccess,
    handleOpenEdit,
    handleUpdateCattle
  };
}
