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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react'; // Removido Crown
import { Input } from '@/components/ui/input';
import { showError, showStudyAcquiredToast } from '@/utils/toast';
import { cn } from '@/lib/utils';
// Removido: AlertDialog imports
import { logUserActivity } from '@/utils/logging'; // Importar função de logging

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

interface StudyWithAcquisitionStatus extends StudyFromDB {
  imageUrl: string; // Mapeia cover_image_url para imageUrl para compatibilidade
  isAcquired: boolean;
}

const Store = () => {
  const { session, loading: sessionLoading, setNewStudyNotification } = useSession(); 
  const navigate = useNavigate();
  const [availableStudies, setAvailableStudies] = useState<StudyWithAcquisitionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [acquiringStudyId, setAcquiringStudyId] = useState<string | null>(null);
  const [acquiringProgress, setAcquiringProgress] = useState(0); // Novo estado para o progresso
  // Removido: [showProAccessModal, setShowProAccessModal] = useState(false);
  // Removido: [modalStudyTitle, setModalStudyTitle] = useState('');

  useEffect(() => {
    const fetchStudiesAndAcquisitionStatus = async () => {
      if (sessionLoading) return;

      setLoading(true);
      const userId = session?.user?.id;

      try {
        // 1. Fetch all studies from the database, filtering by is_visible = true
        const { data: studiesData, error: studiesError } = await supabase
          .from('studies')
          .select('*')
          .eq('is_visible', true); // APENAS ESTUDOS VISÍVEIS

        if (studiesError) throw studiesError;

        // 2. Fetch all user progress to determine acquired studies (if user is logged in)
        let acquiredStudyIds = new Set<string>();

        if (userId) {
          const { data: allUserProgress, error: progressError } = await supabase
            .from('user_progress')
            .select('study_id')
            .eq('user_id', userId);

          if (progressError) {
            console.error('Error fetching user progress for acquisition status:', progressError);
          } else if (allUserProgress) {
            allUserProgress.forEach(p => {
              if (p.study_id) acquiredStudyIds.add(p.study_id);
            });
          }
        }

        // Filter out already acquired studies for the 'Discover' page
        const unacquiredStudies: StudyWithAcquisitionStatus[] = studiesData
          .filter(study => !acquiredStudyIds.has(study.id))
          .map(study => ({
            ...study,
            imageUrl: study.cover_image_url,
            isAcquired: false, // Explicitly false as they are unacquired
          }));

        setAvailableStudies(unacquiredStudies);

      } catch (error: any) {
        console.error('Error fetching studies for discover page:', error);
        showError('Erro ao carregar estudos para descobrir: ' + error.message);
        setAvailableStudies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudiesAndAcquisitionStatus();
  }, [session, sessionLoading]);

  // Removido: handleProStudyAccessAttempt

  const handleAcquireStudy = async (studyId: string, studyTitle: string) => { 
    if (!session?.user) {
      showError("Você precisa estar logado para adquirir um estudo.");
      return;
    }

    setAcquiringStudyId(studyId);
    setAcquiringProgress(0); // Inicia o progresso em 0

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 10; // Incrementa o progresso
      if (currentProgress >= 90) { // Limita a 90% até a conclusão real
        clearInterval(progressInterval);
        setAcquiringProgress(90);
      } else {
        setAcquiringProgress(currentProgress);
      }
    }, 100); // Atualiza a cada 100ms

    try {
      // Fetch the first chapter of the study to mark as acquired
      const { data: chapters, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('study_id', studyId)
        .order('chapter_number', { ascending: true })
        .limit(1);

      if (chapterError) throw chapterError;
      
      const firstChapter = chapters && chapters.length > 0 ? chapters[0] : null;

      if (!firstChapter) {
        showError("Capítulos não encontrados para este estudo.");
        return;
      }

      // Insert progress for the first chapter to "acquire" the study
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: session.user.id,
          study_id: studyId,
          chapter_id: firstChapter.id,
          notes: '',
          completed_at: null, // Not complete, just acquired
        });

      if (insertError) {
        if (insertError.code === '23505') { // Duplicate key error (already acquired)
          showError("Você já adquiriu este estudo.");
        } else {
          showError("Erro ao adquirir o estudo: " + insertError.message);
        }
        return;
      }

      clearInterval(progressInterval); // Para o progresso simulado
      setAcquiringProgress(100); // Define para 100%
      showStudyAcquiredToast({ title: studyTitle, studyId: studyId });
      setNewStudyNotification(true);
      
      // Log user activity for study acquisition
      logUserActivity(session.user.id, 'study_acquired', `Adquiriu o estudo "${studyTitle}".`);

      // Remove the acquired study from the list
      setAvailableStudies(prevItems => prevItems.filter(item => item.id !== studyId));

      // Pequeno atraso para mostrar 100% antes de resetar
      setTimeout(() => {
        setAcquiringStudyId(null);
        setAcquiringProgress(0);
      }, 300); 

    } catch (error: any) {
      clearInterval(progressInterval); // Para o progresso simulado
      setAcquiringProgress(0); // Reseta em caso de erro
      setAcquiringStudyId(null); // Reseta o estado de aquisição
      console.error("Erro inesperado ao adquirir estudo:", error);
      showError("Ocorreu um erro inesperado: " + error.message);
    } finally {
      // O finally não é estritamente necessário aqui, pois o setTimeout já lida com o reset
      // Mas é bom ter certeza que o estado é limpo em todas as saídas.
      // No entanto, o setTimeout já está agendado para limpar após a animação.
    }
  };

  const filteredItems = availableStudies
    .filter(item => {
      // Removido: if (filterType === 'free') return item.is_free;
      // Removido: if (filterType === 'pro') return !item.is_free;
      return true; // Todos os estudos são tratados como "gratuitos" para aquisição
    })
    .filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
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
      <h1 className="text-3xl font-bold mb-2 text-primary">Descobrir Novos Estudos</h1>
      <p className="text-muted-foreground mb-6">Encontre novos módulos para aprofundar suas raízes na fé.</p>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar estudos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Removido: ToggleGroup para filtros de tipo (Todos, Gratuitos, Pro) */}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden">
              <img
                src={item.imageUrl}
                alt={`Capa do estudo ${item.title}`}
                className="w-full h-32 object-cover"
              />
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold leading-tight">{item.title}</CardTitle>
                  {/* Removido: Badge Pro/Gratuito */}
                </div>
                <CardDescription className="text-sm mt-1">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {/* No progress bar for unacquired studies */}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => handleAcquireStudy(item.id, item.title)} 
                  className={cn(
                    "w-full bg-primary hover:bg-primary/90 relative overflow-hidden",
                    acquiringStudyId === item.id && "text-transparent" // Esconde o texto original durante o progresso
                  )}
                  disabled={acquiringStudyId === item.id}
                >
                  {acquiringStudyId === item.id && (
                    <>
                      <div
                        className="absolute inset-0 bg-primary/50 transition-all duration-100 ease-linear"
                        style={{ width: `${acquiringProgress}%` }}
                      />
                      <span className="relative z-10 flex items-center justify-center text-primary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Adquirindo...
                      </span>
                    </>
                  )}
                  {acquiringStudyId !== item.id && "Adquirir Estudo"} {/* Texto genérico */}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-primary">Nenhum novo estudo encontrado</h2>
          <p className="text-muted-foreground mt-2">Você já adquiriu todos os estudos disponíveis ou não há novos estudos que correspondam à sua busca.</p>
        </div>
      )}

      {/* Removido: Modal de Aviso de Acesso Pro */}
    </div>
  );
};

export default Store;