"use client";

import React from 'react';
import { DailyContentTemplate } from '@/pages/AdminDailyContentPage';
import { VerseOfTheDayPreviewCard } from './VerseOfTheDayPreviewCard';
import { DailyStudyPreviewCard } from './DailyStudyPreviewCard';
import { QuickReflectionPreviewCard } from './QuickReflectionPreviewCard';
import { InspirationalQuotePreviewCard } from './InspirationalQuotePreviewCard';
import { MyPrayerPreviewCard } from './MyPrayerPreviewCard';
import { VerseOfTheDayTaskPreview } from './VerseOfTheDayTaskPreview';
import { DailyStudyTaskPreview } from './DailyStudyTaskPreview';
import { QuickReflectionTaskPreview } from './QuickReflectionTaskPreview';
import { InspirationalQuoteTaskPreview } from './InspirationalQuoteTaskPreview';
import { MyPrayerTaskPreview } from './MyPrayerTaskPreview';
import { Card } from '@/components/ui/card';
import { Mail } from 'lucide-react';

interface DailyContentPreviewProps {
  templateData: Partial<DailyContentTemplate>;
  // Removido: isPro
  viewMode: 'card' | 'page'; // Novo prop para controlar a visualização
  className?: string; // Adicionado a prop className
}

export const DailyContentPreview = ({ templateData, viewMode, className }: DailyContentPreviewProps) => { // Removido isPro
  if (!templateData || !templateData.content_type) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <Mail className="h-16 w-16 mb-4" />
        <p className="text-lg font-semibold">Selecione um tipo de conteúdo</p>
        <p className="text-sm">Preencha o formulário para ver o preview.</p>
      </Card>
    );
  }

  // Renderiza o preview do CARD (como aparece na tela 'Hoje')
  if (viewMode === 'card') {
    switch (templateData.content_type) {
      case 'verse_of_the_day':
        return <VerseOfTheDayTaskPreview templateData={templateData} className={className} />;
      case 'daily_study':
        return <DailyStudyTaskPreview templateData={templateData} className={className} />;
      case 'quick_reflection':
        return <QuickReflectionTaskPreview templateData={templateData} className={className} />;
      case 'inspirational_quotes':
        return <InspirationalQuoteTaskPreview templateData={templateData} className={className} />;
      case 'my_prayer':
        return <MyPrayerTaskPreview templateData={templateData} className={className} />;
      default:
        return (
          <Card className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <Mail className="h-16 w-16 mb-4" />
            <p className="text-lg font-semibold">Tipo de card desconhecido</p>
          </Card>
        );
    }
  }

  // Renderiza o preview da PÁGINA (como aparece ao clicar no card)
  if (viewMode === 'page') {
    switch (templateData.content_type) {
      case 'verse_of_the_day':
        return (
          <VerseOfTheDayPreviewCard
            text={templateData.text_content || ''}
            reference={templateData.reference || 'Versículo'}
            explanation={templateData.explanation || null}
            url_audio={templateData.url_audio || null}
            // Removido isPro
            className={className}
          />
        );
      case 'daily_study':
        return (
          <DailyStudyPreviewCard
            title={templateData.title || null}
            text={templateData.text_content || ''}
            auxiliar_text={templateData.auxiliar_text || null}
            tags={templateData.tags || null}
            url_audio={templateData.url_audio || null}
            // Removido isPro
            explanation={templateData.explanation || null} // AGORA: Passando a explicação
            className={className}
          />
        );
      case 'quick_reflection':
        return (
          <QuickReflectionPreviewCard
            text={templateData.text_content || null}
            auxiliar_text={templateData.auxiliar_text || null}
            url_audio={templateData.url_audio || null}
            // Removido isPro
            className={className}
          />
        );
      case 'inspirational_quotes':
        return (
          <InspirationalQuotePreviewCard
            text={templateData.text_content || null}
            auxiliar_text={templateData.auxiliar_text || null}
            explanation={templateData.explanation || null}
            url_audio={templateData.url_audio || null}
            // Removido isPro
            className={className}
          />
        );
      case 'my_prayer':
        return (
          <MyPrayerPreviewCard
            text={templateData.text_content || null}
            auxiliar_text={templateData.auxiliar_text || null}
            url_audio={templateData.url_audio || null}
            // Removido isPro
            className={className}
          />
        );
      default:
        return (
          <Card className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <Mail className="h-16 w-16 mb-4" />
            <p className="text-lg font-semibold">Tipo de página desconhecido</p>
          </Card>
        );
    }
  }

  return null; // Fallback
};