import React from 'react';
import { RefreshCwIcon } from '../../components/Icons';
import { useMilkCollections } from './milk/useMilkCollections';
import { useMilkEntryForm } from './milk/useMilkEntryForm';
import { useCorrection } from './milk/useCorrection';
import { useHistoryFilters } from './milk/useHistoryFilters';
import { MilkEntryForm } from './milk/MilkEntryForm';
import { RatePolicyCard } from './milk/RatePolicyCard';
import { CollectionsTable } from './milk/CollectionsTable';
import { DuplicateModal } from './milk/DuplicateModal';
import { CorrectionModal } from './milk/CorrectionModal';

export function AdminMilkCollection() {
  const {
    farmers, collections, activeRateRule,
    selectedFarmerId, setSelectedFarmerId,
    formError, setFormError, loadData
  } = useMilkCollections();

  const entry = useMilkEntryForm({
    farmers, activeRateRule, selectedFarmerId, setFormError, loadData
  });

  const correction = useCorrection({ loadData });

  const history = useHistoryFilters(collections);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Milk Collection Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Record milk collection intake with authoritative rate calculation, duplicate prevention, and instant farmer portal synchronization
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-outline touch-target"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCwIcon size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Collection Form Card */}
        <MilkEntryForm
          activeRateRule={activeRateRule}
          formSuccess={entry.formSuccess}
          formError={formError}
          handleSubmitCollection={entry.handleSubmitCollection}
          farmerSearch={entry.farmerSearch}
          setFarmerSearch={entry.setFarmerSearch}
          selectedFarmerId={selectedFarmerId}
          setSelectedFarmerId={setSelectedFarmerId}
          filteredFarmers={entry.filteredFarmers}
          selectedFarmer={entry.selectedFarmer}
          collectionDate={entry.collectionDate}
          setCollectionDate={entry.setCollectionDate}
          session={entry.session}
          setSession={entry.setSession}
          quantity={entry.quantity}
          setQuantity={entry.setQuantity}
          fat={entry.fat}
          setFat={entry.setFat}
          snf={entry.snf}
          setSnf={entry.setSnf}
          previewRate={entry.previewRate}
          previewAmount={entry.previewAmount}
          isSubmitting={entry.isSubmitting}
        />

        {/* Pricing Policy Card */}
        <RatePolicyCard activeRateRule={activeRateRule} />
      </div>

      {/* Collection History Table & Filters */}
      <CollectionsTable
        collections={collections}
        filteredCollections={history.filteredCollections}
        historySummary={history.historySummary}
        handleOpenCorrection={correction.handleOpenCorrection}
        historySearch={history.historySearch}
        setHistorySearch={history.setHistorySearch}
        filterStartDate={history.filterStartDate}
        setFilterStartDate={history.setFilterStartDate}
        filterEndDate={history.filterEndDate}
        setFilterEndDate={history.setFilterEndDate}
        filterSession={history.filterSession}
        setFilterSession={history.setFilterSession}
        filterStatus={history.filterStatus}
        setFilterStatus={history.setFilterStatus}
      />

      {/* Duplicate Record Confirmation Modal */}
      <DuplicateModal
        isOpen={entry.showDuplicateModal}
        onClose={() => entry.setShowDuplicateModal(false)}
        selectedFarmer={entry.selectedFarmer}
        collectionDate={entry.collectionDate}
        session={entry.session}
        onConfirm={() => entry.handleSubmitCollection(null, true)}
      />

      {/* Record Correction Modal with Mandatory Reason */}
      {correction.editingRecord && (
        <CorrectionModal
          editingRecord={correction.editingRecord}
          setEditingRecord={correction.setEditingRecord}
          correctError={correction.correctError}
          handleSaveCorrection={correction.handleSaveCorrection}
          correctQty={correction.correctQty}
          setCorrectQty={correction.setCorrectQty}
          correctFat={correction.correctFat}
          setCorrectFat={correction.setCorrectFat}
          correctSnf={correction.correctSnf}
          setCorrectSnf={correction.setCorrectSnf}
          correctReason={correction.correctReason}
          setCorrectReason={correction.setCorrectReason}
          isCorrecting={correction.isCorrecting}
        />
      )}
    </div>
  );
}
