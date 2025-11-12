import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ContentEditor from './ContentEditor';

import {
  BookOpen,
  Edit,
  Eye,
  Upload,
  History,
  Plus,
  Video,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ContentManagerProps {
  userRole: 'instructor' | 'admin';
}

const ContentManager: React.FC<ContentManagerProps> = ({ userRole }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [dayStats, setDayStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const days = [
    { number: 1, title: "Foundation & Fundamentals", icon: "🎯" },
    { number: 2, title: "Core Concepts", icon: "💡" },
    { number: 3, title: "Advanced Techniques", icon: "🚀" },
    { number: 4, title: "Practical Applications", icon: "⚡" },
    { number: 5, title: "Deep Dive & Analysis", icon: "🔍" },
    { number: 6, title: "Integration & Synthesis", icon: "🔗" },
    { number: 7, title: "Mastery & Certification", icon: "🏆" }
  ];

  useEffect(() => {
    fetchContentStats();
  }, []);

  const fetchContentStats = async () => {
    try {
      const stats = [];
      
      for (let day = 1; day <= 7; day++) {
        const { data: content } = await supabase
          .from('course_content')
          .select('*')
          .eq('day_number', day);

        const { data: exercises } = await supabase
          .from('practice_exercises')
          .select('*')
          .eq('day_number', day);

        const hasVideo = content?.some(c => c.video_url);
        const isPublished = content?.some(c => c.is_published);
        const contentCount = content?.length || 0;
        const exerciseCount = exercises?.length || 0;

        stats.push({
          day,
          contentCount,
          exerciseCount,
          hasVideo,
          isPublished,
          completeness: calculateCompleteness(contentCount, exerciseCount, hasVideo)
        });
      }

      setDayStats(stats);
    } catch (error) {
      console.error('Error fetching content stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = (content: number, exercises: number, hasVideo: boolean) => {
    let score = 0;
    if (content > 0) score += 40;
    if (exercises > 0) score += 30;
    if (hasVideo) score += 30;
    return score;
  };

  const handleEditDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowEditor(true);
  };

  const handleViewHistory = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowHistory(true);
  };

  const handleBulkUpload = () => {
    toast({
      title: "Bulk Upload",
      description: "Opening bulk upload interface...",
    });
  };

  const getStatusBadge = (stat: any) => {
    if (stat.completeness === 100) {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (stat.completeness >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Needs Content</Badge>;
    }
  };

  const getStatusIcon = (stat: any) => {
    if (stat.completeness === 100) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stat.completeness >= 50) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Course Content Management</CardTitle>
              <Button onClick={handleBulkUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {days.map((day) => {
                const stat = dayStats.find(s => s.day === day.number) || {};
                
                return (
                  <Card key={day.number} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{day.icon}</span>
                            <div>
                              <h3 className="text-lg font-semibold">
                                Day {day.number}: {day.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(stat)}
                                {getStatusBadge(stat)}
                                {stat.isPublished && (
                                  <Badge className="bg-blue-100 text-blue-800">Published</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {stat.contentCount || 0} Lessons
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {stat.exerciseCount || 0} Exercises
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {stat.hasVideo ? 'Has Video' : 'No Video'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Completeness</span>
                              <span>{stat.completeness || 0}%</span>
                            </div>
                            <Progress value={stat.completeness || 0} className="h-2" />
                          </div>
                        </div>

                        <div className="flex gap-2 ml-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDay(day.number)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(day.number)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add New Lesson
              </Button>
              <Button variant="outline" className="justify-start">
                <Video className="h-4 w-4 mr-2" />
                Upload Videos
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Manage Resources
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Day {selectedDay} Content</DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <ContentEditor
              dayNumber={selectedDay}
              onClose={() => {
                setShowEditor(false);
                fetchContentStats();
              }}
            />
          )}
        </DialogContent>
      </Dialog>



    </>
  );
};

export default ContentManager;