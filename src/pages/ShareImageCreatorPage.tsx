"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Palette, Type, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSession } from '@/contexts/SessionContext';
import { logUserActivity } from '@/utils/logging';
import { supabase } from '@/integrations/supabase/client';

// Definição das imagens de fundo (agora com 4 opções únicas)
const backgroundImages = [
  { id: 'bg1', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550732/bela-vista-das-arvores-com-folhas-verdes-nos-campos-de-grama-sob-o-ceu-azul-min_lwvhcp.jpg', alt: 'Árvores com folhas verdes sob o céu azul' },
  { id: 'bg2', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550731/uma-vista-deslumbrante-da-paisagem-natural-da-praia-min_vyk9em.jpg', alt: 'Vista deslumbrante da paisagem natural da praia' },
  { id: 'bg3', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550731/uma-vista-deslumbrante-da-paisagem-natural-da-praia_1_-min_m5n3o2.jpg', alt: 'Vista deslumbrante da paisagem natural da praia (2)' },
  { id: 'bg4', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550731/foto-vertical-de-uma-passagem-de-madeira-sobre-um-pequeno-lago-reflexivo-e-uma-cadeia-de-montanhas-no-horizonte_1_-min_hcczr8.jpg', alt: 'Passagem de madeira sobre lago com montanhas' },
  { id: 'bg5', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550731/cenario-mar-com-penhascos-durante-o-por-sol-papel-de-parede-perfeito_2_-min_tvjzrn.jpg', alt: 'Cenário de mar com penhascos durante o pôr do sol' },
  { id: 'bg6', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550730/bela-foto-das-cores-por-sol-no-horizonte-de-um-lago-tranquilo-com-uma-doca-min_vjm5d0.jpg', alt: 'Pôr do sol em um lago tranquilo com doca' },
  { id: 'bg7', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550730/uma-vista-deslumbrante-da-paisagem-natural-da-praia_2_-min_ejtzks.jpg', alt: 'Vista deslumbrante da paisagem natural da praia (3)' },
  { id: 'bg8', url: 'https://res.cloudinary.com/djmx0jbus/image/upload/v1757550730/close-up-de-pedras-submersas-no-lago-min_rkqhby.jpg', alt: 'Close-up de pedras submersas no lago' },
];

// Opções de cores de texto
const textColors = [
  { label: 'Branco', class: 'text-white', hex: '#ffffff' },
  { label: 'Preto', class: 'text-black', hex: '#000000' },
  { label: 'Primário', class: 'text-primary', hex: 'hsl(var(--primary))' },
  { label: 'Secundário', class: 'text-secondary-foreground', hex: 'hsl(var(--secondary-foreground))' },
];

// Opções de estilos de fonte
const fontStyles = [
  { label: 'Padrão', class: 'font-sans' },
  { label: 'Serif', class: 'font-serif' },
  { label: 'Mono', class: 'font-mono' },
];

// Opções de tamanho da fonte
const fontSizes = [
  { label: 'Menor', class: 'text-2xl' },
  { label: 'Padrão', class: 'text-3xl' },
  { label: 'Maior', class: 'text-4xl' },
];

interface ShareContentData {
  text: string;
  reference?: string;
  title?: string;
  explanation?: string;
  auxiliar_text?: string;
}

const ShareImageCreatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, refetchProfile } = useSession();
  const shareRef = useRef<HTMLDivElement>(null);

  const [contentToShare, setContentToShare] = useState<ShareContentData | null>(null);
  const [selectedBackground, setSelectedBackground] = useState(backgroundImages[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(textColors[0]);
  const [selectedFontStyle, setSelectedFontStyle] = useState(fontStyles[0]);
  const [selectedFontSize, setSelectedFontSize] = useState(fontSizes[1]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showCustomizationMenu, setShowCustomizationMenu] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).shareContent) {
      setContentToShare((location.state as any).shareContent);
    } else {
      showError("Nenhum conteúdo para compartilhar foi fornecido.");
      navigate(-1);
    }
  }, [location.state, navigate]);

  const handleShareImage = async () => {
    if (!shareRef.current || !contentToShare || !session?.user) {
      showError("Não foi possível gerar a imagem para compartilhamento.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(shareRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL('image/png');

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "raizesdafe_share.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Raízes da Fé - Compartilhe a Palavra!',
          text: `"${contentToShare.text}" ${contentToShare.reference ? `— ${contentToShare.reference}` : ''}\n\nConfira o app Raízes da Fé!`,
        });
        showSuccess('Imagem compartilhada com sucesso!');
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'raizesdafe_share.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Imagem gerada e baixada com sucesso!');
      }

      const { error: updateError } = await supabase
        .rpc('increment_total_shares', { user_id: session.user.id });

      if (updateError) {
        console.error("Erro ao incrementar total_shares:", updateError);
      }
      await refetchProfile();
      logUserActivity(session.user.id, 'content_shared_image', `Compartilhou conteúdo como imagem: "${contentToShare.text.substring(0, 50)}..."`);

    } catch (error: any) {
      console.error('Erro ao gerar ou compartilhar imagem:', error);
      showError('Erro ao gerar ou compartilhar imagem: ' + error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!contentToShare) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayContent = contentToShare.text;
  const displayReference = contentToShare.reference;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="relative flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary"></h1>
        <div className="flex items-center gap-2">
          <DropdownMenu open={showCustomizationMenu} onOpenChange={setShowCustomizationMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Cor do Texto</p>
                <div className="flex flex-wrap gap-2">
                  {textColors.map(color => (
                    <Button
                      key={color.class}
                      variant="outline"
                      size="icon"
                      className={cn("h-8 w-8 rounded-full border-2", selectedTextColor.class === color.class && "ring-2 ring-primary")}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setSelectedTextColor(color)}
                    >
                      {selectedTextColor.class === color.class && <CheckCircle className="h-4 w-4 text-white" />}
                    </Button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Estilo da Fonte</p>
                <div className="flex flex-wrap gap-2">
                  {fontStyles.map(font => (
                    <Button
                      key={font.class}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 px-3",
                        font.class,
                        selectedFontStyle.class === font.class && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setSelectedFontStyle(font)}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tamanho da Fonte</p>
                <div className="flex flex-wrap gap-2">
                  {fontSizes.map(size => (
                    <Button
                      key={size.class}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 px-3",
                        selectedFontSize.class === size.class && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setSelectedFontSize(size)}
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleShareImage} disabled={isGeneratingImage}>
            {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <Card 
          ref={shareRef} 
          className="relative w-full max-w-md aspect-[9/16] flex flex-col items-center justify-center p-8 rounded-lg shadow-xl overflow-hidden"
          style={{
            backgroundImage: `url(${selectedBackground.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/30 z-0"></div>
          <div className="relative z-10 text-center">
            <p className={cn("font-bold leading-tight mb-4", selectedTextColor.class, selectedFontStyle.class, selectedFontSize.class)}>
              "{displayContent}"
            </p>
            {displayReference && displayReference !== 'Reflexão' && ( // Adicionada a condição para não exibir se for 'Reflexão'
              <p className={cn("text-lg font-semibold", selectedTextColor.class, selectedFontStyle.class)}>
                — {displayReference}
              </p>
            )}
          </div>
        </Card>
      </main>

      <footer className="flex-shrink-0 p-4 border-t border-border bg-card">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-4 p-2">
            {backgroundImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "flex-shrink-0 h-20 w-20 rounded-md overflow-hidden border-2 cursor-pointer transition-all",
                  selectedBackground.id === image.id ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted"
                )}
                onClick={() => setSelectedBackground(image)}
              >
                <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </footer>
    </div>
  );
};

export default ShareImageCreatorPage;