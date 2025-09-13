"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquareText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showError } from '@/utils/toast';

interface UserFeedback {
  id: string;
  user_id: string;
  feedback_text: string;
  created_at: string;
}

const fetchUserFeedback = async (): Promise<UserFeedback[]> => {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); // Limitar para evitar sobrecarga
  if (error) throw error;
  return data;
};

const AdminFeedbackPage = () => {
  const navigate = useNavigate();

  const { data: feedback, isLoading, error } = useQuery<UserFeedback[], Error>({
    queryKey: ['userFeedback'],
    queryFn: fetchUserFeedback,
  });

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-8">
        <p>Erro ao carregar feedbacks: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl pb-8">
      <header className="relative flex items-center justify-center py-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <MessageSquareText className="h-6 w-6" /> Feedbacks dos Usuários
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedbacks Recebidos</CardTitle>
          <CardDescription>Visualize as sugestões e comentários enviados pelos usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && feedback.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data</TableHead>
                    <TableHead className="w-[100px]">ID do Usuário</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{formatTimestamp(item.created_at)}</TableCell>
                      <TableCell className="text-xs">{item.user_id.substring(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{item.feedback_text}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-4">Nenhum feedback de usuário encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeedbackPage;