"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, PlusCircle, Edit, Eye, EyeOff, Loader2, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudyForm } from '@/components/admin/StudyForm';
import { ChapterForm } from '@/components/admin/ChapterForm';
import { JsonChapterForm } from '@/components/admin/JsonChapterForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useSession } from '@/contexts/SessionContext'; // Importar useSession
import { logAdminActivity } from '@/utils/logging'; // Importar função de logging

interface Study {
  id: string;
  title: string;
  description: string;
  is_free: boolean;
  cover_image_url: string | null;
  is_visible: boolean;
}

interface Chapter {
  id: string;
  study_id: string;
  chapter_number: number;
  title: string;
  bible_text: string;
  explanation: string;
  application: string;
  audio_url: string | null;
}

const fetchStudies = async (): Promise<Study[]> => {
  const { data, error } = await supabase
    .from('studies')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const fetchChaptersForStudy = async (studyId: string): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('study_id', studyId)
    .order('chapter_number', { ascending: true });
  if (error) throw error;
  return data;
};

const AdminStudiesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession(); // Obter a sessão para o ID do admin

  const [showStudyForm, setShowStudyForm] = useState(false);
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [selectedStudyForChapter, setSelectedStudyForChapter] = useState<Study | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  const [showJsonChapterForm, setShowJsonChapterForm] = useState(false);

  const [showChaptersList, setShowChaptersList] = useState(false);
  const [chaptersOfSelectedStudy, setChaptersOfSelectedStudy] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false); // NOVO: Estado de carregamento para capítulos

  const [showConfirmDeleteStudy, setShowConfirmDeleteStudy] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null);
  const [confirmStudyTitle, setConfirmStudyTitle] = useState('');

  const [showConfirmDeleteChapter, setShowConfirmDeleteChapter] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);

  const { data: studies, isLoading, error } = useQuery<Study[], Error>({
    queryKey: ['adminStudies'],
    queryFn: fetchStudies,
  });

  const handleCreateNewStudy = () => {
    setEditingStudy(null);
    setShowStudyForm(true);
  };

  const handleEditStudy = (study: Study) => {
    setEditingStudy(study);
    setShowStudyForm(true);
  };

  const handleAddChapter = (study: Study) => {
    setSelectedStudyForChapter(study);
    setEditingChapter(null);
    setShowChapterForm(true);
  };

  const handleAddChapterViaJson = (study: Study) => {
    setSelectedStudyForChapter(study);
    setShowJsonChapterForm(true);
  };

  const handleManageChapters = async (study: Study) => {
    setSelectedStudyForChapter(study);
    setChaptersOfSelectedStudy([]); // Limpa a lista anterior
    setLoadingChapters(true); // Inicia o carregamento
    setShowChaptersList(true); // Abre o modal imediatamente com o loader
    try {
      const chapters = await fetchChaptersForStudy(study.id);
      setChaptersOfSelectedStudy(chapters);
    } catch (err: any) {
      showError('Erro ao carregar capítulos: ' + err.message);
      console.error(err);
    } finally {
      setLoadingChapters(false); // Finaliza o carregamento
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowChapterForm(true);
  };

  const handleToggleVisibility = async (studyId: string, currentVisibility: boolean, studyTitle: string) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('studies')
        .update({ is_visible: !currentVisibility })
        .eq('id', studyId);

      if (error) throw error;
      showSuccess(`Visibilidade do estudo atualizada para ${!currentVisibility ? 'visível' : 'oculto'}.`);
      logAdminActivity(session.user.id, 'study_visibility_toggled', `Visibilidade do estudo "${studyTitle}" alterada para ${!currentVisibility ? 'visível' : 'oculto'}.`);
      queryClient.invalidateQueries({ queryKey: ['adminStudies'] });
    } catch (err: any) {
      showError('Erro ao atualizar visibilidade: ' + err.message);
      console.error(err);
    }
  };

  const handleDeleteStudy = async () => {
    if (!studyToDelete || confirmStudyTitle !== studyToDelete.title || !session?.user?.id) {
      showError('O nome do estudo não corresponde. Por favor, digite o nome corretamente.');
      return;
    }
    try {
      const { error } = await supabase
        .from('studies')
        .delete()
        .eq('id', studyToDelete.id);

      if (error) throw error;
      showSuccess('Estudo e seus capítulos foram removidos com sucesso!');
      logAdminActivity(session.user.id, 'study_deleted', `Estudo "${studyToDelete.title}" (ID: ${studyToDelete.id}) e seus capítulos foram removidos.`);
      queryClient.invalidateQueries({ queryKey: ['adminStudies'] });
      setStudyToDelete(null);
      setConfirmStudyTitle('');
      setShowConfirmDeleteStudy(false);
    } catch (err: any) {
      showError('Erro ao remover estudo: ' + err.message);
      console.error(err);
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete || !session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterToDelete.id);

      if (error) throw error;
      showSuccess('Capítulo removido com sucesso!');
      logAdminActivity(session.user.id, 'chapter_deleted', `Capítulo "${chapterToDelete.title}" (ID: ${chapterToDelete.id}) do estudo "${selectedStudyForChapter?.title}" foi removido.`);
      queryClient.invalidateQueries({ queryKey: ['adminStudies'] });
      if (selectedStudyForChapter) {
        handleManageChapters(selectedStudyForChapter);
      }
      setChapterToDelete(null);
      setShowConfirmDeleteChapter(false);
    } catch (err: any) {
      showError('Erro ao remover capítulo: ' + err.message);
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-8">
        <p>Erro ao carregar estudos: {error.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['adminStudies'] })} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl pb-8">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Gerenciar Estudos
        </h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            <CardDescription>Crie novos estudos ou gerencie os existentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={handleCreateNewStudy}>
              <PlusCircle className="h-4 w-4 mr-2" /> Criar Novo Estudo
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-primary mt-8 mb-4">Estudos Existentes</h2>
        {studies && studies.length > 0 ? (
          <div className="grid gap-4">
            {studies.map((study) => (
              <Card key={study.id} className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4">
                {study.cover_image_url && (
                  <img src={study.cover_image_url} alt={study.title} className="w-full md:w-24 h-24 object-cover rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">{study.description}</CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor={`visibility-switch-${study.id}`}>Visível:</Label>
                    <Switch
                      id={`visibility-switch-${study.id}`}
                      checked={study.is_visible}
                      onCheckedChange={() => handleToggleVisibility(study.id, study.is_visible, study.title)}
                    />
                    {study.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" onClick={() => handleEditStudy(study)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-2">Editar</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleManageChapters(study)}>
                    <FileText className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-2">Capítulos</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setStudyToDelete(study); setShowConfirmDeleteStudy(true); }}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-2">Excluir</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary">Nenhum estudo cadastrado</h2>
            <p className="text-muted-foreground mt-2">Comece criando seu primeiro estudo acima.</p>
          </div>
        )}
      </div>

      {/* Dialog para o formulário de estudo */}
      <Dialog open={showStudyForm} onOpenChange={setShowStudyForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudy ? 'Editar Estudo' : 'Criar Novo Estudo'}</DialogTitle>
          </DialogHeader>
          <StudyForm
            study={editingStudy || undefined}
            onSaveSuccess={() => {
              setShowStudyForm(false);
              queryClient.invalidateQueries({ queryKey: ['adminStudies'] });
            }}
            onCancel={() => setShowStudyForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para a lista de capítulos */}
      <Dialog open={showChaptersList} onOpenChange={setShowChaptersList}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capítulos de "{selectedStudyForChapter?.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="flex gap-2 mb-4">
              <Button className="flex-1" onClick={() => handleAddChapter(selectedStudyForChapter!)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Novo Capítulo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleAddChapterViaJson(selectedStudyForChapter!)}>
                <FileText className="h-4 w-4 mr-2" /> Adicionar via JSON
              </Button>
            </div>
            {loadingChapters ? ( // Exibe o loader se estiver carregando
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chaptersOfSelectedStudy.length > 0 ? (
              <div className="space-y-2">
                {chaptersOfSelectedStudy.map((chapter) => (
                  <Card key={chapter.id} className="flex items-center justify-between p-3">
                    <span className="font-medium">{chapter.chapter_number}. {chapter.title}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditChapter(chapter)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Capítulo</span>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setChapterToDelete(chapter); setShowConfirmDeleteChapter(true); }}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir Capítulo</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Nenhum capítulo encontrado para este estudo.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para o formulário de capítulo */}
      <Dialog open={showChapterForm} onOpenChange={setShowChapterForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChapter ? 'Editar Capítulo' : `Adicionar Capítulo ao Estudo "${selectedStudyForChapter?.title}"`}</DialogTitle>
          </DialogHeader>
          {selectedStudyForChapter && (
            <ChapterForm
              studyId={selectedStudyForChapter.id}
              chapter={editingChapter || undefined}
              onSaveSuccess={() => {
                setShowChapterForm(false);
                if (selectedStudyForChapter) {
                  handleManageChapters(selectedStudyForChapter);
                }
              }}
              onCancel={() => setShowChapterForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para o formulário de capítulo via JSON */}
      <Dialog open={showJsonChapterForm} onOpenChange={setShowJsonChapterForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Capítulo via JSON ao Estudo "{selectedStudyForChapter?.title}"</DialogTitle>
          </DialogHeader>
          {selectedStudyForChapter && (
            <JsonChapterForm
              studyId={selectedStudyForChapter.id}
              onSaveSuccess={() => {
                setShowJsonChapterForm(false);
                if (selectedStudyForChapter) {
                  handleManageChapters(selectedStudyForChapter);
                }
              }}
              onCancel={() => setShowJsonChapterForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar a exclusão de estudo */}
      <AlertDialog open={showConfirmDeleteStudy} onOpenChange={(open) => {
        setShowConfirmDeleteStudy(open);
        if (!open) setConfirmStudyTitle('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Trash2 className="h-16 w-16 text-destructive mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Excluir Estudo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o estudo "<span className="font-bold text-primary">{studyToDelete?.title}</span>"?
              Todos os capítulos e o progresso dos usuários relacionados a este estudo serão permanentemente removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            <div className="mt-4 w-full">
              <Label htmlFor="confirm-study-title" className="sr-only">Digite o nome do estudo para confirmar</Label>
              <Input
                id="confirm-study-title"
                placeholder={`Digite "${studyToDelete?.title}" para confirmar`}
                value={confirmStudyTitle}
                onChange={(e) => setConfirmStudyTitle(e.target.value)}
                className="w-full text-center"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto"
                onClick={handleDeleteStudy}
                disabled={confirmStudyTitle !== studyToDelete?.title}
              >
                Excluir Estudo
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para confirmar a exclusão de capítulo */}
      <AlertDialog open={showConfirmDeleteChapter} onOpenChange={setShowConfirmDeleteChapter}>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Trash2 className="h-16 w-16 text-destructive mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Excluir Capítulo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o capítulo "{chapterToDelete?.title}"?
              O progresso dos usuários relacionado a este capítulo será permanentemente removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto"
                onClick={handleDeleteChapter}
              >
                Excluir Capítulo
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStudiesPage;