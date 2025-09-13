"use client";

import { Heart, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyContentTemplate } from '@/pages/AdminDailyContentPage'; // Importar a interface

interface MyPrayerTaskPreviewProps {
  templateData: Partial<DailyContentTemplate>;
  className?: string;
}

export const MyPrayerTaskPreview = ({ templateData, className }: MyPrayerTaskPreviewProps) => {
  const contentSnippet = templateData.text_content || templateData.auxiliar_text || "Conecte-se com Deus através da oração.";

  return (
    <div
      className={cn(
        "w-full p-4 rounded-2xl text-left relative",
        "bg-gradient-to-br from-purple-100 to-pink-200 text-gray-800 shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">ORAÇÃO DO DIA</span>
          <span className="text-xs text-black/60 font-semibold">• 3MIN</span>
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