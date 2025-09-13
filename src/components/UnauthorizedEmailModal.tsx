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
import { MailWarning, ArrowLeft, MessageSquare } from 'lucide-react'; // Usando MailWarning para o emoji

interface UnauthorizedEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport: () => void;
}

export const UnauthorizedEmailModal = ({ isOpen, onClose, onContactSupport }: UnauthorizedEmailModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <MailWarning className="h-16 w-16 text-yellow-500 mb-4" />
          <AlertDialogTitle className="text-2xl font-bold text-primary">Acesso Não Autorizado</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Este email não está liberado para acesso ao aplicativo. Por favor, entre em contato com o suporte para solicitar a liberação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={onContactSupport}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Liberar Acesso
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};