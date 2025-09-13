import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, Share2, CheckCircle, X, ArrowRight } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyTasksProgress } from '@/hooks/use-daily-tasks-progress';
import { getNextIncompleteTaskPath, isLastTaskInSequenceAndAllCompleted, isFirstTaskInSequence, getPreviousTaskPath, getCompletionStatusKey } from '@/utils/dailyTasksSequence'; // Importar getCompletionStatusKey
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';
import { getLocalDateString } from '@/lib/utils'; // Importar a nova função
import { checkAndAwardAchievements } from '@/utils/achievements'; // Importar a função de verificação de conquistas
import { showAchievementToast } from '@/utils/toast'; // Importar o toast de conquista

const InspirationalQuotePage = () => {
  const navigate = useNavigate();
  const { session, refetchProfile } = useSession(); 
  const queryClient = useQueryClient();
  const [quoteContent, setQuoteContent] = useState<{ text: string | null; auxiliar_text: string | null; explanation: string | null; url_audio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const { 
    completedDailyTasksCount, 
    totalDailyTasks, 
    dailyProgressPercentage, 
    isLoadingAnyDailyTask,
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  } = useDailyTasksProgress();

  const currentTaskName = 'inspirational_quotes';
  const completionStatus = {
    isJournalCompleted,
    isDailyStudyTaskCompleted,
    isQuickReflectionTaskCompleted,
    isInspirationalQuoteTaskCompleted,
    isMyPrayerTaskCompleted,
    isVerseOfTheDayTaskCompleted, // Adicionado aqui
  };

  // isFirstTask e previousTaskPath podem ser calculados fora do handleCompleteTask
  const isFirstTask = isFirstTaskInSequence(currentTaskName);
  const previousTaskPath = getPreviousTaskPath(currentTaskName);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const todayStr = getLocalDateString(new Date()); // Usar getLocalDateString
      const userId = session.user.id;

      const { data: dailyContentData, error: dailyContentError } = await supabase
        .from('daily_content_for_users')
        .select('inspirational_quotes')
        .eq('user_id', userId)
        .eq('content_date', todayStr)
        .single();

      if (dailyContentError && dailyContentError.code !== 'PGRST116') {
        console.error("Erro ao buscar ID da citação inspiradora para o usuário:", dailyContentError);
        showError("Erro ao carregar a citação inspiradora.");
        setQuoteContent(null);
        setLoading(false);
        return;
      }

      const quoteTemplateId = dailyContentData?.inspirational_quotes;

      if (quoteTemplateId) {
        const { data: templateData, error: templateError } = await supabase
          .from('daily_content_templates')
          .select('text_content, auxiliar_text, explanation, url_audio')
          .eq('id', quoteTemplateId)
          .single();

        if (templateError) {
          console.error("Erro ao buscar conteúdo do template da citação:", templateError);
          showError("Erro ao carregar o conteúdo da citação.");
          setQuoteContent(null);
        } else if (templateData) {
          setQuoteContent({ 
            text: templateData.text_content, 
            auxiliar_text: templateData.auxiliar_text || null, 
            explanation: templateData.explanation || null,
            url_audio: templateData.url_audio || null 
          });
        } else {
          setQuoteContent(null);
        }
      } else {
        setQuoteContent(null);
      }
      setLoading(false);
    };
    fetchQuote();
  }, [session, navigate]);

  const handleShare = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para compartilhar.");
      return;
    }
    if (!quoteContent?.text && !quoteContent?.auxiliar_text) {
      showError("Nenhum conteúdo para compartilhar.");
      return;
    }

    // Navega para a nova página de criação de imagem de compartilhamento
    navigate('/share-creator', {
      state: {
        shareContent: {
          text: quoteContent.text || quoteContent.auxiliar_text || '', // Prioriza text, depois auxiliar_text
          reference: quoteContent.auxiliar_text, // Usa auxiliar_text como referência para citações
          explanation: quoteContent.explanation,
        }
      }
    });
  };

  const handleCompleteTask = async () => {
    if (!session?.user) {
      showError("Você precisa estar logado para finalizar.");
      return;
    }
    setIsCompleting(true);
    const today = getLocalDateString(new Date()); // Usar getLocalDateString
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('daily_tasks_progress')
        .upsert({
          user_id: userId,
          task_name: currentTaskName,
          task_date: today,
          value: 1,
        }, { onConflict: 'user_id,task_name,task_date' });

      if (error) {
        throw error;
      }
      
      // Simula o status de conclusão da tarefa atual para a lógica de navegação
      const simulatedCompletionStatus = {
        ...completionStatus,
        [getCompletionStatusKey(currentTaskName)]: true,
      };

      const isLastTaskAfterCompletion = isLastTaskInSequenceAndAllCompleted(currentTaskName, simulatedCompletionStatus);
      const nextTaskPathAfterCompletion = getNextIncompleteTaskPath(currentTaskName, simulatedCompletionStatus);

      // Invalida todas as queries de progresso diário para garantir a atualização
      queryClient.invalidateQueries({ queryKey: ['journalStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['verseOfTheDayTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyStudyTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['quickReflectionTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['inspirationalQuoteTaskStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerTaskStatus', userId] });
      
      if (nextTaskPathAfterCompletion) {
        navigate(nextTaskPathAfterCompletion);
      } else if (isLastTaskAfterCompletion) {
        navigate('/today');
      } else {
        navigate('/today'); // Fallback
      }
    } catch (error: any) {
      showError("Erro ao finalizar a citação: " + error.message);
      console.error("Erro ao finalizar citação:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // O cálculo de isLastTask para o botão deve usar o estado atual, não o simulado
  const isLastTaskForButton = isLastTaskInSequenceAndAllCompleted(currentTaskName, completionStatus);

  if (loading || isLoadingAnyDailyTask) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="relative flex items-center justify-center py-4 mb-4 flex-shrink-0 container mx-auto max-w-2xl px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Citação Inspiradora</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0"
          onClick={() => navigate('/today')}
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Indicador de Progresso Diário */}
      <div className="w-full space-y-2 mb-4 flex-shrink-0 container mx-auto max-w-2xl px-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-primary/80">Progresso Diário</h3>
          <span className="text-sm text-muted-foreground">
            {completedDailyTasksCount} de {totalDailyTasks} tarefas ({dailyProgressPercentage.toFixed(0)}%)
          </span>
        </div>
        <Progress value={dailyProgressPercentage} className="h-2.5" />
      </div>

      <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4 overflow-y-auto pb-4 container mx-auto max-w-2xl px-4">
        {quoteContent?.text ? (
          <Card className="p-6 space-y-4 w-full flex-shrink-0">
            <CardHeader className="p-0 pb-2">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Sua Citação de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
                "{quoteContent.text}"
              </p>
              {quoteContent.auxiliar_text && ( // Seção "Para Refletir"
                <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
                  <h3 className="text-xl font-bold text-primary/90 mb-2">Para Refletir</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {quoteContent.auxiliar_text}
                  </p>
                </div>
              )}
              {quoteContent.explanation && ( // Nova Seção "Explicação"
                <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
                  <h3 className="text-xl font-bold text-primary/90 mb-2">Explicação</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {quoteContent.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground flex-grow flex flex-col justify-center items-center">
            <p className="text-lg">Nenhuma citação disponível para hoje.</p>
            <p className="text-sm">Tente novamente mais tarde ou verifique sua conexão.</p>
          </div>
        )}

        {quoteContent?.url_audio && (
          <AudioPlayer src={quoteContent.url_audio} className="mb-4 flex-shrink-0" />
        )}
      </div>

      <div className="flex justify-between items-center py-4 gap-2 flex-shrink-0 container mx-auto max-w-2xl px-4">
        {/* Share Button */}
        <Button 
          variant="outline" 
          onClick={handleShare} 
          size="icon" 
          className="h-10 w-10 flex-shrink-0"
          disabled={!quoteContent?.text && !quoteContent?.auxiliar_text}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Back Button (conditional) */}
        {!isFirstTask && previousTaskPath && (
          <Button 
            variant="outline" 
            onClick={() => navigate(previousTaskPath)} 
            className="flex-1"
            disabled={isCompleting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        )}

        {/* Continue/Finalize Button */}
        <Button 
          onClick={handleCompleteTask} 
          className={cn("flex-1", isFirstTask ? "w-full" : "")}
          disabled={isCompleting || (!quoteContent?.text && !quoteContent?.auxiliar_text)}
        >
          {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            isLastTaskForButton ? ( // Usar isLastTaskForButton aqui
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Jornada
              </>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )
          )}
        </Button>
      </div>
    </div>
  );
};

export default InspirationalQuotePage;