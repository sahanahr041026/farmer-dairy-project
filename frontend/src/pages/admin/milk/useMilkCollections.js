import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function useMilkCollections() {
  const [farmers, setFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeRateRule, setActiveRateRule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Farmer Selection State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');

  // Notifications
  const [formError, setFormError] = useState('');

  // Load initial data
  const loadData = async () => {
    try {
      const [fList, cList, rRule] = await Promise.all([
        api.getFarmers(),
        api.getCollections({ limit: 100 }),
        api.getCurrentRate()
      ]);
      setFarmers(fList);
      setCollections(cList);
      setActiveRateRule(rRule);
      if (fList.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(fList[0].id.toString());
      }
    } catch (e) {
      console.error(e);
      setFormError("Failed to load data from server. Please verify connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    farmers, collections, activeRateRule, loading,
    selectedFarmerId, setSelectedFarmerId,
    formError, setFormError, loadData
  };
}
