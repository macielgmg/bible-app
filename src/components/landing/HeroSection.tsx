import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { useSession } from '@/contexts/SessionContext'; // Importar useSession

export const HeroSection = () => {
  const navigate = useNavigate(); // Inicializar useNavigate
  const { session } = useSession(); // Obter o estado da sessão

  const handleStartJourney = () => {
    if (session) {
      navigate('/today'); // Se logado, vai para a página principal do app
    } else {
      navigate('/login'); // Se não logado, vai para a página de login
    }
  };

  return (
    <section className="flex flex-col md:flex-row items-center justify-between py-16 px-4 md:px-8 lg:px-12 relative z-10 max-w-screen-xl mx-auto">
      {/* Conteúdo de texto */}
      <div className="flex flex-col items-start text-left w-full md:w-1/2 lg:w-[55%] mb-12 md:mb-0"> {/* Ajustado para w-full em mobile */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground animate-fade-in-up animation-delay-100">
          DESPERTE SUA <br /> FÉ
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 animate-fade-in-up animation-delay-200">
          Descubra uma vasta seleção de estudos bíblicos e ferramentas de crescimento espiritual. Nossa plataforma oferece uma jornada de fé personalizada e suporte contínuo para todas as suas dúvidas.
        </p>

        <div className="flex flex-col items-start justify-center gap-4 mb-16 w-full max-w-md">
          <Button 
            variant="default" 
            className="bg-foreground hover:bg-foreground/90 text-background px-8 py-6 text-lg animate-fade-in-up animation-delay-300"
            onClick={handleStartJourney} // Adicionado o handler de clique
          >
            Iniciar Jornada
          </Button>
        </div>

        {/* Seção "The mobile app is available now" com ícones - REMOVIDA */}
      </div>

      {/* Seção para a imagem do mockup - Oculta em telas pequenas, visível a partir de md */}
      <div className="hidden md:flex relative flex-shrink-0 md:w-1/2 lg:w-[45%] justify-center md:justify-end h-[300px] md:h-[400px] lg:h-[500px] mt-8 md:mt-0 animate-fade-in-up animation-delay-200">
        <img
          src="https://res.cloudinary.com/djmx0jbus/image/upload/v1757379288/imagem_2025-09-08_212751437-left_ar6kgv.png"
          alt="Travel Mockup"
          className="h-full w-auto object-contain"
        />
      </div>
    </section>
  );
};