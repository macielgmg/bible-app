import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthProtectedRouteProps {
  children: ReactNode;
}

const AuthProtectedRoute = ({ children }: AuthProtectedRouteProps) => {
  const { session, loading: sessionLoading, onboardingCompleted } = useSession();
  const location = useLocation();

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!onboardingCompleted && location.pathname !== '/onboarding-quiz') {
    // If logged in but onboarding not completed, redirect to onboarding quiz
    return <Navigate to="/onboarding-quiz" replace state={{ from: location }} />;
  }

  return children;
};

export default AuthProtectedRoute;