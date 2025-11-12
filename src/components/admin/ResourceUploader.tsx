import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Upload,
  File,
  Video,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ResourceUploaderProps {
  dayNumber: number;
  onUploadComplete: () => void;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

const ResourceUploader: React.FC<ResourceUploaderProps> = ({ dayNumber, onUploadComplete }) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileUpload[] = Array.from(fileList).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const getFileType = (file: File): string => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('pdf') || file.type.includes('document')) return 'document';
    return 'resource';
  };

  const getFileIcon = (file: File) => {
    const type = getFileType(file);
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const uploadFile = async (fileUpload: FileUpload) => {
    setFiles(prev => prev.map(f => 
      f.id === fileUpload.id ? { ...f, status: 'uploading', progress: 10 } : f
    ));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('file', fileUpload.file);
      formData.append('dayNumber', dayNumber.toString());
      formData.append('fileType', getFileType(fileUpload.file));
      formData.append('userId', user.id);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id && f.progress < 90 
            ? { ...f, progress: f.progress + 10 } 
            : f
        ));
      }, 200);

      const { data, error } = await supabase.functions.invoke('upload-course-material', {
        body: formData,
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'success', progress: 100, url: data.url } 
          : f
      ));

      toast({
        title: "Upload Complete",
        description: `${fileUpload.file.name} uploaded successfully.`
      });

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'error', error: error.message } 
          : f
      ));
      
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${fileUpload.file.name}`,
        variant: "destructive"
      });
    }
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
    onUploadComplete();
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resources for Day {dayNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">
            Support for videos, PDFs, documents, and other resources
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>Select Files</span>
            </Button>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Files ({files.length})</h4>
              <Button 
                onClick={uploadAll}
                disabled={files.every(f => f.status !== 'pending')}
              >
                Upload All
              </Button>
            </div>
            
            {files.map(fileUpload => (
              <div key={fileUpload.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(fileUpload.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileUpload.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileUpload.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {fileUpload.status === 'pending' && (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {fileUpload.status === 'uploading' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {fileUpload.status === 'success' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {fileUpload.status === 'error' && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileUpload.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {fileUpload.status === 'uploading' && (
                  <Progress value={fileUpload.progress} className="mt-2 h-1" />
                )}

                {fileUpload.error && (
                  <p className="text-xs text-red-500 mt-2">{fileUpload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceUploader;