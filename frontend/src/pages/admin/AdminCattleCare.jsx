import React from 'react';
import { CalendarIcon, PlusIcon } from '../../components/Icons';
import { useCattleCare } from './cattlecare/useCattleCare';
import { RemindersList } from './cattlecare/RemindersList';
import { HerdTable } from './cattlecare/HerdTable';
import { CompletionModal } from './cattlecare/CompletionModal';
import { ReminderModal } from './cattlecare/ReminderModal';
import { RegisterCattleModal } from './cattlecare/RegisterCattleModal';
import { EditCattleModal } from './cattlecare/EditCattleModal';

export function AdminCattleCare() {
  const cc = useCattleCare();

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Cattle Health, Vaccination & Reminders
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Schedule veterinary drives, log administered doses, and transmit direct SMS reminders to farmers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => cc.setIsCattleModalOpen(true)}
            className="btn btn-outline touch-target"
          >
            <PlusIcon size={16} />
            <span>Add Cattle</span>
          </button>
          <button
            onClick={() => cc.setIsReminderModalOpen(true)}
            className="btn btn-primary touch-target"
          >
            <CalendarIcon size={16} />
            <span>Schedule Health Reminder</span>
          </button>
        </div>
      </div>

      {cc.actionSuccess && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {cc.actionSuccess}
        </div>
      )}
      {cc.actionError && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {cc.actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Reminders List Card */}
        <RemindersList
          reminders={cc.reminders}
          filteredReminders={cc.filteredReminders}
          statusFilter={cc.statusFilter}
          setStatusFilter={cc.setStatusFilter}
          openCompletionModal={cc.openCompletionModal}
          handleSendReminderSMS={cc.handleSendReminderSMS}
          handleCancelReminder={cc.handleCancelReminder}
        />

        {/* Registered Herd Table */}
        <HerdTable cattleList={cc.cattleList} handleOpenEditCattle={cc.handleOpenEditCattle} />
      </div>

      {/* Record Administration Modal */}
      {cc.completingRem && (
        <CompletionModal
          completingRem={cc.completingRem}
          isCompletionModalOpen={cc.isCompletionModalOpen}
          setIsCompletionModalOpen={cc.setIsCompletionModalOpen}
          adminBy={cc.adminBy}
          setAdminBy={cc.setAdminBy}
          nextDueDate={cc.nextDueDate}
          setNextDueDate={cc.setNextDueDate}
          completionNotes={cc.completionNotes}
          setCompletionNotes={cc.setCompletionNotes}
          handleConfirmCompletion={cc.handleConfirmCompletion}
        />
      )}

      {/* Schedule Reminder Modal */}
      <ReminderModal
        isReminderModalOpen={cc.isReminderModalOpen}
        setIsReminderModalOpen={cc.setIsReminderModalOpen}
        formSuccess={cc.formSuccess}
        templates={cc.templates}
        handleApplyTemplate={cc.handleApplyTemplate}
        handleCreateReminder={cc.handleCreateReminder}
        farmers={cc.farmers}
        targetFarmerId={cc.targetFarmerId}
        setTargetFarmerId={cc.setTargetFarmerId}
        careType={cc.careType}
        setCareType={cc.setCareType}
        dueDate={cc.dueDate}
        setDueDate={cc.setDueDate}
        remTitle={cc.remTitle}
        setRemTitle={cc.setRemTitle}
        remTitleKn={cc.remTitleKn}
        setRemTitleKn={cc.setRemTitleKn}
        remGuidance={cc.remGuidance}
        setRemGuidance={cc.setRemGuidance}
        vetNotes={cc.vetNotes}
        setVetNotes={cc.setVetNotes}
      />

      {/* Add Cattle Modal */}
      <RegisterCattleModal
        isCattleModalOpen={cc.isCattleModalOpen}
        setIsCattleModalOpen={cc.setIsCattleModalOpen}
        handleCreateCattle={cc.handleCreateCattle}
        farmers={cc.farmers}
        cattleFarmerId={cc.cattleFarmerId}
        setCattleFarmerId={cc.setCattleFarmerId}
        cTag={cc.cTag}
        setCTag={cc.setCTag}
        cName={cc.cName}
        setCName={cc.setCName}
        cBreed={cc.cBreed}
        setCBreed={cc.setCBreed}
        cAge={cc.cAge}
        setCAge={cc.setCAge}
        cYield={cc.cYield}
        setCYield={cc.setCYield}
        cStatus={cc.cStatus}
        setCStatus={cc.setCStatus}
        cNotes={cc.cNotes}
        setCNotes={cc.setCNotes}
      />

      {/* Edit Cattle Modal */}
      {cc.editingCattle && (
        <EditCattleModal
          editingCattle={cc.editingCattle}
          setEditingCattle={cc.setEditingCattle}
          editSuccess={cc.editSuccess}
          editError={cc.editError}
          handleSaveEditCattle={cc.handleSaveEditCattle}
          editName={cc.editName}
          setEditName={cc.setEditName}
          editBreed={cc.editBreed}
          setEditBreed={cc.setEditBreed}
          editAge={cc.editAge}
          setEditAge={cc.setEditAge}
          editYield={cc.editYield}
          setEditYield={cc.setEditYield}
          editStatus={cc.editStatus}
          setEditStatus={cc.setEditStatus}
          editNotes={cc.editNotes}
          setEditNotes={cc.setEditNotes}
        />
      )}
    </div>
  );
}
