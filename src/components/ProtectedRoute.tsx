import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Adicionado: Importação do cliente Supabase
import { useQuery } from '@tanstack/react-query'; // Adicionado: Importação de useQuery

interface ProtectedRouteProps {
  children: ReactNode;
}

const fetchAdminStatus = async (userId: string | undefined) => {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error('Error checking admin status:', error);
    return false;
  }
  return !!data;
};

const AdminProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();

  const { data: isAdmin, isLoading: loadingAdminStatus } = useQuery({
    queryKey: ['adminStatus', session?.user?.id],
    queryFn: () => fetchAdminStatus(session?.user?.id),
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // Cache admin status for 5 minutes
  });

  if (sessionLoading || loadingAdminStatus) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    // If not logged in or not an admin, redirect to home or login
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminProtectedRoute;