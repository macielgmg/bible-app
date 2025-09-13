"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, XCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // Adicionado: Importação de FormDescription
} from "@/components/ui/form";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext'; // Importar useSession
import { logAdminActivity } from '@/utils/logging'; // Importar função de logging

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
  // Removido: is_free
  cover_image_url: z.string().url("URL da imagem de capa inválida.").optional().or(z.literal('')),
  is_visible: z.boolean().default(false),
});

type StudyFormValues = z.infer<typeof formSchema>;

interface StudyFormProps {
  study?: {
    id: string;
    title: string;
    description: string;
    // Removido: is_free
    cover_image_url: string | null;
    is_visible: boolean;
  };
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const StudyForm = ({ study, onSaveSuccess, onCancel }: StudyFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession(); // Obter a sessão para o ID do admin

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: study?.title || '',
      description: study?.description || '',
      // Removido: is_free: study?.is_free ?? true,
      cover_image_url: study?.cover_image_url || '',
      is_visible: study?.is_visible ?? false,
    },
  });

  // Preenche o formulário com os dados do estudo se estiver em modo de edição
  useEffect(() => {
    if (study) {
      form.reset({
        title: study.title,
        description: study.description,
        // Removido: is_free: study.is_free,
        cover_image_url: study.cover_image_url || '',
        is_visible: study.is_visible,
      });
    }
  }, [study, form]);

  const onSubmit = async (values: StudyFormValues) => {
    if (!session?.user?.id) {
      showError("Usuário administrador não identificado.");
      return;
    }
    setIsLoading(true);
    try {
      if (study) {
        // Atualiza um estudo existente
        const { error } = await supabase
          .from('studies')
          .update({
            title: values.title,
            description: values.description,
            // Removido: is_free: values.is_free,
            cover_image_url: values.cover_image_url || null, // Garante que string vazia vira null
            is_visible: values.is_visible,
          })
          .eq('id', study.id);

        if (error) throw error;
        showSuccess('Estudo atualizado com sucesso!');
        logAdminActivity(session.user.id, 'study_updated', `Estudo "${values.title}" (ID: ${study.id}) foi atualizado.`);
      } else {
        // Insere um novo estudo
        const { error } = await supabase
          .from('studies')
          .insert({
            title: values.title,
            description: values.description,
            // Removido: is_free: values.is_free,
            is_visible: values.is_visible,
          });

        if (error) throw error;
        showSuccess('Novo estudo criado com sucesso!');
        logAdminActivity(session.user.id, 'study_created', `Novo estudo "${values.title}" foi criado.`);
      }
      onSaveSuccess(); // Chama a função de sucesso para fechar o modal e recarregar a lista
    } catch (error: any) {
      console.error('Erro ao salvar estudo:', error);
      showError('Erro ao salvar estudo: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <h2 className="text-2xl font-bold text-primary text-center mb-6">
          {study ? 'Editar Estudo' : 'Criar Novo Estudo'}
        </h2>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título do estudo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição detalhada do estudo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem de Capa</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Removido: is_free switch */}
        <FormField
          control={form.control}
          name="is_visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visível no Aplicativo</FormLabel>
                <FormDescription>
                  Marque para que este estudo apareça na biblioteca e na loja do aplicativo.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-2" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Estudo
          </Button>
        </div>
      </form>
    </Form>
  );
};