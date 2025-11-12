import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CourseDB extends DBSchema {
  content: {
    key: string;
    value: {
      id: string;
      dayNumber: number;
      title: string;
      content: any;
      videos: string[];
      resources: any[];
      downloadedAt: number;
      size: number;
    };
  };
  progress: {
    key: string;
    value: {
      id: string;
      dayNumber: number;
      completed: boolean;
      lastAccessed: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
}

export function useOfflineStorage() {
  const [db, setDb] = useState<IDBPDatabase<CourseDB> | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    initDB();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initDB = async () => {
    const database = await openDB<CourseDB>('course-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
      },
    });
    setDb(database);
  };

  const saveContent = async (dayNumber: number, data: any) => {
    if (!db) return;
    await db.put('content', {
      id: `day-${dayNumber}`,
      dayNumber,
      ...data,
      downloadedAt: Date.now(),
    });
  };

  const getContent = async (dayNumber: number) => {
    if (!db) return null;
    return await db.get('content', `day-${dayNumber}`);
  };

  const deleteContent = async (dayNumber: number) => {
    if (!db) return;
    await db.delete('content', `day-${dayNumber}`);
  };

  const getAllContent = async () => {
    if (!db) return [];
    return await db.getAll('content');
  };

  return {
    db,
    isOnline,
    saveContent,
    getContent,
    deleteContent,
    getAllContent,
  };
}
