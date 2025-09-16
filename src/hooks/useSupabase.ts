import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient, checkApiConnection } from '../lib/api';

// Cache for API responses
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// MySQL Database hooks with localStorage fallback
export function useSupabaseQuery<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create cache key
  const cacheKey = useMemo(() => {
    return `${table}-${select}-${JSON.stringify(filters || {})}`;
  }, [table, select, filters]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Check cache first
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Try to fetch from MySQL API first
        const isApiAvailable = await checkApiConnection();
        
        if (isApiAvailable) {
          const result = await apiClient.get<T>(table, filters);
          const data = result || [];
          setData(data);
          setError(null);
          
          // Cache the result
          queryCache.set(cacheKey, { data, timestamp: Date.now() });
        } else {
          throw new Error('API not available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Failed to fetch data from MySQL API:', err);
        
        // Fallback to localStorage if API fails
        try {
          const storedData = localStorage.getItem(table) || '[]';
          let result = JSON.parse(storedData);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              result = result.filter((item: any) => item[key] === value);
            });
          }
          
          setData(result || []);
          console.log('Using localStorage fallback for', table);
        } catch (fallbackErr) {
          console.error('Fallback to localStorage also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [cacheKey, table, select, filters]);

  const refetch = useCallback(async () => {
    // Clear cache for this query
    queryCache.delete(cacheKey);
    
    setLoading(true);
    try {
      const isApiAvailable = await checkApiConnection();
      
      if (isApiAvailable) {
        const result = await apiClient.get<T>(table, filters);
        const data = result || [];
        setData(data);
        setError(null);
        
        // Cache the new result
        queryCache.set(cacheKey, { data, timestamp: Date.now() });
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to refetch data from MySQL API:', err);
      
      // Fallback to localStorage
      try {
        const storedData = localStorage.getItem(table) || '[]';
        let result = JSON.parse(storedData);
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            result = result.filter((item: any) => item[key] === value);
          });
        }
        
        setData(result || []);
      } catch (fallbackErr) {
        console.error('Fallback to localStorage also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, table, filters]);

  return { data, loading, error, refetch };
}

export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false);

  const insert = async (table: string, data: any) => {
    try {
      setLoading(true);
      
      // Prepare data for MySQL
      const insertData = {
        ...data,
        // Ensure all required fields are present
        ...(table === 'bookings' && {
          payment_status: data.payment_status || 'pending',
          amount: data.amount || 0
        })
      };
      
      // Try to insert via API first
      const isApiAvailable = await checkApiConnection();
      
      if (isApiAvailable) {
        const result = await apiClient.create(table, insertData);
        return result;
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      console.error('Insert error:', message);
      
      // Fallback to localStorage if API fails
      try {
        const existingData = JSON.parse(localStorage.getItem(table) || '[]');
        const newItem = {
          ...data,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          ...(table === 'bookings' && {
            payment_status: data.payment_status || 'pending',
            amount: data.amount || 0
          })
        };
        
        const updatedData = [...existingData, newItem];
        localStorage.setItem(table, JSON.stringify(updatedData));
        
        console.log('Using localStorage fallback for insert');
        return newItem;
      } catch (fallbackErr) {
        console.error('Fallback to localStorage also failed:', fallbackErr);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const update = async (table: string, id: string, data: any) => {
    try {
      setLoading(true);
      
      // Try to update via API first
      const isApiAvailable = await checkApiConnection();
      
      if (isApiAvailable) {
        const result = await apiClient.update(table, id, data);
        return result;
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      console.error('Update error:', message);
      
      // Fallback to localStorage if API fails
      try {
        const existingData = JSON.parse(localStorage.getItem(table) || '[]');
        const updatedData = existingData.map((item: any) =>
          item.id === id ? { ...item, ...data } : item
        );
        
        localStorage.setItem(table, JSON.stringify(updatedData));
        
        console.log('Using localStorage fallback for update');
        return updatedData.find((item: any) => item.id === id);
      } catch (fallbackErr) {
        console.error('Fallback to localStorage also failed:', fallbackErr);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const remove = async (table: string, id: string) => {
    try {
      setLoading(true);
      
      // Try to delete via API first
      const isApiAvailable = await checkApiConnection();
      
      if (isApiAvailable) {
        await apiClient.delete(table, id);
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      console.error('Delete error:', message);
      
      // Fallback to localStorage if API fails
      try {
        const existingData = JSON.parse(localStorage.getItem(table) || '[]');
        const updatedData = existingData.filter((item: any) => item.id !== id);
        localStorage.setItem(table, JSON.stringify(updatedData));
        
        console.log('Using localStorage fallback for delete');
      } catch (fallbackErr) {
        console.error('Fallback to localStorage also failed:', fallbackErr);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return { insert, update, remove, loading };
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string, path?: string) => {
    try {
      setUploading(true);
      
      // Try to upload via API first
      const isApiAvailable = await checkApiConnection();
      
      if (isApiAvailable) {
        const url = await apiClient.uploadFile(file, bucket, path);
        return url;
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', message);
      
      // Fallback to base64 for localStorage storage
      try {
        console.log('Using base64 fallback for file upload');
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        });
      } catch (fallbackErr) {
        console.error('Fallback to base64 also failed:', fallbackErr);
        throw err;
      }
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
}