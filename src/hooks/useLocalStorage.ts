import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function useLocalStorageQuery<T>(key: string, defaultValue: T[] = [] as T[]) {
  const [data, setData] = useLocalStorage<T[]>(key, defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const refetch = () => {
    const item = window.localStorage.getItem(key);
    const newData = item ? JSON.parse(item) : defaultValue;
    setData(newData);
  };

  return { data, loading, refetch };
}

export function useLocalStorageMutation<T>() {
  const [loading, setLoading] = useState(false);

  const insert = async (key: string, newItem: Omit<T, 'id'>) => {
    setLoading(true);
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const itemWithId = {
        ...newItem,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      const updatedData = [...existingData, itemWithId];
      localStorage.setItem(key, JSON.stringify(updatedData));
      return itemWithId;
    } finally {
      setLoading(false);
    }
  };

  const update = async (key: string, id: string, updates: Partial<T>) => {
    setLoading(true);
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedData = existingData.map((item: any) =>
        item.id === id ? { ...item, ...updates } : item
      );
      localStorage.setItem(key, JSON.stringify(updatedData));
      return updatedData.find((item: any) => item.id === id);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (key: string, id: string) => {
    setLoading(true);
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedData = existingData.filter((item: any) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(updatedData));
    } finally {
      setLoading(false);
    }
  };

  return { insert, update, remove, loading };
}