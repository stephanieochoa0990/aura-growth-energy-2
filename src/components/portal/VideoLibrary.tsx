import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { Play, Clock, CheckCircle, Film, Brain, Sparkles, Gift } from 'lucide-react';

interface Video {
  id: string;
  day_number: number;
  title: string;
  description: string;
  duration_seconds: number;
  video_url: string;
  thumbnail_url: string;
  video_type: 'lesson' | 'meditation' | 'practice' | 'bonus';
  order_index: number;
  progress?: number;
  completed?: boolean;
}

export const VideoLibrary: React.FC<{ currentDay: number }> = ({ currentDay }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadVideos();
  }, [currentDay]);

  const loadVideos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load videos for current day
    const { data: videoData } = await supabase
      .from('video_content')
      .select('*')
      .eq('day_number', currentDay)
      .order('order_index');

    if (videoData) {
      // Load progress for each video
      const videosWithProgress = await Promise.all(
        videoData.map(async (video) => {
          const { data: progressData } = await supabase
            .from('video_progress')
            .select('completion_percentage, completed')
            .eq('user_id', user.id)
            .eq('video_id', video.id)
            .single();

          return {
            ...video,
            progress: progressData?.completion_percentage || 0,
            completed: progressData?.completed || false
          };
        })
      );

      setVideos(videosWithProgress);
      if (!selectedVideo && videosWithProgress.length > 0) {
        setSelectedVideo(videosWithProgress[0]);
      }
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getVideoIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <Film className="h-4 w-4" />;
      case 'meditation': return <Brain className="h-4 w-4" />;
      case 'practice': return <Sparkles className="h-4 w-4" />;
      case 'bonus': return <Gift className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const getVideoTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-500/20 text-blue-300';
      case 'meditation': return 'bg-purple-500/20 text-purple-300';
      case 'practice': return 'bg-green-500/20 text-green-300';
      case 'bonus': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const filteredVideos = activeTab === 'all' 
    ? videos 
    : videos.filter(v => v.video_type === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-yellow-400">Day {currentDay} Video Content</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedVideo && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">{selectedVideo.title}</h3>
              <VideoPlayer
                videoId={selectedVideo.id}
                videoUrl={selectedVideo.video_url}
                title={selectedVideo.title}
                duration={selectedVideo.duration_seconds}
                onProgressUpdate={(progress) => {
                  setVideos(videos.map(v => 
                    v.id === selectedVideo.id 
                      ? { ...v, progress, completed: progress >= 90 }
                      : v
                  ));
                }}
              />
              {selectedVideo.description && (
                <p className="mt-4 text-gray-400">{selectedVideo.description}</p>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full bg-gray-800">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="lesson">Lessons</TabsTrigger>
              <TabsTrigger value="meditation">Meditations</TabsTrigger>
              <TabsTrigger value="practice">Practices</TabsTrigger>
              <TabsTrigger value="bonus">Bonus</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-3">
                {filteredVideos.map((video) => (
                  <Card
                    key={video.id}
                    className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:bg-gray-700 ${
                      selectedVideo?.id === video.id ? 'ring-2 ring-yellow-400' : ''
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                              {video.completed ? (
                                <CheckCircle className="h-8 w-8 text-green-400" />
                              ) : (
                                <Play className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            {video.progress > 0 && !video.completed && (
                              <Progress
                                value={video.progress}
                                className="absolute bottom-0 left-0 right-0 h-1"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{video.title}</h4>
                              <Badge className={getVideoTypeColor(video.video_type)}>
                                <span className="flex items-center gap-1">
                                  {getVideoIcon(video.video_type)}
                                  {video.video_type}
                                </span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(video.duration_seconds)}
                              </span>
                              {video.progress > 0 && (
                                <span>{Math.round(video.progress)}% complete</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant={selectedVideo?.id === video.id ? "default" : "outline"}
                          size="sm"
                          className={selectedVideo?.id === video.id ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          {selectedVideo?.id === video.id ? 'Playing' : 'Play'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};