"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { MultiSelect } from '@/components/ui/MultiSelect'; // Importar MultiSelect
import { allContentTags, ContentTagOption } from '@/utils/contentTags'; // Importar as tags

// Define the content types for the select dropdown
const CONTENT_TYPES = [
  { value: 'verse_of_the_day', label: 'Versículo do Dia' },
  { value: 'daily_study', label: 'Estudo Diário' },
  { value: 'quick_reflection', label: 'Reflexão Rápida' },
  { value: 'inspirational_quotes', label: 'Citação Inspiradora' },
  { value: 'my_prayer', label: 'Oração do Dia' },
];

const formSchema = z.object({
  content_type: z.string().min(1, "O tipo de conteúdo é obrigatório."),
  title: z.string().optional(), // Optional for some types
  text_content: z.string().min(1, "O conteúdo principal é obrigatório."),
  reference: z.string().optional(), // For verses
  auxiliar_text: z.string().optional(), // For reflections, prayers, studies
  tags: z.array(z.string()).optional(), // Alterado para array de strings
  explanation: z.string().optional(), // For quotes, verses
  url_audio: z.string().url("URL do áudio inválida.").optional().or(z.literal('')),
});

type DailyContentTemplateFormValues = z.infer<typeof formSchema>;

interface DailyContentTemplateFormProps {
  template?: {
    id: string;
    content_type: string;
    title: string | null;
    text_content: string;
    reference: string | null;
    auxiliar_text: string | null;
    tags: string[] | null;
    explanation: string | null;
    url_audio: string | null;
  };
  initialContentType?: string; // To pre-fill when creating new
  onSaveSuccess: () => void;
  onCancel: () => void;
  onFormChange?: (values: Partial<DailyContentTemplateFormValues>) => void; // Novo prop
}

export const DailyContentTemplateForm = ({ template, initialContentType, onSaveSuccess, onCancel, onFormChange }: DailyContentTemplateFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DailyContentTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content_type: template?.content_type || initialContentType || '',
      title: template?.title || '',
      text_content: template?.text_content || '',
      reference: template?.reference || '',
      auxiliar_text: template?.auxiliar_text || '',
      tags: template?.tags || [], // Alterado para array
      explanation: template?.explanation || '',
      url_audio: template?.url_audio || '',
    },
  });

  // Watch all form fields and call onFormChange
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (onFormChange) {
        onFormChange(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  useEffect(() => {
    if (template) {
      form.reset({
        content_type: template.content_type,
        title: template.title || '',
        text_content: template.text_content,
        reference: template.reference || '',
        auxiliar_text: template.auxiliar_text || '',
        tags: template.tags || [], // Alterado para array
        explanation: template.explanation || '',
        url_audio: template.url_audio || '',
      });
    } else if (initialContentType) {
      form.setValue('content_type', initialContentType);
    }
  }, [template, initialContentType, form]);

  const onSubmit = async (values: DailyContentTemplateFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        content_type: values.content_type,
        title: values.title || null,
        text_content: values.text_content,
        reference: values.reference || null,
        auxiliar_text: values.auxiliar_text || null,
        tags: values.tags && values.tags.length > 0 ? values.tags : null, // Salva como null se vazio
        explanation: values.explanation || null,
        url_audio: values.url_audio || null,
      };

      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('daily_content_templates')
          .update(payload)
          .eq('id', template.id);

        if (error) throw error;
        showSuccess('Template de conteúdo diário atualizado com sucesso!');
      } else {
        // Insert new template
        const { error } = await supabase
          .from('daily_content_templates')
          .insert(payload);

        if (error) throw error;
        showSuccess('Novo template de conteúdo diário criado com sucesso!');
      }
      onSaveSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar template de conteúdo diário:', error);
      showError('Erro ao salvar template: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <h2 className="text-2xl font-bold text-primary text-center mb-6">
          {template ? 'Editar Template' : 'Criar Novo Template'}
        </h2>

        <FormField
          control={form.control}
          name="content_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conteúdo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!template}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conteúdo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                O tipo de conteúdo não pode ser alterado após a criação.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Título do conteúdo (ex: Salmo 23)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text_content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo Principal</FormLabel>
              <FormControl>
                <Textarea placeholder="Digite o texto principal aqui..." className="min-h-[150px]" {...field} />
              </FormControl>
              <FormDescription>
                O texto central do versículo, estudo, reflexão, citação ou oração.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referência (Opcional, para Versículos)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João 3:16" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="auxiliar_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto Auxiliar / Para Refletir (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Texto adicional, pergunta para reflexão, etc." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormDescription>
                Pode ser uma pergunta para reflexão, um autor da citação, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explicação (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Explicação detalhada do conteúdo..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormDescription>
                Uma explicação mais aprofundada do conteúdo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Opcional)</FormLabel>
              <FormControl>
                <MultiSelect
                  options={allContentTags}
                  selected={field.value || []}
                  onSelectedChange={field.onChange}
                  placeholder="Selecione as tags relevantes"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Tags ajudam a personalizar o conteúdo para os usuários.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url_audio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Áudio (Opcional, Recurso Pro)</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/audio.mp3" {...field} />
              </FormControl>
              <FormDescription>
                Link para um arquivo de áudio do conteúdo (exclusivo para usuários Pro).
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
            Salvar Template
          </Button>
        </div>
      </form>
    </Form>
  );
};