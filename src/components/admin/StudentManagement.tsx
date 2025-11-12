import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Mail, Download, Eye, Edit, Trash2, UserPlus, CheckCircle, RotateCcw, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddStudentModal from './AddStudentModal';
import { StudentActivityTimeline } from './StudentActivityTimeline';

interface Student {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
  progress?: {
    days_completed: number[];
    current_day: number;
    last_accessed: string;
  };
  certificate?: {
    id: string;
    issued_at: string;
  };
}

interface StudentManagementProps {
  userRole: 'instructor' | 'admin';
}

const StudentManagement: React.FC<StudentManagementProps> = ({ userRole }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filterStatus, students]);

  const fetchStudents = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          user_progress!left(
            days_completed,
            current_day,
            last_accessed
          ),
          certificates!left(
            id,
            issued_at
          )
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (profiles) {
        const formattedStudents = profiles.map(profile => ({
          ...profile,
          progress: profile.user_progress?.[0],
          certificate: profile.certificates?.[0]
        }));
        setStudents(formattedStudents);
        setFilteredStudents(formattedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => {
        const daysCompleted = student.progress?.days_completed?.length || 0;
        switch (filterStatus) {
          case 'completed':
            return daysCompleted >= 7;
          case 'in-progress':
            return daysCompleted > 0 && daysCompleted < 7;
          case 'not-started':
            return daysCompleted === 0;
          default:
            return true;
        }
      });
    }

    setFilteredStudents(filtered);
  };

  const handleSendEmail = async (student: Student) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: student.email,
          subject: 'Message from Your Instructor',
          emailType: 'custom',
          studentName: student.full_name
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Email sent to ${student.full_name}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  };


  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== studentId));
      toast({
        title: "Student Deleted",
        description: "Student has been removed from the system"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive"
      });
    }
  };

  const handleMarkComplete = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .update({ 
          days_completed: [1, 2, 3, 4, 5, 6, 7],
          current_day: 7
        })
        .eq('user_id', studentId);

      if (error) throw error;

      await fetchStudents();
      toast({
        title: "Progress Updated",
        description: "Student marked as complete"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const handleResetProgress = async (studentId: string) => {
    if (!confirm('Are you sure you want to reset this student\'s progress?')) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .update({ 
          days_completed: [],
          current_day: 1
        })
        .eq('user_id', studentId);

      if (error) throw error;

      await fetchStudents();
      toast({
        title: "Progress Reset",
        description: "Student progress has been reset"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset progress",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Name', 'Email', 'Enrollment Date', 'Days Completed', 'Progress %', 'Status'],
      ...filteredStudents.map(s => [
        s.full_name,
        s.email,
        new Date(s.created_at).toLocaleDateString(),
        s.progress?.days_completed?.length || 0,
        Math.round(((s.progress?.days_completed?.length || 0) / 7) * 100),
        s.progress?.days_completed?.length >= 7 ? 'Completed' : 'In Progress'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  const getStatusBadge = (student: Student) => {
    const daysCompleted = student.progress?.days_completed?.length || 0;
    if (daysCompleted >= 7) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (daysCompleted > 0) {
      return <Badge className="bg-blue-100 text-blue-800">Day {daysCompleted}/7</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Student Management</CardTitle>
            <Button onClick={() => setShowAddStudent(true)} className="bg-yellow-600 hover:bg-yellow-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>

              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <div
                          key={day}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            student.progress?.days_completed?.includes(day)
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(student)}</TableCell>
                  <TableCell>
                    {student.certificate ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Issued</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDetails(true);
                        }}
                        title="View Details & Activity"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkComplete(student.id)}
                        title="Mark Complete"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetProgress(student.id)}
                        title="Reset Progress"
                      >
                        <RotateCcw className="h-4 w-4 text-orange-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendEmail(student)}
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {userRole === 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStudent(student.id)}
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Student Details Modal with Activity Timeline */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details & Activity</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Basic Information</TabsTrigger>
                <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{selectedStudent.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Enrollment Date</label>
                  <p>{new Date(selectedStudent.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Active</label>
                  <p>{selectedStudent.progress?.last_accessed 
                    ? new Date(selectedStudent.progress.last_accessed).toLocaleString()
                    : 'Never'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Progress Overview</label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <div
                        key={day}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedStudent.progress?.days_completed?.includes(day)
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity">
                <StudentActivityTimeline 
                  userId={selectedStudent.id} 
                  userName={selectedStudent.full_name} 
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <AddStudentModal 
        open={showAddStudent} 
        onOpenChange={setShowAddStudent}
        onStudentAdded={fetchStudents}
      />
    </>
  );
};

export default StudentManagement;
