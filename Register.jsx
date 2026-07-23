import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext();

// This is an OPTIONAL account layer. Nothing in the game requires signing
// in - the only thing an account unlocks is syncing your save to the cloud
// so it follows you across devices/browsers. Multiplayer (joining/hosting
// worlds, chat) never requires it either.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseConfigured);
  const [authMessage, setAuthMessage] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingAuth(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
      setIsLoadingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: 'Cloud save is not configured yet.' };
    setAuthMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setAuthMessage(error.message); return { error: error.message }; }
    setAuthMessage('Check your email to confirm your account, then log in.');
    return { error: null };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: 'Cloud save is not configured yet.' };
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthMessage(error.message); return { error: error.message }; }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoadingAuth,
      isSupabaseConfigured,
      authMessage,
      setAuthMessage,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
