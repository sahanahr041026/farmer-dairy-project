import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useCattleData } from './cattle/useCattleData';
import { useAddCattle } from './cattle/useAddCattle';
import { useEditCattle } from './cattle/useEditCattle';
import { speakReminder } from './cattle/speakReminder';
import { CattleHeader } from './cattle/CattleHeader';
import { CattleTabs } from './cattle/CattleTabs';
import { CattleListTab } from './cattle/CattleListTab';
import { RemindersTab } from './cattle/RemindersTab';
import { BreedsTab } from './cattle/BreedsTab';
import { AddCattleModal, EditCattleModal } from './cattle/CattleModals';

export function FarmerCattle() {
  const { user, language } = useAuth();
  const [activeTab, setActiveTab] = useState('cows'); // 'cows', 'reminders', 'breeds'
  const { cattleList, reminders, breeds, selectedBreed, setSelectedBreed, loading, loadData } = useCattleData();
  const add = useAddCattle(language, loadData);
  const edit = useEditCattle(language, loadData);

  // Voice Guidance for Reminders
  const handleSpeakReminder = (rem) => speakReminder(rem, language);

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
      <CattleHeader
        language={language}
        user={user}
        cattleCount={cattleList.length}
        onAdd={() => add.setIsAddModalOpen(true)}
      />

      <CattleTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        cattleCount={cattleList.length}
        pendingReminderCount={reminders.filter(r => r.status !== 'completed').length}
      />

      {activeTab === 'cows' && (
        <CattleListTab
          loading={loading}
          cattleList={cattleList}
          language={language}
          onAdd={() => add.setIsAddModalOpen(true)}
          onEdit={edit.handleOpenEdit}
        />
      )}

      {activeTab === 'reminders' && (
        <RemindersTab
          reminders={reminders}
          language={language}
          onSpeak={handleSpeakReminder}
          onComplete={handleCompleteReminder}
        />
      )}

      {activeTab === 'breeds' && (
        <BreedsTab
          breeds={breeds}
          selectedBreed={selectedBreed}
          setSelectedBreed={setSelectedBreed}
          language={language}
        />
      )}

      <AddCattleModal language={language} add={add} />
      <EditCattleModal language={language} edit={edit} />
    </div>
  );
}
