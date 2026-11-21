import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

// All state, data loading and handlers for the Cattle Care admin page.
export function useCattleCare() {
  const [farmers, setFarmers] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Feedback State
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // New Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetFarmerId, setTargetFarmerId] = useState('');
  const [targetCattleId, _setTargetCattleId] = useState('');
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

  // Edit Cattle Modal
  const [editingCattle, setEditingCattle] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('Gir');
  const [editAge, setEditAge] = useState('');
  const [editYield, setEditYield] = useState('');
  const [editStatus, setEditStatus] = useState('Milking');
  const [editNotes, setEditNotes] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

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
      const [fList, cList, rList, tList] = await Promise.all([
        api.getFarmers().catch(() => []),
        api.getCattle().catch(() => []),
        api.getReminders().catch(() => []),
        api.getReminderTemplates().catch(() => [])
      ]);
      setFarmers(fList);
      setCattleList(cList);
      setReminders(rList);
      setTemplates(tList);
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

  const handleApplyTemplate = (tpl) => {
    setRemTitle(tpl.title);
    setRemTitleKn(tpl.title_kn || '');
    setCareType(tpl.care_type);
    setVetNotes(tpl.default_notes || '');
  };

  const handleOpenEditCattle = (c) => {
    setEditingCattle(c);
    setEditName(c.name || '');
    setEditBreed(c.breed || 'Gir');
    setEditAge(c.age_years ?? '');
    setEditYield(c.daily_yield_estimate ?? '');
    setEditStatus(c.milking_status || 'Milking');
    setEditNotes(c.health_notes || '');
    setEditSuccess('');
    setEditError('');
  };

  const handleSaveEditCattle = async (e) => {
    e.preventDefault();
    if (!editingCattle) return;
    setEditError('');
    try {
      await api.updateCattle(editingCattle.id, {
        name: editName.trim(),
        breed: editBreed,
        age_years: editAge === '' ? null : parseFloat(editAge),
        daily_yield_estimate: editYield === '' ? 0 : parseFloat(editYield),
        milking_status: editStatus,
        health_notes: editNotes
      });
      setEditSuccess('Cattle profile updated successfully.');
      loadData();
      setTimeout(() => {
        setEditingCattle(null);
        setEditSuccess('');
      }, 1200);
    } catch (err) {
      setEditError(err.message);
    }
  };

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

  return {
    farmers, cattleList, reminders, templates, loading, statusFilter, setStatusFilter,
    actionSuccess, actionError,
    isReminderModalOpen, setIsReminderModalOpen, targetFarmerId, setTargetFarmerId,
    remTitle, setRemTitle, remTitleKn, setRemTitleKn, careType, setCareType,
    dueDate, setDueDate, remGuidance, setRemGuidance, vetNotes, setVetNotes, formSuccess,
    isCattleModalOpen, setIsCattleModalOpen, cattleFarmerId, setCattleFarmerId,
    cTag, setCTag, cName, setCName, cBreed, setCBreed, cAge, setCAge,
    cYield, setCYield, cStatus, setCStatus, cNotes, setCNotes,
    editingCattle, setEditingCattle, editName, setEditName, editBreed, setEditBreed,
    editAge, setEditAge, editYield, setEditYield, editStatus, setEditStatus,
    editNotes, setEditNotes, editSuccess, editError,
    isCompletionModalOpen, setIsCompletionModalOpen, completingRem,
    adminBy, setAdminBy, completionNotes, setCompletionNotes, nextDueDate, setNextDueDate,
    handleApplyTemplate, handleOpenEditCattle, handleSaveEditCattle, handleCreateReminder,
    handleCreateCattle, openCompletionModal, handleConfirmCompletion,
    handleSendReminderSMS, handleCancelReminder, filteredReminders
  };
}
