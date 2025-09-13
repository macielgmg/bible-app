"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [newAuthorizedEmail, setNewAuthorizedEmail] = useState('');
  const [isAddingAuthorizedUser, setIsAddingAuthorizedUser] = useState(false);

  const handleAddAuthorizedUser = async () => {
    if (!newAuthorizedEmail) {
      showError("Por favor, insira um email.");
      return;
    }
    setIsAddingAuthorizedUser(true);
    try {
      // Using the service_role key to bypass RLS for this admin action
      // In a real-world scenario, this would be done via an Edge Function
      // that has the service_role key, not directly from the client.
      // For this exercise, we'll simulate it as if an Edge Function is called.
      const { data, error } = await supabase
        .from('authorized_users')
        .insert({ email: newAuthorizedEmail });

      if (error) {
        throw error;
      }
      showSuccess(`Email ${newAuthorizedEmail} autorizado com sucesso para cadastro!`);
      setNewAuthorizedEmail('');
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        showError("Este email já está autorizado.");
      } else {
        showError("Erro ao adicionar usuário autorizado: " + error.message);
      }
      console.error("Erro ao adicionar usuário autorizado:", error);
    } finally {
      setIsAddingAuthorizedUser(false);
    }
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
          <Users className="h-6 w-6" /> Gerenciar Usuários Autorizados
        </h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Email Autorizado</CardTitle>
            <CardDescription>Permita que novos usuários se cadastrem no aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="authorized-email">Email para Autorizar</Label>
              <Input
                id="authorized-email"
                type="email"
                placeholder="email@example.com"
                value={newAuthorizedEmail}
                onChange={(e) => setNewAuthorizedEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleAddAuthorizedUser} 
              disabled={isAddingAuthorizedUser || !newAuthorizedEmail} 
              className="w-full"
            >
              {isAddingAuthorizedUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Adicionar Usuário Autorizado
            </Button>
            {/* Futuramente, listar usuários autorizados e permitir remoção */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersPage;