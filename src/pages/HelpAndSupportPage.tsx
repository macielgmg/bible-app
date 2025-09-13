"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, HelpCircle, HeartHandshake, Star, Share2, Send, MessageSquareText, Loader2 } from 'lucide-react'; // Adicionado Send, MessageSquareText e Loader2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import { showSuccess, showError } from '@/utils/toast'; // Importar toasts
import { supabase } from '@/integrations/supabase/client'; // Importar supabase
import { useSession } from '@/contexts/SessionContext'; // Importar useSession
import { logUserActivity } from '@/utils/logging'; // Importar logUserActivity

const WHATSAPP_NUMBER = "5531936182392";
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda com o aplicativo Raízes da Fé.";

const HelpAndSupportPage = () => {
  const navigate = useNavigate();
  const { session } = useSession(); // Para obter o user_id
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleWhatsappClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Raízes da Fé - Seu aplicativo de estudo bíblico',
        text: 'Aprofunde sua fé e conhecimento da Palavra de Deus diariamente com o Raízes da Fé!',
        url: window.location.origin, // URL base do PWA
      })
      .then(() => console.log('App compartilhado com sucesso!'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      // Fallback para navegadores que não suportam a Web Share API
      const shareText = `Aprofunde sua fé e conhecimento da Palavra de Deus diariamente com o Raízes da Fé! Acesse: ${window.location.origin}`;
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Link do aplicativo copiado para a área de transferência!'))
        .catch(() => alert('Não foi possível copiar o link do aplicativo.'));
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      showError("Por favor, digite seu feedback antes de enviar.");
      return;
    }
    if (!session?.user?.id) {
      showError("Você precisa estar logado para enviar feedback.");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: session.user.id,
          feedback_text: feedbackText.trim(),
        });

      if (error) {
        throw error;
      }

      showSuccess("Feedback enviado com sucesso! Agradecemos sua contribuição.");
      logUserActivity(session.user.id, 'feedback_submitted', `Feedback enviado: "${feedbackText.trim().substring(0, 100)}..."`);
      setFeedbackText(''); // Limpa o campo
    } catch (err: any) {
      console.error('Erro ao enviar feedback:', err);
      showError('Erro ao enviar feedback: ' + err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Ajuda e Suporte</h1>
      </header>

      <Tabs defaultValue="help" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 mb-4">
          <TabsTrigger value="help" className="flex items-center gap-2 text-base py-2">
            <HelpCircle className="h-5 w-5" /> Ajuda
          </TabsTrigger>
          <TabsTrigger value="contribute" className="flex items-center gap-2 text-base py-2">
            <HeartHandshake className="h-5 w-5" /> Contribuir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="help">
          <Card className="p-6 space-y-4 text-center">
            <CardHeader className="p-0 pb-2">
              <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-lg text-muted-foreground">
                Nossa equipe de suporte está pronta para te ajudar! Entre em contato conosco via WhatsApp para um atendimento rápido.
              </p>
              <Button 
                onClick={handleWhatsappClick} 
                className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageSquare className="h-6 w-6 mr-3" />
                Falar com Suporte via WhatsApp
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Fique à vontade para mandar mensagem, iremos responder o mais rápido possível.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contribute">
          <Card className="p-6 space-y-6 text-center">
            <CardHeader className="p-0 pb-2">
              <HeartHandshake className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Apoie o Raízes da Fé</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-lg text-muted-foreground">
                Se você ama o Raízes da Fé e deseja nos ajudar a continuar crescendo, considere as seguintes formas de contribuição:
              </p>
              
              <div className="space-y-3 text-left">
                {/* Seção de Enviar Feedback */}
                <Card className="p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-primary" /> Enviar Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sua opinião é muito importante! Compartilhe suas sugestões, ideias ou problemas que encontrou.
                    </p>
                    <Textarea
                      placeholder="Digite seu feedback aqui..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="min-h-[100px]"
                      disabled={isSubmittingFeedback}
                    />
                    <Button 
                      onClick={handleSendFeedback} 
                      className="w-full"
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                    >
                      {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Enviar Feedback
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3">
                  <Share2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-primary">Compartilhe o App</h3>
                    <p className="text-muted-foreground text-sm">
                      Ajude-nos a alcançar mais pessoas compartilhando o Raízes da Fé com seus amigos e familiares!
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary justify-start text-sm" onClick={handleShareApp}>
                      Compartilhar Agora
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpAndSupportPage;