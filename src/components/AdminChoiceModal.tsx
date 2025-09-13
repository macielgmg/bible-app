"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LayoutDashboard, Home } from 'lucide-react';

interface AdminChoiceModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void; // Corrigido: agora aceita um booleano
  onAdminPanelClick: () => void;
  onStayInAppClick: () => void;
}

export const AdminChoiceModal = ({ isOpen, onClose, onAdminPanelClick, onStayInAppClick }: AdminChoiceModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <LayoutDashboard className="h-16 w-16 text-primary mb-4" />
          <AlertDialogTitle className="text-2xl font-bold text-primary">Bem-vindo, Administrador!</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Detectamos que você é um usuário administrador. Para onde você gostaria de ir?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={onStayInAppClick}
            >
              <Home className="h-4 w-4 mr-2" /> Ficar no App Principal
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={onAdminPanelClick}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" /> Ir para Painel Admin
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};