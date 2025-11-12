import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Bookmark, BookmarkCheck, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  duration?: number;
  dayNumber?: number;
  sectionNumber?: number;
  onProgressUpdate?: (progress: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  duration,
  dayNumber,
  sectionNumber,
  onProgressUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);
  const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    loadVideoProgress();
    loadBookmarks();
    
    // Save progress when component unmounts or video changes
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveProgress();
    };
  }, [videoId]);

  // Auto-save progress every 5 seconds while playing
  useEffect(() => {
    if (isPlaying && currentTime > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 5000);
    }
  }, [currentTime, isPlaying]);

  const loadVideoProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('video_progress')
      .select('last_position, completion_percentage')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    if (data?.last_position && !hasLoadedInitialProgress) {
      // Wait for video to be ready before seeking
      const seekToSavedPosition = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.currentTime = data.last_position;
          setCurrentTime(data.last_position);
          setLastSavedPosition(data.last_position);
          setHasLoadedInitialProgress(true);
          
          // Show toast about resuming
          if (data.last_position > 5) {
            toast({
              title: "Resuming where you left off",
              description: `Continuing from ${formatTime(data.last_position)}`
            });
          }
        } else {
          setTimeout(seekToSavedPosition, 100);
        }
      };
      seekToSavedPosition();
    }
  };

  const loadBookmarks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('video_bookmarks')
      .select('timestamp_seconds')
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    if (data) {
      setBookmarks(data.map(b => b.timestamp_seconds));
    }
  };

  const saveProgress = async () => {
    if (!videoRef.current) return;
    const currentVideoTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (!currentVideoTime || !duration || duration === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, skipping video progress save');
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-video-progress', {
        body: {
          videoId,
          videoTitle: title,
          dayNumber,
          sectionNumber,
          currentTime: currentVideoTime,
          duration: duration,
          forceComplete: false
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (onProgressUpdate) {
        const completion = (currentVideoTime / duration) * 100;
        onProgressUpdate(completion);
      }
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };


  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
    } else {
      videoRef.current.play();
      progressInterval.current = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          if (videoRef.current.currentTime - lastSavedPosition > 10) {
            saveProgress();
            setLastSavedPosition(videoRef.current.currentTime);
          }
        }
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !videoRef.current) return;

    const timestamp = Math.floor(videoRef.current.currentTime);
    
    if (bookmarks.includes(timestamp)) {
      await supabase
        .from('video_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .eq('timestamp_seconds', timestamp);
      
      setBookmarks(bookmarks.filter(b => b !== timestamp));
      toast({ title: "Bookmark removed" });
    } else {
      await supabase.from('video_bookmarks').insert({
        user_id: user.id,
        video_id: videoId,
        timestamp_seconds: timestamp,
        note: `Bookmarked at ${formatTime(timestamp)}`
      });
      
      setBookmarks([...bookmarks, timestamp]);
      toast({ title: "Bookmark added", description: `at ${formatTime(timestamp)}` });
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isBookmarked = bookmarks.some(b => Math.abs(b - currentTime) < 2);

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onLoadedMetadata={(e) => {
            setVideoDuration(e.currentTarget.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
            saveProgress();
          }}
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="mb-2">
            <Slider
              value={[currentTime]}
              max={videoDuration}
              step={1}
              onValueChange={([value]) => seekTo(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(videoDuration)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => seekTo(Math.min(videoDuration, currentTime + 10))}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleBookmark}
                className="text-white hover:bg-white/20"
              >
                {isBookmarked ? 
                  <BookmarkCheck className="h-4 w-4 text-yellow-400" /> : 
                  <Bookmark className="h-4 w-4" />
                }
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => {
                    setVolume(value);
                    if (videoRef.current) videoRef.current.volume = value;
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {bookmarks.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400 mb-2">Bookmarks:</p>
          <div className="flex flex-wrap gap-2">
            {bookmarks.sort((a, b) => a - b).map(timestamp => (
              <Badge
                key={timestamp}
                variant="secondary"
                className="cursor-pointer hover:bg-yellow-500/20"
                onClick={() => seekTo(timestamp)}
              >
                {formatTime(timestamp)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};