"use client";

import { Sprout } from "lucide-react"; // Usando Sprout como ícone para Raízes da Fé
import { cn } from "@/lib/utils";

interface LandingLogoProps {
  className?: string;
}

export const LandingLogo = ({ className }: LandingLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2 text-xl", className)}>
      <Sprout className="h-6 w-6 text-foreground" /> {/* Ícone de broto */}
      <span className="font-bold text-foreground">Raízes da Fé</span>
    </div>
  );
};