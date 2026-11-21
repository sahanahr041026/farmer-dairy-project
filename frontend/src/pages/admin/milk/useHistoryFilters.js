import { useState, useMemo } from 'react';

export function useHistoryFilters(collections) {
  const [historySearch, setHistorySearch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtered collections for history table
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Search
      if (historySearch.trim()) {
        const term = historySearch.toLowerCase().trim();
        const matchName = c.farmer_name && c.farmer_name.toLowerCase().includes(term);
        const matchUid = c.farmer_uid && c.farmer_uid.toLowerCase().includes(term);
        if (!matchName && !matchUid) return false;
      }
      // Date range
      if (filterStartDate && c.collection_date < filterStartDate) return false;
      if (filterEndDate && c.collection_date > filterEndDate) return false;
      // Session
      if (filterSession !== 'all' && c.session !== filterSession) return false;
      // Record status
      if (filterStatus !== 'all' && c.record_status !== filterStatus) return false;

      return true;
    });
  }, [collections, historySearch, filterStartDate, filterEndDate, filterSession, filterStatus]);

  // Aggregate summary totals for filtered period
  const historySummary = useMemo(() => {
    const totalLitres = filteredCollections.reduce((sum, c) => sum + (c.quantity_litres || 0), 0);
    const totalAmount = filteredCollections.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    return {
      totalLitres: Math.round(totalLitres * 10) / 10,
      totalAmount: Math.round(totalAmount * 100) / 100,
      count: filteredCollections.length
    };
  }, [filteredCollections]);

  return {
    historySearch, setHistorySearch,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    filterSession, setFilterSession,
    filterStatus, setFilterStatus,
    filteredCollections, historySummary
  };
}
