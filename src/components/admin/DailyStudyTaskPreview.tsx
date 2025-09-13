"use client";

import { BookOpen, ArrowUpRight, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DailyContentTemplate } from '@/pages/AdminDailyContentPage'; // Importar a interface

interface DailyStudyTaskPreviewProps {
  templateData: Partial<DailyContentTemplate>;
  className?: string;
}

export const DailyStudyTaskPreview = ({ templateData, className }: DailyStudyTaskPreviewProps) => {
  const contentSnippet = templateData.title || "Aprofunde-se na Palavra com o estudo de hoje.";
  const tags = templateData.tags || [];

  const truncateTag = (tag: string, maxLength: number) => {
    if (tag.length > maxLength) {
      return tag.substring(0, maxLength - 3) + '...';
    }
    return tag;
  };

  return (
    <div
      className={cn(
        "w-full p-4 rounded-2xl text-left relative",
        "bg-gradient-to-br from-blue-100 to-blue-200 text-gray-800 shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-black/70" />
          <span className="font-bold text-sm">ESTUDO DIÁRIO</span>
          <span className="text-xs text-black/60 font-semibold">• 10MIN</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-nowrap overflow-hidden max-h-[24px]">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-white/50 text-gray-700 border-none px-2 py-0.5 text-xs font-medium flex-shrink-0 whitespace-nowrap"
            >
              <Tag className="h-3 w-3 mr-1" /> {truncateTag(tag.toUpperCase(), 12)}
            </Badge>
          ))}
        </div>
      )}

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