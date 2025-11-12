import { Trophy, Star, Zap, Target, Award, BookOpen, Clock, Flame, Heart, Crown } from 'lucide-react';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: any;
  category: 'progress' | 'engagement' | 'mastery' | 'special';
  requirement: (stats: any) => boolean;
}

export const achievements: Achievement[] = [
  {
    key: 'first_steps',
    title: 'First Steps',
    description: 'Complete Day 1',
    icon: Star,
    category: 'progress',
    requirement: (stats) => stats.currentDay > 1
  },
  {
    key: 'early_riser',
    title: 'Early Riser',
    description: 'Access content within first hour of day unlock',
    icon: Clock,
    category: 'engagement',
    requirement: (stats) => stats.earlyAccess >= 3
  },
  {
    key: 'dedicated_learner',
    title: 'Dedicated Learner',
    description: 'Complete 10+ materials',
    icon: BookOpen,
    category: 'engagement',
    requirement: (stats) => stats.totalCompleted >= 10
  },
  {
    key: 'halfway_hero',
    title: 'Halfway Hero',
    description: 'Reach Day 4',
    icon: Zap,
    category: 'progress',
    requirement: (stats) => stats.currentDay >= 4
  },
  {
    key: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all materials for 3 consecutive days',
    icon: Target,
    category: 'mastery',
    requirement: (stats) => stats.perfectDays >= 3
  },
  {
    key: 'time_invested',
    title: 'Time Invested',
    description: 'Spend 5+ hours learning',
    icon: Clock,
    category: 'engagement',
    requirement: (stats) => stats.totalTimeHours >= 5
  },
  {
    key: 'on_fire',
    title: 'On Fire',
    description: 'Complete materials 7 days in a row',
    icon: Flame,
    category: 'engagement',
    requirement: (stats) => stats.streak >= 7
  },
  {
    key: 'journey_complete',
    title: 'Journey Complete',
    description: 'Finish all 7 days',
    icon: Trophy,
    category: 'progress',
    requirement: (stats) => stats.currentDay > 7
  },
  {
    key: 'master_student',
    title: 'Master Student',
    description: 'Complete all materials with 100% completion',
    icon: Crown,
    category: 'mastery',
    requirement: (stats) => stats.percentComplete === 100
  },
  {
    key: 'community_contributor',
    title: 'Community Contributor',
    description: 'Post 5+ times in the forum',
    icon: Heart,
    category: 'special',
    requirement: (stats) => stats.forumPosts >= 5
  },
  {
    key: 'video_enthusiast',
    title: 'Video Enthusiast',
    description: 'Watch 10+ videos',
    icon: Award,
    category: 'engagement',
    requirement: (stats) => stats.videosWatched >= 10
  }
];
