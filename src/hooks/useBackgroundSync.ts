import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

interface SyncItem {
  id: string;
  type: 'progress' | 'completion' | 'bookmark';
  data: any;
  timestamp: number;
}

export function useBackgroundSync() {
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncQueue();
    
    const handleOnline = () => {
      setIsOnline(true);
      syncAll();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSyncQueue = () => {
    const stored = localStorage.getItem('sync-queue');
    if (stored) {
      setSyncQueue(JSON.parse(stored));
    }
  };

  const saveSyncQueue = (queue: SyncItem[]) => {
    localStorage.setItem('sync-queue', JSON.stringify(queue));
    setSyncQueue(queue);
  };

  const addToQueue = (type: SyncItem['type'], data: any) => {
    const item: SyncItem = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now()
    };
    const newQueue = [...syncQueue, item];
    saveSyncQueue(newQueue);
    
    if (isOnline) {
      syncAll();
    }
  };

  const syncAll = async () => {
    if (syncing || syncQueue.length === 0) return;
    
    setSyncing(true);
    const failed: SyncItem[] = [];

    for (const item of syncQueue) {
      try {
        await syncItem(item);
      } catch (error) {
        console.error('Sync failed:', error);
        failed.push(item);
      }
    }

    saveSyncQueue(failed);
    setSyncing(false);

    if (failed.length === 0) {
      toast({
        title: "Sync Complete",
        description: "All changes have been synchronized.",
      });
    } else {
      toast({
        title: "Partial Sync",
        description: `${syncQueue.length - failed.length} items synced, ${failed.length} failed.`,
        variant: "destructive"
      });
    }
  };

  const syncItem = async (item: SyncItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    switch (item.type) {
      case 'progress':
        await supabase
          .from('user_progress')
          .upsert({ user_id: user.id, ...item.data });
        break;
      case 'completion':
        await supabase
          .from('day_completions')
          .upsert({ user_id: user.id, ...item.data });
        break;
      case 'bookmark':
        await supabase
          .from('video_bookmarks')
          .upsert({ user_id: user.id, ...item.data });
        break;
    }
  };

  return {
    syncQueue,
    syncing,
    isOnline,
    addToQueue,
    syncAll
  };
}
