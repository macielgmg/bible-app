"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspirationalQuotePreviewCardProps {
  text: string | null;
  auxiliar_text: string | null;
  explanation: string | null;
  url_audio: string | null;
  // Removido: isPro
  className?: string;
}

export const InspirationalQuotePreviewCard = ({ text, auxiliar_text, explanation, url_audio, className }: InspirationalQuotePreviewCardProps) => {
  if (!text && !auxiliar_text) return null;

  return (
    <Card className={cn("p-6 space-y-4 w-full", className)}>
      <CardHeader className="p-0 pb-2">
        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold text-primary">Sua Citação de Hoje</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {text && (
          <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
            "{text}"
          </p>
        )}
        {auxiliar_text && (
          <div className="mt-6 pt-4 border-t border-muted-foreground/20 text-left">
            <h3 className="text-xl font-bold text-primary/90 mb-2">Para Refletir</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {auxiliar_text}
            </p>
          </div>
        )}
        {explanation && (
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