import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { session, loading: sessionLoading, isAdmin } = useSession(); // Use isAdmin from SessionContext
  const location = useLocation();

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    // If not logged in or not an admin, redirect to home
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminProtectedRoute;