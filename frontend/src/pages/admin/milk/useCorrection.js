import { useState } from 'react';
import { api } from '../../../services/api';

export function useCorrection({ loadData }) {
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctQty, setCorrectQty] = useState('');
  const [correctFat, setCorrectFat] = useState('');
  const [correctSnf, setCorrectSnf] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Open correction modal
  const handleOpenCorrection = (rec) => {
    setEditingRecord(rec);
    setCorrectQty(rec.quantity_litres.toString());
    setCorrectFat(rec.fat_percentage ? rec.fat_percentage.toString() : '4.0');
    setCorrectSnf(rec.snf_percentage ? rec.snf_percentage.toString() : '8.5');
    setCorrectReason('');
    setCorrectError('');
  };

  // Save record correction
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctReason.trim()) {
      setCorrectError("Mandatory: Please provide a specific audit reason for this correction.");
      return;
    }

    const q = parseFloat(correctQty);
    if (!q || q <= 0) {
      setCorrectError("Quantity must be greater than zero.");
      return;
    }

    setIsCorrecting(true);
    try {
      await api.correctCollection(editingRecord.id, {
        quantity_litres: q,
        fat_percentage: parseFloat(correctFat) || null,
        snf_percentage: parseFloat(correctSnf) || null,
        reason: correctReason.trim()
      });

      setEditingRecord(null);
      loadData();
    } catch (err) {
      setCorrectError(err.message || "Failed to save correction.");
    } finally {
      setIsCorrecting(false);
    }
  };

  return {
    editingRecord, setEditingRecord,
    correctQty, setCorrectQty, correctFat, setCorrectFat,
    correctSnf, setCorrectSnf, correctReason, setCorrectReason,
    correctError, isCorrecting,
    handleOpenCorrection, handleSaveCorrection
  };
}
