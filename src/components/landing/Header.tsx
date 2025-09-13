import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingLogo } from '@/components/landing/LandingLogo';
import { useSession } from '@/contexts/SessionContext'; // Importar useSession

export const Header = () => {
  const navigate = useNavigate();
  const { session } = useSession(); // Obter o estado da sessão

  const buttonText = session ? 'Abrir App' : 'Entrar'; // Alterado de 'Download App' para 'Entrar'
  const handleClick = () => {
    if (session) {
      navigate('/today'); // Se logado, vai para a página principal do app
    } else {
      navigate('/login'); // Se não logado, vai para a página de login
    }
  };

  return (
    <header className="flex items-center justify-between p-4 md:px-8 lg:px-12 py-6 w-full max-w-screen-xl mx-auto">
      <div className="flex items-center gap-8">
        <LandingLogo />
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          className="border-foreground text-foreground hover:bg-foreground/10"
          onClick={handleClick}
        >
          {buttonText}
        </Button>
      </div>
    </header>
  );
};