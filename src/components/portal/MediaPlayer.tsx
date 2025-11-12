import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface MediaPlayerProps {
  mediaUrl: string;
  mediaType: 'youtube' | 'audio' | 'video';
  caption: string;
  sectionName?: string;
}

export default function MediaPlayer({ mediaUrl, mediaType, caption, sectionName }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const togglePlay = () => {
    if (mediaType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (mediaType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
    if (videoRef.current) videoRef.current.volume = newVolume / 100;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.muted = !isMuted;
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (mediaType === 'youtube') {
    return (
      <div className="space-y-2 w-full">
        <div className="aspect-video bg-black rounded-lg overflow-hidden w-full max-w-full">
          <iframe
            src={getYouTubeEmbedUrl(mediaUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={sectionName || caption}
          />
        </div>
        <p className="text-xs sm:text-sm text-center text-muted-foreground italic px-2 break-words">
          {sectionName && <span className="font-medium">{sectionName}: </span>}
          {caption}
        </p>
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 w-full">
        <CardContent className="p-3 sm:p-4">
          <audio
            ref={audioRef}
            src={mediaUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Button
              size="icon"
              variant="outline"
              onClick={togglePlay}
              className="shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-8 sm:h-8 shrink-0"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1 min-w-0"
                />
                <span className="text-xs sm:text-sm text-muted-foreground w-8 sm:w-10 text-right shrink-0">
                  {volume}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-center text-muted-foreground italic mt-3 px-2 break-words">
            {sectionName && <span className="font-medium">{sectionName}: </span>}
            {caption}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="space-y-2 w-full">
        <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-full">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full aspect-video"
            controls={false}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                size="icon"
                variant="secondary"
                onClick={togglePlay}
                className="shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              
              <div className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-8 sm:h-8 text-white hover:bg-white/20 shrink-0"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1 max-w-[80px] sm:max-w-[120px]"
                />
              </div>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 text-white hover:bg-white/20 shrink-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-center text-muted-foreground italic px-2 break-words">
          {sectionName && <span className="font-medium">{sectionName}: </span>}
          {caption}
        </p>
      </div>
    );
  }

  return null;
}