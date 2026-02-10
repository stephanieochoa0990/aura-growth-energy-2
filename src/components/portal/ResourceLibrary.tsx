import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Play, BookOpen, FileText, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

interface ResourceLibraryProps {
  userId: string;
}

export default function ResourceLibrary({ userId }: ResourceLibraryProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { isAdmin } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllMaterials();
  }, []);

  useEffect(() => {
    filterMaterials(activeFilter);
  }, [activeFilter, materials]);

  async function fetchAllMaterials() {
    const { data } = await supabase
      .from('class_materials')
      .select('*')
      .order('day_number', { ascending: true });

    if (data) {
      setMaterials(data);
      setFilteredMaterials(data);
    }
    setLoading(false);
  }

  function filterMaterials(filter: string) {
    if (filter === 'all') {
      setFilteredMaterials(materials);
    } else {
      setFilteredMaterials(materials.filter(m => m.content_type === filter));
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'meditation': return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'practice': return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      default: return <Download className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'video': return 'bg-blue-600';
      case 'meditation': return 'bg-purple-600';
      case 'practice': return 'bg-green-600';
      default: return 'bg-[#D4AF37]';
    }
  };

  if (loading) return <div className="text-[#D4AF37] text-base px-4">Loading resources...</div>;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">Resource Library</h2>
        <p className="text-gray-400 text-sm sm:text-base">Access all course materials and downloads</p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="bg-gray-900 border border-[#D4AF37]/20 inline-flex sm:grid sm:grid-cols-5 min-w-max sm:min-w-0 sm:w-full">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black px-3 py-2 text-sm whitespace-nowrap">
              All Resources
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black px-3 py-2 text-sm whitespace-nowrap">
              Videos
            </TabsTrigger>
            <TabsTrigger value="meditation" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black px-3 py-2 text-sm whitespace-nowrap">
              Meditations
            </TabsTrigger>
            <TabsTrigger value="practice" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black px-3 py-2 text-sm whitespace-nowrap">
              Practices
            </TabsTrigger>
            <TabsTrigger value="resource" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black px-3 py-2 text-sm whitespace-nowrap">
              Downloads
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="bg-gray-900 border-[#D4AF37]/20">
            <CardHeader className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-base sm:text-lg text-[#D4AF37] flex items-center gap-2">
                    {getIcon(material.content_type)}
                    {editingId === material.id ? (
                      <Input
                        value={editValues.title ?? material.title}
                        onChange={(e) =>
                          setEditValues((prev: any) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      material.title
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    {editingId === material.id ? (
                      <Textarea
                        value={editValues.description ?? material.description ?? ''}
                        onChange={(e) =>
                          setEditValues((prev: any) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                    ) : (
                      material.description
                    )}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={`${getTypeColor(material.content_type)} text-white text-xs`}>
                    Day {material.day_number}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (editingId === material.id) {
                            setEditingId(null);
                            setEditValues({});
                          } else {
                            setEditingId(material.id);
                            setEditValues({
                              title: material.title,
                              description: material.description,
                              content_url: material.content_url,
                            });
                          }
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {editingId === material.id && (
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          disabled={savingId === material.id}
                          onClick={async () => {
                            try {
                              setSavingId(material.id);
                              const { error } = await supabase
                                .from('class_materials')
                                .update({
                                  title: editValues.title ?? material.title,
                                  description: editValues.description ?? material.description,
                                  content_url: editValues.content_url ?? material.content_url,
                                })
                                .eq('id', material.id);

                              if (error) throw error;

                              await fetchAllMaterials();
                              setEditingId(null);
                              setEditValues({});
                              toast({
                                title: 'Resource updated',
                                description: 'Changes have been saved.',
                              });
                            } catch (err) {
                              console.error('Error updating material:', err);
                              toast({
                                title: 'Save failed',
                                description: 'Could not save resource. Please try again.',
                                variant: 'destructive',
                              });
                            } finally {
                              setSavingId(null);
                            }
                          }}
                        >
                          {savingId === material.id ? 'Saving…' : 'Save'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-400">
                  {material.duration_minutes > 0 && (
                    <span>{material.duration_minutes} minutes</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black min-h-[44px] w-full sm:w-auto text-base"
                  onClick={() => window.open(material.content_url, '_blank')}
                >
                  {material.is_downloadable ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  ) : (
                    <>
                      {getIcon(material.content_type)}
                      <span className="ml-2">Access</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
