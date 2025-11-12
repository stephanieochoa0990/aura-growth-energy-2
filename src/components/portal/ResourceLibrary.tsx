import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Play, BookOpen, FileText } from 'lucide-react';

interface ResourceLibraryProps {
  userId: string;
}

export default function ResourceLibrary({ userId }: ResourceLibraryProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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
                    {material.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    {material.description}
                  </CardDescription>
                </div>
                <Badge className={`${getTypeColor(material.content_type)} text-white text-xs shrink-0`}>
                  Day {material.day_number}
                </Badge>
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
