import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils"; // Importar cn

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean; // Novo prop para controlar a visibilidade do texto
  className?: string; // Novo prop para classes adicionais
}

export const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg' },
    md: { icon: 'h-6 w-6', text: 'text-xl' },
    lg: { icon: 'h-8 w-8', text: 'text-2xl' },
  };

  return (
    <div className={cn(`flex items-center gap-2 ${sizes[size].text}`, className)}>
      <Sprout className={`${sizes[size].icon} text-primary`} />
      {showText && <span className="font-bold text-primary">Raízes da Fé</span>}
    </div>
  );
};