import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Search, Loader2, Award, ArrowLeft } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [certificateId, setCertificateId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, []);

  const verifyCertificate = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);

    try {
      const { data, error: dbError } = await supabase
        .from('certificates')
        .select('certificate_id, student_name, completion_date, issued_at')
        .eq('certificate_id', certificateId.trim())
        .single();

      if (dbError || !data) {
        setError('Certificate not found. Please check the ID and try again.');
      } else {
        setCertificate(data);
      }
    } catch (err) {
      setError('An error occurred while verifying the certificate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-500 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
              Certificate Verification
            </h1>
            <p className="text-gray-400">
              Verify the authenticity of an Aura Mastery Journey completion certificate
            </p>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Award className="h-6 w-6" />
                Enter Certificate ID
              </CardTitle>
              <CardDescription className="text-gray-400">
                The certificate ID can be found at the bottom of the certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="e.g., AURA-ABC123-XYZ"
                  className="bg-gray-800 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && verifyCertificate()}
                />
                <Button
                  onClick={verifyCertificate}
                  disabled={loading || !certificateId.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold">Verification Failed</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {certificate && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold text-lg">
                        Certificate Verified
                      </p>
                      <p className="text-green-300 text-sm mt-1">
                        This is a valid certificate issued by Aura Mastery Journey
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-green-800 pt-4 space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Certificate ID</p>
                      <p className="text-white font-mono">{certificate.certificate_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm">Issued To</p>
                      <p className="text-white text-lg font-semibold">
                        {certificate.student_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Completion Date</p>
                      <p className="text-white">
                        {new Date(certificate.completion_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Issued On</p>
                      <p className="text-white">
                        {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-300">
                      This certificate confirms that <span className="font-semibold text-yellow-600">
                      {certificate.student_name}</span> has successfully completed all 7 days of 
                      the Aura Mastery Journey program.
                    </p>
                  </div>
                </div>
              )}

              {!certificate && !error && !loading && (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <Award className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    Enter a certificate ID above to verify its authenticity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Certificates are issued upon successful completion of all 7 days of the journey.
            </p>
            <p className="mt-2">
              For questions about certificates, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}