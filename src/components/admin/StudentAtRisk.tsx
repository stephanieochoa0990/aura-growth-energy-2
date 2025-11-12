import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, TrendingDown } from 'lucide-react';

interface AtRiskStudent {
  id: string;
  name: string;
  email: string;
  daysCompleted: number;
  lastActive: string;
  videoCompletion: number;
  forumPosts: number;
  riskLevel: 'high' | 'medium' | 'low';
}

interface StudentAtRiskProps {
  students: AtRiskStudent[];
  onContactStudent: (studentId: string) => void;
}

const StudentAtRisk: React.FC<StudentAtRiskProps> = ({ students, onContactStudent }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Students Needing Support
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-4">All students are on track!</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                  <Badge className={getRiskColor(student.riskLevel)}>
                    {student.riskLevel} risk
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Progress:</span> {student.daysCompleted}/7 days
                  </div>
                  <div>
                    <span className="text-gray-500">Video:</span> {student.videoCompletion}%
                  </div>
                  <div>
                    <span className="text-gray-500">Forum:</span> {student.forumPosts} posts
                  </div>
                  <div>
                    <span className="text-gray-500">Last active:</span> {student.lastActive}
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onContactStudent(student.id)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Encouragement Email
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAtRisk;
