import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Download, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificateGeneratorProps {
  userId?: string;
  isPreview?: boolean;
}

export function CertificateGenerator({ userId, isPreview }: CertificateGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);
  const [completionStatus, setCompletionStatus] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkCompletionStatus();
  }, [userId]);

  const checkCompletionStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const targetUserId = userId ?? authUser.id;

      // Check completion status
      const { data: status } = await supabase
        .from('completion_status')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      setCompletionStatus(status);

      // Check for existing certificate
      const { data: cert } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (cert) {
        setCertificate(cert);
        setStudentName(cert.student_name);
      }

      // Get user profile for name
      if (!cert && status?.is_complete) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', targetUserId)
          .single();

        if (profile?.full_name) {
          setStudentName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const generateCertificate = async () => {
    if (!studentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name for the certificate.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { studentName },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      setCertificate(data);
      toast({
        title: "Certificate Generated!",
        description: "Your certificate has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate certificate.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!completionStatus?.is_complete) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Award className="h-6 w-6" />
            Course Certificate
          </CardTitle>
          <CardDescription className="text-gray-400">
            Complete all 7 days to earn your certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300">
              You need to complete all 7 days of the journey to receive your certificate.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 h-2 rounded-full"
                  style={{ width: `${(completionStatus?.total_progress || 0)}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">
                {Math.round(completionStatus?.total_progress || 0)}% Complete
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (certificate) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <CheckCircle className="h-6 w-6" />
            Your Certificate
          </CardTitle>
          <CardDescription className="text-gray-400">
            Congratulations on completing the journey!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-400">Certificate ID</p>
            <p className="font-mono text-yellow-600">{certificate.certificate_id}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-400">Issued To</p>
            <p className="text-white font-semibold">{certificate.student_name}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-400">Completion Date</p>
            <p className="text-white">
              {new Date(certificate.completion_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => window.open(certificate.pdf_url, '_blank')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => window.open(`/verify?id=${certificate.certificate_id}`, '_blank')}
              variant="outline"
              className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <Award className="h-6 w-6" />
          Generate Your Certificate
        </CardTitle>
        <CardDescription className="text-gray-400">
          Congratulations on completing the 7-Day Aura Mastery Journey!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-300">
            Your Full Name (as it will appear on the certificate)
          </Label>
          <Input
            id="name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your full name"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <Button
          onClick={generateCertificate}
          disabled={loading || !studentName.trim()}
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <Award className="h-4 w-4 mr-2" />
              Generate Certificate
            </>
          )}
        </Button>

        <p className="text-sm text-gray-400 text-center">
          Your certificate will include a unique ID for verification and can be downloaded as a PDF.
        </p>
      </CardContent>
    </Card>
  );
}