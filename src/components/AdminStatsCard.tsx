"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  title: string;
  value: string | number | null;
  icon: React.ElementType; // Corrigido: Usando 'React.ElementType'
  isLoading?: boolean;
  className?: string;
}

export const AdminStatsCard = ({ title, value, icon: Icon, isLoading, className }: AdminStatsCardProps) => {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="text-2xl font-bold text-primary">{value !== null ? value : '-'}</div>
        )}
      </CardContent>
    </Card>
  );
};