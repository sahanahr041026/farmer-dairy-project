import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function useCattleData() {
  const [cattleList, setCattleList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, rList, bList] = await Promise.all([
        api.getCattle(),
        api.getReminders(),
        api.getBreeds()
      ]);
      setCattleList(cList);
      setReminders(rList);
      setBreeds(bList);
      if (bList.length > 0 && !selectedBreed) {
        setSelectedBreed(bList[0]);
      }
    } catch (e) {
      console.error("Error loading cattle data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { cattleList, reminders, breeds, selectedBreed, setSelectedBreed, loading, loadData };
}
