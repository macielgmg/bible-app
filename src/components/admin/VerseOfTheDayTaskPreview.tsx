"use client";

import { Quote, ArrowUpRight } from 'lucide-react'; // Alterado para Quote
import { cn } from '@/lib/utils';
import { DailyContentTemplate } from '@/pages/AdminDailyContentPage'; // Importar a interface

interface VerseOfTheDayTaskPreviewProps {
  templateData: Partial<DailyContentTemplate>;
  className?: string;
}

export const VerseOfTheDayTaskPreview = ({ templateData, className }: VerseOfTheDayTaskPreviewProps) => {
  const contentSnippet = templateData.text_content || "Medite no versículo do dia e aplique-o à sua vida.";
  const referenceSnippet = templateData.reference || "Versículo do Dia";

  return (
    <div
      className={cn(
        "w-full p-4 rounded-2xl text-left relative",
        "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-lg", // Cores e texto do card real
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Quote className="h-5 w-5 text-primary-foreground/80" /> {/* Ícone do card real */}
          <span className="font-bold text-sm">VERSÍCULO DO DIA</span>
          <span className="text-xs text-primary-foreground/60 font-semibold">• 5MIN</span>
        </div>
        {/* Não mostra status de 'FEITO' no preview */}
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <p className="text-xl font-semibold max-w-[70%] line-clamp-2">
            "{contentSnippet}"
          </p>
          <div className="bg-primary-foreground/20 rounded-lg p-3 hover:bg-primary-foreground/30 transition-colors"> {/* Ajustado cor do botão */}
            <ArrowUpRight className="h-6 w-6 text-primary-foreground" /> {/* Cor do ícone do botão */}
          </div>
        </div>
      </div>
    </div>
  );
};