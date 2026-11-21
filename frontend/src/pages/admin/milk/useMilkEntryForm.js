import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { computePreviewRate } from './rateUtils';

export function useMilkEntryForm({
  farmers, activeRateRule, selectedFarmerId, setFormError, loadData
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Farmer Search State
  const [farmerSearch, setFarmerSearch] = useState('');

  // Form State
  const [collectionDate, setCollectionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning');
  const [quantity, setQuantity] = useState('');
  const [fat, setFat] = useState('4.0');
  const [snf, setSnf] = useState('8.5');
  const [notes, setNotes] = useState('');

  // Live calculation preview
  const [previewRate, setPreviewRate] = useState(41.0);
  const [previewAmount, setPreviewAmount] = useState(0.0);

  const [formSuccess, setFormSuccess] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Filtered farmers for selection dropdown
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return farmers;
    const term = farmerSearch.toLowerCase().trim();
    return farmers.filter((f) =>
      f.full_name.toLowerCase().includes(term) ||
      f.farmer_uid.toLowerCase().includes(term) ||
      (f.phone && f.phone.includes(term)) ||
      (f.village && f.village.toLowerCase().includes(term))
    );
  }, [farmers, farmerSearch]);

  // Selected farmer object
  const selectedFarmer = useMemo(() => {
    return farmers.find((f) => f.id.toString() === selectedFarmerId.toString()) || null;
  }, [farmers, selectedFarmerId]);

  // Live recalculate preview rate and amount whenever inputs change
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const f = parseFloat(fat) || 4.0;
    const s = parseFloat(snf) || 8.5;

    if (activeRateRule) {
      const roundedRate = computePreviewRate(activeRateRule, f, s);
      setPreviewRate(roundedRate);
      setPreviewAmount(Math.round(q * roundedRate * 100) / 100);
    }
  }, [quantity, fat, snf, activeRateRule]);

  // Handle milk collection save
  const handleSubmitCollection = async (e, forceOverwrite = false) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess(null);

    const q = parseFloat(quantity);
    if (!q || q <= 0) {
      setFormError("Please enter a valid milk quantity in litres (must be > 0).");
      return;
    }

    if (!selectedFarmerId) {
      setFormError("Please select a registered farmer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordCollection({
        farmer_id: parseInt(selectedFarmerId),
        collection_date: collectionDate,
        session,
        quantity_litres: q,
        fat_percentage: activeRateRule?.calculation_method === 'flat_rate' ? (parseFloat(fat) || null) : parseFloat(fat),
        snf_percentage: activeRateRule?.calculation_method === 'flat_rate' ? (parseFloat(snf) || null) : parseFloat(snf),
        notes: notes || undefined
      }, forceOverwrite, forceOverwrite);

      setFormSuccess({
        farmerName: res.farmer_name || selectedFarmer?.full_name,
        farmerUid: res.farmer_uid || selectedFarmer?.farmer_uid,
        date: res.collection_date,
        session: res.session,
        quantity: res.quantity_litres,
        rate: res.rate_per_litre,
        amount: res.total_amount
      });

      // Clear quantity and notes, keeping date and session for fast consecutive entries
      setQuantity('');
      setNotes('');
      setShowDuplicateModal(false);
      loadData();
    } catch (err) {
      if (err.message && (err.message.includes('Duplicate') || err.message.includes('already exists') || err.message.includes('409'))) {
        setShowDuplicateModal(true);
      } else {
        setFormError(err.message || "Failed to record milk collection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting, farmerSearch, setFarmerSearch,
    collectionDate, setCollectionDate, session, setSession,
    quantity, setQuantity, fat, setFat, snf, setSnf,
    previewRate, previewAmount,
    formSuccess, showDuplicateModal, setShowDuplicateModal,
    filteredFarmers, selectedFarmer, handleSubmitCollection
  };
}
