import React from 'react';
import { PlusIcon } from '../../components/Icons';
import { useSmsAdmin } from './sms/useSmsAdmin';
import { SmsTabs } from './sms/SmsTabs';
import { GatewayBanner } from './sms/GatewayBanner';
import { BroadcastComposer } from './sms/BroadcastComposer';
import { PhonePreview } from './sms/PhonePreview';
import { CampaignHistory } from './sms/CampaignHistory';
import { SchemesTab } from './sms/SchemesTab';
import { JobsSummary } from './sms/JobsSummary';
import { JobsTable } from './sms/JobsTable';
import { PreviewModal } from './sms/PreviewModal';
import { SchemeModal } from './sms/SchemeModal';

export function AdminSMSNotifications() {
  const s = useSmsAdmin();
  const { activeTab, resultMsg, errorMsg } = s;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            SMS Notifications, Broadcasts & Schemes
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage official cooperative schemes, emergency SMS broadcasts, and cellular delivery audit queues
          </p>
        </div>

        {activeTab === 'schemes' && (
          <button
            onClick={() => s.setIsSchemeModalOpen(true)}
            className="btn btn-primary touch-target"
          >
            <PlusIcon size={16} />
            <span>Create Scheme / Notice</span>
          </button>
        )}
      </div>


      <SmsTabs
        activeTab={activeTab}
        setActiveTab={s.setActiveTab}
        announcements={s.announcements}
        smsSummary={s.smsSummary}
      />

      {/* Gateway Environment Status Banner */}
      <GatewayBanner />

      {resultMsg && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {resultMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* ===================== TAB 1: CAMPAIGNS & BROADCAST ===================== */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Composer & Phone Mockup Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Form Card */}
            <BroadcastComposer
              form={s}
              templates={s.templates}
              farmers={s.farmers}
              villages={s.villages}
              handleApplyTemplate={s.handleApplyTemplate}
              handleRequestPreview={s.handleRequestPreview}
              charStats={s.charStats}
            />

            {/* Mobile Phone Preview Mockup */}
            <PhonePreview title={s.title} message={s.message} />
          </div>

          {/* Campaign History Table */}
          <CampaignHistory campaigns={s.campaigns} />
        </div>
      )}

      {/* ===================== TAB 2: SCHEMES & ANNOUNCEMENTS ===================== */}
      {activeTab === 'schemes' && (
        <SchemesTab
          announcements={s.announcements}
          handleTogglePublishScheme={s.handleTogglePublishScheme}
          handleDeleteScheme={s.handleDeleteScheme}
        />
      )}

      {/* ===================== TAB 3: SMS DELIVERY QUEUE & JOBS ===================== */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Metrics Cards */}
          {s.smsSummary && <JobsSummary smsSummary={s.smsSummary} />}

          {/* Jobs Table Card */}
          <JobsTable
            filteredJobs={s.filteredJobs}
            jobFilter={s.jobFilter}
            setJobFilter={s.setJobFilter}
            loadData={s.loadData}
            handleRetryJob={s.handleRetryJob}
            handleCancelJob={s.handleCancelJob}
          />
        </div>
      )}

      {/* Confirmation & Recipient Validation Modal */}
      {s.previewData && (
        <PreviewModal
          previewData={s.previewData}
          isPreviewOpen={s.isPreviewOpen}
          setIsPreviewOpen={s.setIsPreviewOpen}
          message={s.message}
          sending={s.sending}
          handleConfirmSend={s.handleConfirmSend}
        />
      )}

      {/* Create Scheme Modal */}
      <SchemeModal
        isOpen={s.isSchemeModalOpen}
        onClose={() => s.setIsSchemeModalOpen(false)}
        form={s}
        farmers={s.farmers}
        villages={s.villages}
        handleCreateScheme={s.handleCreateScheme}
        schemeSubmitting={s.schemeSubmitting}
      />
    </div>
  );
}
