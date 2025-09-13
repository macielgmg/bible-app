import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean; // NOVO: Indica se o usuário é um administrador
  fullName: string | null;
  avatarUrl: string | null;
  hasNewStudyNotification: boolean;
  setNewStudyNotification: (value: boolean) => void;
  refetchProfile: () => Promise<void>;
  onboardingCompleted: boolean;
  quizResponses: string | null;
  preferences: string | null;
  enablePopups: boolean;
  totalShares: number;
  totalJournalEntries: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // NOVO: Estado para isAdmin
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasNewStudyNotification, setNewStudyNotification] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [quizResponses, setQuizResponses] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string | null>(null);
  const [enablePopups, setEnablePopups] = useState(true);
  const [totalShares, setTotalShares] = useState(0);
  const [totalJournalEntries, setTotalJournalEntries] = useState(0);

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      console.log('fetchProfile: No user, resetting profile states.');
      setIsAdmin(false); // Resetar isAdmin
      setFullName(null);
      setAvatarUrl(null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setEnablePopups(true);
      setTotalShares(0);
      setTotalJournalEntries(0);
      return;
    }

    console.log('fetchProfile: Fetching profile for user ID:', user.id);
    const [
      { data: profile, error: profileError },
      { data: adminData, error: adminError } // NOVO: Buscar status de admin
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, onboarding_completed, quiz_responses, preferences, daily_verse_notifications, study_reminders, achievement_notifications, enable_popups, total_shares, total_journal_entries')
        .eq('id', user.id)
        .single(),
      supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(), // Use maybeSingle to handle no rows found gracefully
    ]);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('fetchProfile: Error fetching profile:', profileError);
      setFullName(null);
      setAvatarUrl(null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setEnablePopups(true);
      setTotalShares(0);
      setTotalJournalEntries(0);
    } else if (profile) {
      console.log('fetchProfile: Profile data received:', profile);
      
      setFullName([profile.first_name, profile.last_name].filter(Boolean).join(' ') || null);
      setAvatarUrl(profile.avatar_url || null);
      setOnboardingCompleted(profile.onboarding_completed ?? false);
      setQuizResponses(profile.quiz_responses || null);
      setPreferences(profile.preferences || null);
      setEnablePopups(profile.enable_popups ?? true);
      setTotalShares(profile.total_shares ?? 0);
      setTotalJournalEntries(profile.total_journal_entries ?? 0);
      console.log('fetchProfile: Set onboardingCompleted to:', profile.onboarding_completed ?? false);
    } else {
      console.log('fetchProfile: Profile not found for user ID:', user.id, 'Using user_metadata for name.');
      setFullName(user.user_metadata.first_name || user.user_metadata.last_name ? [user.user_metadata.first_name, user.user_metadata.last_name].filter(Boolean).join(' ') : null);
      setAvatarUrl(user.user_metadata.avatar_url || null);
      setOnboardingCompleted(false);
      setQuizResponses(null);
      setPreferences(null);
      setEnablePopups(true);
      setTotalShares(0);
      setTotalJournalEntries(0);
      console.log('fetchProfile: Set onboardingCompleted to false (profile not found).');
    }

    // NOVO: Lógica para definir isAdmin
    // Handle adminError gracefully, especially PGRST116 (no rows found)
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('fetchProfile: Error fetching admin status:', adminError);
      setIsAdmin(false);
    } else {
      setIsAdmin(!!adminData); // adminData will be null if no row found, which means not an admin
      console.log('fetchProfile: User is admin:', !!adminData);
    }

  }, []);

  const refetchProfile = useCallback(async () => {
    if (session?.user) {
      console.log('refetchProfile: Manually refetching profile for user ID:', session.user.id);
      await fetchProfile(session.user);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const getSessionAndSetState = async () => {
      if (!isMounted) return;
      setLoading(true);
      console.log('useEffect[initial/visibility]: Attempting to get session.');
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          setSession(currentSession);
          console.log('useEffect[initial/visibility]: Session set:', currentSession ? 'present' : 'null');
        }
      } catch (error) {
        console.error("useEffect[initial/visibility]: Error getting initial session:", error);
        if (isMounted) setSession(null);
      } finally {
      }
    };

    getSessionAndSetState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        console.log('useEffect[initial/visibility]: Page visible, re-getting session.');
        getSessionAndSetState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    console.log('useEffect[onAuthStateChange]: Setting up auth state listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        console.log('useEffect[onAuthStateChange]: Auth state changed, new session set:', newSession ? 'present' : 'null', 'Event:', _event);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      console.log('useEffect[onAuthStateChange]: Auth state listener unsubscribed.');
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const updateProfileAndLoading = async () => {
      if (!isMounted) return;
      setLoading(true);
      console.log('useEffect[session]: Session changed, updating profile and loading state. Current session:', session ? 'present' : 'null');
      try {
        await fetchProfile(session?.user ?? null);
      } catch (error) {
        console.error("useEffect[session]: Error updating profile after session change:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    updateProfileAndLoading();
  }, [session, fetchProfile]);

  return (
    <SessionContext.Provider value={{ 
      session, 
      loading, 
      isAdmin, // NOVO: Passar isAdmin
      fullName, 
      avatarUrl, 
      hasNewStudyNotification, 
      setNewStudyNotification, 
      refetchProfile,
      onboardingCompleted,
      quizResponses,
      preferences,
      enablePopups,
      totalShares,
      totalJournalEntries,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};