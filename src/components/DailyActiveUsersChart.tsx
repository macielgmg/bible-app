"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

interface DailyActiveUsersData {
  task_date: string;
  active_users: number;
}

const fetchDailyActiveUsers = async (days: number): Promise<DailyActiveUsersData[]> => {
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd'); // -1 para incluir o dia atual
  
  const { data, error } = await supabase.rpc('get_daily_active_users', {
    start_date: startDate,
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  if (error) {
    console.error('Error fetching daily active users:', error);
    throw error;
  }

  // Preencher dias sem atividade com 0
  const result: DailyActiveUsersData[] = [];
  const dataMap = new Map(data.map((item: any) => [item.task_date, item.active_users]));

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    result.push({
      task_date: date,
      active_users: (dataMap.get(date) || 0) as number, // Corrigido: Adicionando afirmação de tipo
    });
  }

  return result;
};

interface DailyActiveUsersChartProps {
  days?: number; // Número de dias para exibir no gráfico, padrão 30
}

export const DailyActiveUsersChart = ({ days = 30 }: DailyActiveUsersChartProps) => {
  const { data, isLoading, isError, error } = useQuery<DailyActiveUsersData[], Error>({
    queryKey: ['dailyActiveUsers', days],
    queryFn: () => fetchDailyActiveUsers(days),
  });

  if (isLoading) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-80 flex items-center justify-center text-destructive">
        <p>Erro ao carregar dados de usuários ativos: {error?.message}</p>
      </Card>
    );
  }

  const formattedData = data?.map(item => ({
    ...item,
    formattedDate: format(new Date(item.task_date), 'dd/MM', { locale: ptBR }),
  })) || [];

  return (
    <Card className="h-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Usuários Ativos Diários ({days} dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="formattedDate"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              labelStyle={{
                color: 'hsl(var(--primary))',
                fontWeight: 'bold',
              }}
              itemStyle={{
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string, props: any) => [`${value} usuários`, 'Ativos']}
              labelFormatter={(label: string) => `Data: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="active_users"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary-foreground))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};