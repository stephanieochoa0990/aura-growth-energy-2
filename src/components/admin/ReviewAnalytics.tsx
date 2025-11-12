import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, TrendingUp, MessageSquare, ThumbsUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'];

export default function ReviewAnalytics() {
  const [stats, setStats] = useState<any>({});
  const [ratingTrend, setRatingTrend] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Overall stats
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved');

    if (reviews) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0);
      
      setStats({
        totalReviews: reviews.length,
        averageRating: avgRating.toFixed(1),
        totalHelpful,
        withPhotos: reviews.filter(r => r.photo_count > 0).length
      });

      // Rating distribution
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating} Star`,
        count: reviews.filter(r => r.rating === rating).length
      }));
      setRatingDistribution(distribution);

      // Rating trend over last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyData: any = {};
      reviews.forEach(review => {
        const date = new Date(review.created_at);
        if (date >= sixMonthsAgo) {
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, total: 0, sum: 0 };
          }
          monthlyData[monthKey].total++;
          monthlyData[monthKey].sum += review.rating;
        }
      });

      const trend = Object.values(monthlyData).map((m: any) => ({
        month: m.month,
        avgRating: (m.sum / m.total).toFixed(1),
        count: m.total
      }));
      setRatingTrend(trend);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-3xl font-bold">{stats.totalReviews || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-3xl font-bold">{stats.averageRating || 0}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Helpful Votes</p>
              <p className="text-3xl font-bold">{stats.totalHelpful || 0}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With Photos</p>
              <p className="text-3xl font-bold">{stats.withPhotos || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rating Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ratingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgRating" stroke="#3b82f6" name="Avg Rating" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
