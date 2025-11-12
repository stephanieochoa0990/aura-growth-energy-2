import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { achievements } from '@/data/achievementsData';
import { Lock, Sparkles } from 'lucide-react';

interface AchievementGridProps {
  earnedAchievements: string[];
  stats: any;
}

export default function AchievementGrid({ earnedAchievements, stats }: AchievementGridProps) {
  const categories = ['progress', 'engagement', 'mastery', 'special'];
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'progress': return 'border-gold/30 bg-gold/5';
      case 'engagement': return 'border-blue-500/30 bg-blue-500/5';
      case 'mastery': return 'border-purple-500/30 bg-purple-500/5';
      case 'special': return 'border-pink-500/30 bg-pink-500/5';
      default: return 'border-gray-700 bg-gray-800';
    }
  };

  const earnedCount = earnedAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gold/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Your Achievements
            </CardTitle>
            <Badge className="bg-gold text-black">
              {earnedCount}/{totalCount} Unlocked
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {categories.map((category) => {
        const categoryAchievements = achievements.filter(a => a.category === category);
        const categoryEarned = categoryAchievements.filter(a => 
          earnedAchievements.includes(a.key)
        ).length;

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white capitalize">{category}</h3>
              <span className="text-sm text-gray-400">
                {categoryEarned}/{categoryAchievements.length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => {
                const isEarned = earnedAchievements.includes(achievement.key);
                const Icon = achievement.icon;
                
                return (
                  <Card
                    key={achievement.key}
                    className={`transition-all ${
                      isEarned 
                        ? getCategoryColor(category) + ' border-2' 
                        : 'bg-gray-900 border-gray-700 opacity-60'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          isEarned ? 'bg-white/10' : 'bg-gray-800'
                        }`}>
                          {isEarned ? (
                            <Icon className="w-6 h-6 text-gold" />
                          ) : (
                            <Lock className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${
                            isEarned ? 'text-white' : 'text-gray-500'
                          }`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-sm ${
                            isEarned ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {achievement.description}
                          </p>
                          {isEarned && (
                            <Badge className="mt-2 bg-green-600 text-white text-xs">
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
