import { supabase } from '@/integrations/supabase/client';

// Cache for logging status to avoid repeated DB calls
let userLoggingStatusCache: boolean | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const isUserLoggingEnabledGlobally = async (): Promise<boolean> => {
  const now = Date.now();
  if (userLoggingStatusCache !== null && (now - lastCacheTime < CACHE_DURATION_MS)) {
    return userLoggingStatusCache;
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'user_logging_enabled')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error fetching user logging status:', error);
      // Default to true in case of error to avoid blocking logs
      userLoggingStatusCache = true;
      lastCacheTime = now;
      return true;
    }

    const isEnabled = data?.value === 'true';
    userLoggingStatusCache = isEnabled;
    lastCacheTime = now;
    return isEnabled;

  } catch (e) {
    console.error('Unexpected error in isUserLoggingEnabledGlobally:', e);
    userLoggingStatusCache = true; // Default to true on unexpected error
    lastCacheTime = now;
    return true;
  }
};

export const logUserActivity = async (userId: string, event_type: string, description: string) => {
  const isEnabled = await isUserLoggingEnabledGlobally();
  if (!isEnabled) {
    // console.log('User logging is disabled. Skipping log:', event_type, description);
    return;
  }
  try {
    const { error } = await supabase.from('user_logs').insert({
      user_id: userId,
      event_type,
      description,
    });
    if (error) {
      console.error('Error logging user activity:', error);
    }
  } catch (e) {
    console.error('Unexpected error in logUserActivity:', e);
  }
};

export const logAdminActivity = async (adminUserId: string, event_type: string, description: string) => {
  try {
    const { error } = await supabase.from('admin_logs').insert({
      admin_user_id: adminUserId,
      event_type,
      description,
    });
    if (error) {
      console.error('Error logging admin activity:', error);
    }
  } catch (e) {
    console.error('Unexpected error in logAdminActivity:', e);
  }
};