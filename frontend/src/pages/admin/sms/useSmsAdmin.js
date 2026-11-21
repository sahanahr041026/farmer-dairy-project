import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { templates } from './smsTemplates';
import { getCharStats } from './smsHelpers';

export function useSmsAdmin() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'schemes' | 'jobs'
  const [campaigns, setCampaigns] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [smsJobs, setSmsJobs] = useState([]);
  const [smsSummary, setSmsSummary] = useState(null);
  const [jobFilter, setJobFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, locality, individual
  const [targetLocality, setTargetLocality] = useState('');
  const [targetFarmerId, setTargetFarmerId] = useState('');

  // Broadcast Preview & Modal State
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Scheme Modal State
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeTitleKn, setSchemeTitleKn] = useState('');
  const [schemeCategory, setSchemeCategory] = useState('subsidy');
  const [schemeAudience, setSchemeAudience] = useState('all');
  const [schemeVillage, setSchemeVillage] = useState('');
  const [schemeFarmerId, setSchemeFarmerId] = useState('');
  const [schemeContent, setSchemeContent] = useState('');
  const [schemeContentKn, setSchemeContentKn] = useState('');
  const [schemeEligibility, setSchemeEligibility] = useState('');
  const [schemeBenefits, setSchemeBenefits] = useState('');
  const [schemeContact, setSchemeContact] = useState('');
  const [schemeLink, _setSchemeLink] = useState('');
  const [schemeExpiresAt, setSchemeExpiresAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [schemeSendSms, setSchemeSendSms] = useState(true);
  const [schemeSubmitting, setSchemeSubmitting] = useState(false);


  const loadData = async () => {
    try {
      setLoading(true);
      const [cList, fList, vList, aList, sData, jList] = await Promise.all([
        api.getSMSCampaigns().catch(() => []),
        api.getFarmers().catch(() => []),
        api.getVillages().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getSMSSummary().catch(() => null),
        api.getSMSJobs({ limit: 50 }).catch(() => [])
      ]);
      setCampaigns(cList);
      setFarmers(fList);
      setVillages(vList);
      setAnnouncements(aList);
      setSmsSummary(sData);
      setSmsJobs(jList);

      if (vList.length > 0) {
        if (!targetLocality) setTargetLocality(vList[0]);
        if (!schemeVillage) setSchemeVillage(vList[0]);
      }
      if (fList.length > 0) {
        if (!targetFarmerId) setTargetFarmerId(fList[0].id.toString());
        if (!schemeFarmerId) setSchemeFarmerId(fList[0].id.toString());
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

  const handleApplyTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) {
      setTitle(tmpl.title);
      setMessage(tmpl.text);
    }
  };

  const handleRequestPreview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResultMsg('');

    if (!message.trim()) {
      setErrorMsg("Message body cannot be empty.");
      return;
    }

    try {
      const res = await api.previewSMS({
        title,
        message,
        target_audience: targetAudience,
        target_locality: targetAudience === 'locality' ? targetLocality : null,
        target_farmer_id: targetAudience === 'individual' ? parseInt(targetFarmerId) : null
      });
      setPreviewData(res);
      setIsPreviewOpen(true);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setErrorMsg('');
    setResultMsg('');

    try {
      const res = await api.sendSMS({
        title,
        message,
        target_audience: targetAudience,
        target_locality: targetAudience === 'locality' ? targetLocality : null,
        target_farmer_id: targetAudience === 'individual' ? parseInt(targetFarmerId) : null
      });

      setIsPreviewOpen(false);
      setResultMsg(`Broadcast successfully queued for ${res.recipient_count} farmers. [${res.delivery_status}]`);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  // Scheme Creation
  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setSchemeSubmitting(true);
    setErrorMsg('');
    try {
      await api.createAnnouncement({
        title: schemeTitle,
        title_kn: schemeTitleKn || undefined,
        category: schemeCategory,
        target_audience: schemeAudience,
        target_village: schemeAudience === 'village' ? schemeVillage : undefined,
        target_farmer_id: schemeAudience === 'individual' ? parseInt(schemeFarmerId) : undefined,
        content: schemeContent,
        content_kn: schemeContentKn || undefined,
        eligibility_criteria: schemeEligibility || undefined,
        benefits: schemeBenefits || undefined,
        contact_person: schemeContact || undefined,
        reference_link: schemeLink || undefined,
        expires_at: schemeExpiresAt ? `${schemeExpiresAt}T23:59:59` : undefined,
        is_published: true,
        send_sms: schemeSendSms
      });
      setIsSchemeModalOpen(false);
      setResultMsg("New scheme published and notifications queued!");
      // Reset form
      setSchemeTitle('');
      setSchemeTitleKn('');
      setSchemeContent('');
      setSchemeContentKn('');
      setSchemeEligibility('');
      setSchemeBenefits('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSchemeSubmitting(false);
    }
  };

  const handleTogglePublishScheme = async (annc) => {
    try {
      await api.updateAnnouncement(annc.id, { is_published: !annc.is_published });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteScheme = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      loadData();
    } catch (err) {
      alert("Error deleting scheme: " + err.message);
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      await api.retrySMSJob(jobId);
      loadData();
    } catch (err) {
      alert("Error retrying SMS job: " + err.message);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await api.cancelSMSJob(jobId);
      loadData();
    } catch (err) {
      alert("Error cancelling SMS job: " + err.message);
    }
  };


  // Character calculation
  const { charLength, isUnicode, maxSingle, parts } = getCharStats(message);

  const filteredJobs = smsJobs.filter(job => {
    if (jobFilter === 'all') return true;
    return job.status === jobFilter;
  });

  return {
    activeTab, setActiveTab,
    campaigns, farmers, villages, announcements, smsJobs, smsSummary,
    jobFilter, setJobFilter, loading,
    title, setTitle, message, setMessage,
    targetAudience, setTargetAudience,
    targetLocality, setTargetLocality,
    targetFarmerId, setTargetFarmerId,
    previewData, isPreviewOpen, setIsPreviewOpen,
    sending, resultMsg, errorMsg,
    isSchemeModalOpen, setIsSchemeModalOpen,
    schemeTitle, setSchemeTitle, schemeTitleKn, setSchemeTitleKn,
    schemeCategory, setSchemeCategory, schemeAudience, setSchemeAudience,
    schemeVillage, setSchemeVillage, schemeFarmerId, setSchemeFarmerId,
    schemeContent, setSchemeContent, schemeContentKn, setSchemeContentKn,
    schemeEligibility, setSchemeEligibility, schemeBenefits, setSchemeBenefits,
    schemeContact, setSchemeContact, schemeExpiresAt, setSchemeExpiresAt,
    schemeSendSms, setSchemeSendSms, schemeSubmitting,
    templates, charStats: { charLength, isUnicode, maxSingle, parts }, filteredJobs,
    loadData, handleApplyTemplate, handleRequestPreview, handleConfirmSend,
    handleCreateScheme, handleTogglePublishScheme, handleDeleteScheme,
    handleRetryJob, handleCancelJob
  };
}
