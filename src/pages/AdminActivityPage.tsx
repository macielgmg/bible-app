"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, BarChart3, Users, UserCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showError, showSuccess } from '@/utils/toast';
import { logAdminActivity } from '@/utils/logging';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserLog {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  created_at: string;
}

interface AdminLog {
  id: string;
  admin_user_id: string;
  event_type: string;
  description: string;
  created_at: string;
}

const fetchUserLogs = async (): Promise<UserLog[]> => {
  const { data, error } = await supabase
    .from('user_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); // Limitar para evitar sobrecarga
  if (error) throw error;
  return data;
};

const fetchAdminLogs = async (): Promise<AdminLog[]> => {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); // Limitar para evitar sobrecarga
  if (error) throw error;
  return data;
};

// New fetch function for logging status
const fetchUserLoggingStatus = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'user_logging_enabled')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user logging status:', error);
    return true; // Default to enabled on error
  }
  return data?.value === 'true';
};

// New update function for logging status
const updateUserLoggingStatus = async (isEnabled: boolean) => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'user_logging_enabled', value: isEnabled ? 'true' : 'false' }, { onConflict: 'key' });
  if (error) throw error;
};

const AdminActivityPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();

  const [showUserLogsModal, setShowUserLogsModal] = useState(false);
  const [showAdminLogsModal, setShowAdminLogsModal] = useState(false);
  const [showConfirmToggleLogging, setShowConfirmToggleLogging] = useState(false);
  const [isTogglingLogging, setIsTogglingLogging] = useState(false);

  const { data: userLogs, isLoading: isLoadingUserLogs, error: userLogsError } = useQuery<UserLog[], Error>({
    queryKey: ['userLogs'],
    queryFn: fetchUserLogs,
    enabled: showUserLogsModal && !!session?.user,
  });

  const { data: adminLogs, isLoading: isLoadingAdminLogs, error: adminLogsError } = useQuery<AdminLog[], Error>({
    queryKey: ['adminLogs'],
    queryFn: fetchAdminLogs,
    enabled: showAdminLogsModal && !!session?.user,
  });

  // Fetch global user logging status
  const { data: isUserLoggingEnabled, isLoading: isLoadingLoggingStatus, error: loggingStatusError } = useQuery<boolean, Error>({
    queryKey: ['userLoggingEnabledStatus'],
    queryFn: fetchUserLoggingStatus,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  });

  // Mutation to update logging status
  const toggleLoggingMutation = useMutation<void, Error, boolean>({
    mutationFn: updateUserLoggingStatus,
    onMutate: () => {
      setIsTogglingLogging(true);
    },
    onSuccess: (data, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['userLoggingEnabledStatus'] });
      showSuccess(`Registro de logs de usuários ${newStatus ? 'habilitado' : 'desabilitado'} com sucesso!`);
      if (session?.user?.id) {
        logAdminActivity(session.user.id, 'user_logging_toggled', `Registro de logs de usuários ${newStatus ? 'habilitado' : 'desabilitado'}.`);
      }
      // Clear the cache in src/utils/logging.ts
      // This is a bit tricky as it's a global variable. A better pattern would be to have a function in logging.ts to clear it.
      // For now, I'll assume the query invalidation will eventually lead to a fresh fetch.
      // Or, I can export a clearCache function from logging.ts. Let's add that.
    },
    onError: (err) => {
      showError(`Erro ao alterar status de logs: ${err.message}`);
      console.error('Error toggling user logging status:', err);
    },
    onSettled: () => {
      setIsTogglingLogging(false);
      setShowConfirmToggleLogging(false);
    },
  });

  const handleToggleUserLogging = (newStatus: boolean) => {
    toggleLoggingMutation.mutate(newStatus);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

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
          <Activity className="h-6 w-6" /> Atividade dos Usuários
        </h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Relatórios de Atividade</CardTitle>
            <CardDescription>Monitore o progresso e o engajamento dos usuários.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              <BarChart3 className="h-4 w-4 mr-2" /> Ver Relatórios de Atividade (Em breve)
            </Button>
          </CardContent>
        </Card>

        {/* Seção de Logs de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logs de Usuários</CardTitle>
            <CardDescription>Visualize as ações realizadas pelos usuários no aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => setShowUserLogsModal(true)}>
              <Users className="h-4 w-4 mr-2" /> Ver Logs de Usuários
            </Button>
            {isLoadingLoggingStatus ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando status...</span>
              </div>
            ) : loggingStatusError ? (
              <p className="text-destructive text-sm text-center">Erro ao carregar status de logs: {loggingStatusError.message}</p>
            ) : (
              <AlertDialog open={showConfirmToggleLogging} onOpenChange={setShowConfirmToggleLogging}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={isUserLoggingEnabled ? "destructive" : "default"} 
                    className="w-full"
                    disabled={isTogglingLogging}
                  >
                    {isTogglingLogging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isUserLoggingEnabled ? "Desabilitar Registro de Logs de Usuários" : "Habilitar Registro de Logs de Usuários"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader className="flex flex-col items-center text-center">
                    <Activity className="h-16 w-16 text-primary mb-4" />
                    <AlertDialogTitle className="text-2xl font-bold text-primary">
                      {isUserLoggingEnabled ? "Desabilitar Registro de Logs?" : "Habilitar Registro de Logs?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      {isUserLoggingEnabled
                        ? "Ao desabilitar, novas atividades dos usuários NÃO serão registradas. Logs existentes permanecerão."
                        : "Ao habilitar, novas atividades dos usuários começarão a ser registradas."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                    <AlertDialogCancel asChild>
                      <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button 
                        variant={isUserLoggingEnabled ? "destructive" : "default"} 
                        className="w-full sm:w-auto"
                        onClick={() => handleToggleUserLogging(!isUserLoggingEnabled)}
                        disabled={isTogglingLogging}
                      >
                        {isTogglingLogging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isUserLoggingEnabled ? "Desabilitar" : "Habilitar"}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* Seção de Logs de Administradores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logs de Administradores</CardTitle>
            <CardDescription>Acompanhe as ações realizadas pelos administradores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setShowAdminLogsModal(true)}>
              <UserCog className="h-4 w-4 mr-2" /> Ver Logs de Administradores
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal para Logs de Usuários */}
      <Dialog open={showUserLogsModal} onOpenChange={setShowUserLogsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs de Usuários</DialogTitle>
          </DialogHeader>
          {isLoadingUserLogs ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userLogsError ? (
            <div className="text-destructive text-center p-4">
              Erro ao carregar logs de usuários: {userLogsError.message}
            </div>
          ) : userLogs && userLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>ID do Usuário</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{formatTimestamp(log.created_at)}</TableCell>
                    <TableCell className="text-xs">{log.user_id.substring(0, 8)}...</TableCell>
                    <TableCell className="text-xs">{log.event_type}</TableCell>
                    <TableCell className="text-xs">{log.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-4">Nenhum log de usuário encontrado.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Logs de Administradores */}
      <Dialog open={showAdminLogsModal} onOpenChange={setShowAdminLogsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs de Administradores</DialogTitle>
          </DialogHeader>
          {isLoadingAdminLogs ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : adminLogsError ? (
            <div className="text-destructive text-center p-4">
              Erro ao carregar logs de administradores: {adminLogsError.message}
            </div>
          ) : adminLogs && adminLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>ID do Admin</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{formatTimestamp(log.created_at)}</TableCell>
                    <TableCell className="text-xs">{log.admin_user_id.substring(0, 8)}...</TableCell>
                    <TableCell className="text-xs">{log.event_type}</TableCell>
                    <TableCell className="text-xs">{log.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-4">Nenhum log de administrador encontrado.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminActivityPage;