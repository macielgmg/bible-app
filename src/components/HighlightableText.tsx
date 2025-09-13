"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, XCircle, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Highlight {
  id: string;
  user_id: string; // Adicionado
  chapter_id: string; // Adicionado
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
}

interface TextSegment {
  content: string;
  startOffset: number;
  endOffset: number;
  isWord: boolean;
}

interface HighlightableTextProps {
  text: string;
  chapterId: string;
  isHighlightingMode: boolean;
  isErasingMode: boolean; // Novo prop
  onHighlightsChange?: () => void;
}

// Função para tokenizar o texto em palavras, espaços e pontuações, com offsets
const tokenizeText = (fullText: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let currentOffset = 0;
  // Regex para capturar:
  // 1. Sequências de letras Unicode (incluindo acentos) -> \p{L}+
  // 2. Sequências de números -> \p{N}+
  // 3. Sequências de outros caracteres não-letras, não-números, não-espaços (pontuação, símbolos) -> [^\p{L}\p{N}\s]+
  // 4. Sequências de espaços -> \s+
  // A flag 'u' é essencial para que \p{L} e \p{N} funcionem.
  const regex = /(\p{L}+|\p{N}+|[^\p{L}\p{N}\s]+|\s+)/gu; 

  let match;
  while ((match = regex.exec(fullText)) !== null) {
    const content = match[0];
    const startOffset = currentOffset;
    const endOffset = currentOffset + content.length;
    // Uma "palavra" para fins de destaque será uma sequência de letras ou números.
    // Isso permite destacar "João" ou "123" mas não "!" ou " ".
    const isWord = /^\p{L}+$/u.test(content) || /^\p{N}+$/u.test(content);

    segments.push({ content, startOffset, endOffset, isWord });
    currentOffset = endOffset;
  }
  return segments;
};

export const HighlightableText = ({ text, chapterId, isHighlightingMode, isErasingMode, onHighlightsChange }: HighlightableTextProps) => {
  const { session } = useSession();
  const textRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartOffset, setSelectionStartOffset] = useState<number | null>(null);
  const [selectionEndOffset, setSelectionEndOffset] = useState<number | null>(null);

  const [textSegments, setTextSegments] = useState<TextSegment[]>(() => tokenizeText(text));
  useEffect(() => {
    setTextSegments(tokenizeText(text));
  }, [text]);

  const { data: highlightsData = [], isLoading: isLoadingHighlights, refetch: refetchHighlights } = useQuery<Highlight[], Error>({
    queryKey: ['userHighlights', session?.user?.id, chapterId],
    queryFn: async () => {
      if (!session?.user || !chapterId) return [];

      const { data, error } = await supabase
        .from('user_highlights')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('chapter_id', chapterId)
        .order('start_offset', { ascending: true });

      if (error) {
        console.error('Error fetching highlights:', error);
        throw new Error('Erro ao carregar marcações.');
      }
      return data || [];
    },
    enabled: !!session?.user && !!chapterId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Modificado para aceitar os offsets da seleção e criar múltiplos destaques
  const handleHighlightDirectly = async (selectionMinOffset: number, selectionMaxOffset: number) => {
    if (!session?.user) return;

    const highlightsToInsert: Omit<Highlight, 'id'>[] = [];
    let highlightedWordsCount = 0;

    textSegments.forEach(segment => {
      // Verifica se o segmento é uma palavra e se sobrepõe à seleção
      if (segment.isWord && segment.startOffset < selectionMaxOffset && segment.endOffset > selectionMinOffset) {
        // Garante que o texto destacado seja apenas a palavra
        const wordText = text.substring(segment.startOffset, segment.endOffset);
        highlightsToInsert.push({
          user_id: session.user.id,
          chapter_id: chapterId,
          start_offset: segment.startOffset,
          end_offset: segment.endOffset,
          highlighted_text: wordText,
        });
        highlightedWordsCount++;
      }
    });

    if (highlightsToInsert.length === 0) {
      // showSuccess('Nenhuma palavra selecionada para marcar.'); // Removido
      return;
    }

    try {
      const { error } = await supabase
        .from('user_highlights')
        .insert(highlightsToInsert);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['userHighlights', session.user.id, chapterId] });
      // showSuccess(`${highlightedWordsCount} palavra(s) marcada(s) com sucesso!`); // Removido
      if (onHighlightsChange) onHighlightsChange();
    } catch (error: any) {
      console.error('Error saving highlights directly:', error);
      showError('Erro ao salvar marcações: ' + error.message);
    }
  };

  // Função para exclusão em lote de marcações, com lógica de fragmentação
  const handleEraseDirectly = async (selectionMinOffset: number, selectionMaxOffset: number) => {
    if (!session?.user) return;

    const highlightsToDeleteIds: string[] = [];
    const highlightsToInsert: Omit<Highlight, 'id'>[] = []; // Para partes divididas

    // Itera sobre os destaques existentes
    for (const existingHighlight of highlightsData) {
      const hStart = existingHighlight.start_offset;
      const hEnd = existingHighlight.end_offset;
      const eStart = selectionMinOffset;
      const eEnd = selectionMaxOffset;

      // Verifica se há sobreposição entre o destaque existente e a área de exclusão
      const overlaps = (hStart < eEnd && hEnd > eStart);

      if (overlaps) {
        // Marca o destaque existente para exclusão
        highlightsToDeleteIds.push(existingHighlight.id);

        // Calcula as novas partes do destaque, se houver
        // Parte à esquerda do trecho a ser apagado
        if (hStart < eStart) {
          highlightsToInsert.push({
            user_id: session.user.id,
            chapter_id: chapterId,
            start_offset: hStart,
            end_offset: Math.min(hEnd, eStart - 1), // Garante que não ultrapasse o final do destaque original
            highlighted_text: text.substring(hStart, Math.min(hEnd, eStart - 1) + 1).trim(),
          });
        }

        // Parte à direita do trecho a ser apagado
        if (hEnd > eEnd) {
          highlightsToInsert.push({
            user_id: session.user.id,
            chapter_id: chapterId,
            start_offset: Math.max(hStart, eEnd + 1), // Garante que não comece antes do início do destaque original
            end_offset: hEnd,
            highlighted_text: text.substring(Math.max(hStart, eEnd + 1), hEnd + 1).trim(),
          });
        }
      }
    }

    if (highlightsToDeleteIds.length === 0 && highlightsToInsert.length === 0) {
      // showSuccess('Nenhuma marcação encontrada na área selecionada para remover.'); // Removido
      return;
    }

    try {
      // Realiza as exclusões
      if (highlightsToDeleteIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_highlights')
          .delete()
          .in('id', highlightsToDeleteIds)
          .eq('user_id', session.user.id);

        if (deleteError) throw deleteError;
      }

      // Realiza as inserções das partes divididas
      if (highlightsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_highlights')
          .insert(highlightsToInsert);

        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ['userHighlights', session.user.id, chapterId] });
      // showSuccess(`${highlightsToDeleteIds.length} marcação(ões) removida(s) e ${highlightsToInsert.length} nova(s) parte(s) criada(s)!`); // Removido
      if (onHighlightsChange) onHighlightsChange();
    } catch (error: any) {
      console.error('Erro ao remover/atualizar marcações:', error);
      showError('Erro ao remover/atualizar marcações: ' + error.message);
    }
  };

  // Função auxiliar para obter offsets de um elemento
  const getOffsetsFromEventTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement;
    if (element && element.dataset.offsetStart && element.dataset.offsetEnd) {
      const start = parseInt(element.dataset.offsetStart, 10);
      const end = parseInt(element.dataset.offsetEnd, 10);
      const isWord = element.dataset.isWord === 'true';
      return { start, end, isWord };
    }
    return null;
  };

  // Início da interação (mousedown/touchstart no contêiner)
  const handleInteractionStart = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isHighlightingMode && !isErasingMode) return; // Só interage se um dos modos estiver ativo

    const offsets = getOffsetsFromEventTarget(event.target);
    if (!offsets || !offsets.isWord) {
      setIsSelecting(false);
      setSelectionStartOffset(null);
      setSelectionEndOffset(null);
      return;
    }

    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    // Sempre inicia uma seleção em ambos os modos
    setIsSelecting(true);
    setSelectionStartOffset(offsets.start);
    setSelectionEndOffset(offsets.end);
  }, [isHighlightingMode, isErasingMode]);

  // Movimento da seleção (mousemove/touchmove no contêiner ou documento)
  const handleInteractionMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isSelecting || selectionStartOffset === null) return;

    const target = event instanceof TouchEvent ? document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY) : event.target;
    const offsets = getOffsetsFromEventTarget(target);

    if (offsets && offsets.isWord) {
      setSelectionEndOffset(offsets.end);
    }
  }, [isSelecting, selectionStartOffset]);

  // Final da seleção (mouseup/touchend em qualquer lugar do documento)
  const handleDocumentInteractionEnd = useCallback(async () => {
    if (!isSelecting) return;

    setIsSelecting(false);

    if (selectionStartOffset === null || selectionEndOffset === null) {
      setSelectionStartOffset(null);
      setSelectionEndOffset(null);
      return;
    }

    const finalStartOffset = Math.min(selectionStartOffset, selectionEndOffset);
    const finalEndOffset = Math.max(selectionStartOffset, selectionEndOffset);

    // Se a seleção for apenas um clique (início e fim iguais), não faz nada para evitar apagar/marcar acidentalmente
    if (finalStartOffset === finalEndOffset) {
      setSelectionStartOffset(null);
      setSelectionEndOffset(null);
      return;
    }

    // O texto selecionado é usado apenas para logs/feedback, não para salvar diretamente
    const selectedTextPreview = text.substring(finalStartOffset, finalEndOffset).trim();

    if (selectedTextPreview.length === 0) {
      setSelectionStartOffset(null);
      setSelectionEndOffset(null);
      return;
    }

    if (isHighlightingMode) {
      console.log('--- Ação de Marcar ---');
      console.log('Preview: Texto a ser marcado:', selectedTextPreview);
      console.log('Offsets:', finalStartOffset, '-', finalEndOffset);
      await handleHighlightDirectly(finalStartOffset, finalEndOffset); // Passa apenas os offsets
    } else if (isErasingMode) {
      console.log('--- Ação de Apagar ---');
      console.log('Preview: Texto selecionado para apagar:', selectedTextPreview);
      console.log('Offsets:', finalStartOffset, '-', finalEndOffset);
      await handleEraseDirectly(finalStartOffset, finalEndOffset); // Chama a função de exclusão/fragmentação
    }

    setSelectionStartOffset(null);
    setSelectionEndOffset(null);
  }, [isSelecting, selectionStartOffset, selectionEndOffset, text, isHighlightingMode, isErasingMode, highlightsData, handleHighlightDirectly, handleEraseDirectly, session, chapterId, queryClient, onHighlightsChange, textSegments]);

  useEffect(() => {
    const currentTextRef = textRef.current;
    if (currentTextRef) {
      currentTextRef.addEventListener('mousedown', handleInteractionStart);
      currentTextRef.addEventListener('touchstart', handleInteractionStart, { passive: false });

      document.addEventListener('mousemove', handleInteractionMove);
      document.addEventListener('touchmove', handleInteractionMove, { passive: false });

      document.addEventListener('mouseup', handleDocumentInteractionEnd);
      document.addEventListener('touchend', handleDocumentInteractionEnd);
    }

    // Limpa seleções e estados ao sair de qualquer modo de marcação/apagamento
    if (!isHighlightingMode && !isErasingMode) {
      window.getSelection()?.removeAllRanges();
      setIsSelecting(false);
      setSelectionStartOffset(null);
      setSelectionEndOffset(null);
    }

    return () => {
      if (currentTextRef) {
        currentTextRef.removeEventListener('mousedown', handleInteractionStart);
        currentTextRef.removeEventListener('touchstart', handleInteractionStart);
      }
      document.removeEventListener('mousemove', handleInteractionMove);
      document.removeEventListener('touchmove', handleInteractionMove);
      document.removeEventListener('mouseup', handleDocumentInteractionEnd);
      document.removeEventListener('touchend', handleDocumentInteractionEnd);
    };
  }, [handleInteractionStart, handleInteractionMove, handleDocumentInteractionEnd, isHighlightingMode, isErasingMode]);

  const isSegmentHighlighted = useCallback((segment: TextSegment) => {
    const isPermanentlyHighlighted = highlightsData.some(h =>
      segment.startOffset < h.end_offset + 1 && segment.endOffset > h.start_offset
    );

    let isTemporarilyHighlightedForHighlighting = false;
    let isTemporarilyHighlightedForErasing = false;

    if (isSelecting && selectionStartOffset !== null && selectionEndOffset !== null) {
      const currentSelectionMin = Math.min(selectionStartOffset, selectionEndOffset);
      const currentSelectionMax = Math.max(selectionStartOffset, selectionEndOffset);

      // Check if the segment is within the current selection range
      const segmentOverlapsWithCurrentSelection = 
        segment.startOffset < currentSelectionMax && segment.endOffset > currentSelectionMin;

      if (isHighlightingMode && segmentOverlapsWithCurrentSelection) {
        isTemporarilyHighlightedForHighlighting = true;
      } else if (isErasingMode && segmentOverlapsWithCurrentSelection) {
        // For erasing preview, we want to highlight *all parts of any highlight*
        // that would be deleted by the current selection.
        const highlightsOverlappingWithCurrentSelection = highlightsData.filter(h =>
          h.start_offset < currentSelectionMax && h.end_offset + 1 > currentSelectionMin
        );

        isTemporarilyHighlightedForErasing = highlightsOverlappingWithCurrentSelection.some(h =>
          segment.startOffset < h.end_offset + 1 && segment.endOffset > h.start_offset
        );
      }
    }

    return { 
      isPermanentlyHighlighted, 
      isTemporarilyHighlightedForHighlighting,
      isTemporarilyHighlightedForErasing
    };
  }, [highlightsData, isSelecting, selectionStartOffset, selectionEndOffset, isHighlightingMode, isErasingMode]);

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={cn(
          "prose max-w-none text-lg font-serif italic leading-relaxed text-primary/90",
          (isHighlightingMode || isErasingMode) && "cursor-text select-none", // Cursor de texto para ambos os modos
          isErasingMode && "cursor-crosshair" // Adiciona um cursor diferente para o modo borracha
        )}
      >
        {textSegments.map((segment, index) => {
          const { isPermanentlyHighlighted, isTemporarilyHighlightedForHighlighting, isTemporarilyHighlightedForErasing } = isSegmentHighlighted(segment);
          return (
            <span
              key={index}
              data-offset-start={segment.startOffset}
              data-offset-end={segment.endOffset}
              data-is-word={segment.isWord}
              className={cn(
                "relative",
                (isHighlightingMode || isErasingMode) && segment.isWord && "cursor-pointer",
                isPermanentlyHighlighted && "bg-yellow-300/70 dark:bg-yellow-600/50 rounded-sm",
                // Pré-visualização para o modo de marcação
                isHighlightingMode && isTemporarilyHighlightedForHighlighting && "bg-yellow-200/50 dark:bg-yellow-500/30 rounded-sm",
                // Pré-visualização para o modo de borracha
                isErasingMode && isTemporarilyHighlightedForErasing && "bg-red-300/50 dark:bg-red-600/50 rounded-sm"
              )}
            >
              {segment.content}
            </span>
          );
        })}
      </div>
    </div>
  );
};