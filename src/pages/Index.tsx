import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react'; // Importar useState
import { cn } from '@/lib/utils'; // Importar cn

export default function Index() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [isFadingOut, setIsFadingOut] = useState(false); // NOVO: Estado para controlar o fade-out

  // Se já estiver logado, redireciona para a página principal do app
  if (session) {
    return <Navigate to="/today" replace />;
  }

  const handleContinue = () => {
    setIsFadingOut(true); // Inicia a animação de fade-out
    setTimeout(() => {
      navigate('/login'); // Navega para a página de login após a animação
    }, 300); // Duração da animação de 300ms
  };

  return (
    <div className={cn("min-h-screen flex flex-col bg-background transition-opacity duration-300", isFadingOut && "animate-fade-out")}> {/* NOVO: Aplica a classe de animação */}
      {/* Header */}
      <div className="relative h-24 bg-primary flex items-center justify-start p-4">
        {/* Botão de voltar removido */}
      </div>

      {/* Content Wrapper with rounded top corners and negative margin, now encompassing image, text, and button */}
      <div className="flex-1 flex flex-col bg-card rounded-t-3xl -mt-8 relative z-10 overflow-hidden">
        {/* Image Section */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src="https://res.cloudinary.com/djmx0jbus/image/upload/v1757642278/Design_sem_nome_2_moujxj.gif"
            alt="Ilustração de crescimento espiritual"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Text Content */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Aprofunde sua jornada de fé.
          </h1>
          <p className="text-base text-muted-foreground max-w-xs">
            Descubra estudos bíblicos, reflexões diárias e ferramentas para o seu crescimento espiritual.
          </p>
        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 p-4 w-full max-w-md mx-auto">
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
          >
            Continuar <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}