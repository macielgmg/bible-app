"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Headphones, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DailyStudyPreviewCardProps {
  title: string | null;
  text: string;
  auxiliar_text: string | null; // Mantido por compatibilidade, mas não será renderizado
  tags: string[] | null;
  url_audio: string | null;
  // Removido: isPro
  explanation: string | null; // NOVO: Adicionado a prop explanation
  className?: string;
}

export const DailyStudyPreviewCard = ({ title, text, auxiliar_text, tags, url_audio, explanation, className }: DailyStudyPreviewCardProps) => { // Removido isPro
  if (!text) return null;

  return (
    <Card className={cn("p-6 space-y-4 w-full", className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-3xl font-bold text-primary">{title || 'Estudo Diário'}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 items-center">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium flex-shrink-0 whitespace-nowrap"
              >
                <Tag className="h-3 w-3 mr-1" /> {tag.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
          "{text}"
        </p>
        {explanation && ( // AGORA: Renderiza a explicação
          <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
            <h3 className="text-xl font-bold text-primary/90 mb-2">Explicação</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
        )}
      </CardContent>
      {url_audio && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Headphones className="h-4 w-4" /> Áudio disponível
        </div>
      )}
    </Card>
  );
};