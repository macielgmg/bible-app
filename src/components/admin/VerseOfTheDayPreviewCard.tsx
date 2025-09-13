"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote, Headphones } from "lucide-react"; // Alterado para Quote
import { cn } from "@/lib/utils";

interface VerseOfTheDayPreviewCardProps {
  text: string;
  reference: string;
  explanation: string | null;
  url_audio: string | null;
  // Removido: isPro
  className?: string;
}

export const VerseOfTheDayPreviewCard = ({ text, reference, explanation, url_audio, className }: VerseOfTheDayPreviewCardProps) => {
  if (!text) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-primary/90 to-primary text-primary-foreground flex flex-col", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Quote className="h-5 w-5" /> {/* Ícone corrigido */}
          Versículo do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center text-center py-2 px-4">
        <p className="text-lg font-serif italic line-clamp-2 leading-tight">
          "{text}" <span className="font-semibold text-sm not-italic">{reference}</span>
        </p>
        {explanation && (
          <p className="text-xs text-primary-foreground/80 mt-2 line-clamp-2">
            {explanation}
          </p>
        )}
        {url_audio && (
          <div className="flex items-center gap-1 text-xs text-primary-foreground/70 mt-2">
            <Headphones className="h-3 w-3" /> Áudio disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
};