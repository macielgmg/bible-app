"use client";

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BookOpen, PlusCircle, Activity, LayoutDashboard, Mail, UserCheck, UserPlus, BarChart3, Book, FileText, LayoutTemplate, MessageSquareText } from 'lucide-react'; // Adicionado MessageSquareText
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminStatsCard } from '@/components/AdminStatsCard';
import { DailyActiveUsersChart } from '@/components/DailyActiveUsersChart';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { useSession } from '@/contexts/SessionContext'; // Importar useSession

// Funções para buscar dados
const fetchTotalUsers = async () => {
  const { count, error } = await supabase
    .from('profiles') // Usar a tabela profiles para contar usuários registrados no app
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
};

const fetchActiveUsers = async (days: number) => {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const { count, error } = await supabase
    .from('daily_tasks_progress')
    .select('user_id', { count: 'exact', head: true })
    .gte('task_date', startDate);
  if (error) throw error;
  return count;
};

// Novas funções para buscar dados do banco de dados
const fetchTotalStudies = async () => {
  const { count, error } = await supabase
    .from('studies')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
};

const fetchTotalChapters = async () => {
  const { count, error } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
};

const fetchTotalDailyContentTemplates = async () => {
  const { count, error } = await supabase
    .from('daily_content_templates')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { fullName } = useSession(); // Obter o nome completo do usuário

  const adminFirstName = fullName ? fullName.split(' ')[0] : 'Admin'; // Extrai o primeiro nome

  const { data: totalUsers, isLoading: isLoadingTotalUsers } = useQuery<number | null, Error>({
    queryKey: ['totalUsers'],
    queryFn: fetchTotalUsers,
  });

  const { data: activeUsers7Days, isLoading: isLoadingActiveUsers7Days } = useQuery<number | null, Error>({
    queryKey: ['activeUsers', 7],
    queryFn: () => fetchActiveUsers(7),
  });

  const { data: activeUsers30Days, isLoading: isLoadingActiveUsers30Days } = useQuery<number | null, Error>({
    queryKey: ['activeUsers', 30],
    queryFn: fetchActiveUsers(30),
  });

  // Novas queries para dados do banco de dados
  const { data: totalStudies, isLoading: isLoadingTotalStudies } = useQuery<number | null, Error>({
    queryKey: ['totalStudies'],
    queryFn: fetchTotalStudies,
  });

  const { data: totalChapters, isLoading: isLoadingTotalChapters } = useQuery<number | null, Error>({
    queryKey: ['totalChapters'],
    queryFn: fetchTotalChapters,
  });

  const { data: totalDailyContentTemplates, isLoading: isLoadingTotalDailyContentTemplates } = useQuery<number | null, Error>({
    queryKey: ['totalDailyContentTemplates'],
    queryFn: fetchTotalDailyContentTemplates,
  });

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
          <LayoutDashboard className="h-6 w-6" /> Olá, {adminFirstName}!
        </h1>
      </header>

      {/* Seção de Estatísticas Rápidas de Usuários */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <AdminStatsCard 
          title="Total de Usuários" 
          value={totalUsers} 
          icon={Users} 
          isLoading={isLoadingTotalUsers} 
        />
        <AdminStatsCard 
          title="Ativos (7 dias)" 
          value={activeUsers7Days} 
          icon={UserCheck} 
          isLoading={isLoadingActiveUsers7Days} 
        />
        <AdminStatsCard 
          title="Ativos (30 dias)" 
          value={activeUsers30Days} 
          icon={UserPlus} 
          isLoading={isLoadingActiveUsers30Days} 
        />
      </div>

      {/* Seção de Gráfico de Usuários Ativos e Estatísticas de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Usuários Ativos Diários */}
        <DailyActiveUsersChart days={30} />

        {/* Estatísticas de Conteúdo */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Book className="h-5 w-5" /> Estatísticas de Conteúdo
          </h2>
          <AdminStatsCard 
            title="Total de Estudos" 
            value={totalStudies} 
            icon={BookOpen} 
            isLoading={isLoadingTotalStudies} 
            className="flex-1"
          />
          <AdminStatsCard 
            title="Total de Capítulos" 
            value={totalChapters} 
            icon={FileText} 
            isLoading={isLoadingTotalChapters} 
            className="flex-1"
          />
          <AdminStatsCard 
            title="Templates Diários" 
            value={totalDailyContentTemplates} 
            icon={LayoutTemplate} 
            isLoading={isLoadingTotalDailyContentTemplates} 
            className="flex-1"
          />
        </div>
      </div>

      {/* Seção de Navegação para Áreas de Gestão */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gerenciar Usuários Autorizados */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/management/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Usuários Autorizados</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription>Adicione e gerencie emails que podem se cadastrar no app.</CardDescription>
          </CardContent>
        </Card>

        {/* Gerenciar Estudos */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/management/studies')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Estudos e Capítulos</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription>Adicione, edite ou remova estudos e seus capítulos.</CardDescription>
          </CardContent>
        </Card>

        {/* Gerenciar Conteúdo Diário */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/management/daily-content')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Conteúdo Diário</CardTitle>
            <Mail className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription>Gerencie templates para versículos, orações, etc.</CardDescription>
          </CardContent>
        </Card>

        {/* Verificar Atividade dos Usuários */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/management/activity')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Atividade dos Usuários</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription>Monitore o progresso e o engajamento dos usuários.</CardDescription>
          </CardContent>
        </Card>

        {/* NOVO: Gerenciar Feedbacks dos Usuários */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/management/feedback')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Feedbacks dos Usuários</CardTitle>
            <MessageSquareText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription>Visualize e gerencie os feedbacks enviados pelos usuários.</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;