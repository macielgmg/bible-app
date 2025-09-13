"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, PlusCircle, BookOpen, Heart, Sparkles, Lightbulb, Edit, Trash2, Loader2, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/toast';
import { DailyContentTemplateForm } from '@/components/admin/DailyContentTemplateForm';
import { cn } from '@/lib/utils';
import { DailyContentPreview } from '@/components/admin/DailyContentPreview'; // Importar o novo componente de preview
import { useSession } from '@/contexts/SessionContext'; // Importar useSession para isPro
import { logAdminActivity } from '@/utils/logging'; // Importar função de logging

// Define the content types for display and filtering
const CONTENT_TYPE_MAP: { [key: string]: { label: string; icon: React.ElementType; } } = {
  verse_of_the_day: { label: 'Versículo do Dia', icon: BookOpen },
  daily_study: { label: 'Estudo Diário', icon: BookOpen },
  quick_reflection: { label: 'Reflexão Rápida', icon: Lightbulb },
  inspirational_quotes: { label: 'Citação Inspiradora', icon: Sparkles },
  my_prayer: { label: 'Oração do Dia', icon: Heart },
};

export interface DailyContentTemplate { // Exportar a interface para ser usada no preview
  id: string;
  content_type: string;
  title: string | null;
  text_content: string;
  reference: string | null;
  auxiliar_text: string | null;
  tags: string[] | null; // Alterado para array de strings
  explanation: string | null;
  url_audio: string | null;
}

const fetchDailyContentTemplates = async (): Promise<DailyContentTemplate[]> => {
  const { data, error } = await supabase
    .from('daily_content_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const AdminDailyContentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession(); // Obter isPro do contexto da sessão

  const [selectedContentType, setSelectedContentType] = useState<string | null>(null); // Estado para o tipo de conteúdo selecionado
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DailyContentTemplate | null>(null);
  const [initialContentTypeForForm, setInitialContentTypeForForm] = useState<string | undefined>(undefined);
  const [previewData, setPreviewData] = useState<Partial<DailyContentTemplate>>({}); // Estado para os dados do preview

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DailyContentTemplate | null>(null);

  const { data: templates, isLoading, error } = useQuery<DailyContentTemplate[], Error>({
    queryKey: ['dailyContentTemplates'],
    queryFn: fetchDailyContentTemplates,
  });

  // Define o primeiro tipo de conteúdo como selecionado por padrão ao carregar
  useEffect(() => {
    if (!selectedContentType && Object.keys(CONTENT_TYPE_MAP).length > 0) {
      setSelectedContentType(Object.keys(CONTENT_TYPE_MAP)[0]);
    }
  }, [selectedContentType]);

  const handleCreateNewTemplate = (contentType: string) => {
    setEditingTemplate(null);
    setInitialContentTypeForForm(contentType);
    setPreviewData({ content_type: contentType }); // Inicializa o preview com o tipo
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: DailyContentTemplate) => {
    setEditingTemplate(template);
    setInitialContentTypeForForm(undefined); // Clear initial type when editing
    setPreviewData(template); // Inicializa o preview com os dados do template
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete || !session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('daily_content_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;
      showSuccess('Template removido com sucesso!');
      logAdminActivity(session.user.id, 'daily_content_template_deleted', `Template de conteúdo diário "${templateToDelete.title || templateToDelete.text_content.substring(0, 50) + '...'}" (ID: ${templateToDelete.id}, Tipo: ${templateToDelete.content_type}) foi removido.`);
      queryClient.invalidateQueries({ queryKey: ['dailyContentTemplates'] });
      setTemplateToDelete(null);
      setShowConfirmDelete(false);
    } catch (err: any) {
      showError('Erro ao remover template: ' + err.message);
      console.error(err);
    }
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    const type = template.content_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, DailyContentTemplate[]>) || {};

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
        <p>Erro ao carregar templates de conteúdo diário: {error.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dailyContentTemplates'] })} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const selectedTemplates = selectedContentType ? groupedTemplates[selectedContentType] || [] : [];
  const SelectedIcon = selectedContentType ? CONTENT_TYPE_MAP[selectedContentType].icon : Mail;
  const selectedLabel = selectedContentType ? CONTENT_TYPE_MAP[selectedContentType].label : 'Conteúdo Diário';

  return (
    <div className="container mx-auto max-w-4xl pb-8">
      {/* Unified Header for all screen sizes */}
      <header className="flex items-center py-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Mail className="h-6 w-6" /> Gerenciar Conteúdo Diário
        </h1>
      </header>

      <div className="flex flex-col md:flex-row gap-6 md:justify-center">
        {/* Sidebar de Navegação */}
        <Card className="w-full md:w-1/4 flex-shrink-0 p-4 md:p-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" /> Tipos de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            {Object.entries(CONTENT_TYPE_MAP).map(([type, { label, icon: Icon }]) => (
              <Button
                key={type}
                variant={selectedContentType === type ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start flex items-center gap-2",
                  selectedContentType === type ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-secondary/50"
                )}
                onClick={() => setSelectedContentType(type)}
              >
                <Icon className="h-5 w-5" /> {label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Área de Conteúdo Principal */}
        <div className="flex-1 md:max-w-2xl">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <SelectedIcon className="h-5 w-5" /> {selectedLabel}
              </CardTitle>
              {selectedContentType && (
                <Button size="sm" onClick={() => handleCreateNewTemplate(selectedContentType)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
              {selectedContentType ? (
                selectedTemplates.length > 0 ? (
                  selectedTemplates.map((template) => (
                    <div key={template.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-secondary/30">
                      <div className="flex-1 mr-4 mb-2 sm:mb-0">
                        <p className="font-medium text-primary">{template.title || template.reference || template.text_content.substring(0, 50) + '...'}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.text_content.substring(0, 100)}...
                        </p>
                        {template.url_audio && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Headphones className="h-3 w-3" /> Áudio disponível
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => { setTemplateToDelete(template); setShowConfirmDelete(true); }}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum template de {selectedLabel.toLowerCase()} encontrado.</p>
                )
              ) : (
                <p className="text-muted-foreground text-sm">Selecione um tipo de conteúdo na barra lateral para gerenciar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para o formulário de template com preview */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto p-0"> {/* Ajustado para 90vw e p-0 */}
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{editingTemplate ? 'Editar Template de Conteúdo Diário' : 'Criar Novo Template de Conteúdo Diário'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row h-full"> {/* Layout flexível para formulário e preview */}
            <div className="w-full md:w-1/2 border-r md:pr-4 overflow-y-auto"> {/* Formulário */}
              <DailyContentTemplateForm
                template={editingTemplate || undefined}
                initialContentType={initialContentTypeForForm}
                onSaveSuccess={() => {
                  setShowTemplateForm(false);
                  queryClient.invalidateQueries({ queryKey: ['dailyContentTemplates'] });
                }}
                onCancel={() => setShowTemplateForm(false)}
                onFormChange={setPreviewData} // Passa a função para atualizar o estado do preview
              />
            </div>
            <div className="w-full md:w-1/2 p-4 overflow-y-auto flex flex-col items-center justify-center bg-secondary/40"> {/* Preview */}
              <h3 className="text-lg font-bold text-primary mb-4">Preview para o Usuário</h3>
              <div className="w-full max-w-sm h-full space-y-4"> {/* Contêiner para os dois previews */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Card na tela "Hoje"</p>
                  <DailyContentPreview templateData={previewData} viewMode="card" className="w-full" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Página de Conteúdo</p>
                  <DailyContentPreview templateData={previewData} viewMode="page" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar a exclusão */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <Trash2 className="h-16 w-16 text-destructive mb-4" />
            <AlertDialogTitle className="text-2xl font-bold text-primary">Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o template "{templateToDelete?.title || templateToDelete?.text_content.substring(0, 50) + '...'}"?
              Esta ação não pode ser desfeita.
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
                onClick={handleDeleteTemplate}
              >
                Excluir
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDailyContentPage;