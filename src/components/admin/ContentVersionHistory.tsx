import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  RotateCcw, 
  User, 
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  title: string;
  description: string;
  change_note: string;
  changed_by: string;
  created_at: string;
  content: any;
}

interface ContentVersionHistoryProps {
  contentId: string;
  currentVersion: number;
  onRestore: (version: Version) => void;
}

const ContentVersionHistory: React.FC<ContentVersionHistoryProps> = ({
  contentId,
  currentVersion,
  onRestore
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVersionHistory();
  }, [contentId]);

  const fetchVersionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching version history:', error);
      toast({
        title: "Error",
        description: "Failed to load version history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: Version) => {
    onRestore(version);
    toast({
      title: "Version Restored",
      description: `Content restored to version ${version.version_number}`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {versions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No version history available</p>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={version.version_number === currentVersion ? "default" : "outline"}>
                          Version {version.version_number}
                        </Badge>
                        {version.version_number === currentVersion && (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        )}
                      </div>
                      
                      <h4 className="font-semibold">{version.title}</h4>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.changed_by || 'System'}
                        </span>
                      </div>

                      {version.change_note && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Changes: </span>
                          {version.change_note}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setExpandedVersion(
                          expandedVersion === version.id ? null : version.id
                        )}
                      >
                        {expandedVersion === version.id ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>

                      {expandedVersion === version.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                          <h5 className="font-medium mb-2">Content Preview:</h5>
                          <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                            {(() => {
                              if (Array.isArray(version.content)) {
                                const firstText = version.content
                                  .flatMap((s: any) => Array.isArray(s?.blocks) ? s.blocks : [])
                                  .find((b: any) => b?.type === 'text' && b?.content);
                                return firstText?.content || version.description || 'No content preview available';
                              }
                              return version.description || 'No content preview available';
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {version.version_number !== currentVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        className="ml-4"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContentVersionHistory;
