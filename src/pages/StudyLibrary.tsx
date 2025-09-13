import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, BookOpen } from 'lucide-react'; // Removido Crown para o modal
import { Input } from "@/components/ui/input";
import { showError } from '@/utils/toast';
// Removido: AlertDialog imports

interface StudyFromDB {
  id: string;
  title: string;
  description: string;
  // Removido: is_free
  cover_image_url: string;
  is_visible: boolean; // Adicionado para garantir que o tipo está correto
}

interface ChapterFromDB {
  id: string;
  study_id: string;
  chapter_number: number;
  title: string;
}

interface StudyWithProgress extends StudyFromDB {
  imageUrl: string; // Mapeia cover_image_url para imageUrl para compatibilidade
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
  isAcquired: boolean;
}

const StudyLibrary = () => {
  const { session, loading: sessionLoading } = useSession(); 
  const navigate = useNavigate();
  const [studiesWithProgress, setStudiesWithProgress] = useState<StudyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Removido: [showProAccessModal, setShowProAccessModal] = useState(false);
  // Removido: [modalStudyTitle, setModalStudyTitle] = useState('');

  useEffect(() => {
    const fetchStudiesAndProgress = async () => {
      if (sessionLoading) return;

      setLoading(true);
      const userId = session?.user?.id;

      if (!userId) {
        setStudiesWithProgress([]);
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch all studies from the database, filtering by is_visible = true
        const { data: studiesData, error: studiesError } = await supabase
          .from('studies')
          .select('*')
          .eq('is_visible', true); // APENAS ESTUDOS VISÍVEIS

        if (studiesError) throw studiesError;

        // 2. Fetch all chapters for all studies
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, study_id, chapter_number, title');

        if (chaptersError) throw chaptersError;

        const chaptersByStudy: { [studyId: string]: ChapterFromDB[] } = {};
        chaptersData.forEach(chapter => {
          if (!chaptersByStudy[chapter.study_id]) {
            chaptersByStudy[chapter.study_id] = [];
          }
          chaptersByStudy[chapter.study_id].push(chapter);
        });

        // 3. Fetch all user progress to determine acquired studies and completed chapters
        let completedChapterIds = new Set<string>();
        let acquiredStudyIds = new Set<string>();

        const { data: allUserProgress, error: progressError } = await supabase
          .from('user_progress')
          .select('chapter_id, completed_at, study_id')
          .eq('user_id', userId);

        if (progressError) {
          console.error('Error fetching all user progress:', progressError);
        } else if (allUserProgress) {
          allUserProgress.forEach(p => {
            if (p.study_id) acquiredStudyIds.add(p.study_id);
            if (p.completed_at !== null) {
              completedChapterIds.add(p.chapter_id);
            }
          });
        }

        // Filter to only include acquired studies and calculate their progress
        const acquiredStudiesWithProgress: StudyWithProgress[] = studiesData
          .filter(study => acquiredStudyIds.has(study.id)) // Only show acquired studies
          .map(study => {
            const studyChapters = chaptersByStudy[study.id] || [];
            const totalChapters = studyChapters.length;
            
            const completedChapters = studyChapters.filter(chapter => completedChapterIds.has(chapter.id)).length;
            const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
            
            return {
              ...study,
              imageUrl: study.cover_image_url,
              completedChapters,
              totalChapters,
              progressPercentage,
              isAcquired: true, // Always true for this page
            };
          });

        setStudiesWithProgress(acquiredStudiesWithProgress);

      } catch (error: any) {
        console.error('Error fetching studies for library:', error);
        showError('Erro ao carregar seus estudos: ' + error.message);
        setStudiesWithProgress([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudiesAndProgress();
  }, [session, sessionLoading]);

  // Removido: handleProStudyAccessAttempt

  const filteredStudies = studiesWithProgress.filter(study => {
    const query = searchQuery.toLowerCase();
    return (
      study.title.toLowerCase().includes(query) ||
      study.description.toLowerCase().includes(query)
    );
  });

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">Meus Estudos</h1>
      <p className="text-muted-foreground mb-6">Continue de onde parou ou comece uma nova jornada.</p>
      
      {studiesWithProgress.length > 0 && ( // Mostra a barra de pesquisa apenas se houver estudos adquiridos
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar em meus estudos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filteredStudies.length > 0 ? ( // Verifica filteredStudies para exibir os cards
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudies.map((study) => (
            <Card key={study.id} className="flex flex-col overflow-hidden">
              <img
                src={study.imageUrl}
                alt={`Capa do estudo ${study.title}`}
                className="w-full h-32 object-cover"
              />
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold leading-tight">{study.title}</CardTitle>
                  {/* Removido: Badge Pro */}
                </div>
                <CardDescription className="text-sm mt-1">{study.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 p-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Progresso:</span>
                  <span>{study.completedChapters} de {study.totalChapters}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${study.progressPercentage}%` }}></div>
                </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to={`/study/${study.id}`}>
                    {study.completedChapters === 0
                      ? "Começar Estudo"
                      : study.completedChapters === study.totalChapters
                        ? "Revisar Estudo"
                        : "Continuar Estudo"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary">Nenhum estudo iniciado</h2>
            <p className="text-muted-foreground mt-2">Vá para a aba "Descobrir" para começar uma nova jornada de fé.</p>
            <Button asChild className="mt-4">
                <Link to="/store">Descobrir Estudos</Link>
            </Button>
        </div>
      )}

      {/* Removido: Modal de Aviso de Acesso Pro */}
    </div>
  );
};

export default StudyLibrary;