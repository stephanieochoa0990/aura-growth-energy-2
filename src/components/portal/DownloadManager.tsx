import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Download, Trash2, CheckCircle, WifiOff, Wifi, HardDrive } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeContent } from '@/lib/normalizeContent';

interface DownloadItem {
  dayNumber: number;
  title: string;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress: number;
  size: number;
}

export default function DownloadManager() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [cachedContent, setCachedContent] = useState<any[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const { saveContent, getAllContent, deleteContent, isOnline } = useOfflineStorage();
  const { toast } = useToast();

  const days = [
    { number: 1, title: "Foundation & Fundamentals" },
    { number: 2, title: "Core Concepts" },
    { number: 3, title: "Advanced Techniques" },
    { number: 4, title: "Practical Applications" },
    { number: 5, title: "Deep Dive & Analysis" },
    { number: 6, title: "Integration & Synthesis" },
    { number: 7, title: "Mastery & Certification" }
  ];

  useEffect(() => {
    loadCachedContent();
  }, []);

  const loadCachedContent = async () => {
    const content = await getAllContent();
    const normalized = content.map((item) => ({
      ...item,
      content: item?.content ? normalizeContent(item.content) : { sections: [] },
    }));
    setCachedContent(normalized);
    const size = normalized.reduce((acc, item) => acc + (item.size || 0), 0);
    setTotalSize(size);
  };

  const downloadDay = async (dayNumber: number, title: string) => {
    setDownloads(prev => [...prev, { dayNumber, title, status: 'downloading', progress: 0, size: 0 }]);

    try {
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('day_number', dayNumber)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDownloads(prev => prev.map(d => 
          d.dayNumber === dayNumber ? { ...d, progress: i } : d
        ));
      }

      const normalized = data ? normalizeContent((data as any).content ?? data) : { sections: [] };
      await saveContent(dayNumber, { title, content: normalized, size: 1024 * 500 });

      setDownloads(prev => prev.map(d => 
        d.dayNumber === dayNumber ? { ...d, status: 'completed' } : d
      ));

      toast({
        title: "Download Complete",
        description: `Day ${dayNumber} is now available offline.`,
      });

      loadCachedContent();
    } catch (error: any) {
      setDownloads(prev => prev.map(d => 
        d.dayNumber === dayNumber ? { ...d, status: 'error' } : d
      ));
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeDay = async (dayNumber: number) => {
    await deleteContent(dayNumber);
    toast({
      title: "Content Removed",
      description: `Day ${dayNumber} removed from offline storage.`,
    });
    loadCachedContent();
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Offline Content Manager
          </CardTitle>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">Storage Used: {formatSize(totalSize)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {days.map(day => {
          const cached = cachedContent.find(c => c.dayNumber === day.number);
          const downloading = downloads.find(d => d.dayNumber === day.number && d.status === 'downloading');

          return (
            <div key={day.number} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Day {day.number}: {day.title}</h4>
                {downloading && (
                  <Progress value={downloading.progress} className="mt-2" />
                )}
                {cached && (
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4" />
                    Downloaded {new Date(cached.downloadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!cached && !downloading && (
                  <Button
                    size="sm"
                    onClick={() => downloadDay(day.number, day.title)}
                    disabled={!isOnline}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                {cached && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeDay(day.number)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
