"use client";

import { Lightbulb, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyContentTemplate } from '@/pages/AdminDailyContentPage'; // Importar a interface

interface QuickReflectionTaskPreviewProps {
  templateData: Partial<DailyContentTemplate>;
  className?: string;
}

export const QuickReflectionTaskPreview = ({ templateData, className }: QuickReflectionTaskPreviewProps) => {
  const contentSnippet = templateData.text_content || templateData.auxiliar_text || "Reflita sobre uma breve mensagem para o dia.";

  return (
    <div
      className={cn(
        "w-full p-4 rounded-2xl text-left relative",
        "bg-gradient-to-br from-green-100 to-green-200 text-gray-800 shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">REFLEXÃO RÁPIDA</span>
          <span className="text-xs text-black/60 font-semibold">• 2MIN</span>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <p className="text-xl font-semibold max-w-[70%] line-clamp-2">
            {contentSnippet}
          </p>
          <div className="bg-white/50 rounded-lg p-3">
            <ArrowUpRight className="h-6 w-6 text-black/80" />
          </div>
        </div>
      </div>
    </div>
  );
};