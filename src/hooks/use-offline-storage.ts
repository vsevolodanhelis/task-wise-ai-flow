
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// Type for offline task queue
export interface QueuedOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
}

export function useOfflineStorage<T extends { id: string }>(key: string) {
  const [queue, setQueue] = useState<QueuedOperation<T>[]>([]);
  const [offlineData, setOfflineData] = useState<T[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isMobile = useIsMobile();

  // Initialize from localStorage
  useEffect(() => {
    if (!isMobile) return;
    
    try {
      const storedQueue = localStorage.getItem(`${key}_queue`);
      const storedData = localStorage.getItem(key);
      
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }
      
      if (storedData) {
        setOfflineData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, [key, isMobile]);

  // Listen for online/offline events
  useEffect(() => {
    if (!isMobile) return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMobile]);

  // Save queue and data to localStorage whenever they change
  useEffect(() => {
    if (!isMobile) return;
    
    try {
      localStorage.setItem(`${key}_queue`, JSON.stringify(queue));
      localStorage.setItem(key, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, [queue, offlineData, key, isMobile]);

  const addToQueue = (operation: Omit<QueuedOperation<T>, 'id' | 'timestamp'>) => {
    if (!isMobile) return;
    
    const newOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setQueue(prev => [...prev, newOperation]);
    
    // Update offline data
    if (operation.type === 'create') {
      setOfflineData(prev => [...prev, operation.data]);
    } else if (operation.type === 'update') {
      setOfflineData(prev => 
        prev.map(item => item.id === operation.data.id ? operation.data : item)
      );
    } else if (operation.type === 'delete') {
      setOfflineData(prev => 
        prev.filter(item => item.id !== operation.data.id)
      );
    }
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return {
    queue,
    addToQueue,
    clearQueue,
    offlineData,
    setOfflineData,
    isOnline,
  };
}
