"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Sparkles, Lightbulb, Heart, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer'; // Reutilizar o AudioPlayer

// Tipagem para o conteúdo real (texto) a ser exibido
interface DailyContentTemplate {
  id: string;
  content_type: string;
  title: string | null;
  text_content: string;
  reference: string | null;
  auxiliar_text: string | null;
  tags: string[] | null;
  explanation: string | null;
  url_audio: string | null;
}

const SharedContentPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<DailyContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!templateId) {
        setError("ID do conteúdo não fornecido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('daily_content_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setContent(data);
        } else {
          setError("Conteúdo não encontrado.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar conteúdo compartilhado:", err);
        setError("Não foi possível carregar o conteúdo. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [templateId]);

  const getContentTypeIcon = (type: string | null) => {
    switch (type) {
      case 'verse_of_the_day': return <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />;
      case 'daily_study': return <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />;
      case 'quick_reflection': return <Lightbulb className="h-16 w-16 text-primary mx-auto mb-4" />;
      case 'inspirational_quotes': return <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />;
      case 'my_prayer': return <Heart className="h-16 w-16 text-primary mx-auto mb-4" />;
      default: return <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />;
    }
  };

  const getContentTypeTitle = (type: string | null) => {
    switch (type) {
      case 'verse_of_the_day': return 'Versículo do Dia';
      case 'daily_study': return 'Estudo Diário';
      case 'quick_reflection': return 'Reflexão Rápida';
      case 'inspirational_quotes': return 'Citação Inspiradora';
      case 'my_prayer': return 'Oração do Dia';
      default: return 'Conteúdo Compartilhado';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao Carregar Conteúdo</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" /> Voltar para o Início
        </Button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">Conteúdo Não Encontrado</h1>
        <p className="text-muted-foreground mb-6">O link pode estar inválido ou o conteúdo foi removido.</p>
        <Button onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" /> Voltar para o Início
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl flex flex-col min-h-screen p-4">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <h1 className="text-xl font-bold text-primary">{getContentTypeTitle(content.content_type)}</h1>
      </header>

      <Card className="p-6 space-y-4 flex-grow">
        <CardHeader className="p-0 pb-2 text-center">
          {getContentTypeIcon(content.content_type)}
          {content.title && <CardTitle className="text-3xl font-bold text-primary">{content.title}</CardTitle>}
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
            "{content.text_content}"
          </p>
          {content.reference && (
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              — {content.reference}
            </p>
          )}
          {content.auxiliar_text && (
            <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
              <h3 className="text-xl font-bold text-primary/90 mb-2">Para Refletir</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {content.auxiliar_text}
              </p>
            </div>
          )}
          {content.explanation && (
            <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
              <h3 className="text-xl font-bold text-primary/90 mb-2">Explicação</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {content.explanation}
              </p>
            </div>
          )}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium">
                  {tag.toUpperCase()}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {content.url_audio && (
        <div className="mt-4">
          <AudioPlayer src={content.url_audio} />
        </div>
      )}

      <footer className="py-4 flex-shrink-0">
        <Button onClick={() => navigate('/')} className="w-full">
          <Home className="h-4 w-4 mr-2" /> Abrir no Aplicativo
        </Button>
      </footer>
    </div>
  );
};

export default SharedContentPage;