"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, XCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext'; // Importar useSession
import { logAdminActivity } from '@/utils/logging'; // Importar função de logging

// Schema para um único objeto de capítulo esperado na entrada JSON
const chapterSchema = z.object({
  chapter_number: z.coerce.number().min(1, "O número do capítulo é obrigatório e deve ser maior que 0."),
  title: z.string().min(1, "O título do capítulo é obrigatório."),
  bible_text: z.string().min(1, "O texto bíblico é obrigatório."),
  explanation: z.string().min(1, "A explicação é obrigatória."),
  application: z.string().min(1, "A aplicação prática é obrigatória."),
  audio_url: z.string().url("URL do áudio inválida.").optional().or(z.literal('')),
});

// Schema para o formulário em si, que recebe uma string JSON
const jsonFormSchema = z.object({
  jsonInput: z.string().min(1, "O JSON do capítulo é obrigatório."),
});

type JsonFormValues = z.infer<typeof jsonFormSchema>;

interface JsonChapterFormProps {
  studyId: string;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const JsonChapterForm = ({ studyId, onSaveSuccess, onCancel }: JsonChapterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession(); // Obter a sessão para o ID do admin

  const form = useForm<JsonFormValues>({
    resolver: zodResolver(jsonFormSchema),
    defaultValues: {
      jsonInput: '',
    },
  });

  const onSubmit = async (values: JsonFormValues) => {
    if (!session?.user?.id) {
      showError("Usuário administrador não identificado.");
      return;
    }
    setIsLoading(true);
    try {
      let chapterData: z.infer<typeof chapterSchema>;
      try {
        const parsed = JSON.parse(values.jsonInput);
        chapterData = chapterSchema.parse(parsed); // Valida o JSON parseado contra chapterSchema
      } catch (parseError: any) {
        showError('Erro de formato JSON ou validação: ' + parseError.message);
        console.error('JSON parse or validation error:', parseError);
        setIsLoading(false);
        return;
      }

      // Insere o novo capítulo
      const { error } = await supabase
        .from('chapters')
        .insert({
          study_id: studyId,
          chapter_number: chapterData.chapter_number,
          title: chapterData.title,
          bible_text: chapterData.bible_text,
          explanation: chapterData.explanation,
          application: chapterData.application,
          audio_url: chapterData.audio_url || null,
        });

      if (error) throw error;
      showSuccess('Novo capítulo criado via JSON com sucesso!');
      logAdminActivity(session.user.id, 'chapter_created_json', `Novo capítulo "${chapterData.title}" (número: ${chapterData.chapter_number}) foi criado via JSON para o estudo ${studyId}.`);
      onSaveSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar capítulo via JSON:', error);
      showError('Erro ao salvar capítulo via JSON: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Cole um objeto JSON contendo os dados do capítulo. Exemplo:
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto mb-4">
          {`{
  "chapter_number": 1,
  "title": "O Caminho do Justo",
  "bible_text": "Bem-aventurado o homem...",
  "explanation": "O Salmo 1 serve como...",
  "application": "Avalie seus hábitos...",
  "audio_url": "https://exemplo.com/audio.mp3"
}`}
        </pre>

        <FormField
          control={form.control}
          name="jsonInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo do Capítulo (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cole o JSON do capítulo aqui..."
                  className="min-h-[250px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Certifique-se de que o JSON está formatado corretamente e inclui todos os campos obrigatórios.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-2" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Capítulo (JSON)
          </Button>
        </div>
      </form>
    </Form>
  );
};